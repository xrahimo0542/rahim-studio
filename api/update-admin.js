const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'portfolio.db');
const USERNAME = 'rahim';
const PASSWORD = 'rahim123';

async function updateCredentials() {
  console.log('[ADMIN CREDENTIALS] Updating database entry...');
  
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('[ERROR] Failed to open SQLite Database:', err);
      process.exit(1);
    }
  });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(PASSWORD, salt);

  db.serialize(() => {
    // 1. Clear users table to remove old credentials
    db.run("DELETE FROM users", (err) => {
      if (err) console.error('[ERROR] Failed to clear old users:', err);
      else console.log('[ADMIN CREDENTIALS] Removed old admin records.');
    });

    // 2. Insert new credentials
    db.run(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [USERNAME, passwordHash],
      (insertErr) => {
        if (insertErr) {
          console.error('[ERROR] Database insert failed:', insertErr);
        } else {
          console.log(`[ADMIN CREDENTIALS] Admin user registered: username="${USERNAME}", password="${PASSWORD}"`);
        }
      }
    );
  });

  // Close db connection
  setTimeout(() => {
    db.close((closeErr) => {
      if (closeErr) console.error('[ERROR] Failed to close database safely:', closeErr);
      else console.log('[ADMIN CREDENTIALS] Database updated and connection closed.');
    });
  }, 2000);
}

updateCredentials();
