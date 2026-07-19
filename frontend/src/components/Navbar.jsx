import React, { useState, useEffect } from 'react';
import { Shield, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, token, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);

  const handleLogoClick = () => {
    if (clickTimer) clearTimeout(clickTimer);
    
    const newClicks = logoClicks + 1;
    if (newClicks >= 5) {
      handleNavClick('admin');
      setLogoClicks(0);
    } else {
      setLogoClicks(newClicks);
      const timer = setTimeout(() => {
        setLogoClicks(0);
      }, 2000);
      setClickTimer(timer);
      handleNavClick('projects');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileOpen(false);
    
    // Custom smooth scroll navigation
    if (tab === 'admin') return;
    
    const element = document.getElementById(tab);
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
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container" style={{ position: 'relative' }}>
        <div className="nav-logo" style={{ cursor: 'pointer' }} onClick={handleLogoClick}>
          <Shield size={24} style={{ color: 'hsl(var(--accent))' }} />
          <span>RAHIM<span style={{ color: 'hsl(var(--primary))' }}>.STUDIO</span></span>
        </div>

        {/* Minimalist Custom Two-Bar Trigger (=) */}
        <button 
          className="nav-toggle" 
          onClick={() => setMobileOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '26px',
            height: '10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            outline: 'none',
            zIndex: 100
          }}
          title="Open Menu"
        >
          <div style={{ width: '100%', height: '2px', background: '#ffffff' }} />
          <div style={{ width: '100%', height: '2px', background: '#ffffff' }} />
        </button>

        {/* Full-Screen Minimalist Overlay Menu */}
        {mobileOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#09090b',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.8rem',
            textTransform: 'uppercase'
          }}>
            {/* Close Trigger */}
            <button 
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                outline: 'none'
              }}
              title="Close Menu"
            >
              <X size={32} />
            </button>

            {/* Menu Links */}
            <a 
              href="#projects" 
              onClick={(e) => { e.preventDefault(); handleNavClick('projects'); }} 
              style={{ color: '#ffffff', fontWeight: 800, transition: 'var(--transition-fast)' }}
              onMouseEnter={(e) => e.target.style.color = 'hsl(var(--primary))'}
              onMouseLeave={(e) => e.target.style.color = '#ffffff'}
            >
              Projects
            </a>
            <a 
              href="#contact" 
              onClick={(e) => { e.preventDefault(); handleNavClick('contact'); }} 
              style={{ color: '#ffffff', fontWeight: 800, transition: 'var(--transition-fast)' }}
              onMouseEnter={(e) => e.target.style.color = 'hsl(var(--primary))'}
              onMouseLeave={(e) => e.target.style.color = '#ffffff'}
            >
              Contact
            </a>
            
            {token && (
              <>
                <a 
                  href="#admin" 
                  onClick={(e) => { e.preventDefault(); handleNavClick('admin'); }} 
                  style={{ color: '#ffffff', fontWeight: 800, transition: 'var(--transition-fast)' }}
                  onMouseEnter={(e) => e.target.style.color = 'hsl(var(--primary))'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  Admin Console
                </a>
                <button 
                  onClick={() => { setMobileOpen(false); onLogout(); }} 
                  className="btn btn-danger"
                  style={{ padding: '0.6rem 2rem', fontSize: '0.9rem', marginTop: '1rem', textTransform: 'uppercase' }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
