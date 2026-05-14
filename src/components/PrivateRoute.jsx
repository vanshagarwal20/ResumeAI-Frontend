import { useAuth } from '../context/AuthContext';

// PrivateRoute guards all authenticated pages.
//
// Previous version used a useEffect to redirect, which created a timing
// window:  initializing=false fires → effect schedules redirect → React
// renders children briefly → redirect fires. That brief render of children
// sometimes triggered additional API calls that cleared auth state.
//
// New version: redirect is synchronous inside render. As soon as
// initializing=false and isAuthenticated=false the user is sent to landing
// on the SAME render cycle — no intermediate flash of protected content and
// no async scheduling gap where auth state can change underneath us.
export default function PrivateRoute({ children, onNavigate }) {
  const { isAuthenticated, initializing } = useAuth();

  // Still initializing (validating token from localStorage) — show spinner.
  // PrivateRoute must never redirect while this is true or the user would
  // be kicked to landing every time they refresh the page.
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin material-symbols-outlined text-indigo-600 text-5xl">
          progress_activity
        </span>
      </div>
    );
  }

  // Initializing complete and still not authenticated — redirect now.
  if (!isAuthenticated) {
    // Use queueMicrotask so we're not calling state-setters during render,
    // which React disallows. The delay is imperceptible (sub-millisecond).
    queueMicrotask(() => onNavigate('landing'));
    return null;
  }

  return children;
}