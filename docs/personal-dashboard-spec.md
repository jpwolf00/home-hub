# Personal Dashboard - SPEC.md

## Overview
Always-on display dashboard optimized for at-a-glance information. Large fonts, high contrast.

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐                           ┌─────────────────┐ │
│  │   12:45 PM      │                           │   ☀️ 72°F       │ │
│  │   Sunday        │                           │   Sunny         │ │
│  └─────────────────┘                           └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐  ┌────────────────────────────┐ │
│  │  📅 SPORTS                  │  │  📈 STOCKS                  │ │
│  │                             │  │                             │ │
│  │  Celtics vs Lakers    7:30PM│  │  AAPL   ▲  $178.50  +1.2% │ │
│  │  Chiefs vs Bills      8:00PM│  │  GOOGL  ▼  $142.30  -0.8% │ │
│  │  Lakers vs Warriors   9:30PM│  │  MSFT   ▲  $378.20  +0.5% │ │
│  │                             │  │  TSLA   ▼  $245.60  -2.1%   │ │
│  └─────────────────────────────┘  └────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  ✓ TASKS                                               [+ Add] │ │
│  │  ☐ Review PR #142                                        3:00 │ │
│  │  ☑ Send weekly report                                    done │ │
│  │  ☐ Call dentist                                          5:00 │ │
│  │  ☐ Buy groceries                                         --   │ │
│  └───────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  NEWS TICKER: Breaking: AI models achieve new benchmarks...       │
│  Tech: New GPU released... | Sports: Trade deadline... | More...  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Clock Widget (Top Left)
- Large digital clock (48px+ font)
- Day/date below
- High contrast white on dark

### 2. Weather Widget (Top Right)
- Current temp (large)
- Weather icon
- Condition text
- Optional: 3-day forecast dots

### 3. Sports Widget
- Upcoming games list
- Time in local tz
- Tap for details (optional)
- Scroll if >3 games

### 4. Stocks Widget
- Watchlist (4-6 stocks)
- Symbol, direction arrow, price, % change
- Green = up, Red = down
- Scrollable if >4

### 5. Tasks Widget
- Todo list with checkboxes
- Due time if set
- Add new task button
- Strike-through on completed

### 6. News Ticker
- Continuous scrolling marquee
- Headlines separated by pipes
- Click to expand (optional)

---

## Visual Design

### Colors (High Contrast Dark)
```css
--background: oklch(0.1 0.02 260);
--card-bg: oklch(0.15 0.02 260);
--text-primary: oklch(1 0 0);
--text-secondary: oklch(0.75 0.02 260);
--accent: oklch(0.6 0.15 200);
--success: oklch(0.65 0.18 140);   /* Green */
--danger: oklch(0.6 0.15 20);      /* Red */
--warning: oklch(0.7 0.15 45);     /* Amber */
```

### Typography
- **Clock**: 56px, bold, JetBrains Mono
- **Temp**: 36px, bold
- **Headings**: 18px semibold
- **Body**: 16px regular
- **Labels**: 14px, uppercase, muted

### Layout
- 2-column grid for widgets (top row: clock + weather)
- Full-width rows for tasks and news ticker
- Card border-radius: 16px
- Padding: 1.5rem inside cards

---

## Data Sources

### Weather
- **API**: OpenWeatherMap (free tier)
- **Endpoint**: `/api/weather`
- **Fields**: temp, condition, icon

### Sports
- **API**: API-Football or similar (free tier)
- **Endpoint**: `/api/sports`
- **Fields**: team names, game time, league

### Stocks
- **API**: Finnhub (free tier)
- **Endpoint**: `/api/stocks`
- **Fields**: symbol, price, change, changePercent

### Tasks
- **Storage**: In-app state (localStorage) or API
- **Fields**: id, title, completed, dueTime

### News
- **API**: NewsAPI or RSS feeds
- **Endpoint**: `/api/news`
- **Fields**: headlines array

---

## Interactions

- **Checkboxes**: Toggle task completion (instant visual feedback)
- **Add Task**: Opens inline input
- **Stock tap**: (future) Show chart
- **News tap**: (future) Open article
- **Auto-refresh**: Weather/Sports/Stocks every 5-15 min

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (<640px) | Single column, stacked |
| Tablet (640-1024px) | 2-column grid |
| Desktop (>1024px) | Full layout as shown |
