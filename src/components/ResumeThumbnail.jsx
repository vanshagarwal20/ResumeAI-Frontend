import React, { useState, useEffect, memo } from 'react';
import { sectionApi } from '../api/services';
import ResumeRenderer from './templates/ResumeRenderer';

/**
 * A lightweight, scaled-down live preview of a resume.
 * Fetches sections on mount and renders the actual template at thumbnail scale.
 * Wrapped in React.memo so it only re-renders when the resumeId or updatedAt changes.
 *
 * Props:
 *   resume    — resume object (must have resumeId, templateId)
 *   height    — CSS height for the thumbnail container (default: '180px')
 */
function ResumeThumbnail({ resume, height = '180px' }) {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!resume?.resumeId) return;

    let cancelled = false;
    sectionApi
      .getByResume(resume.resumeId)
      .then((res) => {
        if (!cancelled) {
          const data = res.data.data || [];
          setSections(data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => { cancelled = true; };
  }, [resume?.resumeId, resume?.updatedAt]);

  // Fallback while loading
  if (!sections && !error) {
    return (
      <div className="resume-thumb-container" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <span className="material-symbols-outlined text-slate-300 animate-spin text-lg">progress_activity</span>
        </div>
      </div>
    );
  }

  // Fallback on error
  if (error || !sections) {
    return (
      <div className="resume-thumb-container" style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <span className="material-symbols-outlined text-slate-300 text-2xl">description</span>
          <span className="text-[10px] text-slate-400">Preview unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-thumb-container" style={{ height }}>
      <div className="resume-thumb-scaler">
        <div className="resume-thumb-content">
          <ResumeRenderer resume={resume} sections={sections} />
        </div>
      </div>
      {/* Invisible overlay to block mouse interaction */}
      <div className="absolute inset-0 z-10" />
    </div>
  );
}

export default memo(ResumeThumbnail, (prev, next) => {
  return (
    prev.resume?.resumeId === next.resume?.resumeId &&
    prev.resume?.updatedAt === next.resume?.updatedAt &&
    prev.resume?.templateId === next.resume?.templateId &&
    prev.height === next.height
  );
});
