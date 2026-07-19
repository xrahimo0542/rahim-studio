import React from 'react';

export default function Hero({ setActiveTab }) {
  const scrollToSection = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="home" style={{
      height: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-end',
      background: '#000'
    }}>
      {/* Absolute Background Image (Moody 3D Villa Visual matching reference) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1800')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 1
      }} />

      {/* Dark overlay for text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.15) 100%)',
        zIndex: 2
      }} />

      {/* Content Container */}
      <div className="container" style={{
        position: 'relative',
        zIndex: 3,
        width: '100%',
        paddingBottom: '80px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '2rem'
      }}>
        {/* Left side Titles */}
        <div style={{ maxWidth: '680px' }}>
          <div style={{
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            marginBottom: '1rem',
            fontFamily: 'var(--font-body)'
          }}>
            Graphic Design & 3D Visualization Studio
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)',
            lineHeight: '1.2',
            color: '#ffffff',
            fontWeight: 800,
            textTransform: 'uppercase',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.02em'
          }}>
            Bring your projects to life with world-class 3D visualization
          </h1>
        </div>

        {/* Right side buttons */}
        <div style={{ display: 'flex', gap: '0.8rem', zIndex: 10 }}>
          <button 
            onClick={() => scrollToSection('projects')} 
            className="btn" 
            style={{ 
              background: '#000000', 
              color: '#ffffff', 
              border: '1.5px solid #ffffff !important',
              padding: '0.9rem 2.2rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              boxShadow: 'none'
            }}
          >
            PORTFOLIO
          </button>
          <button 
            onClick={() => scrollToSection('contact')} 
            className="btn" 
            style={{ 
              background: '#ffffff', 
              color: '#000000', 
              border: '1.5px solid #ffffff !important',
              padding: '0.9rem 2.2rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              boxShadow: 'none'
            }}
          >
            START PROJECT
          </button>
        </div>
      </div>
      
      {/* Mobile styles override */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          #home .container {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding-bottom: 50px !important;
          }
          #home .container div:last-child {
            width: 100% !important;
            margin-top: 1rem;
          }
          #home .container button {
            flex: 1 !important;
            text-align: center !important;
            padding: 0.8rem 1rem !important;
          }
        }
      `}} />
    </section>
  );
}
