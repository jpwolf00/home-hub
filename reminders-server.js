#!/usr/bin/env node
/**
 * Apple Reminders API Server
 * Run: node reminders-server.js
 * Access: http://localhost:3456/reminders
 */

const http = require('http');
const { execSync } = require('child_process');

const PORT = 3456;

function getReminders() {
  // Simpler script - just get name and completed, skip list name (causes permission issues)
  const script = `
    tell application "Reminders"
      set reminderList to {}
      repeat with r in every reminder
        set reminderName to name of r
        set remCompleted to completed of r
        -- Only include incomplete reminders
        if remCompleted is false then
          set end of reminderList to {name:reminderName, completed:remCompleted, list:"General"}
        end if
      end repeat
      return reminderList
    end tell
  `;
  
  try {
    const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
    console.log('Raw AppleScript result:', result.substring(0, 200));
    
    // Parse the AppleScript output - match patterns like name:..., completed:...
    const reminders = [];
    const nameMatches = result.matchAll(/name:([^,}]+)/g);
    const completeMatches = result.matchAll(/completed:(true|false)/g);
    
    const names = Array.from(nameMatches, m => m[1].trim());
    const completes = Array.from(completeMatches, m => m[1] === 'true');
    
    for (let i = 0; i < names.length; i++) {
      reminders.push({
        title: names[i],
        completed: completes[i] || false,
        list: 'General'
      });
    }
    
    return reminders;
  } catch (e) {
    console.error('Error running AppleScript:', e.message);
    console.error('Stack:', e.stack);
    return [];
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/reminders') {
    const reminders = getReminders();
    
    // Log to terminal
    console.log('\n📋 Reminders fetched:');
    console.log('==================');
    if (reminders.length === 0) {
      console.log('(no reminders found)');
    } else {
      reminders.forEach((r, i) => {
        console.log(`${i + 1}. [${r.completed ? '✓' : ' '}] ${r.title} (${r.list})`);
      });
    }
    console.log('==================\n');
    
    res.end(JSON.stringify(reminders));
  } else if (req.url === '/health') {
    res.end(JSON.stringify({ status: 'ok' }));
  } else if (req.url === '/' || req.url === '/index.html') {
    // Simple HTML page showing reminders
    const reminders = getReminders();
    const html = `<!DOCTYPE html>
<html>
<head><title>Mac Reminders</title></head>
<body style="font-family: monospace; padding: 20px;">
<h1>🍎 Mac Reminders</h1>
<pre>${JSON.stringify(reminders, null, 2)}</pre>
<h2>Formatted:</h2>
${reminders.length === 0 ? '<p>(no reminders)</p>' : reminders.map((r, i) => 
  `<p>${i+1}. [${r.completed ? '✓' : ' '}] ${r.title} (${r.list})</p>`
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
