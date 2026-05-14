import React from 'react';

export default function Template2({ resume, sections }) {
  const summary        = sections.find(s => s.sectionType === 'SUMMARY');
  const experiences    = sections.filter(s => s.sectionType === 'EXPERIENCE');
  const education      = sections.filter(s => s.sectionType === 'EDUCATION');
  const skills         = sections.find(s => s.sectionType === 'SKILLS');
  const projects       = sections.filter(s => s.sectionType === 'PROJECTS');
  const certifications = sections.filter(s => s.sectionType === 'CERTIFICATIONS');
  const extraCurr      = sections.filter(s => s.sectionType === 'EXTRA_CURRICULAR');
  const languages      = sections.filter(s => s.sectionType === 'LANGUAGES');

  return (
    <div className="bg-white shadow-2xl p-12 min-h-[1100px] text-gray-900 font-serif">
      {/* Centered Header */}
      <header className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-4xl font-bold tracking-normal uppercase mb-2 text-gray-900">
          {resume?.title || 'Your Name'}
        </h1>
        {resume?.targetJobTitle && (
          <p className="text-base text-gray-700 italic">{resume.targetJobTitle}</p>
        )}
      </header>

      {summary?.content && summary.isVisible !== false && (
        <section className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            {summary.title || 'Professional Summary'}
          </h4>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line text-justify">
            {summary.content}
          </p>
        </section>
      )}

      {experiences.length > 0 && experiences.some(e => e.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            Professional Experience
          </h4>
          <div className="space-y-5">
            {experiences.filter(e => e.isVisible !== false).map(exp => (
              <div key={exp.sectionId}>
                <h5 className="font-bold text-gray-900 text-base">{exp.title}</h5>
                <div className="text-sm text-gray-800 mt-1 whitespace-pre-line list-inside">
                  {exp.content.split('\n').map((line, i) => (
                    <p key={i} className={line.trim().startsWith('-') || line.trim().startsWith('•') ? "ml-4" : ""}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && education.some(e => e.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            Education
          </h4>
          <div className="space-y-3">
            {education.filter(e => e.isVisible !== false).map(edu => (
              <div key={edu.sectionId}>
                <h5 className="font-bold text-gray-900 text-base">{edu.title}</h5>
                <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{edu.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills?.content && skills.isVisible !== false && (
        <section className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            Core Competencies
          </h4>
          <p className="text-sm text-gray-800 leading-relaxed">
            {skills.content.split(',').map(s => s.trim()).join('  •  ')}
          </p>
        </section>
      )}

      {projects.length > 0 && projects.some(p => p.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            Selected Projects
          </h4>
          <div className="space-y-4">
            {projects.filter(p => p.isVisible !== false).map(p => (
              <div key={p.sectionId}>
                <h5 className="font-bold text-gray-900 text-base">{p.title}</h5>
                <p className="text-sm text-gray-800 mt-1 whitespace-pre-line ml-4">{p.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications.length > 0 && certifications.some(c => c.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            Certifications
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
            {certifications.filter(c => c.isVisible !== false).map(c => (
              <li key={c.sectionId}>
                <span className="font-bold">{c.title}</span>
                {c.content && <span> - {c.content}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {languages.length > 0 && languages.some(l => l.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            Languages
          </h4>
          <p className="text-sm text-gray-800">
            {languages.filter(l => l.isVisible !== false).map(l => l.content.trim()).join('  |  ')}
          </p>
        </section>
      )}

      {extraCurr.length > 0 && extraCurr.some(e => e.isVisible !== false) && (
        <section className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            Extra Curricular Activities
          </h4>
          <div className="space-y-3">
            {extraCurr.filter(e => e.isVisible !== false).map(ec => (
              <div key={ec.sectionId}>
                <h5 className="font-bold text-gray-900 text-base">{ec.title}</h5>
                <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{ec.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
