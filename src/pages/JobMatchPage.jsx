import { useState, useEffect, useCallback } from 'react';
import TopNav from '../components/TopNav';
import { jobMatchApi } from '../api/services';
import { resumeApi } from '../api/resumeApi';

/* ───────────────────── helper: score color ───────────────────── */
function scoreColor(s) {
  if (s >= 80) return '#10b981';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}
function scoreBg(s) {
  if (s >= 80) return 'rgba(16,185,129,.12)';
  if (s >= 50) return 'rgba(245,158,11,.12)';
  return 'rgba(239,68,68,.12)';
}
function sourceStyle(src) {
  if (src === 'LinkedIn') return { bg: '#0a66c2', text: '#fff' };
  if (src === 'Naukri') return { bg: '#0b8043', text: '#fff' };
  return { bg: '#64748b', text: '#fff' };
}

/* ───────────────────── tiny circular score ───────────────────── */
function ScoreCircle({ score, size = 56 }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, offset = c - (score / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={scoreColor(score)}
        strokeWidth={4} strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: size*.28, fontWeight: 700, fill: scoreColor(score) }}>
        {score}%
      </text>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function JobMatchPage({ onNavigate }) {
  const [tab, setTab] = useState('search');
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  // search state
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [jobResults, setJobResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // match history
  const [matches, setMatches] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // analyze modal
  const [analyzing, setAnalyzing] = useState(null); // job listing being analyzed
  const [analyzeResult, setAnalyzeResult] = useState(null);

  // recommendations
  const [recsId, setRecsId] = useState(null);
  const [recs, setRecs] = useState('');
  const [loadingRecs, setLoadingRecs] = useState(false);

  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── load resumes ── */
  useEffect(() => {
    resumeApi.getAll().then(r => {
      const list = r.data?.data || [];
      setResumes(list);
      if (list.length > 0) setSelectedResumeId(String(list[0].resumeId));
    }).catch(() => {});
  }, []);

  /* ── load matches when tab changes ── */
  const loadMatches = useCallback(async () => {
    setLoadingMatches(true);
    try {
      const r = await jobMatchApi.getAll();
      setMatches(r.data?.data || []);
    } catch { /* */ }
    setLoadingMatches(false);
  }, []);

  const loadBookmarks = useCallback(async () => {
    setLoadingMatches(true);
    try {
      const r = await jobMatchApi.getBookmarks();
      setBookmarks(r.data?.data || []);
    } catch { /* */ }
    setLoadingMatches(false);
  }, []);

  const loadTop = useCallback(async () => {
    setLoadingMatches(true);
    try {
      const r = await jobMatchApi.getTopMatches(10);
      setTopMatches(r.data?.data || []);
    } catch { /* */ }
    setLoadingMatches(false);
  }, []);

  useEffect(() => {
    if (tab === 'history') loadMatches();
    if (tab === 'bookmarks') loadBookmarks();
    if (tab === 'top') loadTop();
  }, [tab, loadMatches, loadBookmarks, loadTop]);

  /* ── search jobs ── */
  const handleSearch = async () => {
    if (!searchTitle.trim()) return;
    setSearching(true); setJobResults([]);
    try {
      const r = await jobMatchApi.searchJobs({ jobTitle: searchTitle.trim(), location: searchLocation.trim() || 'Remote' });
      setJobResults(r.data?.data || []);
    } catch { showToast('Failed to search jobs'); }
    setSearching(false);
  };

  /* ── analyze fit ── */
  const handleAnalyze = async (job) => {
    if (!selectedResumeId) { showToast('Please select a resume first'); return; }
    setAnalyzing(job); setAnalyzeResult(null);
    try {
      const r = await jobMatchApi.analyze({
        resumeId: Number(selectedResumeId),
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        jobUrl: job.jobUrl,
        jobDescription: job.description || job.jobTitle + ' role at ' + job.companyName,
      });
      setAnalyzeResult(r.data?.data);
      showToast('Job fit analysis complete!');
    } catch { showToast('Analysis failed'); }
  };

  /* ── bookmark toggle ── */
  const toggleBookmark = async (m) => {
    try {
      if (m.bookmarked) { await jobMatchApi.unbookmark(m.jobMatchId); }
      else { await jobMatchApi.bookmark(m.jobMatchId); }
      showToast(m.bookmarked ? 'Removed from bookmarks' : 'Bookmarked!');
      if (tab === 'history') loadMatches();
      if (tab === 'bookmarks') loadBookmarks();
      if (tab === 'top') loadTop();
    } catch { showToast('Failed to update bookmark'); }
  };

  /* ── delete match ── */
  const handleDelete = async (id) => {
    try {
      await jobMatchApi.delete(id);
      showToast('Match deleted');
      if (tab === 'history') loadMatches();
      if (tab === 'bookmarks') loadBookmarks();
      if (tab === 'top') loadTop();
    } catch { showToast('Failed to delete'); }
  };

  /* ── recommendations ── */
  const handleRecs = async (id) => {
    if (recsId === id) { setRecsId(null); return; }
    setRecsId(id); setRecs(''); setLoadingRecs(true);
    try {
      const r = await jobMatchApi.getRecommendations(id);
      setRecs(r.data?.data || 'No recommendations available.');
    } catch { setRecs('Failed to load recommendations.'); }
    setLoadingRecs(false);
  };

  /* ── tabs ── */
  const tabs = [
    { id: 'search', icon: 'search', label: 'Search Jobs' },
    { id: 'history', icon: 'history', label: 'Match History' },
    { id: 'bookmarks', icon: 'bookmark', label: 'Bookmarks' },
    { id: 'top', icon: 'emoji_events', label: 'Top Matches' },
  ];

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <TopNav activePage="job-matches" onNavigate={onNavigate} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: 32 }}>work</span>
            Job Match
          </h1>
          <p className="text-slate-500 mt-1">Search jobs from LinkedIn &amp; Naukri, analyze resume-to-job fit, and get tailoring recommendations.</p>
        </div>

        {/* resume selector */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <label className="text-sm font-semibold text-slate-600">Active Resume:</label>
          <select value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)}
            className="input-field max-w-xs" style={{ width: 260 }}>
            {resumes.map(r => (
              <option key={r.resumeId} value={r.resumeId}>{r.title || `Resume #${r.resumeId}`}</option>
            ))}
            {resumes.length === 0 && <option value="">No resumes found</option>}
          </select>
        </div>

        {/* tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-slate-100 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span className="material-symbols-outlined text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── SEARCH TAB ─── */}
        {tab === 'search' && (
          <div className="animate-fade-in">
            {/* search bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
              <div className="flex gap-3 flex-wrap">
                <input placeholder="Job title (e.g. Java Developer)" value={searchTitle}
                  onChange={e => setSearchTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="input-field flex-1 min-w-[200px]" />
                <input placeholder="Location (e.g. Bangalore)" value={searchLocation}
                  onChange={e => setSearchLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="input-field w-48" />
                <button onClick={handleSearch} disabled={searching || !searchTitle.trim()} className="btn-primary">
                  <span className="material-symbols-outlined text-lg">{searching ? 'hourglass_empty' : 'search'}</span>
                  {searching ? 'Searching...' : 'Search Jobs'}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">Fetches live listings from LinkedIn and Naukri job portals</p>
            </div>

            {/* results */}
            {searching && <div className="text-center py-16 text-slate-400"><span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span><p className="mt-2">Searching LinkedIn &amp; Naukri...</p></div>}

            {!searching && jobResults.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {jobResults.map((job, i) => {
                  const ss = sourceStyle(job.source);
                  return (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: ss.bg, color: ss.text }}>{job.source}</span>
                            {job.employmentType && <span className="text-[10px] text-slate-400 font-medium">{job.employmentType}</span>}
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm truncate">{job.jobTitle}</h3>
                          <p className="text-xs text-slate-500">{job.companyName}</p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <div className="text-lg font-black" style={{ color: scoreColor(job.relevanceScore) }}>{job.relevanceScore}%</div>
                          <div className="text-[10px] text-slate-400">relevance</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span>{job.location}</span>
                        {job.salary && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">payments</span>{job.salary}</span>}
                        {job.postedDate && <span>{job.postedDate}</span>}
                      </div>
                      {job.description && <p className="text-xs text-slate-500 mb-4 line-clamp-2">{job.description}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => handleAnalyze(job)} disabled={!selectedResumeId || analyzing === job}
                          className="btn-primary text-xs py-1.5 px-3">
                          <span className="material-symbols-outlined text-sm">{analyzing === job ? 'hourglass_empty' : 'analytics'}</span>
                          {analyzing === job ? 'Analyzing...' : 'Analyze Fit'}
                        </button>
                        <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1.5 px-3">
                          <span className="material-symbols-outlined text-sm">open_in_new</span>Apply
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!searching && jobResults.length === 0 && searchTitle && (
              <div className="text-center py-16 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-2">work_off</span>
                <p>No results yet. Try searching for a job title.</p>
              </div>
            )}

            {!searching && !searchTitle && (
              <div className="text-center py-16 text-slate-300">
                <span className="material-symbols-outlined text-6xl mb-3">travel_explore</span>
                <p className="text-slate-400 font-medium">Enter a job title to search across LinkedIn &amp; Naukri</p>
              </div>
            )}
          </div>
        )}

        {/* ─── ANALYSIS RESULT MODAL ─── */}
        {analyzeResult && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setAnalyzeResult(null); setAnalyzing(null); }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">Job Fit Analysis</h3>
                <button onClick={() => { setAnalyzeResult(null); setAnalyzing(null); }} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <ScoreCircle score={analyzeResult.matchScore} size={72} />
                <div>
                  <h4 className="font-bold text-slate-900">{analyzeResult.jobTitle}</h4>
                  <p className="text-sm text-slate-500">{analyzeResult.companyName || 'Company'}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sourceStyle(analyzeResult.source).bg, color: '#fff' }}>{analyzeResult.source}</span>
                </div>
              </div>
              {/* matched keywords */}
              {analyzeResult.matchedKeywords?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">✅ Matched Skills</p>
                  <div className="flex flex-wrap gap-1">{analyzeResult.matchedKeywords.map((k, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{k}</span>
                  ))}</div>
                </div>
              )}
              {analyzeResult.missingKeywords?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">❌ Missing Skills</p>
                  <div className="flex flex-wrap gap-1">{analyzeResult.missingKeywords.map((k, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">{k}</span>
                  ))}</div>
                </div>
              )}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 mb-4">
                <p className="text-xs text-slate-600">{analyzeResult.recommendation}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { toggleBookmark({ ...analyzeResult, bookmarked: false }); }} className="btn-secondary text-xs py-1.5">
                  <span className="material-symbols-outlined text-sm">bookmark_add</span>Bookmark
                </button>
                <button onClick={() => { setAnalyzeResult(null); setAnalyzing(null); }} className="btn-ghost text-xs py-1.5 ml-auto">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── HISTORY / BOOKMARKS / TOP ─── */}
        {(tab === 'history' || tab === 'bookmarks' || tab === 'top') && (
          <div className="animate-fade-in">
            {loadingMatches && <div className="text-center py-16 text-slate-400"><span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span><p className="mt-2">Loading...</p></div>}

            {!loadingMatches && (() => {
              const list = tab === 'history' ? matches : tab === 'bookmarks' ? bookmarks : topMatches;
              if (list.length === 0) return (
                <div className="text-center py-16 text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-2">{tab === 'bookmarks' ? 'bookmark_border' : tab === 'top' ? 'emoji_events' : 'history'}</span>
                  <p>{tab === 'bookmarks' ? 'No bookmarked matches yet.' : tab === 'top' ? 'No matches yet. Analyze some jobs first!' : 'No match history yet.'}</p>
                </div>
              );
              return (
                <div className="space-y-3">
                  {list.map(m => (
                    <div key={m.jobMatchId} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <ScoreCircle score={m.matchScore} size={52} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-slate-900 text-sm truncate">{m.jobTitle}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sourceStyle(m.source).bg, color: '#fff' }}>{m.source}</span>
                          </div>
                          <p className="text-xs text-slate-500">{m.companyName || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ''}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => handleRecs(m.jobMatchId)} title="Recommendations"
                            className={`p-2 rounded-lg transition-colors ${recsId === m.jobMatchId ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-400'}`}>
                            <span className="material-symbols-outlined text-lg">lightbulb</span>
                          </button>
                          <button onClick={() => toggleBookmark(m)} title={m.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                            className={`p-2 rounded-lg transition-colors ${m.bookmarked ? 'bg-amber-50 text-amber-500' : 'hover:bg-slate-50 text-slate-400'}`}>
                            <span className="material-symbols-outlined text-lg" style={m.bookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}>bookmark</span>
                          </button>
                          {m.jobUrl && (
                            <a href={m.jobUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-50 text-slate-400">
                              <span className="material-symbols-outlined text-lg">open_in_new</span>
                            </a>
                          )}
                          <button onClick={() => handleDelete(m.jobMatchId)} title="Delete" className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                      {/* keywords */}
                      {(m.matchedKeywords?.length > 0 || m.missingKeywords?.length > 0) && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {m.matchedKeywords?.slice(0, 6).map((k, i) => (
                            <span key={'m'+i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">{k}</span>
                          ))}
                          {m.missingKeywords?.slice(0, 4).map((k, i) => (
                            <span key={'x'+i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600">{k}</span>
                          ))}
                        </div>
                      )}
                      {/* recommendation */}
                      {m.recommendation && (
                        <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{m.recommendation}</p>
                      )}
                      {/* expanded recommendations */}
                      {recsId === m.jobMatchId && (
                        <div className="mt-3 p-4 bg-indigo-50/60 rounded-lg border border-indigo-100 animate-fade-in">
                          {loadingRecs ? (
                            <p className="text-xs text-indigo-500">Loading recommendations...</p>
                          ) : (
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{recs}</pre>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
