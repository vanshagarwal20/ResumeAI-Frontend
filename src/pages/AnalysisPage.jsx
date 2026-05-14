import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { resumeApi } from '../api/resumeApi';
import { aiApi, jobMatchApi, sectionApi } from '../api/services';
import { getErrorMessage } from '../utils/errorHandler';
import TopNav from '../components/TopNav';

function ScoreArc({ score }) {
  const r = 88;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r={r} fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
      <circle
        cx="100"
        cy="100"
        r={r}
        fill="transparent"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.2s ease' }}
      />
    </svg>
  );
}

export default function AnalysisPage({ onNavigate, resumeId }) {
  const toast = useToast();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(resumeId || null);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [jobMatches, setJobMatches] = useState([]);
  const [savingMatch, setSavingMatch] = useState(false);
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => {
    loadResumes();
    loadJobMatches();
  }, []);

  async function loadResumes() {
    try {
      const res = await resumeApi.getAll();
      const data = [...(res.data.data || [])].sort((a, b) =>
        new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)
      );
      setResumes(data);

      if (resumeId) {
        setSelectedResumeId(resumeId);
      } else if (data.length > 0) {
        setSelectedResumeId(data[0].resumeId);
      } else {
        try {
          const recent = await resumeApi.getRecent();
          if (recent.data.data?.resumeId) {
            setSelectedResumeId(recent.data.data.resumeId);
          }
        } catch {
          // no resumes yet
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function loadJobMatches() {
    try {
      const res = await jobMatchApi.getAll();
      setJobMatches(res.data.data || []);
    } catch {
      // silent
    }
  }

  async function handleAnalyze() {
    if (!selectedResumeId) {
      toast.error('Please select a resume first.');
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Please paste a job description.');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const selectedResume = resumes.find((r) => r.resumeId === selectedResumeId);

      const sectionsRes = await sectionApi.getByResume(selectedResumeId);
      const resumeSections = sectionsRes.data.data || [];

      const resumeText = [
        selectedResume?.title || '',
        selectedResume?.targetJobTitle || '',
        ...resumeSections.map((section) =>
          typeof section.content === 'string'
            ? section.content
            : JSON.stringify(section.content || {})
        ),
      ]
        .join(' ')
        .trim();

      const res = await aiApi.analyzeAts({
        resumeId: selectedResumeId,
        resumeText,
        jobDescription,
      });

      const data = res.data.data;
      setResult(data);

      // Update ATS score on resume — non-blocking, don't let failure hide the analysis result
      try {
        await resumeApi.updateAtsScore(selectedResumeId, data.atsScore || data.score || 0);
      } catch {
        // score update is best-effort; backend already did it internally
      }

      toast.success('ATS analysis complete!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveJobMatch() {
    if (!result || !selectedResumeId) return;

    setSavingMatch(true);
    try {
      const res = await jobMatchApi.create({
        resumeId: selectedResumeId,
        jobTitle: jobTitle || 'Analyzed Role',
        jobDescription,
        companyName: '',
      });

      setJobMatches((prev) => [res.data.data, ...prev]);
      toast.success('Job match saved!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingMatch(false);
    }
  }

  async function handleDeleteMatch(matchId) {
    try {
      await jobMatchApi.delete(matchId);
      setJobMatches((prev) => prev.filter((m) => m.id !== matchId && m.matchId !== matchId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const score = result?.atsScore || result?.score || 0;
  const missingKeywords = result?.missingKeywords || [];
  const presentKeywords = result?.presentKeywords || result?.matchedKeywords || [];
  const suggestions = result?.suggestions?.length
    ? result.suggestions
    : result?.improvements?.length
      ? result.improvements
      : result?.recommendation
        ? [result.recommendation]
        : [];

  return (
    <div className="min-h-screen bg-background">
      <TopNav activePage="analysis" onNavigate={onNavigate} />

      <main className="max-w-[1280px] mx-auto px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ATS Analysis</h1>
            <p className="text-slate-500 mt-1">
              Paste a job description to see how well your resume matches.
            </p>
          </div>
          <button onClick={() => onNavigate('dashboard')} className="btn-ghost text-sm">
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="section-card p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Resume</label>
              {resumes.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">
                  No resumes yet.{' '}
                  <button
                    className="text-indigo-600 font-semibold hover:underline"
                    onClick={() => onNavigate('editor')}
                  >
                    Create one first
                  </button>
                </div>
              ) : (
                <select
                  className="input-field"
                  value={selectedResumeId || ''}
                  onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                >
                  {resumes.map((r) => (
                    <option key={r.resumeId} value={r.resumeId}>
                      {r.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="section-card p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Job Title (for saving)
              </label>
              <input
                className="input-field mb-3"
                placeholder="e.g. Software Engineer @ Google"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />

              <label className="block text-sm font-semibold text-slate-700 mb-2">Job Description</label>
              <textarea
                className="input-field resize-none text-sm"
                rows={10}
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />

              <button
                className="btn-primary w-full justify-center mt-4"
                onClick={handleAnalyze}
                disabled={analyzing || !selectedResumeId || !jobDescription.trim()}
              >
                {analyzing ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-base">progress_activity</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                    Analyze with AI
                  </>
                )}
              </button>
            </div>

            {result && (
              <div className="section-card p-8 flex flex-col items-center text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  ATS Score
                </span>
                <div className="relative w-44 h-44 flex items-center justify-center mb-4">
                  <ScoreArc score={score} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-slate-900">{score}</span>
                    <span className="text-sm text-slate-400">
                      {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  {result.summary || `Your resume matches ${score}% of the job requirements.`}
                </p>
                <button
                  onClick={handleSaveJobMatch}
                  disabled={savingMatch}
                  className="btn-secondary text-sm py-2 w-full justify-center"
                >
                  {savingMatch ? 'Saving...' : 'Save Job Match'}
                </button>
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-7 space-y-6">
            {!result && !analyzing && (
              <div className="section-card p-12 flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-slate-300 text-7xl mb-4">
                  manage_search
                </span>
                <h3 className="text-lg font-semibold text-slate-400 mb-2">No analysis yet</h3>
                <p className="text-slate-400 text-sm">
                  Select a resume and paste a job description, then click Analyze.
                </p>
              </div>
            )}

            {analyzing && (
              <div className="section-card p-12 flex flex-col items-center text-center">
                <span className="animate-spin material-symbols-outlined text-indigo-600 text-5xl mb-4">
                  progress_activity
                </span>
                <p className="text-slate-500 text-sm">
                  Analyzing your resume against the job description...
                </p>
              </div>
            )}

            {result && (
              <>
                <div className="section-card p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">label_important</span>
                    Keyword Analysis
                  </h3>

                  {missingKeywords.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">
                        Missing Keywords
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {missingKeywords.map((k) => (
                          <span
                            key={k}
                            className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-medium border border-red-100 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {presentKeywords.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                        Present Keywords
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {presentKeywords.map((k) => (
                          <span
                            key={k}
                            className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">check</span>
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {suggestions.length > 0 && (
                  <div className="section-card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-indigo-500"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        auto_awesome
                      </span>
                      AI Suggestions
                    </h3>
                    <div className="space-y-3">
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100"
                        >
                          <span className="material-symbols-outlined text-indigo-600 text-base mt-0.5">
                            lightbulb
                          </span>
                          <p className="text-sm text-slate-700">
                            {typeof s === 'string' ? s : s.text || s.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn-primary mt-4 text-sm py-2"
                      onClick={() => onNavigate('editor', { resumeId: selectedResumeId })}
                    >
                      Apply Fixes in Editor{' '}
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                )}

                {result.breakdown && (
                  <div className="section-card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Score Breakdown</h3>
                    <div className="space-y-4">
                      {Object.entries(result.breakdown).map(([label, scoreValue]) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-medium text-slate-700 capitalize">
                              {label.replace(/_/g, ' ')}
                            </span>
                            <span className="text-slate-400 text-xs font-semibold">
                              {scoreValue}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${scoreValue}%`,
                                background:
                                  scoreValue >= 80
                                    ? '#10b981'
                                    : scoreValue >= 60
                                      ? '#f59e0b'
                                      : '#ef4444',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {jobMatches.length > 0 && (
              <div className="section-card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Saved Job Matches</h3>
                <div className="space-y-3">
                  {jobMatches.slice(0, 5).map((m) => (
                    <div
                      key={m.id || m.matchId || m.jobMatchId}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{m.jobTitle}</p>
                        <p className="text-xs text-slate-400">{m.companyName || 'Company'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${m.matchScore || m.atsScore || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-indigo-600">
                            {m.matchScore || m.atsScore || 0}%
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteMatch(m.id || m.matchId || m.jobMatchId)}
                          className="text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
