const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Determine which database driver to use
const isPostgres = !!process.env.DATABASE_URL;
let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  console.log('[DATABASE] Connecting via PostgreSQL (Production Vercel)...');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Supabase/Neon secure handshakes
    }
  });
} else {
  console.log('[DATABASE] Connecting via SQLite (Local Fallback)...');
  const dbPath = path.join(__dirname, 'portfolio.db');
  sqliteDb = new sqlite3.Database(dbPath);
}

// Convert SQLite style ? parameters to PostgreSQL style $1, $2, $3...
function convertQueryParams(sql) {
  if (!isPostgres) return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

// Promisified database actions mapping SQLite and PG APIs
const query = {
  async run(sql, params = []) {
    if (isPostgres) {
      // Postgres insert returning ID helper
      let querySql = convertQueryParams(sql);
      if (sql.trim().toLowerCase().startsWith('insert') && !sql.toLowerCase().includes('returning')) {
        querySql += ' RETURNING id';
      }
      const result = await pgPool.query(querySql, params);
      const lastInsertId = result.rows[0]?.id || null;
      return { id: lastInsertId, changes: result.rowCount };
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    }
  },

  async all(sql, params = []) {
    if (isPostgres) {
      const querySql = convertQueryParams(sql);
      const result = await pgPool.query(querySql, params);
      return result.rows;
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  },

  async get(sql, params = []) {
    if (isPostgres) {
      const querySql = convertQueryParams(sql);
      const result = await pgPool.query(querySql, params);
      return result.rows[0] || null;
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    }
  }
};

async function initDatabase() {
  console.log('[DATABASE] Creating schemas...');

  // 1. Users table
  await query.run(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `.replace('SERIAL PRIMARY KEY', isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

  // 2. Projects table (with added video_url support)
  await query.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      video_url TEXT,
      live_url TEXT,
      github_url TEXT,
      tags TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `.replace('SERIAL PRIMARY KEY', isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

  // 3. Skills table
  await query.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      category VARCHAR(255) NOT NULL,
      proficiency INTEGER DEFAULT 80,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `.replace('SERIAL PRIMARY KEY', isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

  // 4. Contact Messages table
  await query.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      ip_address VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `.replace('SERIAL PRIMARY KEY', isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

  // 5. Analytics table
  await query.run(`
    CREATE TABLE IF NOT EXISTS analytics (
      id SERIAL PRIMARY KEY,
      metric_name VARCHAR(255) UNIQUE NOT NULL,
      metric_value INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `.replace('SERIAL PRIMARY KEY', isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'));

  await seedDatabase();
}

async function seedDatabase() {
  console.log('[DATABASE] Seeding metrics and content items...');

  // Seed default admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@portfolio.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'SecureAdmin2026!';
  
  const existingAdmin = await query.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    await query.run(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [adminEmail, passwordHash]
    );
    console.log(`Admin user created: ${adminEmail}`);
  }

  // Seed Graphic, 3D, and Video projects if table is empty
  const projectCount = await query.get('SELECT COUNT(*) as count FROM projects');
  if (parseInt(projectCount.count) === 0) {
    const defaultProjects = [
      {
        title: 'Cybernetic Monolith - 3D Environment Design',
        description: 'A dark sci-fi ambient landscape modeled completely in Blender. Sculpted high-polygon assets, custom node textures, volumetrics, and ray-traced lighting highlights. Built to show real-time WebGL compatibility.',
        image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60',
        video_url: '', // Image design
        live_url: 'https://www.artstation.com',
        github_url: '',
        tags: '3D Design,Blender,Cycles Render,PBR Textures',
        display_order: 1
      },
      {
        title: 'Aura Energy Drink - Graphic & Brand Identity',
        description: 'Visual identity system and can product mockup packaging design for a futuristic energy drink line. Features dynamic cyber gradients, bold typeface layout structures, and complete print vector standards created in Figma.',
        image_url: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=60',
        video_url: '', 
        live_url: 'https://behance.net',
        github_url: '',
        tags: 'Graphic Design,Figma,Illustrator,Packaging',
        display_order: 2
      },
      {
        title: 'Synthesized Dreams - DaVinci Resolve Cinematic Edit',
        description: 'DaVinci Resolve narrative showreel edit and cinematic grading. Developed with custom color mapping, dynamic audio synchronization, sound design mapping, and specialized transitions.',
        image_url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=60',
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Standard embed video link
        live_url: 'https://youtube.com',
        github_url: '',
        tags: 'Video Editing,DaVinci Resolve,Color Grading,Sound Design',
        display_order: 3
      }
    ];

    for (const proj of defaultProjects) {
      await query.run(
        `INSERT INTO projects (title, description, image_url, video_url, live_url, github_url, tags, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [proj.title, proj.description, proj.image_url, proj.video_url, proj.live_url, proj.github_url, proj.tags, proj.display_order]
      );
    }
    console.log('Seeded Graphic, 3D, and Video project files.');
  }

  // Seed designer skills if empty
  const skillCount = await query.get('SELECT COUNT(*) as count FROM skills');
  if (parseInt(skillCount.count) === 0) {
    const defaultSkills = [
      // 3D Category
      { name: 'Blender 3D Modeling', category: '3D Design', proficiency: 92 },
      { name: 'Cinema 4D & Octane', category: '3D Design', proficiency: 85 },
      { name: 'Substance Painter Textures', category: '3D Design', proficiency: 80 },
      // Graphic Category
      { name: 'Figma Visual Layouts', category: 'Graphic Design', proficiency: 95 },
      { name: 'Adobe Photoshop', category: 'Graphic Design', proficiency: 90 },
      { name: 'Adobe Illustrator Vectors', category: 'Graphic Design', proficiency: 88 },
      // Video Category
      { name: 'Adobe Premiere Pro Edit', category: 'Video Editing', proficiency: 92 },
      { name: 'After Effects Motion Graphics', category: 'Video Editing', proficiency: 88 },
      { name: 'DaVinci Resolve Color Grade', category: 'Video Editing', proficiency: 84 },
      // Tools & Security
      { name: 'Git & Deployment Workflows', category: 'Tools', proficiency: 82 },
      { name: 'Vercel Serverless Pipelines', category: 'Tools', proficiency: 85 }
    ];

    for (const skill of defaultSkills) {
      await query.run(
        'INSERT OR IGNORE INTO skills (name, category, proficiency) VALUES (?, ?, ?)',
        [skill.name, skill.category, skill.proficiency]
      );
    }
    console.log('Seeded multimedia design skills.');
  }

  // Seed analytics views if empty
  const analyticsCount = await query.get('SELECT COUNT(*) as count FROM analytics');
  if (parseInt(analyticsCount.count) === 0) {
    await query.run("INSERT INTO analytics (metric_name, metric_value) VALUES ('page_views', 87)");
    await query.run("INSERT INTO analytics (metric_name, metric_value) VALUES ('contact_submissions', 0)");
    console.log('Seeded base analytics.');
  }
}

module.exports = {
  query,
  initDatabase
};
