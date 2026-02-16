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
  const script = `
    tell application "Reminders"
      set reminderList to {}
      repeat with r in every reminder
        set reminderName to name of r
        set remCompleted to completed of r
        set remList to name of list of r
        set end of reminderList to {name:reminderName, completed:remCompleted, list:remList}
      end repeat
      return reminderList
    end tell
  `;
  
  try {
    const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
    const lines = result.trim().split('\n');
    const reminders = [];
    
    for (const line of lines) {
      // Parse: {name:Task, completed:false, list:Personal}
      const nameMatch = line.match(/name:([^,]+)/);
      const completeMatch = line.match(/completed:(true|false)/);
      const listMatch = line.match(/list:([^}]+)/);
      
      if (nameMatch) {
        reminders.push({
          title: nameMatch[1].trim(),
          completed: completeMatch ? completeMatch[1] === 'true' : false,
          list: listMatch ? listMatch[1].trim() : 'Unknown'
        });
      }
    }
    
    return reminders;
  } catch (e) {
    console.error('Error:', e.message);
    return [];
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/reminders') {
    const reminders = getReminders();
    res.end(JSON.stringify(reminders));
  } else if (req.url === '/health') {
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🍎 Reminders API running at http://localhost:${PORT}/reminders`);
});
