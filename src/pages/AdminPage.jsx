import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { authApi } from '../api/authApi';
import { templateApi } from '../api/services';
import { getErrorMessage } from '../utils/errorHandler';
import Sidebar from '../components/Sidebar';

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }) {
  return (
    <div className="section-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent || 'bg-indigo-50 text-indigo-600'}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

// ─── USER MANAGEMENT TAB ──────────────────────────────────────
function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await authApi.getAllUsers();
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(user) {
    setActionLoading(user.userId);
    try {
      if (user.active === false || user.isActive === false) {
        await authApi.reactivateUser(user.userId);
        toast.success(`${user.fullName} reactivated.`);
      } else {
        await authApi.deactivateUser(user.userId);
        toast.success(`${user.fullName} deactivated.`);
      }
      await loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleChangePlan(userId, newPlan) {
    setActionLoading(userId);
    try {
      await authApi.updateUserSubscription(userId, newPlan);
      toast.success(`Subscription updated to ${newPlan}.`);
      await loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = users.filter(u =>
    (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-4xl text-indigo-600 animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon="group" label="Total Users" value={users.length} />
        <StatCard icon="check_circle" label="Active"
          value={users.filter(u => u.active !== false && u.isActive !== false).length}
          accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon="block" label="Deactivated"
          value={users.filter(u => u.active === false || u.isActive === false).length}
          accent="bg-red-50 text-red-500" />
        <StatCard icon="diamond" label="Premium"
          value={users.filter(u => (u.subscriptionPlan || '').toUpperCase() === 'PREMIUM').length}
          accent="bg-amber-50 text-amber-600" />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
        <input
          className="input-field pl-10"
          placeholder="Search users by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">User</th>
                <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => {
                const isActive = u.active !== false && u.isActive !== false;
                const plan = (u.subscriptionPlan || 'FREE').toUpperCase();
                return (
                  <tr key={u.userId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                          {(u.fullName || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        u.role === 'ADMIN' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer"
                        value={plan}
                        onChange={e => handleChangePlan(u.userId, e.target.value)}
                        disabled={actionLoading === u.userId}
                      >
                        <option value="FREE">FREE</option>
                        <option value="PREMIUM">PREMIUM</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                      }`}>{isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={actionLoading === u.userId || u.role === 'ADMIN'}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                          isActive
                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {actionLoading === u.userId ? '…' : isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TEMPLATE MANAGEMENT TAB ──────────────────────────────────
function TemplateManagement() {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'PROFESSIONAL', description: '', htmlStructure: '<html><body>{{content}}</body></html>', isPremium: false, isPublic: true, isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await templateApi.getAll();
      setTemplates(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingTemplate(null);
    setForm({ name: '', category: 'PROFESSIONAL', description: '', htmlStructure: '<html><body>{{content}}</body></html>', isPremium: false, isPublic: true, isActive: true });
    setShowForm(true);
  }

  function openEdit(t) {
    setEditingTemplate(t);
    setForm({
      name: t.name || '',
      category: t.category || 'PROFESSIONAL',
      description: t.description || '',
      htmlStructure: t.htmlStructure || '',
      isPremium: t.isPremium ?? t.premium ?? false,
      isPublic: t.isPublic ?? t.public ?? true,
      isActive: t.isActive ?? t.active ?? true,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Template name is required.'); return; }
    setSaving(true);
    try {
      if (editingTemplate) {
        await templateApi.update(editingTemplate.templateId, form);
        toast.success('Template updated!');
      } else {
        await templateApi.create(form);
        toast.success('Template created!');
      }
      setShowForm(false);
      await loadTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    try {
      await templateApi.delete(id);
      toast.success('Template deleted.');
      await loadTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-4xl text-indigo-600 animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-slate-500">{templates.length} template{templates.length !== 1 ? 's' : ''} total</p>
        <button className="btn-primary text-sm py-2" onClick={openCreate}>
          <span className="material-symbols-outlined text-base">add</span>
          New Template
        </button>
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input className="input-field mb-3" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Modern Professional" />

            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select className="input-field mb-3" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="PROFESSIONAL">Professional</option>
              <option value="CREATIVE">Creative</option>
              <option value="ACADEMIC">Academic</option>
              <option value="SIMPLE">Simple</option>
            </select>

            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea className="input-field mb-3 resize-none" rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description…" />

            <label className="block text-sm font-medium text-slate-700 mb-1">HTML Structure</label>
            <textarea className="input-field mb-3 resize-none font-mono text-xs" rows={5} value={form.htmlStructure}
              onChange={e => setForm(f => ({ ...f, htmlStructure: e.target.value }))}
              placeholder="<html><body>{{content}}</body></html>" />

            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isPremium}
                  onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))}
                  className="accent-indigo-600" /> Premium Only
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isPublic}
                  onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))}
                  className="accent-indigo-600" /> Public
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="accent-indigo-600" /> Active
              </label>
            </div>

            <div className="flex gap-3">
              <button className="btn-ghost flex-1 justify-center" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editingTemplate ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map(t => {
          const isPrem = t.isPremium ?? t.premium ?? false;
          const isAct = t.isActive ?? t.active ?? true;
          return (
            <div key={t.templateId} className="section-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{t.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{t.category}</p>
                </div>
                <div className="flex gap-1">
                  {isPrem && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">PREMIUM</span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isAct ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  }`}>{isAct ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{t.description || 'No description.'}</p>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button className="flex-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  onClick={() => openEdit(t)}>Edit</button>
                <button className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  onClick={() => handleDelete(t.templateId)}>
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          );
        })}
        {templates.length === 0 && (
          <div className="col-span-full section-card p-12 flex flex-col items-center text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">style</span>
            <p className="font-medium">No templates yet</p>
            <p className="text-xs mt-1">Create your first resume template.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────
export default function AdminPage({ onNavigate }) {
  const { isAdmin, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-6">
        <span className="material-symbols-outlined text-6xl text-red-300 mb-4">shield</span>
        <h1 className="text-3xl font-bold text-red-600 mb-3">Access Denied</h1>
        <p className="text-slate-600 mb-6">
          You do not have permission to access the admin panel.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'users', label: 'User Management', icon: 'group' },
    { id: 'templates', label: 'Templates', icon: 'style' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage="admin" onNavigate={onNavigate} onLogout={logout} />

      <main className="ml-64 flex-1">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-8 py-3 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">admin_panel_settings</span>
              Admin Panel
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage users, templates, and system settings</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 px-3 py-1 rounded-full bg-red-50 text-red-600">
              ADMIN: {user?.fullName}
            </span>
          </div>
        </header>

        <div className="p-8 max-w-[1440px] mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-slate-100 rounded-xl p-1 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'templates' && <TemplateManagement />}
        </div>
      </main>
    </div>
  );
}
