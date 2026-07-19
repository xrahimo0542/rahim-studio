const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');
require('dotenv').config();

const { initDatabase, query } = require('./db');
const {
  generalLimiter,
  authLimiter,
  contactLimiter,
  securityHeaders,
  corsOptions,
  sanitizeInput
} = require('./security');
const verifyToken = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Apply Global Security Headers
app.use(securityHeaders);

// Apply CORS Policy
app.use(cors(corsOptions));

// Enable Body Parsing
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Serve Static Uploaded Images
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply global input sanitization to block script/html injection in all requests
app.use(sanitizeInput);

// Apply general rate limiting to all requests
app.use('/api/', generalLimiter);

// ----------------------------------------------------
// Public Routes
// ----------------------------------------------------

// View Tracker: Increment page views count in analytics table
app.post('/api/analytics/view', async (req, res) => {
  try {
    await query.run(`
      UPDATE analytics 
      SET metric_value = metric_value + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE metric_name = 'page_views'
    `);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating analytics view count:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Fetch Skills
app.get('/api/skills', async (req, res) => {
  try {
    const skills = await query.all('SELECT * FROM skills ORDER BY category, proficiency DESC');
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills.' });
  }
});

// Fetch Projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await query.all('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// Secure Contact Form Route
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields (name, email, subject, message) are required.' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (name.length > 100 || subject.length > 150 || message.length > 2000) {
    return res.status(400).json({ error: 'Input length limit exceeded.' });
  }

  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // Parameterized Insert
    await query.run(
      `INSERT INTO messages (name, email, subject, message, ip_address) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, subject, message, ip]
    );

    // Update messages counts in analytics
    await query.run(`
      UPDATE analytics 
      SET metric_value = metric_value + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE metric_name = 'contact_submissions'
    `);

    res.status(200).json({ success: 'Thank you! Your message was submitted securely.' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ error: 'Failed to submit message securely. Please try again.' });
  }
});

// Admin Authentication Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (email !== 'rahim' && !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email or username configuration.' });
  }

  try {
    const user = await query.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '2h' }
    );

    res.json({
      success: 'Authentication successful',
      token,
      admin: { email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication service error.' });
  }
});

// ----------------------------------------------------
// Admin Protected Routes
// ----------------------------------------------------

// Get Admin Analytics Summary
app.get('/api/admin/analytics', verifyToken, async (req, res) => {
  try {
    const analytics = await query.all('SELECT * FROM analytics');
    const recentMessagesCount = await query.get('SELECT COUNT(*) as count FROM messages WHERE is_read = 0');
    const totalProjects = await query.get('SELECT COUNT(*) as count FROM projects');
    const totalSkills = await query.get('SELECT COUNT(*) as count FROM skills');

    res.json({
      analytics,
      unreadMessagesCount: recentMessagesCount.count,
      totalProjects: totalProjects.count,
      totalSkills: totalSkills.count
    });
  } catch (error) {
    console.error('Error fetching analytics details:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics data.' });
  }
});

// Retrieve Contact Messages
app.get('/api/admin/messages', verifyToken, async (req, res) => {
  try {
    const messages = await query.all('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to retrieve contact messages.' });
  }
});

// Toggle message read status
app.put('/api/admin/messages/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { is_read } = req.body;

  try {
    await query.run(
      'UPDATE messages SET is_read = ? WHERE id = ?',
      [is_read ? 1 : 0, id]
    );
    res.json({ success: `Message status updated to ${is_read ? 'read' : 'unread'}.` });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update message status.' });
  }
});

// Delete message
app.delete('/api/admin/messages/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await query.run('DELETE FROM messages WHERE id = ?', [id]);
    res.json({ success: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

// Create project
app.post('/api/admin/projects', verifyToken, async (req, res) => {
  const { title, description, image_url, video_url, live_url, github_url, tags, display_order } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  try {
    const order = display_order ? parseInt(display_order) : 0;
    const result = await query.run(
      `INSERT INTO projects (title, description, image_url, video_url, live_url, github_url, tags, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, image_url, video_url, live_url, github_url, tags, order]
    );
    res.status(201).json({ success: 'Project created.', id: result.id });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// Update project
app.put('/api/admin/projects/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, image_url, video_url, live_url, github_url, tags, display_order } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  try {
    const order = display_order ? parseInt(display_order) : 0;
    await query.run(
      `UPDATE projects 
       SET title = ?, description = ?, image_url = ?, video_url = ?, live_url = ?, github_url = ?, tags = ?, display_order = ?
       WHERE id = ?`,
      [title, description, image_url, video_url, live_url, github_url, tags, order, id]
    );
    res.json({ success: 'Project updated successfully.' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// Delete project
app.delete('/api/admin/projects/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await query.run('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ success: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// Create skill
app.post('/api/admin/skills', verifyToken, async (req, res) => {
  const { name, category, proficiency } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Skill name and category are required.' });
  }

  try {
    const score = proficiency ? Math.min(100, Math.max(0, parseInt(proficiency))) : 80;
    const result = await query.run(
      'INSERT INTO skills (name, category, proficiency) VALUES (?, ?, ?)',
      [name, category, score]
    );
    res.status(201).json({ success: 'Skill added.', id: result.id });
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ error: 'Failed to create skill. Name may already exist.' });
  }
});

// Update skill
app.put('/api/admin/skills/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, category, proficiency } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Skill name and category are required.' });
  }

  try {
    const score = proficiency ? Math.min(100, Math.max(0, parseInt(proficiency))) : 80;
    await query.run(
      'UPDATE skills SET name = ?, category = ?, proficiency = ? WHERE id = ?',
      [name, category, score, id]
    );
    res.json({ success: 'Skill updated successfully.' });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Failed to update skill.' });
  }
});

// Delete skill
app.delete('/api/admin/skills/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await query.run('DELETE FROM skills WHERE id = ?', [id]);
    res.json({ success: 'Skill deleted successfully.' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Failed to delete skill.' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Conditional local listener (Vercel automatically wraps this exported app serverless-ly)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  initDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`[SECURE SERVER] Listening on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to initialize local database:', err);
  });
} else {
  // In serverless production contexts, trigger schema setups lazily
  initDatabase().catch(err => console.error('Vercel DB initialization error:', err));
}

module.exports = app;
