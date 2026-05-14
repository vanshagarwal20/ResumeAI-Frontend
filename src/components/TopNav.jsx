import { useAuth } from '../context/AuthContext';

export default function TopNav({ activePage, onNavigate }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const navLinks = [
    { label: 'Dashboard', page: 'dashboard', auth: true },
    { label: 'AI Analysis', page: 'analysis', auth: true },
    { label: 'Job Match', page: 'job-matches', auth: true },
  ];

  function handleLogout() {
    logout();
    onNavigate('landing');
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-50 flex justify-between items-center w-full px-6 py-3">
      <div className="flex items-center gap-8">
        <button
          onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
          className="text-xl font-black tracking-tight text-indigo-600 cursor-pointer hover:opacity-80 transition-opacity"
        >
          ResumeAI
        </button>

        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => onNavigate(link.page)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activePage === link.page
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}

            <span className="text-xs font-bold text-slate-500 px-3 py-1 rounded-full bg-slate-100">
              Role: {user?.role}
            </span>

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                Admin Panel
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <button
              onClick={() => onNavigate('editor')}
              className="btn-primary text-sm py-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              New Resume
            </button>

            <div
              className="h-8 w-8 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm cursor-pointer"
              onClick={handleLogout}
              title="Logout"
            >
              {user?.fullName?.substring(0, 2).toUpperCase() || 'U'}
            </div>
          </>
        ) : (
          <>
            <button
              className="btn-ghost py-2 text-sm"
              onClick={() => onNavigate('landing')}
            >
              Sign In
            </button>
            <button
              className="btn-primary py-2 text-sm"
              onClick={() => onNavigate('landing')}
            >
              Get Started
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
