import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Admin from './pages/Admin';

// Dynamically target backend URL depending on Vercel deployment vs. local hosting
export const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Synchronously increment view counts and load initial database state
  useEffect(() => {
    const initializeSite = async () => {
      try {
        // Post page view metrics
        fetch(`${API_BASE}/analytics/view`, { method: 'POST' }).catch(() => {});

        // Fetch public project and skill arrays
        const [projRes, skillRes] = await Promise.all([
          fetch(`${API_BASE}/projects`),
          fetch(`${API_BASE}/skills`)
        ]);

        const projData = await projRes.json();
        const skillData = await skillRes.json();

        setProjects(projData);
        setSkills(skillData);
      } catch (error) {
        console.error('Error seeding frontend context:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSite();
  }, [activeTab]); // Reload on switching sections to sync any admin database updates immediately

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setActiveTab('home');
  };

  return (
    <>
      {/* Glassmorphic Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        token={token} 
        onLogout={handleLogout} 
      />

      {activeTab === 'admin' ? (
        <Admin token={token} setToken={setToken} />
      ) : (
        <>
          <Hero setActiveTab={setActiveTab} />
          
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8rem 0',
              color: 'hsl(var(--primary))',
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 500
            }}>
              Loading Portfolio Artworks...
            </div>
          ) : (
            <>
              <Projects projects={projects} />
              <Contact />
            </>
          )}
        </>
      )}

      {/* Footer Details */}
      <footer style={{
        padding: '2.5rem 0',
        borderTop: '1px solid var(--border-glass)',
        textAlign: 'center',
        background: 'rgba(5, 7, 12, 0.4)',
        fontSize: '0.86rem',
        color: 'hsl(var(--text-secondary))'
      }}>
        <div className="container">
          <p>© {new Date().getFullYear()} Rahim. Constructed securely utilizing React, Express, & SQLite.</p>
        </div>
      </footer>
    </>
  );
}
