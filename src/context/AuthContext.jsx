import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../api/authApi';
import { authClient } from '../api/client';
import { getErrorMessage } from '../utils/errorHandler';

const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────
// Helper: read user from localStorage safely
// ─────────────────────────────────────────────────────────────
function readStoredUser() {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);

  // `initializing` blocks PrivateRoute from redirecting until the first
  // token validation completes. We start true only when a token actually
  // exists so unauthenticated users never see the spinner.
  const [initializing, setInitializing] = useState(
    () => !!localStorage.getItem('accessToken')
  );

  // Guard against the React StrictMode double-invoke of effects in dev.
  // Without this, the profile fetch runs twice and the second one may
  // fire an auth:logout race before the first resolves.
  const initRan = useRef(false);

  // Derive synchronously from state — never from localStorage reads inside render.
  const isAuthenticated = !!user && !!localStorage.getItem('accessToken');
  const isAdmin = user?.role === 'ADMIN';
  const isPremium = user?.subscriptionPlan?.toUpperCase() === 'PREMIUM';

  // ── Force-logout event listener + initial token validation ──
  useEffect(() => {
    const handleForceLogout = () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setInitializing(false);
    };
    window.addEventListener('auth:logout', handleForceLogout);

    // Prevent double-run in React StrictMode (dev only).
    if (initRan.current) return () => window.removeEventListener('auth:logout', handleForceLogout);
    initRan.current = true;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      // No token at all — nothing to validate, not initializing.
      setInitializing(false);
      return () => window.removeEventListener('auth:logout', handleForceLogout);
    }

    // Token exists: validate by fetching the profile.
    // This re-hydrates `user` after a hard redirect (e.g. post-OAuth) so
    // PrivateRoute sees isAuthenticated = true as soon as the call resolves.
    authApi.getProfile()
      .then((res) => {
        const userData = res.data.data;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        checkAndRefreshStaleToken(userData);
      })
      .catch(() => {
        // Access token invalid — the axios interceptor will attempt a refresh.
        // If refresh also fails, it fires auth:logout, which clears state above.
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setInitializing(false));

    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helper: Sync token claims with DB profile ─────────────────
  async function checkAndRefreshStaleToken(userData) {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.subscriptionPlan !== userData.subscriptionPlan || payload.role !== userData.role) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await authApi.refresh(refreshToken);
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
        }
      }
    } catch (e) {
      // Ignore parse errors or refresh failures
    }
  }

  // ── Session helpers ──────────────────────────────────────────
  function saveSession({ accessToken, refreshToken, user: userData }) {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  }

  // ── OAuth2 callback handler ──────────────────────────────────
  // Called by OAuthCallbackPage with the tokens extracted from the URL.
  //
  // KEY FIX: We set initializing=false here BEFORE navigating to dashboard.
  // Without this, the useEffect above also runs getProfile() (because a token
  // now exists in localStorage), and if that second fetch races with this one,
  // the .catch() in the effect clears the token and kicks the user to landing.
  //
  // By marking initRan.current=true before saving tokens, we prevent the
  // effect's getProfile() from running a second time. Then we do the fetch
  // ourselves here, set the user, and signal initializing=false — so
  // PrivateRoute lets the user through immediately.
  async function oauthLogin(accessToken, refreshToken) {
    // Mark the init guard BEFORE writing tokens to localStorage.
    // This prevents the useEffect from seeing the token and launching
    // a duplicate getProfile() call that could race and clear the session.
    initRan.current = true;

    // Persist tokens so the profile request is authorised.
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Fetch the canonical profile from the server.
    const res = await authApi.getProfile();
    const userData = res.data.data;

    // Write to both localStorage (persistence) and React state (re-render).
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Signal that initializing is complete so PrivateRoute doesn't block.
    setInitializing(false);

    return userData;
  }

  // ── Standard login ───────────────────────────────────────────
  async function login(email, password) {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      saveSession(res.data.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    } finally {
      setLoading(false);
    }
  }

  // ── Registration ─────────────────────────────────────────────
  async function register(fullName, email, password, phone) {
    setLoading(true);
    try {
      const res = await authApi.register({ fullName, email, password, phone });
      saveSession(res.data.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    } finally {
      setLoading(false);
    }
  }

  // ── Logout ───────────────────────────────────────────────────
  // UPDATED: also calls the server to revoke tokens
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Tell the server to blacklist this token immediately
        await authClient.post('/api/v1/auth/logout', null, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      // If the server call fails (e.g. already expired), still log out locally
      console.warn('[logout] Server-side revocation failed:', err?.response?.status);
    } finally {
      // Always clear client-side state regardless of server response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  // ── Profile refresh ──────────────────────────────────────────
  async function refreshProfile() {
    try {
      const res = await authApi.getProfile();
      const updated = res.data.data;
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      await checkAndRefreshStaleToken(updated);
    } catch {
      // silently fail — user will notice next action
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      isPremium,
      loading,
      initializing,
      login,
      register,
      oauthLogin,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
