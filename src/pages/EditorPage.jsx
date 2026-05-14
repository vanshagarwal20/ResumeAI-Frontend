import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { resumeApi } from '../api/resumeApi';
import { sectionApi, aiApi, exportApi } from '../api/services';
import { getErrorMessage, isQuotaExceeded } from '../utils/errorHandler';
import html2pdf from 'html2pdf.js';
import ResumeRenderer from '../components/templates/ResumeRenderer';
import useDebounce from '../hooks/useDebounce';
import TEMPLATE_META from '../data/templateMeta';

const SECTION_TYPES = [
  { type: 'SUMMARY', label: 'Professional Summary', icon: 'subject' },
  { type: 'EXPERIENCE', label: 'Work Experience', icon: 'work' },
  { type: 'EDUCATION', label: 'Education', icon: 'school' },
  { type: 'SKILLS', label: 'Skills', icon: 'psychology' },
  { type: 'PROJECTS', label: 'Projects', icon: 'rocket_launch' },
  { type: 'CERTIFICATIONS', label: 'Certifications', icon: 'verified' },
  { type: 'LANGUAGES', label: 'Languages', icon: 'translate' },
  { type: 'EXTRA_CURRICULAR', label: 'Extra Curricular', icon: 'volunteer_activism' },
];

const DEFAULT_CONTENT = {
  SUMMARY: 'Add your professional summary here.',
  EXPERIENCE: 'Add your work experience here.',
  EDUCATION: 'Add your education details here.',
  SKILLS: 'Java, Spring Boot, MySQL, JWT, Swagger',
  PROJECTS: 'Add your project details here.',
  CERTIFICATIONS: 'Add your certifications here.',
  LANGUAGES: 'English (Fluent), Hindi (Native)',
  EXTRA_CURRICULAR: 'Add your extra curricular activities here.',
};

function ResumeMetaEditor({ resume, onSave, onDraftChange }) {
  const [title, setTitle] = useState(resume?.title || '');
  const [targetJob, setTargetJob] = useState(resume?.targetJobTitle || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ title, targetJobTitle: targetJob });
    setSaving(false);
  }

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-3">Resume Header</p>
      <label className="block text-xs font-medium text-slate-500 mb-1">Your Full Name</label>
      <input
        className="input-field mb-2 text-sm"
        value={title}
        placeholder="e.g. Alexander Hamilton"
        onChange={(e) => {
          setTitle(e.target.value);
          onDraftChange?.({ title: e.target.value, targetJobTitle: targetJob });
        }}
      />
      <label className="block text-xs font-medium text-slate-500 mb-1">Target Job Title</label>
      <input
        className="input-field mb-3 text-sm"
        value={targetJob}
        placeholder="e.g. Senior Software Engineer"
        onChange={(e) => {
          setTargetJob(e.target.value);
          onDraftChange?.({ title, targetJobTitle: e.target.value });
        }}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Header'}
      </button>
    </div>
  );
}

function TemplateSwitcher({ currentTemplateId, onSwitch, disabled }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {TEMPLATE_META.map((t) => {
        const isActive = t.id === currentTemplateId;
        return (
          <button
            key={t.id}
            disabled={disabled}
            onClick={() => onSwitch(t.id)}
            className={`template-switch-card flex-shrink-0 ${
              isActive ? 'active' : ''
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={t.description}
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ color: isActive ? t.accentColor : '#94a3b8' }}
            >
              {t.icon}
            </span>
            <span
              className={`text-xs font-semibold whitespace-nowrap ${
                isActive ? 'text-indigo-700' : 'text-slate-500'
              }`}
            >
              {t.name}
            </span>
            {isActive && (
              <span className="material-symbols-outlined text-xs text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function AiUsageWidget({ aiUsage, isPremium, onNavigate }) {
  if (!aiUsage) return null;

  const used = aiUsage.requestsUsedThisMonth ?? 0;
  const limit = aiUsage.freeTierMonthlyLimit ?? 5;
  const pct = Math.min(100, (used / limit) * 100);
  const exceeded = !isPremium && used >= limit;

  return (
    <div className={`border rounded-xl p-3 text-xs ${exceeded ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-100'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`material-symbols-outlined text-sm ${exceeded ? 'text-amber-500' : 'text-indigo-600'}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <span className={`font-bold ${exceeded ? 'text-amber-700' : 'text-indigo-600'}`}>AI Credits</span>
        {isPremium && (
          <span className="ml-auto text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">PREMIUM</span>
        )}
      </div>

      {isPremium ? (
        <div className="flex items-center gap-2 text-indigo-700">
          <span className="material-symbols-outlined text-sm text-emerald-500">all_inclusive</span>
          <span className="font-semibold">Unlimited AI usage</span>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-slate-600 mb-1">
            <span>Used this month</span>
            <span className={`font-bold ${exceeded ? 'text-amber-700' : ''}`}>
              {used} / {limit}
            </span>
          </div>
          <div className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${exceeded ? 'bg-amber-500' : 'bg-indigo-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {exceeded ? (
            <div className="mt-2">
              <p className="font-bold text-amber-700 mb-1">Request limit exceeded. Upgrade to Premium.</p>
              <button
                onClick={() => onNavigate('profile')}
                className="w-full py-1.5 bg-amber-500 text-white font-bold rounded-lg hover:opacity-90 text-[10px]"
              >
                Upgrade to Premium
              </button>
            </div>
          ) : (
            <p className="mt-1 text-slate-400">{limit - used} requests remaining</p>
          )}
        </>
      )}
    </div>
  );
}

function SectionEditor({ section, onSave, onDelete, onAiGenerate, onDraftChange, isPremium, aiLimitReached }) {
  const [content, setContent] = useState(section.content || '');
  const [title, setTitle] = useState(section.title || '');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    setContent(section.content || '');
    setTitle(section.title || '');
  }, [section.sectionId]);

  async function handleSave() {
    setSaving(true);
    const isVis = section.isVisible ?? section.visible ?? true;
    await onSave(section.sectionId, {
      sectionType: section.sectionType,
      title,
      content,
      displayOrder: section.displayOrder,
      isVisible: isVis,
    });
    setSaving(false);
  }

  function updateTitle(value) {
    setTitle(value);
    onDraftChange?.(section.sectionId, { title: value, content });
  }

  function updateContent(value) {
    setContent(value);
    onDraftChange?.(section.sectionId, { title, content: value });
  }

  async function handleAI() {
    if (aiLimitReached && !isPremium) return;
    setAiLoading(true);
    await onAiGenerate(section.sectionType, { title, content, companyName }, (value) => {
      setContent(value);
      onDraftChange?.(section.sectionId, { title, content: value });
    });
    setAiLoading(false);
  }

  const aiDisabled = aiLoading || (aiLimitReached && !isPremium);
  const aiTitle = aiLimitReached && !isPremium ? 'Request limit exceeded. Upgrade to Premium.' : '';

  const AiBtn = ({ label }) => (
    <button
      onClick={handleAI}
      disabled={aiDisabled}
      title={aiTitle}
      className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
        auto_awesome
      </span>
      {aiLoading ? 'Generating...' : label}
    </button>
  );

  const renderFields = () => {
    switch (section.sectionType) {
      case 'SUMMARY':
        return (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
            <input className="input-field mb-3" value={title} onChange={(e) => updateTitle(e.target.value)} />
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Summary</label>
              <AiBtn label="AI Generate" />
            </div>
            <textarea
              className="input-field resize-none"
              rows={5}
              value={content}
              onChange={(e) => updateContent(e.target.value)}
              placeholder="Write a professional summary..."
            />
          </div>
        );

      case 'EXPERIENCE':
        return (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Job Title</label>
            <input
              className="input-field mb-2"
              value={title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
            />

            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Company Name <span className="text-slate-300 normal-case font-normal">(optional for AI)</span>
            </label>
            <input
              className="input-field mb-2"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google (optional)"
            />

            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
              <AiBtn label="AI Write" />
            </div>
            <textarea
              className="input-field resize-none"
              rows={5}
              value={content}
              onChange={(e) => updateContent(e.target.value)}
              placeholder="Describe your role and achievements. AI Write will enhance it."
            />
          </div>
        );

      default:
        return (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
            <input className="input-field mb-3" value={title} onChange={(e) => updateTitle(e.target.value)} />
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Content</label>
            <textarea className="input-field resize-none" rows={5} value={content} onChange={(e) => updateContent(e.target.value)} />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-slate-400 text-base">drag_indicator</span>
        <h3 className="font-bold text-slate-800 text-sm flex-1">
          {section.title || SECTION_TYPES.find((t) => t.type === section.sectionType)?.label || section.sectionType}
        </h3>
        <button onClick={() => onDelete(section.sectionId)} className="text-red-400 hover:text-red-600 transition-colors">
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>

      {renderFields()}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Section'}
      </button>
    </div>
  );
}

export default function EditorPage({ onNavigate, resumeId }) {
  const { isPremium } = useAuth();
  const toast = useToast();
  const [resume, setResume] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiUsage, setAiUsage] = useState(null);
  const [savingResume, setSavingResume] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.72);
  const [switchingTemplate, setSwitchingTemplate] = useState(false);

  // Debounce preview data so the template doesn't re-render on every single keystroke
  const debouncedResume = useDebounce(resume, 200);
  const debouncedSections = useDebounce(sections, 200);

  // Zoom helpers
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 1.0;
  const ZOOM_STEP = 0.08;
  const zoomIn = () => setZoomLevel((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  const zoomOut = () => setZoomLevel((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  const zoomReset = () => setZoomLevel(0.72);
  const zoomPercent = Math.round(zoomLevel * 100);

  const aiLimitReached = !isPremium &&
    aiUsage !== null &&
    (aiUsage.requestsUsedThisMonth ?? 0) >= (aiUsage.freeTierMonthlyLimit ?? 5);

  useEffect(() => {
    if (resumeId) loadResume();
    else setLoading(false);
  }, [resumeId]);

  async function loadResume() {
    setLoading(true);
    try {
      const [resumeRes, sectionsRes, usageRes] = await Promise.allSettled([
        resumeApi.getById(resumeId),
        sectionApi.getByResume(resumeId),
        aiApi.getUsage(),
      ]);

      if (resumeRes.status === 'fulfilled') setResume(resumeRes.value.data.data);
      if (sectionsRes.status === 'fulfilled') {
        const data = sectionsRes.value.data.data || [];
        setSections(data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
      }
      if (usageRes.status === 'fulfilled') setAiUsage(usageRes.value.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function refreshUsage() {
    try {
      const res = await aiApi.getUsage();
      setAiUsage(res.data.data);
    } catch {
      // silent
    }
  }

  async function handleSaveResumeMeta(data) {
    try {
      const res = await resumeApi.update(resumeId, data);
      setResume(res.data.data);
      toast.success('Resume header saved!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function handleMetaDraftChange(data) {
    setResume((prev) => (prev ? { ...prev, ...data } : prev));
  }

  function handleSectionDraftChange(sectionId, changes) {
    setSections((prev) =>
      prev.map((section) => (section.sectionId === sectionId ? { ...section, ...changes } : section))
    );
  }

  async function handleTemplateSwitch(newTemplateId) {
    if (!resume || newTemplateId === resume.templateId) return;
    setSwitchingTemplate(true);
    // Optimistically update local state first for instant preview
    setResume((prev) => ({ ...prev, templateId: newTemplateId }));
    try {
      await resumeApi.update(resumeId, { ...resume, templateId: newTemplateId });
      toast.success(`Switched to ${TEMPLATE_META.find((t) => t.id === newTemplateId)?.name || 'template'}!`);
    } catch (err) {
      // Revert on failure
      setResume((prev) => ({ ...prev, templateId: resume.templateId }));
      toast.error(getErrorMessage(err));
    } finally {
      setSwitchingTemplate(false);
    }
  }

  async function handleSaveResume() {
    if (!resumeId || !resume) return;
    setSavingResume(true);
    try {
      const resumeRes = await resumeApi.update(resumeId, {
        title: resume.title,
        targetJobTitle: resume.targetJobTitle,
        templateId: resume.templateId,
        status: resume.status,
        language: resume.language,
      });

      const savedSections = await Promise.all(
        sections.map((section) => {
          const isVis = section.isVisible ?? section.visible ?? true;
          return sectionApi.update(section.sectionId, {
            sectionType: section.sectionType,
            title: section.title,
            content: section.content,
            displayOrder: section.displayOrder,
            isVisible: isVis,
          });
        })
      );

      setResume(resumeRes.data.data);
      setSections(
        savedSections
          .map((res) => res.data.data)
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      );
      toast.success('Resume saved!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingResume(false);
    }
  }

  async function handleAddSection(sectionType, label) {
    try {
      const res = await sectionApi.create({
        resumeId,
        sectionType,
        title: label,
        displayOrder: sections.length + 1,
        isVisible: true,
        content: DEFAULT_CONTENT[sectionType] || `Add your ${label.toLowerCase()} details here.`,
      });
      setSections((prev) => [...prev, res.data.data]);
      toast.success('Section added!');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 500) {
        toast.error(`Failed to add "${label}" section. Please restart the Section Service backend and try again.`);
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  }

  async function handleSaveSection(sectionId, updated) {
    try {
      const res = await sectionApi.update(sectionId, updated);
      setSections((prev) => prev.map((s) => (s.sectionId === sectionId ? res.data.data : s)));
      toast.success('Section saved!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDeleteSection(sectionId) {
    if (!confirm('Remove this section?')) return;
    try {
      await sectionApi.delete(sectionId);
      setSections((prev) => prev.filter((s) => s.sectionId !== sectionId));
      toast.success('Section deleted!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleAiGenerate(sectionType, contentObj, setContent) {
    if (aiLimitReached && !isPremium) {
      toast.error('Request limit exceeded. Upgrade to Premium.');
      return;
    }
    try {
      if (sectionType === 'SUMMARY') {
        const res = await aiApi.generateSummary({
          jobTitle: resume?.targetJobTitle || resume?.title || 'Professional',
          skills: contentObj.content || 'General skills',
          experienceLevel: '3 years',
        });
        setContent(res.data.data.generatedText);
        toast.success('AI summary generated!');
      } else if (sectionType === 'EXPERIENCE') {
        const res = await aiApi.generateExperienceBullets({
          jobTitle: contentObj.title || 'Professional',
          companyName: contentObj.companyName || '',
          workSummary: contentObj.content || 'Worked on various projects and responsibilities',
        });
        setContent(res.data.data.generatedText);
        toast.success('AI bullets generated!');
      }
      await refreshUsage();
    } catch (err) {
      if (isQuotaExceeded(err)) {
        await refreshUsage();
        toast.error('Request limit exceeded. Upgrade to Premium.');
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  }

  async function handleExport() {
    if (!isPremium) {
      toast.error('PDF export is available for Premium users. Please upgrade.');
      onNavigate('profile');
      return;
    }
    try {
      toast.info('Generating PDF... please wait.');

      await exportApi.exportResume({
        resumeId,
        templateId: resume?.templateId || 1,
        exportFormat: 'PDF',
      });

      const previewEl = document.getElementById('resume-preview-area');
      if (!previewEl) {
        toast.error('Resume preview not found.');
        return;
      }

      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `${(resume?.title || 'Resume').replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(previewEl).save();
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      toast.error('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    }
  }

  const uniqueOnce = ['SUMMARY', 'SKILLS'];
  const existingTypes = sections.map((s) => s.sectionType);
  const availableTypes = SECTION_TYPES.filter((t) =>
    uniqueOnce.includes(t.type) ? !existingTypes.includes(t.type) : true
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-spin material-symbols-outlined text-indigo-600 text-4xl">progress_activity</span>
          <p className="text-slate-500 text-sm">Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 flex justify-between items-center px-6 py-3 shadow-sm z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('dashboard')} className="text-xl font-black text-indigo-600 hover:opacity-80">
            ResumeAI
          </button>
          <div className="border-l border-slate-200 pl-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="material-symbols-outlined text-sm">description</span>
            <span className="font-medium">{resume?.title || 'New Resume'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-ghost text-sm py-2 px-4" onClick={() => onNavigate('exports')}>
            <span className="material-symbols-outlined text-base">history</span>
            Export History
          </button>
          <button className="btn-ghost text-sm py-2 px-4" onClick={handleSaveResume} disabled={savingResume}>
            <span className={`material-symbols-outlined text-base ${savingResume ? 'animate-spin' : ''}`}>
              {savingResume ? 'progress_activity' : 'save'}
            </span>
            {savingResume ? 'Saving...' : 'Save Resume'}
          </button>
          <button className="btn-ghost text-sm py-2 px-4" onClick={handleExport}>
            <span className="material-symbols-outlined text-base">download</span>
            Export PDF
          </button>
          <button className="btn-primary text-sm py-2" onClick={() => onNavigate('analysis', { resumeId })}>
            Analyze ATS
          </button>
          <button onClick={() => onNavigate('dashboard')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[380px] flex-shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto">
          <div className="p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Resume Sections</h2>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">
                {sections.length} sections
              </span>
            </div>

            <AiUsageWidget aiUsage={aiUsage} isPremium={isPremium} onNavigate={onNavigate} />

            <ResumeMetaEditor resume={resume} onSave={handleSaveResumeMeta} onDraftChange={handleMetaDraftChange} />

            {sections.map((section) => (
              <SectionEditor
                key={section.sectionId}
                section={section}
                onSave={handleSaveSection}
                onDelete={handleDeleteSection}
                onAiGenerate={handleAiGenerate}
                onDraftChange={handleSectionDraftChange}
                isPremium={isPremium}
                aiLimitReached={aiLimitReached}
              />
            ))}

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Section</p>
              <div className="grid grid-cols-2 gap-2">
                {availableTypes.map((t, i) => (
                  <button
                    key={`${t.type}-${i}`}
                    onClick={() => handleAddSection(t.type, t.label)}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 bg-slate-200/60 overflow-y-auto flex flex-col">
          {/* ── Preview Toolbar ─────────────────────────────── */}
          <div className="sticky top-0 z-20 bg-slate-200/80 backdrop-blur-md border-b border-slate-300/50 px-6 py-3">
            <div className="max-w-[780px] mx-auto flex items-center justify-between gap-4">
              {/* Live badge + template switcher */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="live-dot" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Live</span>
                </div>
                <div className="border-l border-slate-300 pl-4 flex-1 min-w-0">
                  <TemplateSwitcher
                    currentTemplateId={resume?.templateId || 1}
                    onSwitch={handleTemplateSwitch}
                    disabled={switchingTemplate}
                  />
                </div>
              </div>

              {/* Zoom controls */}
              <div className="zoom-toolbar flex-shrink-0">
                <button className="zoom-btn" onClick={zoomOut} title="Zoom out">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>remove</span>
                </button>
                <span className="text-[10px] font-bold text-slate-500 w-9 text-center select-none">{zoomPercent}%</span>
                <button className="zoom-btn" onClick={zoomIn} title="Zoom in">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button className="zoom-btn" onClick={zoomReset} title="Reset zoom">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>fit_screen</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Preview Canvas ──────────────────────────────── */}
          <div className="flex-1 overflow-y-auto py-8 px-6 flex justify-center">
            <div
              id="resume-preview-area"
              className="preview-page-frame preview-content-transition"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                width: '700px',
                minHeight: '990px',
                marginBottom: `${(zoomLevel - 1) * 990}px`,
              }}
            >
              <ResumeRenderer resume={debouncedResume} sections={debouncedSections} />
            </div>
          </div>
        </section>

        <aside className="w-72 flex-shrink-0 bg-white border-l border-slate-200 overflow-y-auto">
          <div className="p-5 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-indigo-600">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span className="font-bold text-xs uppercase tracking-tight">AI Assistant</span>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Tips to boost your score</h4>
              <ul className="text-xs text-slate-600 space-y-2">
                {[
                  'Start bullets with strong action verbs (Led, Built, Reduced)',
                  'Add numbers: "increased by 40%" beats "significantly increased"',
                  'Keep summary under 4 sentences for best ATS parsing',
                  'Match keywords from the job description',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:opacity-90"
                  onClick={() => onNavigate('analysis', { resumeId })}
                >
                  Run ATS Analysis
                </button>
                <button
                  className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200"
                  onClick={handleExport}
                >
                  Export as PDF
                </button>
                <button
                  className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200"
                  onClick={() => onNavigate('exports')}
                >
                  View Export History
                </button>
              </div>
            </div>

            <div className="text-center">
              <button onClick={() => onNavigate('dashboard')} className="text-xs text-slate-400 hover:text-slate-600 underline">
                Back to Dashboard
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
