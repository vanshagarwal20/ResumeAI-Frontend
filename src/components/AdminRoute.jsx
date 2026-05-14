import { useAuth } from '../context/AuthContext';

// AdminRoute guards admin-only pages using the same synchronous redirect
// pattern as PrivateRoute — no useEffect timing gap.
export default function AdminRoute({ children, onNavigate }) {
  const { isAuthenticated, isAdmin, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin material-symbols-outlined text-indigo-600 text-5xl">
          progress_activity
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    queueMicrotask(() => onNavigate('landing'));
    return null;
  }

  if (!isAdmin) {
    queueMicrotask(() => onNavigate('dashboard'));
    return null;
  }

  return children;
}