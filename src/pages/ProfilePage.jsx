import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '../utils/errorHandler';
import Sidebar from '../components/Sidebar';

export default function ProfilePage({ onNavigate }) {
  const { user, logout, refreshProfile, isPremium } = useAuth();
  const toast = useToast();

  // Profile form
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  // Password form
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      await refreshProfile();
      toast.success('Profile updated!');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function handleChangePassword() {
    if (pw.newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setSavingPw(true);
    try {
      await authApi.changePassword(pw.currentPassword, pw.newPassword);
      toast.success('Password changed!');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingPw(false); }
  }

  async function handleUpgrade() {
    try {
      await authApi.updateSubscription('PREMIUM');
      await refreshProfile();
      toast.success('Upgraded to Premium!');
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage="profile" onNavigate={onNavigate} onLogout={logout} />
      <main className="ml-64 flex-1 p-8 max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">My Profile</h2>

        {/* Profile fields */}
        <div className="section-card p-6 mb-6">
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input className="input-field mb-3" value={form.fullName}
            onChange={e => setForm(f=>({...f,fullName:e.target.value}))} />
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input className="input-field mb-4" value={form.phone}
            onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
          <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>

        {/* Password change */}
        <div className="section-card p-6 mb-6">
          <h3 className="font-semibold mb-4">Change Password</h3>
          <input className="input-field mb-3" type="password" placeholder="Current password"
            value={pw.currentPassword} onChange={e=>setPw(p=>({...p,currentPassword:e.target.value}))} />
          <input className="input-field mb-4" type="password" placeholder="New password (min 8 chars)"
            value={pw.newPassword} onChange={e=>setPw(p=>({...p,newPassword:e.target.value}))} />
          <button className="btn-primary" onClick={handleChangePassword} disabled={savingPw}>
            {savingPw ? 'Saving…' : 'Change Password'}
          </button>
        </div>

        {/* Subscription */}
        <div className="section-card p-6">
          <h3 className="font-semibold mb-2">Subscription</h3>
          <p className="text-sm text-slate-500 mb-4">
            Current plan: <span className="font-bold text-indigo-600">{user?.subscriptionPlan || 'FREE'}</span>
          </p>
          {!isPremium && (
            <button className="btn-primary" onClick={handleUpgrade}>Upgrade to Premium</button>
          )}
          {isPremium && (
            <p className="text-sm text-emerald-600 font-semibold">✓ You're on the Premium plan</p>
          )}
        </div>
      </main>
    </div>
  );
}