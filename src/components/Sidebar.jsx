import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  // ✅ ADD isAdmin here
  const { user, logout, isAdmin } = useAuth();

  function handleLogout() {
    logout();
    onNavigate('landing');
  }

  // ✅ MOVE navItems INSIDE component + update it
  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', page: 'dashboard' },
    { icon: 'description', label: 'My Resumes', page: 'dashboard' },
    { icon: 'auto_awesome', label: 'AI Analysis', page: 'analysis' },
    { icon: 'work', label: 'Job Match', page: 'job-matches' },
    { icon: 'person', label: 'Profile', page: 'profile' },

    ...(isAdmin
      ? [{ icon: 'admin_panel_settings', label: 'Admin Panel', page: 'admin' }]
      : []),
  ];

  return (
    <aside className="h-screen w-64 border-r border-slate-200 bg-slate-50 fixed left-0 top-0 flex flex-col p-4 gap-2 z-40">
      <div 
        className="flex items-center gap-3 px-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onNavigate('dashboard')}
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">ResumeAI</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Career Engine</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.page + item.label}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
              activePage === item.page
                ? 'bg-white text-indigo-600 shadow-sm font-medium'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-200 space-y-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className="w-full mb-3 bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-sm"
        >
          + New Resume
        </button>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
              {user.fullName?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.subscriptionPlan || 'FREE'}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-sm"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Log out
        </button>
      </div>
    </aside>
  );
}