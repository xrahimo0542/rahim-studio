import React, { useState } from 'react';
import { ExternalLink, X, Eye, Play } from 'lucide-react';

// Custom inline SVG GitHub Icon to match Lucide stroke guidelines
const GithubIcon = ({ size = 20, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const formatUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const unescapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/');
};

const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : '';
  return `${backendHost}${url}`;
};

// Helper to parse images from DB (handles single strings and serialized JSON arrays)
const getImagesArray = (imageUrlField) => {
  if (!imageUrlField) return ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600'];
  const unescaped = unescapeHtml(imageUrlField);
  try {
    const parsed = JSON.parse(unescaped);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    // Single image URL fallback
  }
  return [unescaped];
};

export default function Projects({ projects }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const filters = ['All', '3D Design', 'Graphic Design', 'Video Editing'];

  // Filter projects by matching tags or category names
  const filteredProjects = activeFilter === 'All'
    ? projects
    : projects.filter(p => {
        if (!p.tags) return false;
        const tagsLower = p.tags.toLowerCase();
        const filterLower = activeFilter.toLowerCase();
        
        if (filterLower === '3d design') {
          return tagsLower.includes('3d') || 
                 tagsLower.includes('modeling') || 
                 tagsLower.includes('render') || 
                 tagsLower.includes('architecture') || 
                 tagsLower.includes('environment') || 
                 tagsLower.includes('archviz');
        }
        if (filterLower === 'graphic design') {
          return tagsLower.includes('graphic') || 
                 tagsLower.includes('branding') || 
                 tagsLower.includes('layout') || 
                 tagsLower.includes('figma');
        }
        if (filterLower === 'video editing') {
          return tagsLower.includes('video') || 
                 tagsLower.includes('editing') || 
                 tagsLower.includes('color') || 
                 tagsLower.includes('resolve');
        }
        
        return tagsLower.includes(filterLower);
      });

  return (
    <section id="projects" style={{ padding: 0, position: 'relative', width: '100%', overflowX: 'hidden', background: 'hsl(var(--bg-primary))' }}>
      
      {/* Featured Projects centered banner matching reference */}
      <div style={{
        background: 'hsl(var(--bg-primary))',
        padding: '6rem 2rem 4rem 2rem',
        textAlign: 'center',
        borderBottom: '1px solid var(--border-glass)'
      }}>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 2.8rem)',
          fontWeight: 600,
          color: 'hsl(var(--text-primary))',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.02em',
          textTransform: 'none'
        }}>
          Featured Projects
        </h2>
      </div>

      {/* Swiss Minimalist Filter Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
        padding: '1.2rem 2rem',
        background: 'hsl(var(--bg-primary))',
        borderBottom: '1px solid var(--border-glass)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        fontWeight: 600,
        letterSpacing: '0.05em'
      }}>
        {filters.map((filter, idx) => (
          <React.Fragment key={filter}>
            <button
              onClick={() => setActiveFilter(filter)}
              style={{
                background: 'none',
                border: 'none',
                color: activeFilter === filter ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
                cursor: 'pointer',
                fontWeight: activeFilter === filter ? 700 : 500,
                padding: '0.2rem 0',
                transition: 'var(--transition-fast)'
              }}
            >
              {filter}
            </button>
            {idx < filters.length - 1 && <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Full-Bleed Project Grid with Zero Gap */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '0px',
        padding: '0px',
        width: '100%',
        boxSizing: 'border-box'
      }} className="projects-grid">
        {filteredProjects.map((project) => {
          const isVideo = !!project.video_url;
          const images = getImagesArray(project.image_url);
          const coverImage = images[0] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600';

          return (
            <div
              key={project.id}
              style={{
                padding: 0,
                position: 'relative',
                height: '420px',
                cursor: 'pointer',
                overflow: 'hidden',
                background: 'hsl(var(--bg-primary))',
                transition: 'var(--transition-smooth)'
              }}
              className="project-card-container"
              onClick={() => {
                setSelectedProject(project);
                setActiveImageIdx(0);
              }}
            >
              {/* Cover Image */}
              <img
                src={getFullImageUrl(coverImage)}
                alt={project.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '0px',
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                className="project-image"
              />

              {/* Media Indicator Badge */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                background: isVideo ? 'hsl(var(--primary))' : 'rgba(18, 18, 22, 0.85)',
                color: '#ffffff',
                padding: '4px 10px',
                fontSize: '0.65rem',
                fontWeight: 600,
                borderRadius: '4px',
                zIndex: 10
              }}>
                {isVideo ? 'PLAY REEL' : `${images.length} PHOTOS`}
              </div>

              {/* Hover Details Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(9, 9, 11, 0.95)',
                opacity: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                transition: 'opacity 0.3s ease',
                zIndex: 8,
                borderRadius: '0px'
              }} className="image-overlay">
                
                {/* Title and Badge on Hover */}
                <h4 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.4rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                  {project.title}
                </h4>
                
                <span style={{
                  fontSize: '0.72rem',
                  color: 'hsl(var(--accent))',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  marginBottom: '1rem',
                  display: 'inline-block'
                }}>
                  {project.tags.split(',')[0]}
                </span>

                <p style={{
                  fontSize: '0.82rem',
                  color: 'hsl(var(--text-secondary))',
                  lineHeight: '1.5',
                  marginBottom: '1.2rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontFamily: 'var(--font-body)',
                  maxWidth: '280px'
                }}>
                  {project.description}
                </p>
                <span className="btn btn-secondary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.78rem', pointerEvents: 'none' }}>
                  <Eye size={12} /> View Specs
                </span>
              </div>
            </div>
          );
        })}
      </div>

        {/* Dynamic Project Detail Modal */}
        {selectedProject && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2000,
              background: 'rgba(5, 7, 12, 0.85)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
            onClick={() => setSelectedProject(null)}
          >
            <div
              className="glass-card"
              style={{
                maxWidth: '750px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                cursor: 'default'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                style={{
                  position: 'absolute',
                  top: '1.2rem',
                  right: '1.2rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a',
                  cursor: 'pointer',
                  zIndex: 2100,
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={18} />
              </button>

              {/* Dynamic Video Player or Interactive Image Carousel */}
              {selectedProject.video_url ? (
                <div style={{
                  width: '100%',
                  height: '350px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '1.5rem',
                  border: '1px solid var(--border-glass)',
                  background: '#000'
                }}>
                  <iframe
                    src={selectedProject.video_url}
                    title={selectedProject.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (() => {
                const modalImages = getImagesArray(selectedProject.image_url);
                return (
                  <div style={{ marginBottom: '1.5rem', width: '100%' }}>
                    {/* Main Image Viewer */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '380px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-glass)',
                      background: '#121622'
                    }}>
                      <img
                        src={getFullImageUrl(modalImages[activeImageIdx]) || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800'}
                        alt={selectedProject.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          background: '#0a0d16'
                        }}
                      />
                      
                      {/* Carousel Navigation Arrows */}
                      {modalImages.length > 1 && (
                        <>
                          <button
                            onClick={() => setActiveImageIdx(prev => (prev === 0 ? modalImages.length - 1 : prev - 1))}
                            style={{
                              position: 'absolute',
                              left: '1rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'rgba(5, 7, 12, 0.75)',
                              border: '1px solid var(--border-glass)',
                              borderRadius: '50%',
                              width: '36px',
                              height: '36px',
                              color: '#fff',
                              cursor: 'pointer',
                              zIndex: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.4rem',
                              lineHeight: 0
                            }}
                          >
                            ‹
                          </button>
                          <button
                            onClick={() => setActiveImageIdx(prev => (prev === modalImages.length - 1 ? 0 : prev + 1))}
                            style={{
                              position: 'absolute',
                              right: '1rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'rgba(5, 7, 12, 0.75)',
                              border: '1px solid var(--border-glass)',
                              borderRadius: '50%',
                              width: '36px',
                              height: '36px',
                              color: '#fff',
                              cursor: 'pointer',
                              zIndex: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.4rem',
                              lineHeight: 0
                            }}
                          >
                            ›
                          </button>
                          
                          {/* Indicators Dots */}
                          <div style={{
                            position: 'absolute',
                            bottom: '1rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '0.5rem',
                            zIndex: 10,
                            background: 'rgba(0,0,0,0.5)',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '10px'
                          }}>
                            {modalImages.map((_, idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: activeImageIdx === idx ? 'hsl(var(--accent))' : 'rgba(255,255,255,0.4)',
                                  transition: 'background 0.3s ease'
                                }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Horizontal Thumbnails Row */}
                    {modalImages.length > 1 && (
                      <div style={{
                        display: 'flex',
                        gap: '0.6rem',
                        marginTop: '0.8rem',
                        overflowX: 'auto',
                        paddingBottom: '0.4rem'
                      }}>
                        {modalImages.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: activeImageIdx === idx ? '2px solid hsl(var(--accent))' : '2px solid transparent',
                              boxShadow: activeImageIdx === idx ? '0 0 10px var(--accent-glow)' : 'none',
                              opacity: activeImageIdx === idx ? 1 : 0.5,
                              transition: 'all 0.2s ease',
                              flexShrink: 0
                            }}
                          >
                            <img src={getFullImageUrl(img)} alt={`thumb-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {selectedProject.tags && selectedProject.tags.split(',').map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.78rem',
                      background: 'rgba(6, 182, 212, 0.08)',
                      color: 'hsl(var(--accent))',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      padding: '0.2rem 0.8rem',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>

              <h3 style={{ fontSize: '1.8rem', color: 'hsl(var(--text-primary))', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                {selectedProject.title}
              </h3>

              <p style={{
                color: 'hsl(var(--text-secondary))',
                fontSize: '1rem',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                {selectedProject.description}
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
                {selectedProject.live_url && (
                  <a
                    href={formatUrl(selectedProject.live_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    Launch Live Showcase <ExternalLink size={16} />
                  </a>
                )}
                {selectedProject.github_url && (
                  <a
                    href={formatUrl(selectedProject.github_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                  >
                    View Source Files <GithubIcon size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

      <style dangerouslySetInnerHTML={{__html: `
        .projects-grid .glass-card:hover .project-image {
          transform: scale(1.08);
        }
        .projects-grid .glass-card:hover .image-overlay {
          opacity: 1 !important;
        }
      `}} />
    </section>
  );
}
