const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configurations
const SOURCE_DIR = 'D:\\Users\\Rahimo\\Pictures\\Lightroom Saved Photos';
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_PATH = path.join(__dirname, 'portfolio.db');

const PROJECTS_MAPPING = [
  {
    title: 'Moon Cabin Concept',
    pattern: ['cabine', 'cabinee', 'mooncabine'],
    category: '3D Design',
    tags: '3D Modeling,Blender,Architecture',
    description: 'A conceptual modular structural cabin visual study placed in lunar environments, exploring detailed metal textures, glass refractions, and low-gravity atmosphere shading.'
  },
  {
    title: 'Dark Forest Atmosphere',
    pattern: ['dark forest'],
    category: '3D Design',
    tags: 'Environment,Cinematic,Lighting',
    description: 'An atmospheric visual study of a dark dense forest environment using high-resolution foliage models, volumetric light rays, and dense ground cover assets.'
  },
  {
    title: 'Midnight Visualizations',
    pattern: ['darknight'],
    category: 'Graphic Design',
    tags: 'Digital Art,Concept Art,Coloring',
    description: 'A study of low-key exposure values, cinematic color tones, and midnight concept art designs.'
  },
  {
    title: 'Desert Dunes Environment',
    pattern: ['desert'],
    category: '3D Design',
    tags: 'Terrain Design,Blender,Cycles Render',
    description: 'An expansive landscape visual rendering of procedural desert dunes, focusing on sand surface micro-details, wind ripples, and warm sunset lighting.'
  },
  {
    title: 'Naftal Refinery Render',
    pattern: ['naftal'],
    category: '3D Design',
    tags: 'Industrial Design,Hard Surface,Modeling',
    description: 'Detailed hard-surface rendering of an industrial refinery facility, showcasing structural pipes, metallic wear, and nocturnal facility lights.'
  },
  {
    title: 'TCH Architecture Study',
    pattern: ['tch'],
    category: '3D Design',
    tags: 'ArchViz,Realism,Lighting',
    description: 'A series of detailed daytime architectural visualization renders for a technology center, utilizing concrete materials and natural sun shadows.'
  },
  {
    title: 'W3 Design Layouts',
    pattern: ['w3'],
    category: 'Graphic Design',
    tags: 'Branding,Layout Design,Typography',
    description: 'Modern geometric visual layout designs exploring brand alignment structures, bold color blocking, and clean typography principles.'
  },
  {
    title: 'Rust Metal Material Study',
    pattern: ['old'],
    category: '3D Design',
    tags: 'Texturing,PBR Materials,Metal Work',
    description: 'A PBR material texturing study focused on realistic old metal oxidation, rust decay patterns, and macro surface weathering details.'
  },
  {
    title: 'Abstract Geometric Cube',
    pattern: ['cube'],
    category: 'Graphic Design',
    tags: 'Abstract,3D Art,Figma',
    description: 'An abstract geometric layout visual exploring complex crystal refractions, glass subdivisions, and smooth color gradients.'
  }
];

async function runImport() {
  console.log('[IMPORT] Starting LightroomSavedPhotos import process...');
  
  // 1. Check if source folder exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`[ERROR] Source folder "${SOURCE_DIR}" does not exist! Make sure it is plugged in and readable.`);
    process.exit(1);
  }

  // 2. Ensure destination uploads folder exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log(`[IMPORT] Creating destination folder: ${UPLOADS_DIR}`);
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // 3. Scan source directory for files
  const files = fs.readdirSync(SOURCE_DIR);
  console.log(`[IMPORT] Scanned source directory. Found ${files.length} total files.`);

  // 4. Initialize SQLite DB connection
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('[ERROR] Failed to open SQLite Database:', err);
      process.exit(1);
    }
  });

  // Helper to clear existing projects and insert new ones
  db.serialize(() => {
    // Clear old seeded projects
    db.run("DELETE FROM projects", (err) => {
      if (err) console.error('[ERROR] Failed to clear existing projects:', err);
      else console.log('[IMPORT] Cleared existing placeholder projects table.');
    });

    let displayOrder = 1;
    
    // 5. Process and group files for each project template
    for (const proj of PROJECTS_MAPPING) {
      const matchedFiles = [];

      for (const file of files) {
        const lowerFile = file.toLowerCase();
        // Skip PSD files (not browser compatible)
        if (lowerFile.endsWith('.psd')) continue;

        // Check if file name matches pattern list
        const matchesPattern = proj.pattern.some(pat => {
          // If pattern is exactly in file name, e.g. "cabine" matches "cabine.jpg", "cabinee (2).jpg"
          return lowerFile.includes(pat);
        });

        if (matchesPattern) {
          const sourceFilePath = path.join(SOURCE_DIR, file);
          const destFileName = file.replace(/\s+/g, '_'); // sanitize filename spaces
          const destFilePath = path.join(UPLOADS_DIR, destFileName);
          
          try {
            // Copy file to local uploads directory
            fs.copyFileSync(sourceFilePath, destFilePath);
            // Public path served by Express
            matchedFiles.push(`/uploads/${destFileName}`);
          } catch (copyErr) {
            console.error(`[ERROR] Failed to copy file "${file}":`, copyErr);
          }
        }
      }

      // If we copied files for this project, save it to database
      if (matchedFiles.length > 0) {
        console.log(`[IMPORT] Project "${proj.title}": Matched and copied ${matchedFiles.length} file(s).`);
        
        // Convert array of URLs to JSON string (expected by Projects helper)
        const imageUrlsString = JSON.stringify(matchedFiles);
        const tagsString = proj.tags;

        db.run(
          `INSERT INTO projects (title, description, image_url, video_url, live_url, github_url, tags, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            proj.title,
            proj.description,
            imageUrlsString,
            '', // videoUrl
            '', // liveUrl
            '', // githubUrl
            tagsString,
            displayOrder++
          ],
          (insertErr) => {
            if (insertErr) {
              console.error(`[ERROR] Database insert failed for project "${proj.title}":`, insertErr);
            } else {
              console.log(`[IMPORT] Database entry inserted successfully for "${proj.title}".`);
            }
          }
        );
      } else {
        console.log(`[IMPORT] Project "${proj.title}": No matching files found.`);
      }
    }
  });

  // Close db
  setTimeout(() => {
    db.close((closeErr) => {
      if (closeErr) console.error('[ERROR] Failed to close database safely:', closeErr);
      else console.log('[IMPORT] Import process completed and database connection closed.');
    });
  }, 3000);
}

runImport();
