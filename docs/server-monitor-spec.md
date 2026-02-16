# Server Monitor Dashboard - SPEC.md

## Overview
Real-time monitoring dashboard for 4 VMs via Beszel API.

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  SERVER MONITOR                          [Refresh] ⟳   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │   UNRAID          │    │   OPENCLAW       │          │
│  │   ● Online        │    │   ● Online       │          │
│  │                   │    │                   │          │
│  │   CPU ████░░ 45% │    │   CPU ██░░░░ 22% │          │
│  │   MEM █████░ 78% │    │   MEM ███░░░ 35% │          │
│  │   DISK ██░░░░ 18%│    │   DISK █░░░░░ 8% │          │
│  └──────────────────┘    └──────────────────┘          │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │   OLLAMA          │    │   [VM Name]      │          │
│  │   ● Online        │    │   ● Offline      │          │
│  │                   │    │                   │          │
│  │   CPU ██████ 62% │    │   CPU    --       │          │
│  │   MEM ████░░░ 48%│    │   MEM    --       │          │
│  │   DISK █████░ 55%│    │   DISK   --       │          │
│  └──────────────────┘    └──────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### VM Card
- **Header**: Hostname + status indicator (green dot = online, red = offline)
- **Metrics**: CPU, Memory, Disk usage bars
- **Update**: Auto-refresh every 30 seconds
- **Hover**: Subtle lift effect

---

## Visual Design

### Colors (Dark Theme - Terminal/Monitoring Style)
```css
--background: oklch(0.15 0.02 260);
--card-bg: oklch(0.2 0.02 260);
--text-primary: oklch(0.95 0.01 260);
--text-secondary: oklch(0.7 0.02 260);
--online: oklch(0.65 0.18 140);  /* Green */
--offline: oklch(0.6 0.15 20);   /* Red */
--cpu: oklch(0.7 0.15 200);      /* Blue */
--memory: oklch(0.7 0.15 280);  /* Purple */
--disk: oklch(0.7 0.15 45);      /* Amber */
```

### Typography
- **Font**: JetBrains Mono (monospace for metrics)
- **Headings**: 24px bold
- **Body**: 14px
- **Metrics**: 12px uppercase labels, large % values

### Layout
- Grid: 2x2 on desktop, 1 column on mobile
- Cards: Fixed aspect ratio, consistent padding (1.5rem)
- Gap: 1.5rem between cards

---

## Data Source

**API Endpoint**: `GET /api/collections/systems/records`
**Base URL**: http://192.168.85.199:8090

**Response fields to use:**
- `name` - hostname
- `status` - online/offline
- `cpu` - CPU percentage
- `memory` - Memory percentage  
- `disk` - Disk usage percentage

---

## Interactions

- **Auto-refresh**: Every 30 seconds
- **Manual refresh**: Click refresh button
- **Card hover**: Subtle scale(1.02) + shadow increase
