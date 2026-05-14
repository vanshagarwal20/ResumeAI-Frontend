import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { resumeApi } from '../api/resumeApi';
import { notificationApi, exportApi, sectionApi } from '../api/services';
import { getErrorMessage } from '../utils/errorHandler';
import Sidebar from '../components/Sidebar';
import { templateApi } from '../api/services';
import html2pdf from 'html2pdf.js';
import { createRoot } from 'react-dom/client';
import ResumeRenderer from '../components/templates/ResumeRenderer';
import ResumeThumbnail from '../components/ResumeThumbnail';

function ScoreRing({ score }) {
  const r = 20, c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="52" height="52" className="-rotate-90">
      <circle cx="26" cy="26" r={r} fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
      <circle cx="26" cy="26" r={r} fill="transparent" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      <text x="26" y="30" textAnchor="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: '26px 26px', fontSize: '11px', fontWeight: 700, fill: color }}>
        {score}
      </text>
    </svg>
  );
}

function CreateResumeModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [targetJob, setTargetJob] = useState('');

  const toast = useToast();

  useEffect(() => {
    templateApi.getPublic().then(r => setTemplates(r.data.data || [])).catch(() => {});
  }, []);

  async function handleSelectTemplate(selectedTemplateId) {
    if (!title.trim()) {
      toast.error('Please enter a Resume Title first.');
      return;
    }
    setLoading(true);
    try {
      const res = await resumeApi.create({ title, targetJobTitle: targetJob, templateId: selectedTemplateId });
      toast.success('Resume created!');
      onCreated(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const TEMPLATE_DETAILS = {
    1: { image: '/templates/modern_resume.png', desc: 'Clean lines and ample whitespace for a contemporary look.' },
    2: { image: '/templates/professional_resume.png', desc: 'Traditional and structured, perfect for formal industries.' },
    3: { image: '/templates/creative_resume.png', desc: 'Vibrant and bold, stands out in the creative field.' },
    4: { image: '/templates/minimalist_resume.png', desc: 'Focuses on leadership experience and achievements.' },
  };

  const getTemplateImage = (id) => TEMPLATE_DETAILS[id]?.image || '/templates/modern_resume.png';
  const getTemplateDesc = (id) => TEMPLATE_DETAILS[id]?.desc || 'A professional layout tailored for your career.';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-3xl sticky top-0 z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Choose a Template</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your details and select a design to start building your resume</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          {/* Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Resume Title <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field bg-white"
                placeholder="e.g. Senior Frontend Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Target Job Title (Optional)
              </label>
              <input
                className="input-field bg-white"
                placeholder="e.g. Software Engineer"
                value={targetJob}
                onChange={e => setTargetJob(e.target.value)}
              />
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map(t => (
              <div 
                key={t.templateId} 
                onClick={() => !loading && handleSelectTemplate(t.templateId)}
                className={`group relative bg-white rounded-2xl border ${!title.trim() ? 'opacity-70 grayscale-[30%] cursor-not-allowed' : 'cursor-pointer hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1'} border-slate-200 overflow-hidden transition-all duration-300`}
              >
                <div className="h-64 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                  <img src={getTemplateImage(t.templateId)} alt={t.name} className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {title.trim() && (
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="bg-white text-indigo-600 font-bold px-6 py-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                        {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : null}
                        {loading ? 'Creating...' : 'Select Template'}
                      </button>
                    </div>
                  )}
                  
                  {!title.trim() && (
                    <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-slate-900/80 text-white text-xs font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm">Enter title first</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{t.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{getTemplateDesc(t.templateId)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardPage({ onNavigate }) {
  const { user, logout, isPremium } = useAuth();
  const toast = useToast();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [recentExports, setRecentExports] = useState([]);
  const [exportsLoading, setExportsLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setExportsLoading(true);
    try {
      const [resumeRes, notifRes, exportRes] = await Promise.allSettled([
        resumeApi.getAll(),
        notificationApi.getAll(),
        exportApi.getHistory(),
      ]);

      if (resumeRes.status === 'fulfilled') {
        setResumes(resumeRes.value.data.data || []);
      }
      if (notifRes.status === 'fulfilled') {
        const notifs = notifRes.value.data.data || [];
        setUnread(notifs.filter(n => n.read === false || n.isRead === false).length);
      }
      if (exportRes.status === 'fulfilled') {
        const allExports = exportRes.value.data.data || [];
        setRecentExports(allExports.slice(0, 5));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setExportsLoading(false);
    }
  }

  async function handleDelete(resumeId) {
    if (!confirm('Delete this resume?')) return;
    try {
      await resumeApi.delete(resumeId);
      setResumes((prev) => prev.filter((r) => r.resumeId !== resumeId));
      toast.success('Resume deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDuplicate(resumeId) {
    try {
      const res = await resumeApi.duplicate(resumeId);
      setResumes((prev) => [...prev, res.data.data]);
      toast.success('Resume duplicated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function handleCreated(newResume) {
    setResumes((prev) => [newResume, ...prev]);
    setShowCreateModal(false);
    onNavigate('editor', { resumeId: newResume.resumeId });
  }

  async function handleExportDownload(record) {
    if (downloading) return;
    setDownloading(record.exportId);
    try {
      const exportRes = await exportApi.getJobStatus(record.exportId);
      const exportJob = exportRes.data.data;
      
      const resumeRes = await resumeApi.getById(record.resumeId);
      const sectionsRes = await sectionApi.getByResume(record.resumeId);
      const resumeData = resumeRes.data.data;
      const sectionsData = sectionsRes.data.data;

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '700px';
      container.style.background = 'white';
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(<ResumeRenderer resume={resumeData} sections={sectionsData} />);

      // Wait a moment for the component to render fully
      await new Promise(r => setTimeout(r, 500));

      const fileName = exportJob?.fileName
        ? exportJob.fileName.replace(/\.\w+$/, '.pdf')
        : `Resume_Export_${record.exportId}.pdf`;
      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(container).save();
      toast.success('PDF downloaded successfully!');
      
      root.unmount();
      document.body.removeChild(container);
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download: ' + getErrorMessage(err));
    } finally {
      setDownloading(null);
    }
  }

  const stats = [
    { label: 'Total Resumes', value: resumes.length, icon: 'description', badge: `${resumes.filter(r=>r.status==='ACTIVE').length} active` },
    { label: 'Avg ATS Score', value: resumes.length ? `${Math.round(resumes.reduce((a,r)=>a+(r.atsScore||0),0)/resumes.length)}%` : 'N/A', icon: 'analytics', badge: 'live' },
    { label: 'Exports', value: recentExports.length, icon: 'download', badge: recentExports.filter(e => e.status === 'COMPLETED').length ? `${recentExports.filter(e => e.status === 'COMPLETED').length} ready` : 'none' },
    { label: 'Notifications', value: unread, icon: 'notifications', badge: unread ? `${unread} new` : 'none' },
  ];

  const colorPalette = ['bg-indigo-500','bg-violet-500','bg-teal-500','bg-amber-500','bg-rose-500'];


  const FREE_RESUME_LIMIT = 3;
  const atQuotaLimit = !isPremium && resumes.length >= FREE_RESUME_LIMIT;
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage="dashboard" onNavigate={onNavigate} onLogout={logout} />

      <main className="ml-64 flex-1">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-8 py-3 flex justify-between items-center shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-60 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search resumes..." />
            </div>
            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
              {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
            </button>
            <div className="h-8 w-8 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs ml-1">
              {user?.fullName?.substring(0,2).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1440px] mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900">Welcome back, {user?.fullName?.split(' ')[0]}! 👋</h3>
            <p className="text-slate-500 mt-1">Here's an overview of your resume portfolio.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            {stats.map((s) => (
              <div key={s.label} className="section-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <span className="material-symbols-outlined text-xl">{s.icon}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-indigo-600 bg-indigo-50">{s.badge}</span>
                </div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1">{s.label}</p>
                <h3 className="text-3xl font-bold text-slate-900">{loading ? '—' : s.value}</h3>
              </div>
            ))}
          </div>

          {/* Resumes Grid */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-slate-900">My Resumes</h3>
            <button
              className={`btn-primary text-sm py-2 ${atQuotaLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !atQuotaLimit && setShowCreateModal(true)}
              title={atQuotaLimit ? 'Free plan allows 3 resumes. Upgrade to Premium for unlimited.' : ''}
              disabled={atQuotaLimit}
            >
              <span className="material-symbols-outlined text-base">add</span>
              {atQuotaLimit ? 'Limit Reached (3/3)' : 'New Resume'}

              {atQuotaLimit && (
                <span
                  className="ml-1 text-xs bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: open upgrade modal
                  }}
                >
                  Upgrade
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[1,2,3].map((i) => (
                <div key={i} className="section-card overflow-hidden animate-pulse">
                  <div className="h-32 bg-slate-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
              {resumes.map((r, i) => (
                <div key={r.resumeId} className="section-card overflow-hidden hover:shadow-md transition-shadow group">
                  <ResumeThumbnail resume={r} height="180px" />
                  <div className="p-4">
                    <h4 className="font-semibold text-slate-900 text-sm mb-1 truncate">{r.title}</h4>
                    <p className="text-xs text-slate-400 mb-3">
                      {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : 'Just created'}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ScoreRing score={r.atsScore || 0} />
                        <span className="text-xs text-slate-500">ATS</span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        r.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>{r.status || 'DRAFT'}</span>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        className="flex-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        onClick={() => onNavigate('editor', { resumeId: r.resumeId })}
                      >Edit</button>
                      <button
                        className="px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => handleDuplicate(r.resumeId)}
                        title="Duplicate"
                      ><span className="material-symbols-outlined text-sm">content_copy</span></button>
                      <button
                        className="px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleDelete(r.resumeId)}
                        title="Delete"
                      ><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Create new card */}
              <div
                className="section-card border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[240px] gap-3 group"
                onClick={() => !atQuotaLimit && setShowCreateModal(true)}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-indigo-600 text-2xl">add</span>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-700 text-sm">Create Resume</p>
                  <p className="text-slate-400 text-xs">Start from scratch</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Exports Section */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-slate-900">Recent Exports</h3>
              <button
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                onClick={() => onNavigate('exports')}
              >
                View All <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>

            {exportsLoading ? (
              <div className="section-card p-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-slate-300 animate-spin">progress_activity</span>
              </div>
            ) : recentExports.length === 0 ? (
              <div className="section-card p-8 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-slate-400 text-2xl">download</span>
                </div>
                <p className="text-sm font-semibold text-slate-500 mb-1">No exports yet</p>
                <p className="text-xs text-slate-400">Export a resume from the editor to see it here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentExports.map((record) => (
                  <div key={record.exportId}
                    className="section-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-indigo-600"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        {record.exportFormat === 'PDF' ? 'picture_as_pdf' : 'html'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {record.fileName || `Export #${record.exportId}`}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase">
                          {record.exportFormat}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          record.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {record.status}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(record.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => onNavigate('editor', { resumeId: record.resumeId })}
                        title="Open in editor"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => handleExportDownload(record)}
                        disabled={record.status !== 'COMPLETED' || downloading === record.exportId}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        <span className={`material-symbols-outlined text-xs ${downloading === record.exportId ? 'animate-spin' : ''}`}>
                          {downloading === record.exportId ? 'progress_activity' : 'download'}
                        </span>
                        {downloading === record.exportId ? 'Generating…' : 'Download'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Insights banner — only if resumes exist */}
          {resumes.length > 0 && (
            <div className="bg-white rounded-xl border border-indigo-100 p-6 flex items-start gap-6 shadow-sm">
              <div className="p-3 bg-indigo-50 rounded-xl flex-shrink-0">
                <span className="material-symbols-outlined text-indigo-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest font-bold text-indigo-600 mb-1">AI Career Insight</p>
                <h4 className="font-semibold text-slate-900 mb-1">Improve your resume with AI</h4>
                <p className="text-sm text-slate-500">Run an ATS analysis on your latest resume to discover missing keywords and boost your interview callback rate.</p>
              </div>
              <button className="btn-primary flex-shrink-0 text-sm" onClick={() => onNavigate('analysis')}>
                Analyze Now <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <CreateResumeModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
