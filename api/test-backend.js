const { exec } = require('child_process');
require('dotenv').config();

async function runTests() {
  console.log('====================================================');
  console.log('   SECURE PORTFOLIO BACKEND VALIDATION TESTS        ');
  console.log('====================================================\n');

  const baseUrl = 'http://localhost:5000/api';
  let adminToken = '';

  // 1. Test Public Routes
  try {
    console.log('[TEST 1] Fetching projects...');
    const projRes = await fetch(`${baseUrl}/projects`);
    const projects = await projRes.json();
    console.log(`-> SUCCESS: Fetched ${projects.length} projects successfully.\n`);
  } catch (err) {
    console.error('-> FAIL: Project fetch failed.', err);
  }

  // 2. Test Admin Endpoint Protection (JWT Boundary Verification)
  try {
    console.log('[TEST 2] Fetching messages without JWT...');
    const res = await fetch(`${baseUrl}/admin/messages`);
    console.log(`-> Server response status: ${res.status}`);
    if (res.status === 401) {
      console.log('-> SUCCESS: Unauthorized access blocked with 401 code as expected.\n');
    } else {
      console.log('-> FAIL: Admin route allowed request without signature header.\n');
    }
  } catch (err) {
    console.error('-> FAIL: JWT boundary test error.', err);
  }

  // 3. Authenticate to retrieve token
  try {
    console.log('[TEST 3] Logging in with seeded admin credentials...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@portfolio.local',
        password: process.env.ADMIN_PASSWORD || 'SecureAdmin2026!'
      })
    });
    const auth = await loginRes.json();
    if (loginRes.ok && auth.token) {
      adminToken = auth.token;
      console.log('-> SUCCESS: Obtained secure admin signature token.\n');
    } else {
      console.log('-> FAIL: Seeded login failed.', auth);
    }
  } catch (err) {
    console.error('-> FAIL: Authentication login test error.', err);
  }

  // 4. Test Input Sanitization & XSS filtering
  if (adminToken) {
    try {
      console.log('[TEST 4] Submitting message with active XSS script tags...');
      const xssPayload = {
        name: 'Attacker <script>alert("xss")</script>',
        email: 'attacker@evil.com',
        subject: 'Infiltration Proof',
        message: 'Trying <iframe src="evil.site"></iframe> injection.'
      };

      const postRes = await fetch(`${baseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(xssPayload)
      });
      const postData = await postRes.json();
      console.log(`-> Submission response: ${postRes.ok ? 'OK (200)' : 'Error'}`);

      // Now load the messages list as Admin to check DB contents
      console.log('-> Inspecting saved inbox record in SQLite Database...');
      const msgListRes = await fetch(`${baseUrl}/admin/messages`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const messages = await msgListRes.json();
      const savedMsg = messages.find(m => m.email === 'attacker@evil.com');

      if (savedMsg) {
        console.log(`-> Saved Name field in DB: "${savedMsg.name}"`);
        console.log(`-> Saved Message field in DB: "${savedMsg.message}"`);
        
        const hasScript = savedMsg.name.includes('<script>');
        const isEscaped = savedMsg.name.includes('&lt;script&gt;') || !savedMsg.name.includes('<script>');

        if (!hasScript && isEscaped) {
          console.log('-> SUCCESS: XSS tags safely sanitized and escaped in database.\n');
        } else {
          console.log('-> FAIL: Raw unescaped HTML tags saved to database!\n');
        }
      } else {
        console.log('-> FAIL: Sanitized testing message was not found.\n');
      }
    } catch (err) {
      console.error('-> FAIL: Input sanitization check error.', err);
    }
  }

  // 5. Test Rate Limiting Protection (DOS Safeguard)
  try {
    console.log('[TEST 5] Hammering contact endpoint to trigger rate limits...');
    let rateLimited = false;
    for (let i = 0; i < 8; i++) {
      const res = await fetch(`${baseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Spam Bot',
          email: 'spam@bot.com',
          subject: `Ping ${i}`,
          message: 'Repeated telemetry transmission check.'
        })
      });
      if (res.status === 429) {
        rateLimited = true;
        console.log(`-> Success on Ping ${i + 1}: Received Status code 429 (Too Many Requests).`);
        break;
      }
    }
    if (rateLimited) {
      console.log('-> SUCCESS: Spam protection is active and blocked multiple submits.\n');
    } else {
      console.log('-> FAIL: Endpoint did not block fast repetitive request spam.\n');
    }
  } catch (err) {
    console.error('-> FAIL: Rate limiting test error.', err);
  }

  console.log('====================================================');
  console.log('               TEST COMPLETED                       ');
  console.log('====================================================');
}

runTests();
