# Home Hub Dashboard

A personal home hub dashboard for monitoring servers, tasks, weather, sports, and more.

## Features

- **Unraid Monitoring** - Server stats, container status, disk usage
- **Task Board** - Apple Reminders sync via Shortcuts
- **Weather** - Current conditions and forecast
- **Sports** - Soccer match schedules (Premier League, etc.)
- **Camera Feeds** - Live video streams
- **AI Assistant** - Local Ollama for smart features

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (via Prisma)
- **AI**: Ollama (local)

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

## Environment Variables

See `.env.example` for required variables.

## Deployment

This project is designed for Coolify deployment. Push to GitHub, connect to Coolify, set env vars, and deploy.

## License

MIT
