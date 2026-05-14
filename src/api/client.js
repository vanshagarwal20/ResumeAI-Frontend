import axios from 'axios';

// API Gateway (resume-service, etc.)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
// Auth-service runs on its own port — all /api/v1/auth/* calls go here
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:8081';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Separate client just for auth-service
export const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── REQUEST: attach JWT to both clients ───────────────────────
// Reads from localStorage at request time so it always picks up
// the latest token — including tokens written by oauthLogin just
// milliseconds before the first authenticated request fires.
const attachToken = (config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // No token available — log in dev so the 403 is easy to trace.
    if (import.meta.env.DEV) {
      console.warn(`[apiClient] No accessToken in localStorage for ${config.method?.toUpperCase()} ${config.url}`);
    }
  }
  return config;
};
apiClient.interceptors.request.use(attachToken, (e) => Promise.reject(e));
authClient.interceptors.request.use(attachToken, (e) => Promise.reject(e));

// ── RESPONSE: auto-refresh on 401 ────────────────────────────
// 403 Forbidden means the token WAS sent but the server rejected the
// request for authorization reasons (wrong user, quota exceeded, etc.).
// We do NOT attempt a refresh on 403 — the token itself is valid.
// Only 401 Unauthorized means the token is missing or expired.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

function addRefreshInterceptor(client) {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // 402 Payment Required — pass straight through (quota exceeded)
      if (error.response?.status === 402) return Promise.reject(error);

      // 403 Forbidden — token is valid but request is not authorized.
      // Log it clearly in dev to make the cause obvious (no token attached,
      // wrong user ownership, etc.) then reject so the caller can handle it.
      if (error.response?.status === 403) {
        if (import.meta.env.DEV) {
          console.error(
            `[apiClient] 403 Forbidden on ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`,
            '\nAuthorization header sent:',
            originalRequest.headers?.Authorization ? 'YES' : 'NO ← this is the problem',
          );
        }
        return Promise.reject(error);
      }

      // 401 Unauthorized — token is missing or expired; try to refresh.
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          forceLogout();
          return Promise.reject(error);
        }

        try {
          const res = await axios.post(
            `${AUTH_BASE_URL}/api/v1/auth/refresh`,
            JSON.stringify(refreshToken),
            { headers: { 'Content-Type': 'application/json' } }
          );
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return client(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          forceLogout();
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}

addRefreshInterceptor(apiClient);
addRefreshInterceptor(authClient);

function forceLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:logout'));
}

export default apiClient;
