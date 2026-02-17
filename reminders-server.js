#!/usr/bin/env node
/**
 * Apple Reminders API Server
 * Run: node reminders-server.js
 * Access: http://localhost:3456/reminders
 */

const http = require('http');
const { execSync } = require('child_process');

const PORT = 3456;

let cache = { data: [], timestamp: 0 };
const CACHE_TTL = 30000;

function getReminders() {
  const now = Date.now();
  if (cache.data.length > 0 && (now - cache.timestamp) < CACHE_TTL) {
    return cache.data;
  }

  // Two fast batch calls: get all list names, then all incomplete reminder names
  // This avoids per-reminder iteration which is extremely slow
  try {
    const start = Date.now();

    // Get list names and their reminder counts to build a mapping
    const listScript = `
      tell application "Reminders"
        set listOutput to ""
        repeat with L in every list
          set n to name of L
          set c to count of (reminders of L whose completed is false)
          if c > 0 then
            set listOutput to listOutput & n & ":::" & c & "|||"
          end if
        end repeat
        return listOutput
      end tell
    `;

    const nameScript = `
      tell application "Reminders"
        set allNames to name of (every reminder whose completed is false)
        set output to ""
        repeat with n in allNames
          set output to output & n & "|||"
        end repeat
        return output
      end tell
    `;

    // Run both - list info is fast (just counts), names we know works
    const listResult = execSync(`osascript -e '${listScript}'`, {
      encoding: 'utf8',
      timeout: 30000,
    }).trim();

    const nameResult = execSync(`osascript -e '${nameScript}'`, {
      encoding: 'utf8',
      timeout: 30000,
    }).trim();

    const elapsed = Date.now() - start;
    console.log(`AppleScript completed in ${elapsed}ms`);

    // Parse list counts: "Work:::3|||Family:::2|||"
    const listCounts = [];
    if (listResult.length > 0) {
      const entries = listResult.split('|||').filter(e => e.includes(':::'));
      for (const entry of entries) {
        const [name, countStr] = entry.split(':::');
        listCounts.push({ name: name.trim(), count: parseInt(countStr) });
      }
    }

    // Parse reminder names
    const names = nameResult.length > 0
      ? nameResult.split('|||').filter(n => n.trim().length > 0).map(n => n.trim())
      : [];

    // Map names to lists based on counts
    // Reminders API returns them grouped by list in order
    const reminders = [];
    let nameIdx = 0;
    for (const list of listCounts) {
      for (let i = 0; i < list.count && nameIdx < names.length; i++) {
        reminders.push({ title: names[nameIdx], completed: false, list: list.name });
        nameIdx++;
      }
    }
    // Any remaining (shouldn't happen, but just in case)
    while (nameIdx < names.length) {
      reminders.push({ title: names[nameIdx], completed: false, list: 'Other' });
      nameIdx++;
    }

    console.log(`Lists: ${listCounts.map(l => `${l.name}(${l.count})`).join(', ')}`);
    cache = { data: reminders, timestamp: now };
    return reminders;
  } catch (e) {
    console.error('Error:', e.message);
    if (cache.data.length > 0) return cache.data;
    return [];
  }
}

// Pre-fetch on startup
setTimeout(() => {
  console.log('Pre-fetching reminders...');
  const reminders = getReminders();
  console.log(`Cached ${reminders.length} reminders`);
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
