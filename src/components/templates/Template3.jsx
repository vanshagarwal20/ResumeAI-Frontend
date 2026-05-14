import React from 'react';

export default function Template3({ resume, sections }) {
  const summary        = sections.find(s => s.sectionType === 'SUMMARY');
  const experiences    = sections.filter(s => s.sectionType === 'EXPERIENCE');
  const education      = sections.filter(s => s.sectionType === 'EDUCATION');
  const skills         = sections.find(s => s.sectionType === 'SKILLS');
  const projects       = sections.filter(s => s.sectionType === 'PROJECTS');
  const certifications = sections.filter(s => s.sectionType === 'CERTIFICATIONS');
  const extraCurr      = sections.filter(s => s.sectionType === 'EXTRA_CURRICULAR');
  const languages      = sections.filter(s => s.sectionType === 'LANGUAGES');

  return (
    <div className="bg-white shadow-2xl min-h-[1100px] text-slate-800 font-sans flex flex-col">
      {/* Vibrant Header */}
      <header className="bg-teal-600 text-white p-10 flex flex-col items-center justify-center text-center rounded-t-lg">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30 backdrop-blur-sm">
          <span className="text-4xl font-black text-white uppercase tracking-widest">
            {resume?.title ? resume.title.substring(0, 2) : 'ME'}
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight uppercase mb-2 text-white shadow-sm">
          {resume?.title || 'Your Resume'}
        </h1>
        {resume?.targetJobTitle && (
          <p className="text-lg font-medium text-teal-100 bg-teal-900/30 px-4 py-1 rounded-full">{resume.targetJobTitle}</p>
        )}
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left Column (Sidebar) */}
        <div className="w-full md:w-1/3 bg-slate-50 p-8 border-r border-slate-200">
          
          {summary?.content && summary.isVisible !== false && (
            <section className="mb-8">
              <h4 className="text-xs font-black text-teal-600 tracking-widest uppercase mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center text-teal-600 material-symbols-outlined text-sm">person</span>
                Profile
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{summary.content}</p>
            </section>
          )}

          {skills?.content && skills.isVisible !== false && (
            <section className="mb-8">
              <h4 className="text-xs font-black text-teal-600 tracking-widest uppercase mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center text-teal-600 material-symbols-outlined text-sm">psychology</span>
                Skills
              </h4>
              <div className="flex flex-col gap-2">
                {skills.content.split(',').map((skill, i) => (
                  <div key={i} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 shadow-sm flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-2"></span>
                    {skill.trim()}
                  </div>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && education.some(e => e.isVisible !== false) && (
            <section className="mb-8">
              <h4 className="text-xs font-black text-teal-600 tracking-widest uppercase mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center text-teal-600 material-symbols-outlined text-sm">school</span>
                Education
              </h4>
              <div className="space-y-4">
                {education.filter(e => e.isVisible !== false).map(edu => (
                  <div key={edu.sectionId} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <h5 className="font-bold text-slate-800 text-xs mb-1">{edu.title}</h5>
                    <p className="text-[11px] text-slate-500 whitespace-pre-line">{edu.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && languages.some(l => l.isVisible !== false) && (
            <section className="mb-8">
              <h4 className="text-xs font-black text-teal-600 tracking-widest uppercase mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center text-teal-600 material-symbols-outlined text-sm">language</span>
                Languages
              </h4>
              <ul className="space-y-2">
                {languages.filter(l => l.isVisible !== false).map(l => (
                  <li key={l.sectionId} className="text-xs text-slate-600 flex items-center">
                    <span className="material-symbols-outlined text-teal-400 text-sm mr-2">check_circle</span>
                    {l.content}
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>

        {/* Right Column (Main Content) */}
        <div className="w-full md:w-2/3 p-8 bg-white">

          {experiences.length > 0 && experiences.some(e => e.isVisible !== false) && (
            <section className="mb-10">
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-5 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-500">work</span>
                Experience
              </h4>
              <div className="space-y-6">
                {experiences.filter(e => e.isVisible !== false).map((exp, i) => (
                  <div key={exp.sectionId} className="relative">
                    <div className="absolute -left-2 top-1.5 w-1.5 h-1.5 bg-teal-400 rounded-full"></div>
                    <div className="pl-4 border-l-2 border-slate-100">
                      <h5 className="font-bold text-slate-800 text-sm bg-slate-50 inline-block px-2 py-0.5 rounded text-teal-700">{exp.title}</h5>
                      <p className="text-xs text-slate-600 mt-2 whitespace-pre-line">{exp.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {projects.length > 0 && projects.some(p => p.isVisible !== false) && (
            <section className="mb-10">
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-5 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-500">rocket_launch</span>
                Projects
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {projects.filter(p => p.isVisible !== false).map(p => (
                  <div key={p.sectionId} className="bg-slate-50 border border-slate-100 p-4 rounded-xl hover:shadow-md transition-shadow">
                    <h5 className="font-bold text-slate-800 text-sm mb-2 text-teal-700">{p.title}</h5>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{p.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {certifications.length > 0 && certifications.some(c => c.isVisible !== false) && (
            <section className="mb-10">
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-5 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-500">verified</span>
                Certifications
              </h4>
              <div className="space-y-3">
                {certifications.filter(c => c.isVisible !== false).map(c => (
                  <div key={c.sectionId} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-teal-400 mt-0.5">workspace_premium</span>
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">{c.title}</h5>
                      <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-line">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {extraCurr.length > 0 && extraCurr.some(e => e.isVisible !== false) && (
            <section className="mb-10">
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-5 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-500">volunteer_activism</span>
                Extra Curricular
              </h4>
              <div className="space-y-4">
                {extraCurr.filter(e => e.isVisible !== false).map(ec => (
                  <div key={ec.sectionId}>
                    <h5 className="font-bold text-slate-800 text-sm">{ec.title}</h5>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{ec.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
