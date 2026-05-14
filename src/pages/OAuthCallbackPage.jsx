import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// OAuthCallbackPage is the landing point after Google redirects back with tokens.
//
// Key fix: we use a ref to guarantee the effect body runs exactly once even
// in React StrictMode (which double-invokes effects in development). Without
// this guard, the second invocation would call oauthLogin a second time while
// the first was still in-flight, causing a race where auth state is set then
// immediately cleared by the duplicate call's error handler.
export default function OAuthCallbackPage({ onNavigate }) {
  const { oauthLogin } = useAuth();
  const [error, setError] = useState(null);
  const hasRun = useRef(false);

  useEffect(() => {
    // Strict-mode guard — only run once even if effect fires twice.
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      setError('Login failed: no tokens received from provider.');
      setTimeout(() => onNavigate('landing'), 2500);
      return;
    }

    // Remove tokens from URL bar immediately so they're not visible or
    // bookmarkable, and so a page refresh doesn't re-process stale tokens.
    window.history.replaceState(null, '', '/oauth/callback');

    // oauthLogin: saves tokens → fetches profile → sets user state.
    // By the time the .then() callback fires, isAuthenticated is already true,
    // so PrivateRoute will allow through instead of redirecting to landing.
    oauthLogin(accessToken, refreshToken)
      .then((userData) => {
        onNavigate(userData?.role === 'ADMIN' ? 'admin' : 'dashboard');
      })
      .catch((err) => {
        console.error('OAuth login failed:', err);
        setError('Authentication failed. Please try again.');
        // Clear any partially-written tokens so the user isn't stuck in a
        // broken half-authenticated state.
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setTimeout(() => onNavigate('landing'), 2500);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
        <p className="text-slate-600 font-medium">{error}</p>
        <p className="text-slate-400 text-sm">Redirecting back...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <span className="animate-spin material-symbols-outlined text-indigo-600 text-5xl">
        progress_activity
      </span>
      <p className="text-slate-500 font-medium">Completing sign in...</p>
    </div>
  );
}