import React from 'react';

export default function Template1({ resume, sections }) {
  const summary        = sections.find(s => s.sectionType === 'SUMMARY');
  const experiences    = sections.filter(s => s.sectionType === 'EXPERIENCE');
  const education      = sections.filter(s => s.sectionType === 'EDUCATION');
  const skills         = sections.find(s => s.sectionType === 'SKILLS');
  const projects       = sections.filter(s => s.sectionType === 'PROJECTS');
  const certifications = sections.filter(s => s.sectionType === 'CERTIFICATIONS');
  const extraCurr      = sections.filter(s => s.sectionType === 'EXTRA_CURRICULAR');
  const languages      = sections.filter(s => s.sectionType === 'LANGUAGES');

  return (
    <div className="bg-white shadow-2xl p-12 min-h-[1100px] text-slate-900 font-sans">
      <header className="border-b-4 border-indigo-600 pb-6 mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight uppercase mb-1">
          {resume?.title || 'Your Resume'}
        </h1>
        {resume?.targetJobTitle && (
          <p className="text-sm font-semibold text-indigo-600 mb-2">{resume.targetJobTitle}</p>
        )}
      </header>

      {summary?.content && summary.isVisible !== false && (
        <section className="mb-6">
          <h4 className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mb-2">
            {summary.title || 'Professional Summary'}
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{summary.content}</p>
        </section>
      )}

      {experiences.length > 0 && experiences.some(e => e.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mb-4">Work Experience</h4>
          <div className="space-y-4">
            {experiences.filter(e => e.isVisible !== false).map(exp => (
              <div key={exp.sectionId} className="relative pl-4 border-l-2 border-indigo-100">
                <h5 className="font-bold text-slate-900 text-sm">{exp.title}</h5>
                <p className="text-xs text-slate-600 mt-2 whitespace-pre-line">{exp.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && education.some(e => e.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mb-4">Education</h4>
          <div className="space-y-3">
            {education.filter(e => e.isVisible !== false).map(edu => (
              <div key={edu.sectionId}>
                <h5 className="font-bold text-slate-900 text-sm">{edu.title}</h5>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{edu.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills?.content && skills.isVisible !== false && (
        <section className="mb-6">
          <h4 className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mb-3">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills.content.split(',').map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                {skill.trim()}
              </span>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && projects.some(p => p.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mb-4">Projects</h4>
          <div className="space-y-3">
            {projects.filter(p => p.isVisible !== false).map(p => (
              <div key={p.sectionId}>
                <h5 className="font-bold text-slate-900 text-sm">{p.title}</h5>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{p.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications.length > 0 && certifications.some(c => c.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mb-4">Certifications</h4>
          <div className="space-y-3">
            {certifications.filter(c => c.isVisible !== false).map(c => (
              <div key={c.sectionId}>
                <h5 className="font-bold text-slate-900 text-sm">{c.title}</h5>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{c.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {languages.length > 0 && languages.some(l => l.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mb-4">Languages</h4>
          <div className="space-y-2">
            {languages.filter(l => l.isVisible !== false).map(l => (
              <div key={l.sectionId}>
                <p className="text-xs text-slate-600 whitespace-pre-line">{l.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {extraCurr.length > 0 && extraCurr.some(e => e.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mb-4">Extra Curricular</h4>
          <div className="space-y-3">
            {extraCurr.filter(e => e.isVisible !== false).map(ec => (
              <div key={ec.sectionId}>
                <h5 className="font-bold text-slate-900 text-sm">{ec.title}</h5>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{ec.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-slate-300">
          <span className="material-symbols-outlined text-6xl mb-3">description</span>
          <p className="text-sm">Add sections from the left panel to build your resume</p>
        </div>
      )}
    </div>
  );
}
