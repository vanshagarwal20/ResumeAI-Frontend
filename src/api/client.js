import axios from 'axios';

// API Gateway for all backend services, including auth.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || BASE_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

const attachToken = (config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (import.meta.env.DEV) {
    console.warn(
      `[apiClient] No accessToken in localStorage for ${config.method?.toUpperCase()} ${config.url}`
    );
  }

  return config;
};

apiClient.interceptors.request.use(attachToken, (error) => Promise.reject(error));
authClient.interceptors.request.use(attachToken, (error) => Promise.reject(error));

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

function addRefreshInterceptor(client) {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 402) {
        return Promise.reject(error);
      }

      if (error.response?.status === 403) {
        if (import.meta.env.DEV) {
          console.error(
            `[apiClient] 403 Forbidden on ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`,
            '\nAuthorization header sent:',
            originalRequest.headers?.Authorization ? 'YES' : 'NO'
          );
        }

        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return client(originalRequest);
            })
            .catch((refreshError) => Promise.reject(refreshError));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          forceLogout();
          return Promise.reject(error);
        }

        try {
          const response = await axios.post(
            `${AUTH_BASE_URL}/api/v1/auth/refresh`,
            JSON.stringify(refreshToken),
            { headers: { 'Content-Type': 'application/json' } }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          processQueue(null, accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          forceLogout();
          return Promise.reject(refreshError);
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