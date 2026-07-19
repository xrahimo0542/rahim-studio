import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Trash2, Plus, Edit3, Save, X, Shield, Lock, Activity, Mail, Layers, FileText } from 'lucide-react';
import { API_BASE } from '../App';

export default function Admin({ token, setToken }) {
  const [activeSubTab, setActiveSubTab] = useState('analytics'); // analytics, messages, projects, skills
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  // Data States
  const [analytics, setAnalytics] = useState(null);
  const [messages, setMessages] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  
  // CRUD editing states
  const [editingProject, setEditingProject] = useState(null); // project object or 'new'
  const [editingSkill, setEditingSkill] = useState(null); // skill object or 'new'
  const [projectForm, setProjectForm] = useState({ title: '', description: '', image_url: '', video_url: '', live_url: '', github_url: '', tags: '', display_order: 0 });
  const [imageUrls, setImageUrls] = useState([]);
  const [skillForm, setSkillForm] = useState({ name: '', category: 'Graphic Design', proficiency: 80 });

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
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const backendHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : '';
    return `${backendHost}${url}`;
  };

  const getImagesArray = (imageUrlField) => {
    if (!imageUrlField) return [];
    const unescaped = unescapeHtml(imageUrlField);
    try {
      const parsed = JSON.parse(unescaped);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Single URL fallback
    }
    return [unescaped];
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, activeSubTab]);

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (activeSubTab === 'analytics') {
        const res = await fetch(`${API_BASE}/admin/analytics`, { headers });
        if (res.status === 401 || res.status === 403) return handleSessionExpired();
        const data = await res.json();
        setAnalytics(data);
      } else if (activeSubTab === 'messages') {
        const res = await fetch(`${API_BASE}/admin/messages`, { headers });
        if (res.status === 401 || res.status === 403) return handleSessionExpired();
        const data = await res.json();
        setMessages(data);
      } else if (activeSubTab === 'projects') {
        const res = await fetch(`${API_BASE}/projects`);
        const data = await res.json();
        setProjectsList(data);
      } else if (activeSubTab === 'skills') {
        const res = await fetch(`${API_BASE}/skills`);
        const data = await res.json();
        setSkillsList(data);
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    }
  };

  const handleSessionExpired = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // ---------------- Messages Actions ----------------
  const toggleReadStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/admin/messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_read: !currentStatus })
      });
      if (res.status === 401 || res.status === 403) return handleSessionExpired();
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Toggle read status error:', err);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) return handleSessionExpired();
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  // ---------------- Projects CRUD ----------------
  const openProjectForm = (project = null) => {
    if (project) {
      setEditingProject(project);
      
      const unescapedProject = {
        title: unescapeHtml(project.title),
        description: unescapeHtml(project.description),
        image_url: unescapeHtml(project.image_url),
        video_url: unescapeHtml(project.video_url),
        live_url: unescapeHtml(project.live_url),
        github_url: unescapeHtml(project.github_url),
        tags: unescapeHtml(project.tags),
        display_order: project.display_order
      };
      
      setImageUrls(getImagesArray(unescapedProject.image_url));
      setProjectForm({
        title: unescapedProject.title,
        description: unescapedProject.description,
        image_url: unescapedProject.image_url || '',
        video_url: unescapedProject.video_url || '',
        live_url: unescapedProject.live_url || '',
        github_url: unescapedProject.github_url || '',
        tags: unescapedProject.tags || '',
        display_order: unescapedProject.display_order || 0
      });
    } else {
      setEditingProject('new');
      setImageUrls([]);
      setProjectForm({ title: '', description: '', image_url: '', video_url: '', live_url: '', github_url: '', tags: '', display_order: 0 });
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    const method = editingProject === 'new' ? 'POST' : 'PUT';
    const url = editingProject === 'new' 
      ? `${API_BASE}/admin/projects` 
      : `${API_BASE}/admin/projects/${editingProject.id}`;

    const payload = {
      ...projectForm,
      image_url: JSON.stringify(imageUrls)
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.status === 401 || res.status === 403) return handleSessionExpired();
      if (res.ok) {
        setEditingProject(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Submit project error:', err);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) return handleSessionExpired();
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  // ---------------- Skills CRUD ----------------
  const openSkillForm = (skill = null) => {
    if (skill) {
      setEditingSkill(skill);
      setSkillForm({ name: skill.name, category: skill.category, proficiency: skill.proficiency });
    } else {
      setEditingSkill('new');
      setSkillForm({ name: '', category: 'Graphic Design', proficiency: 80 });
    }
  };

  const handleSkillSubmit = async (e) => {
    e.preventDefault();
    const method = editingSkill === 'new' ? 'POST' : 'PUT';
    const url = editingSkill === 'new' 
      ? `${API_BASE}/admin/skills` 
      : `${API_BASE}/admin/skills/${editingSkill.id}`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(skillForm)
      });
      if (res.status === 401 || res.status === 403) return handleSessionExpired();
      if (res.ok) {
        setEditingSkill(null);
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save skill.');
      }
    } catch (err) {
      console.error('Submit skill error:', err);
    }
  };

  const deleteSkill = async (id) => {
    if (!window.confirm('Delete this skill?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/skills/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) return handleSessionExpired();
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Delete skill error:', err);
    }
  };

  // ---------------- LOGIN INTERFACE ----------------
  if (!token) {
    return (
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' }}>
        <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              background: 'rgba(139,92,246,0.1)',
              color: 'hsl(var(--primary))',
              padding: '0.8rem',
              borderRadius: '50%',
              marginBottom: '1rem'
            }}>
              <Lock size={32} />
            </div>
            <h3 style={{ fontSize: '1.6rem', color: 'hsl(var(--text-primary))', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>System Console</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.88rem', marginTop: '0.3rem' }}>
              Authentication required to access analytics databases.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '0.82rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.3rem' }}>Username or Email</label>
              <input
                type="text"
                id="login-email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="Username"
              />
            </div>

            <div>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: '0.82rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.3rem' }}>Password</label>
              <input
                type="password"
                id="login-password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••••••"
              />
            </div>

            {loginError && (
              <span style={{ color: 'hsl(var(--danger))', fontSize: '0.8rem', textAlign: 'center' }}>
                {loginError}
              </span>
            )}

            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
              Authenticate <Shield size={16} />
            </button>
          </form>
        </div>
      </section>
    );
  }

  // ---------------- DASHBOARD INTERFACE ----------------
  return (
    <section style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '100px' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }} className="admin-header">
          <div>
            <h2 style={{ fontSize: '2rem', color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--font-heading)' }}>
              <Shield style={{ color: 'hsl(var(--primary))' }} /> Security Console
            </h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
              Manage website repositories, developer skill metrics, and read sanitized contact submissions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setActiveSubTab('analytics')} className={`btn ${activeSubTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}><Activity size={14} /> Stats</button>
            <button onClick={() => setActiveSubTab('messages')} className={`btn ${activeSubTab === 'messages' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}><Mail size={14} /> Inbox</button>
            <button onClick={() => setActiveSubTab('projects')} className={`btn ${activeSubTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}><Layers size={14} /> Projects</button>
            <button onClick={() => setActiveSubTab('skills')} className={`btn ${activeSubTab === 'skills' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}><FileText size={14} /> Skills</button>
          </div>
        </div>

        {/* 1. ANALYTICS SUBTAB */}
        {activeSubTab === 'analytics' && analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Total Page Hits</span>
                <h3 style={{ fontSize: '2.5rem', color: 'hsl(var(--text-primary))', marginTop: '0.5rem' }}>
                  {analytics.analytics.find(a => a.metric_name === 'page_views')?.metric_value || 0}
                </h3>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Contact Messages</span>
                <h3 style={{ fontSize: '2.5rem', color: 'hsl(var(--accent))', marginTop: '0.5rem' }}>
                  {analytics.analytics.find(a => a.metric_name === 'contact_submissions')?.metric_value || 0}
                </h3>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Unread Submissions</span>
                <h3 style={{ fontSize: '2.5rem', color: 'hsl(var(--danger))', marginTop: '0.5rem' }}>
                  {analytics.unreadMessagesCount || 0}
                </h3>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Database Records</span>
                <h3 style={{ fontSize: '2.5rem', color: 'hsl(var(--primary))', marginTop: '0.5rem' }}>
                  {(analytics.totalProjects || 0) + (analytics.totalSkills || 0)}
                </h3>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} style={{ color: 'hsl(var(--accent))' }} /> Platform Threat Model & Load Telemetry
              </h3>
              
              <div style={{ display: 'grid', gap: '1.2rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span>General CORS Access Filtering</span>
                    <span style={{ color: 'hsl(var(--success))', fontWeight: 600 }}>Active (Secure Mode)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    <div style={{ width: '100%', height: '100%', background: 'hsl(var(--success))', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span>XSS Buffer Sanitization Level</span>
                    <span style={{ color: 'hsl(var(--success))', fontWeight: 600 }}>Strict HTML Escaped</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    <div style={{ width: '95%', height: '100%', background: 'hsl(var(--success))', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span>API Route Rate-Limiter Buffer</span>
                    <span>100% Free Capacity</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    <div style={{ width: '100%', height: '100%', background: 'hsl(var(--primary))', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MESSAGES SUBTAB */}
        {activeSubTab === 'messages' && (
          <div className="glass-card" style={{ overflowX: 'auto', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Inbox Messages ({messages.length})</h3>

            {messages.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-secondary))', textAlign: 'center', padding: '2rem 0' }}>No messages in the database.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }} className="admin-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <th style={{ padding: '0.8rem', color: 'hsl(var(--accent))', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '0.8rem', color: 'hsl(var(--accent))', fontSize: '0.85rem', textTransform: 'uppercase' }}>Contact</th>
                    <th style={{ padding: '0.8rem', color: 'hsl(var(--accent))', fontSize: '0.85rem', textTransform: 'uppercase' }}>Subject</th>
                    <th style={{ padding: '0.8rem', color: 'hsl(var(--accent))', fontSize: '0.85rem', textTransform: 'uppercase' }}>Message Body</th>
                    <th style={{ padding: '0.8rem', color: 'hsl(var(--accent))', fontSize: '0.85rem', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '0.8rem', color: 'hsl(var(--accent))', fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.id} style={{ borderBottom: '1px solid var(--border-glass)', opacity: msg.is_read ? 0.65 : 1 }}>
                      <td style={{ padding: '0.8rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '10px',
                          fontWeight: 600,
                          background: msg.is_read ? 'rgba(15, 23, 42, 0.05)' : 'rgba(244,63,94,0.1)',
                          color: msg.is_read ? 'hsl(var(--text-secondary))' : 'hsl(var(--danger))',
                        }}>
                          {msg.is_read ? 'Read' : 'New'}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem' }}>
                        <div style={{ fontWeight: 500, color: 'hsl(var(--text-primary))' }}>{msg.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{msg.email}</div>
                      </td>
                      <td style={{ padding: '0.8rem', fontSize: '0.9rem', fontWeight: 500 }}>{msg.subject}</td>
                      <td style={{ padding: '0.8rem', fontSize: '0.88rem', color: 'hsl(var(--text-secondary))', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={msg.message}>
                        {msg.message}
                      </td>
                      <td style={{ padding: '0.8rem', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                        {new Date(msg.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.8rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => toggleReadStatus(msg.id, msg.is_read)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'hsl(var(--text-secondary))',
                              cursor: 'pointer'
                            }}
                            title="Toggle read status"
                          >
                            {msg.is_read ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'hsl(var(--danger))',
                              cursor: 'pointer'
                            }}
                            title="Delete message"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 3. PROJECTS SUBTAB */}
        {activeSubTab === 'projects' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Configure Projects ({projectsList.length})</h3>
              <button onClick={() => openProjectForm()} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                <Plus size={14} /> Add Project
              </button>
            </div>

            {/* Editing / Adding modal container inline */}
            {editingProject && (
              <div className="glass-card" style={{ border: '1px solid hsl(var(--primary))', marginBottom: '2rem', padding: '1.5rem' }}>
                <h4 style={{ color: 'hsl(var(--text-primary))', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                  <Edit3 size={16} /> {editingProject === 'new' ? 'Create New Project Record' : `Edit: ${editingProject.title}`}
                </h4>

                <form onSubmit={handleProjectSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }} className="project-crud-form">
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>Project Title</label>
                    <input type="text" required value={projectForm.title} onChange={(e) => setProjectForm({...projectForm, title: e.target.value})} style={inputStyle} placeholder="E.g., Cinematic Reel 2026" />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>Description</label>
                    <textarea rows="3" required value={projectForm.description} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} style={inputStyle} placeholder="Describe details, tooling, models..." />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>Artwork Image Gallery ({imageUrls.length} images)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      
                      {/* Image Thumbnails Grid */}
                      {imageUrls.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                          {imageUrls.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-glass)', flexShrink: 0 }}>
                              <img src={getFullImageUrl(url)} alt={`gallery-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button
                                type="button"
                                onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: 'rgba(239, 68, 68, 0.85)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  lineHeight: 0
                                }}
                                title="Remove Image"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Controls */}
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '0.2rem' }}>Upload Image Files (Multiple allowed)</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                              const files = Array.from(e.target.files);
                              for (const file of files) {
                                if (file.size > 20 * 1024 * 1024) {
                                  alert('File is too large! Please upload under 20MB.');
                                  continue;
                                }
                                // Read as base64 to send to Cloudinary via backend
                                const reader = new FileReader();
                                const base64 = await new Promise((resolve) => {
                                  reader.onload = (ev) => resolve(ev.target.result);
                                  reader.readAsDataURL(file);
                                });
                                try {
                                  const res = await fetch(`${API_BASE}/admin/upload`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ image: base64 })
                                  });
                                  const data = await res.json();
                                  if (data.url) {
                                    setImageUrls(prev => [...prev, data.url]);
                                  } else {
                                    alert('Upload failed: ' + (data.error || 'Unknown error'));
                                  }
                                } catch (err) {
                                  console.error('Upload error:', err);
                                  alert('Upload failed. Check your connection.');
                                }
                              }
                              e.target.value = '';
                            }}
                            style={{
                              fontSize: '0.78rem',
                              color: 'hsl(var(--text-secondary))',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px dashed var(--border-glass)',
                              borderRadius: '6px',
                              padding: '0.35rem',
                              width: '100%',
                              cursor: 'pointer'
                            }}
                          />
                        </div>
                        
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '0.2rem' }}>Or Add External Image Link</span>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <input
                              type="text"
                              id="manual-url-input"
                              placeholder="https://..."
                              style={inputStyle}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const url = e.target.value.trim();
                                  if (url) {
                                    setImageUrls(prev => [...prev, url]);
                                    e.target.value = '';
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('manual-url-input');
                                const url = el.value.trim();
                                if (url) {
                                  setImageUrls(prev => [...prev, url]);
                                  el.value = '';
                                }
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                            >
                              Add
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>Video Embed URL (For Video Editing)</label>
                    <input type="text" value={projectForm.video_url} onChange={(e) => setProjectForm({...projectForm, video_url: e.target.value})} style={inputStyle} placeholder="https://www.youtube.com/embed/..." />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>Tags (Comma-separated)</label>
                    <input type="text" value={projectForm.tags} onChange={(e) => setProjectForm({...projectForm, tags: e.target.value})} style={inputStyle} placeholder="3D Design,Blender,Cycles Render" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>Live URL (E.g. Behance / ArtStation)</label>
                    <input type="text" value={projectForm.live_url} onChange={(e) => setProjectForm({...projectForm, live_url: e.target.value})} style={inputStyle} placeholder="https://..." />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>GitHub URL (Optional)</label>
                    <input type="text" value={projectForm.github_url} onChange={(e) => setProjectForm({...projectForm, github_url: e.target.value})} style={inputStyle} placeholder="https://github.com..." />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>Display Order</label>
                    <input type="number" value={projectForm.display_order} onChange={(e) => setProjectForm({...projectForm, display_order: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>
                      <Save size={14} /> Commit Save
                    </button>
                    <button type="button" onClick={() => setEditingProject(null)} className="btn btn-secondary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
              {projectsList.map(proj => (
                <div key={proj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: '8px', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h5 style={{ fontSize: '1rem', color: 'hsl(var(--text-primary))', fontWeight: 600 }}>{proj.title} <span style={{ fontSize: '0.78rem', color: 'hsl(var(--accent))' }}>(Order: {proj.display_order})</span></h5>
                    <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-secondary))', maxWidth: '500px' }}>{proj.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openProjectForm(proj)} className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}><Edit3 size={12} /> Edit</button>
                    <button onClick={() => deleteProject(proj.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}><Trash2 size={12} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SKILLS SUBTAB */}
        {activeSubTab === 'skills' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Configure Skills ({skillsList.length})</h3>
              <button onClick={() => openSkillForm()} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                <Plus size={14} /> Add Skill
              </button>
            </div>

            {/* Editing / Adding modal container inline */}
            {editingSkill && (
              <div className="glass-card" style={{ border: '1px solid hsl(var(--primary))', marginBottom: '2rem', padding: '1.5rem' }}>
                <h4 style={{ color: 'hsl(var(--text-primary))', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                  <Edit3 size={16} /> {editingSkill === 'new' ? 'Add New Skill' : `Edit: ${editingSkill.name}`}
                </h4>

                <form onSubmit={handleSkillSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }} className="project-crud-form">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>Skill Name</label>
                    <input type="text" required value={skillForm.name} onChange={(e) => setSkillForm({...skillForm, name: e.target.value})} style={inputStyle} placeholder="E.g., Blender modeling" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>Category</label>
                    <select value={skillForm.category} onChange={(e) => setSkillForm({...skillForm, category: e.target.value})} style={inputStyle}>
                      <option value="Graphic Design">Graphic Design</option>
                      <option value="3D Design">3D Design</option>
                      <option value="Video Editing">Video Editing</option>
                      <option value="Tools">Tools</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.2rem' }}>Proficiency (0-100%)</label>
                    <input type="number" required min="0" max="100" value={skillForm.proficiency} onChange={(e) => setSkillForm({...skillForm, proficiency: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>
                      <Save size={14} /> Commit Save
                    </button>
                    <button type="button" onClick={() => setEditingSkill(null)} className="btn btn-secondary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {skillsList.map(skill => (
                <div key={skill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                  <div>
                    <h5 style={{ fontSize: '0.95rem', color: 'hsl(var(--text-primary))', fontWeight: 600 }}>{skill.name}</h5>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent))' }}>{skill.category} ({skill.proficiency}%)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => openSkillForm(skill)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer' }}><Edit3 size={14} /></button>
                    <button onClick={() => deleteSkill(skill.id)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--danger))', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column !important;
            align-items: start !important;
          }
          .project-crud-form {
            grid-template-columns: 1fr !important;
          }
          .project-crud-form div {
            grid-column: span 1 !important;
          }
        }
      `}} />
    </section>
  );
}

// Inline input style helper
const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border-glass)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit'
};
