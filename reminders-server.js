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

  // Batch fetch: get all names and completed statuses in two calls instead of looping
  const script = `
    tell application "Reminders"
      set allNames to name of (every reminder whose completed is false)
      set output to ""
      repeat with n in allNames
        set output to output & n & "|||"
      end repeat
      return output
    end tell
  `;

  try {
    const start = Date.now();
    const result = execSync(`osascript -e '${script}'`, {
      encoding: 'utf8',
      timeout: 30000,
    }).trim();
    const elapsed = Date.now() - start;
    console.log(`AppleScript completed in ${elapsed}ms`);

    const reminders = [];
    if (result.length > 0) {
      const names = result.split('|||').filter(n => n.trim().length > 0);
      for (const name of names) {
        reminders.push({
          title: name.trim(),
          completed: false,
          list: 'General',
        });
      }
    }

    cache = { data: reminders, timestamp: now };
    return reminders;
  } catch (e) {
    console.error('Error running AppleScript:', e.message);
    // Return stale cache if available
    if (cache.data.length > 0) return cache.data;
    return [];
  }
}

// Pre-fetch on startup so the first request is fast
setTimeout(() => {
  console.log('Pre-fetching reminders...');
  const reminders = getReminders();
  console.log(`Cached ${reminders.length} reminders on startup`);
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
    const html = `<!DOCTYPE html>
<html>
<head><title>Mac Reminders</title></head>
<body style="font-family: monospace; padding: 20px;">
<h1>🍎 Mac Reminders (${reminders.length})</h1>
${reminders.length === 0 ? '<p>(no reminders)</p>' : reminders.map((r, i) =>
  `<p>${i+1}. ${r.title}</p>`
).join('')}
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
  console.log(`🍎 Reminders API running at http://0.0.0.0:${PORT}/reminders`);
});
