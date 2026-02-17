#!/usr/bin/env node
/**
 * Apple Reminders API Server
 * Run: node reminders-server.js
 * Access: http://localhost:3456/reminders
 */

const http = require('http');
const { execSync } = require('child_process');

const PORT = 3456;

// Cache reminders for 30 seconds to avoid slow AppleScript calls on every request
let cache = { data: [], timestamp: 0 };
const CACHE_TTL = 30000;

function getReminders() {
  const now = Date.now();
  if (cache.data.length > 0 && (now - cache.timestamp) < CACHE_TTL) {
    return cache.data;
  }

  // Use JXA (JavaScript for Automation) instead of AppleScript - faster and easier to parse
  const script = `
    const app = Application("Reminders");
    const results = [];
    const lists = app.lists();
    for (let i = 0; i < lists.length; i++) {
      const listName = lists[i].name();
      const rems = lists[i].reminders.whose({completed: false})();
      for (let j = 0; j < rems.length; j++) {
        results.push(listName + ":::" + rems[j].name());
      }
    }
    results.join("|||");
  `;

  try {
    const start = Date.now();
    const result = execSync(`osascript -l JavaScript -e '${script}'`, {
      encoding: 'utf8',
      timeout: 60000,
    }).trim();
    const elapsed = Date.now() - start;
    console.log(`JXA completed in ${elapsed}ms`);

    const reminders = [];
    if (result.length > 0) {
      const entries = result.split('|||').filter(e => e.trim().length > 0);
      for (const entry of entries) {
        const sepIdx = entry.indexOf(':::');
        if (sepIdx === -1) continue;
        const list = entry.substring(0, sepIdx).trim();
        const title = entry.substring(sepIdx + 3).trim();
        reminders.push({ title, completed: false, list });
      }
    }

    cache = { data: reminders, timestamp: now };
    return reminders;
  } catch (e) {
    console.error('Error running JXA:', e.message);
    // Fallback: try simple AppleScript without list names
    try {
      console.log('Falling back to simple AppleScript...');
      const fallbackScript = `
        tell application "Reminders"
          set allNames to name of (every reminder whose completed is false)
          set output to ""
          repeat with n in allNames
            set output to output & n & "|||"
          end repeat
          return output
        end tell
      `;
      const start2 = Date.now();
      const result2 = execSync(`osascript -e '${fallbackScript}'`, {
        encoding: 'utf8',
        timeout: 60000,
      }).trim();
      console.log(`Fallback AppleScript completed in ${Date.now() - start2}ms`);

      const reminders = [];
      if (result2.length > 0) {
        const names = result2.split('|||').filter(n => n.trim().length > 0);
        for (const name of names) {
          reminders.push({ title: name.trim(), completed: false, list: 'Reminders' });
        }
      }
      cache = { data: reminders, timestamp: now };
      return reminders;
    } catch (e2) {
      console.error('Fallback also failed:', e2.message);
      if (cache.data.length > 0) return cache.data;
      return [];
    }
  }
}

// Pre-fetch on startup so the first request is fast
setTimeout(() => {
  console.log('Pre-fetching reminders...');
  const reminders = getReminders();
  console.log(`Cached ${reminders.length} reminders on startup`);
  const lists = {};
  reminders.forEach(r => { lists[r.list] = (lists[r.list] || 0) + 1; });
  Object.entries(lists).forEach(([name, count]) => console.log(`  ${name}: ${count}`));
}, 1000);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/reminders') {
    const reminders = getReminders();
    console.log(`📋 Served ${reminders.length} reminders`);
    res.end(JSON.stringify(reminders));
  } else if (req.url === '/health') {
    res.end(JSON.stringify({ status: 'ok', cached: cache.data.length }));
  } else if (req.url === '/' || req.url === '/index.html') {
    const reminders = getReminders();
    const lists = {};
    reminders.forEach(r => { lists[r.list] = (lists[r.list] || 0) + 1; });
    const html = `<!DOCTYPE html>
<html>
<head><title>Mac Reminders</title></head>
<body style="font-family: monospace; padding: 20px;">
<h1>Mac Reminders (${reminders.length})</h1>
${Object.entries(lists).map(([name, count]) => `
<h2>${name} (${count})</h2>
${reminders.filter(r => r.list === name).map((r, i) =>
  `<p>${i+1}. ${r.title}</p>`
).join('')}
`).join('')}
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Reminders API running at http://0.0.0.0:${PORT}/reminders`);
});
