import React from 'react';
import { User, Award, Calendar, BookOpen } from 'lucide-react';

export default function About({ skills }) {
  // Separate skills by category for clear presentation
  const categories = {
    '3D Design': skills.filter(s => s.category === '3D Design'),
    'Graphic Design': skills.filter(s => s.category === 'Graphic Design'),
    'Video Editing': skills.filter(s => s.category === 'Video Editing'),
    'Tools': skills.filter(s => s.category === 'Tools')
  };

  const timeline = [
    {
      year: '2024 - Present',
      role: 'Creative Director & 3D Lead',
      company: 'Aether Media Solutions',
      desc: 'Creating high-fidelity 3D assets, directing cinematic video edits, and developing interactive design portfolios with secure serverless architectures.'
    },
    {
      year: '2022 - 2024',
      role: 'Motion Designer & Editor',
      company: 'PixelForge Studios',
      desc: 'Produced promotional and product cinematic reels, customized color grading profiles, and generated visual identity package grids for enterprise products.'
    },
    {
      year: '2020 - 2022',
      role: 'Lead Graphic Designer',
      company: 'TechBase Systems',
      desc: 'Designed user experience frames, product can mockups, logo guidelines, and custom vector templates.'
    }
  ];

  return (
    <section id="about" style={{ padding: '100px 0', position: 'relative' }}>
      <div className="container">
        
        <div className="section-header">
          <h2>About & Experience</h2>
          <p>A fusion of frontend elegance and backend security architectural design.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '4rem',
          alignItems: 'start'
        }} className="about-grid">
          
          {/* Bio & Timeline */}
          <div>
            <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                <User style={{ color: 'hsl(var(--accent))' }} />
                <h3 style={{ fontSize: '1.4rem' }}>Biography</h3>
              </div>
              <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '1rem', fontSize: '0.98rem' }}>
                I am a passionate Full-Stack Engineer and Security Analyst based in London. My engineering philosophy combines creative, high-aesthetic user interface designs with iron-clad database security. 
              </p>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.98rem' }}>
                I believe that modern websites should be fast, aesthetically jaw-dropping, and robust against malicious exploits. I spend my time auditing web frameworks, tinkering with HTML5 graphics, and building secure database systems.
              </p>
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', paddingLeft: '0.5rem' }}>
              <Calendar style={{ color: 'hsl(var(--primary))' }} /> Career Path
            </h3>

            <div style={{
              position: 'relative',
              paddingLeft: '2rem',
              borderLeft: '2px solid rgba(139, 92, 246, 0.2)'
            }}>
              {timeline.map((item, idx) => (
                <div key={idx} style={{ position: 'relative', marginBottom: '2rem' }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-2.5rem',
                    top: '0.2rem',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: 'hsl(var(--primary))',
                    border: '3px solid hsl(var(--bg-primary))',
                    boxShadow: '0 0 10px hsl(var(--primary))'
                  }} />

                  <span style={{
                    fontSize: '0.82rem',
                    color: 'hsl(var(--accent))',
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                  }}>{item.year}</span>
                  <h4 style={{ fontSize: '1.1rem', margin: '0.2rem 0', color: '#fff' }}>
                    {item.role} - <span style={{ fontWeight: 400, color: 'hsl(var(--text-secondary))' }}>{item.company}</span>
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Skills */}
          <div>
            <div className="glass-card" style={{ height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
                <Award style={{ color: 'hsl(var(--accent))' }} />
                <h3 style={{ fontSize: '1.4rem' }}>Skills & Proficiencies</h3>
              </div>

              {Object.keys(categories).map((catName) => (
                <div key={catName} style={{ marginBottom: '1.8rem' }}>
                  <h4 style={{
                    fontSize: '0.92rem',
                    color: 'hsl(var(--accent))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-heading)'
                  }}>{catName}</h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {categories[catName]?.length > 0 ? (
                      categories[catName].map((skill) => (
                        <div key={skill.id}>
                          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                            <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 500 }}>{skill.name}</span>
                            <span style={{ marginLeft: 'auto', color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>
                              {skill.proficiency}%
                            </span>
                          </div>
                          {/* Progress track */}
                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${skill.proficiency}%`,
                              height: '100%',
                              background: catName === 'Security' 
                                ? 'linear-gradient(90deg, hsl(var(--danger)), hsl(var(--primary)))' 
                                : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
                              borderRadius: '3px',
                              boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
                            }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>No skills seeded in database.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 992px) {
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
        }
      `}} />
    </section>
  );
}
