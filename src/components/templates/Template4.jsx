import React from 'react';

export default function Template4({ resume, sections }) {
  const summary        = sections.find(s => s.sectionType === 'SUMMARY');
  const experiences    = sections.filter(s => s.sectionType === 'EXPERIENCE');
  const education      = sections.filter(s => s.sectionType === 'EDUCATION');
  const skills         = sections.find(s => s.sectionType === 'SKILLS');
  const projects       = sections.filter(s => s.sectionType === 'PROJECTS');
  const certifications = sections.filter(s => s.sectionType === 'CERTIFICATIONS');
  const extraCurr      = sections.filter(s => s.sectionType === 'EXTRA_CURRICULAR');
  const languages      = sections.filter(s => s.sectionType === 'LANGUAGES');

  return (
    <div className="bg-white shadow-2xl p-12 min-h-[1100px] text-gray-800 font-sans tracking-wide">
      {/* Minimalist Header */}
      <header className="mb-10 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-light tracking-widest uppercase mb-1 text-gray-900">
          {resume?.title || 'Your Name'}
        </h1>
        {resume?.targetJobTitle && (
          <p className="text-sm tracking-wider text-gray-500 uppercase">{resume.targetJobTitle}</p>
        )}
      </header>

      {summary?.content && summary.isVisible !== false && (
        <section className="mb-8">
          <p className="text-sm text-gray-600 leading-relaxed font-light whitespace-pre-line">
            {summary.content}
          </p>
        </section>
      )}

      {experiences.length > 0 && experiences.some(e => e.isVisible !== false) && (
        <section className="mb-8">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Experience
          </h4>
          <div className="space-y-6">
            {experiences.filter(e => e.isVisible !== false).map(exp => (
              <div key={exp.sectionId}>
                <h5 className="font-medium text-gray-800 text-sm">{exp.title}</h5>
                <p className="text-sm text-gray-500 mt-2 whitespace-pre-line font-light leading-relaxed">{exp.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && education.some(e => e.isVisible !== false) && (
        <section className="mb-8">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Education
          </h4>
          <div className="space-y-4">
            {education.filter(e => e.isVisible !== false).map(edu => (
              <div key={edu.sectionId}>
                <h5 className="font-medium text-gray-800 text-sm">{edu.title}</h5>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-line font-light">{edu.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills?.content && skills.isVisible !== false && (
        <section className="mb-8">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Skills
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed font-light">
            {skills.content.split(',').map(s => s.trim()).join(' • ')}
          </p>
        </section>
      )}

      {projects.length > 0 && projects.some(p => p.isVisible !== false) && (
        <section className="mb-8">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Projects
          </h4>
          <div className="space-y-4">
            {projects.filter(p => p.isVisible !== false).map(p => (
              <div key={p.sectionId}>
                <h5 className="font-medium text-gray-800 text-sm">{p.title}</h5>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-line font-light leading-relaxed">{p.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications.length > 0 && certifications.some(c => c.isVisible !== false) && (
        <section className="mb-8">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Certifications
          </h4>
          <div className="space-y-3">
            {certifications.filter(c => c.isVisible !== false).map(c => (
              <div key={c.sectionId}>
                <h5 className="font-medium text-gray-800 text-sm">{c.title}</h5>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-line font-light">{c.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {languages.length > 0 && languages.some(l => l.isVisible !== false) && (
        <section className="mb-8">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Languages
          </h4>
          <p className="text-sm text-gray-600 font-light">
            {languages.filter(l => l.isVisible !== false).map(l => l.content.trim()).join(', ')}
          </p>
        </section>
      )}

      {extraCurr.length > 0 && extraCurr.some(e => e.isVisible !== false) && (
        <section className="mb-8">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Extra Curricular
          </h4>
          <div className="space-y-4">
            {extraCurr.filter(e => e.isVisible !== false).map(ec => (
              <div key={ec.sectionId}>
                <h5 className="font-medium text-gray-800 text-sm">{ec.title}</h5>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-line font-light leading-relaxed">{ec.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
