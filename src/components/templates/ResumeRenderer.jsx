import React, { Suspense, lazy } from 'react';

// Lazy load templates to improve performance
const Template1 = lazy(() => import('./Template1'));
const Template2 = lazy(() => import('./Template2'));
const Template3 = lazy(() => import('./Template3'));
const Template4 = lazy(() => import('./Template4'));

export default function ResumeRenderer({ resume, sections }) {
  // Determine which template to use, default to Template1 (Modern)
  const templateId = resume?.templateId || 1;

  const renderTemplate = () => {
    switch (templateId) {
      case 1:
        return <Template1 resume={resume} sections={sections} />;
      case 2:
        return <Template2 resume={resume} sections={sections} />;
      case 3:
        return <Template3 resume={resume} sections={sections} />;
      case 4:
        return <Template4 resume={resume} sections={sections} />;
      default:
        return <Template1 resume={resume} sections={sections} />;
    }
  };

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
        <p className="text-sm">Loading template...</p>
      </div>
    }>
      {renderTemplate()}
    </Suspense>
  );
}
