import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { getErrorMessage, getFieldErrors } from '../utils/errorHandler';
import TopNav from '../components/TopNav';
import { API_BASE } from '../config';

const AUTH_BASE =
  import.meta.env.VITE_AUTH_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  API_BASE ||
  'http://localhost:8080';

// ── Auth Modal ────────────────────────────────────────────────
function AuthModal({ mode: initialMode, onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const { login, register, loading } = useAuth();
  const toast = useToast();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
    setGlobalError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError('');

    const result =
      mode === 'login'
        ? await login(form.email, form.password)
        : await register(form.fullName, form.email, form.password, form.phone);

    if (result.success) {
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created! Welcome to ResumeAI.');
      onSuccess();
    } else {
      setGlobalError(result.error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                className="text-indigo-600 font-semibold hover:underline"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setGlobalError('');
                }}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {globalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                className="input-field"
                placeholder="Alexander Hamilton"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={6}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
              <input
                className="input-field"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin material-symbols-outlined text-base">progress_activity</span>
                Please wait...
              </>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>
          <div className="mt-6">
            <a
              href={`${AUTH_BASE}/oauth2/authorization/google`}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const PREVIEW_TEMPLATES = [
  { id: 1, name: 'Modern Minimalist', desc: 'Clean lines and ample whitespace for a contemporary look.', image: '/templates/modern_resume.png' },
  { id: 2, name: 'Corporate Professional', desc: 'Traditional and structured, perfect for formal industries.', image: '/templates/professional_resume.png' },
  { id: 3, name: 'Creative Designer', desc: 'Vibrant and bold, stands out in the creative field.', image: '/templates/creative_resume.png' },
  { id: 4, name: 'Executive Sleek', desc: 'Focuses on leadership experience and achievements.', image: '/templates/minimalist_resume.png' },
];

function TemplatePreviewSection({ onSelect }) {
  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-3">Professional Templates</h2>
        <p className="text-slate-500 max-w-xl mx-auto">Choose from our collection of recruiter-approved designs that stand out.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {PREVIEW_TEMPLATES.map((t) => (
          <div key={t.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="relative h-[340px] bg-slate-100 overflow-hidden border-b border-slate-100">
              <img src={t.image} alt={t.name} className="w-full h-full object-cover object-top opacity-95 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-5">
                <button className="w-full btn-primary py-3 text-sm shadow-lg font-semibold flex justify-center items-center gap-2" onClick={onSelect}>
                  Use This Template <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-slate-900 mb-1">{t.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LandingPage({ onNavigate }) {
  const [authMode, setAuthMode] = useState(null);
  const { isAuthenticated } = useAuth();

  function openLogin() {
    setAuthMode('login');
  }

  function openRegister() {
    setAuthMode('register');
  }

  function handleAuthSuccess() {
    setAuthMode(null);

    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : {};

    onNavigate(user?.role === 'ADMIN' ? 'admin' : 'dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-50 flex justify-between items-center w-full px-6 py-3">
        <span className="text-xl font-black tracking-tight text-indigo-600">ResumeAI</span>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button className="btn-primary" onClick={() => onNavigate('dashboard')}>
              Dashboard <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          ) : (
            <>
              <button className="btn-ghost py-2" onClick={openLogin}>Sign In</button>
              <button className="btn-primary py-2" onClick={openRegister}>Get Started Free</button>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <section className="py-20 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
              <span className="material-symbols-outlined text-indigo-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-indigo-600 text-xs font-bold uppercase tracking-widest">AI-Powered Career Platform</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">
              Build Smarter.<br />Apply Faster.<br />
              <span className="text-indigo-600">Land the Job.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-lg">
              The only resume builder that uses advanced career AI to optimize your resume for ATS systems and human recruiters alike.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary text-base px-8 py-4" onClick={openRegister}>
                Create Resume Free
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
              <button className="btn-ghost text-base px-8 py-4" onClick={openLogin}>
                Sign In
              </button>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['#4f46e5', '#7c3aed', '#2563eb'].map((c, i) => (
                  <div key={i} className="h-9 w-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" style={{ background: c }}>
                    {['AH', 'SM', 'JD'][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500">Joined by <span className="font-bold text-slate-900">12k+</span> professionals this month</p>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden max-w-[400px] mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500 p-8">
              <div className="border-b-4 border-indigo-600 pb-4 mb-4">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">Alexander Hamilton</h2>
                <p className="text-xs font-semibold text-indigo-600 mt-1">Senior Product Designer</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Experience</p>
                <p className="text-xs font-bold text-slate-900">Lead Designer @ Stripe</p>
                {['Led design system team of 12, reducing handoff time 40%.', 'Redesigned merchant dashboard → +15% DAU.'].map((b, i) => (
                  <p key={i} className="text-[10px] text-slate-600 flex gap-1">
                    <span className="text-indigo-400">•</span>
                    {b}
                  </p>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 md:-left-10 bg-white rounded-xl p-4 max-w-[210px] shadow-xl border border-indigo-100 z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-indigo-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">AI Suggestion</span>
              </div>
              <p className="text-xs text-slate-700 italic">"Add metrics to boost your ATS score by 15%."</p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">Supercharge Your Job Search</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Everything you need to go from application to offer letter.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'edit_document', title: 'AI Resume Builder', desc: 'Smart bullet points tailored to job descriptions instantly.', action: openRegister },
              { icon: 'manage_search', title: 'ATS Scanner', desc: 'Know your ATS score before you hit submit.', action: openRegister },
              { icon: 'style', title: '50+ Templates', desc: 'Recruiter-approved designs for every industry.', action: openRegister },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-shadow cursor-pointer" onClick={f.action}>
                <span className="material-symbols-outlined text-indigo-600 text-4xl mb-4 block">{f.icon}</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <TemplatePreviewSection onSelect={openRegister} />

        <section className="py-12 mb-8">
          <div className="bg-indigo-600 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to land your dream job?</h2>
            <p className="text-indigo-200 text-lg mb-8">Join 12,000+ professionals who upgraded their careers.</p>
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-base hover:bg-indigo-50 active:scale-95 transition-all inline-flex items-center gap-2" onClick={openRegister}>
              Get Started Free <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </section>
      </main>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}