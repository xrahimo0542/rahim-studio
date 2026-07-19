import React, { useState } from 'react';
import { API_BASE } from '../App';
import { Send, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, success: null, error: null });

  // Handle live inputs and clear validation errors
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Quick frontend validation rules
  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required.';
    
    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.subject.trim()) tempErrors.subject = 'Subject is required.';
    if (!formData.message.trim()) {
      tempErrors.message = 'Message content is required.';
    } else if (formData.message.length < 10) {
      tempErrors.message = 'Message must be at least 10 characters.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus({ loading: true, success: null, error: null });

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred.');
      }

      setStatus({ loading: false, success: data.success, error: null });
      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus({ loading: false, success: null, error: err.message });
    }
  };

  return (
    <section id="contact" style={{ padding: '100px 0', position: 'relative' }}>
      <div className="container">
        
        <div className="section-header">
          <h2>Secure Communication</h2>
          <p>Submit inquiries, projects request, or code review audits through a secure, sanitized channel.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '0.8fr 1.2fr',
          gap: '4rem',
          alignItems: 'start'
        }} className="contact-grid">
          
          {/* Info Details */}
          <div>
            <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'hsl(var(--text-primary))', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Contact Info</h3>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: 'hsl(var(--accent))',
                  padding: '0.6rem',
                  borderRadius: '10px'
                }}>
                  <Mail size={18} />
                </div>
                <div>
                  <h5 style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', fontWeight: 600 }}>Email</h5>
                  <p style={{ fontSize: '0.95rem', color: 'hsl(var(--text-primary))' }}>abderrahim.merad.22@gmail.com</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: 'hsl(var(--accent))',
                  padding: '0.6rem',
                  borderRadius: '10px'
                }}>
                  <Phone size={18} />
                </div>
                <div>
                  <h5 style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', fontWeight: 600 }}>Phone</h5>
                  <p style={{ fontSize: '0.95rem', color: 'hsl(var(--text-primary))' }}>+213 791 07 18 19</p>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--success))', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <ShieldCheck style={{ color: 'hsl(var(--success))' }} size={24} />
              <p style={{ fontSize: '0.86rem', color: 'hsl(var(--text-secondary))' }}>
                CORS, request validations, and parameter checks are enforced. Dynamic SQL sanitizations prevent injection exploits.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.3rem', color: 'hsl(var(--text-primary))', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              Send Safe Message
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="contact-form-row">
                <div>
                  <label htmlFor="contact-name" style={{ display: 'block', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.4rem' }}>Name</label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      border: errors.name ? '1px solid hsl(var(--danger)) !important' : undefined
                    }}
                    placeholder="Alice Smith"
                  />
                  {errors.name && <span style={{ color: 'hsl(var(--danger))', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block' }}>{errors.name}</span>}
                </div>

                <div>
                  <label htmlFor="contact-email" style={{ display: 'block', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.4rem' }}>Email</label>
                  <input
                    type="text"
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      border: errors.email ? '1px solid hsl(var(--danger)) !important' : undefined
                    }}
                    placeholder="alice@email.com"
                  />
                  {errors.email && <span style={{ color: 'hsl(var(--danger))', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block' }}>{errors.email}</span>}
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" style={{ display: 'block', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.4rem' }}>Subject</label>
                <input
                  type="text"
                  id="contact-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  style={{
                    border: errors.subject ? '1px solid hsl(var(--danger)) !important' : undefined
                  }}
                  placeholder="Project Proposal"
                />
                {errors.subject && <span style={{ color: 'hsl(var(--danger))', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block' }}>{errors.subject}</span>}
              </div>

              <div>
                <label htmlFor="contact-message" style={{ display: 'block', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.4rem' }}>Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  style={{
                    border: errors.message ? '1px solid hsl(var(--danger)) !important' : undefined
                  }}
                  placeholder="Describe your design vision or rendering needs..."
                />
                {errors.message && <span style={{ color: 'hsl(var(--danger))', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block' }}>{errors.message}</span>}
              </div>

              {/* Status Alert Panels */}
              {status.success && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'hsl(var(--success))',
                  padding: '0.8rem 1.2rem',
                  borderRadius: '8px',
                  fontSize: '0.88rem'
                }}>
                  {status.success}
                </div>
              )}

              {status.error && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'hsl(var(--danger))',
                  padding: '0.8rem 1.2rem',
                  borderRadius: '8px',
                  fontSize: '0.88rem'
                }}>
                  Error: {status.error}
                </div>
              )}

              <button
                type="submit"
                disabled={status.loading}
                className="btn btn-primary"
                style={{ alignSelf: 'start', minWidth: '160px', justifyContent: 'center' }}
              >
                {status.loading ? 'Sending...' : <>Send Payload <Send size={15} /></>}
              </button>
            </form>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .contact-form-row {
            grid-template-columns: 1fr !important;
          }
        }
        input:focus, textarea:focus {
          border-color: hsl(var(--primary)) !important;
          box-shadow: 0 0 10px hsl(var(--primary) / 0.15);
        }
      `}} />
    </section>
  );
}
