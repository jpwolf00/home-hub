# Implementation Plan: Home Hub Dashboard Fixes

## Overview
This plan details the implementation of 5 key fixes to the Home Hub dashboard:
1. Sports API team filtering and limits
2. French Column vertical layout consolidation
3. News Column height adjustments (60/40 split)
4. Header even distribution
5. Pi Performance Mode with Framer Motion disable

---

## Task 1: Fix Sports API Filtering (`/api/sports/route.ts`)

### Changes Required

#### 1.1 Update INTERESTING_TEAMS Array
**Current:**
```typescript
const INTERESTING_TEAMS = [
  'Chelsea', 'PSG', 'Wrexham',
  'USA', 'United States',
  'Kentucky',
]
```

**New:**
```typescript
const INTERESTING_TEAMS = [
  'Chelsea', 'PSG', 'Wrexham',
  'USA', 'United States', 'US', 'U.S.', 'U.S.A.',  // USA variations
  'Kentucky',
]
```

#### 1.2 Remove Georgia and Auburn from TEAMS Config
**Current TEAMS object includes:**
- 'Georgia': { name: 'Georgia', logo: '🔴' }
- 'Auburn': { name: 'Auburn', logo: '🟠' }

**Action:** Remove both entries from the TEAMS object.

#### 1.3 Limit Results and Add Sorting

In the `fetchESPNData()` function, after collecting all matches, add filtering and limiting:

```typescript
// After collecting all matches, filter and limit
const filteredMatches = matches.filter(m => {
  const isInteresting = INTERESTING_TEAMS.some(t => 
    m.homeTeam?.includes(t) || m.awayTeam?.includes(t)
  );
  // Exclude Georgia and Auburn explicitly
  const isExcluded = m.homeTeam === 'Georgia' || m.awayTeam === 'Georgia' ||
                     m.homeTeam === 'Auburn' || m.awayTeam === 'Auburn';
  return isInteresting && !isExcluded;
});

// Split into upcoming and finished
const upcoming = filteredMatches
  .filter(m => m.status !== 'FINISHED' && m.status !== 'post' && m.status !== 'final')
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  .slice(0, 7);

const finished = filteredMatches
  .filter(m => m.status === 'FINISHED' || m.status === 'post' || m.status === 'final')
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 7);

return [...upcoming, ...finished];
```

#### 1.4 Update Local Schedule Fallback
In `getLocalSchedule()`, remove all Georgia and Auburn games from the mock data.

---

## Task 2: Consolidate French Widget (`FrenchWidget.tsx` + `page.tsx`)

### 2.1 Rewrite FrenchWidget.tsx Completely

The new FrenchWidget should have a vertical stack layout with ALL sections visible at once:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { frenchVocabulary, frenchVerbs } from '@/lib/french-data';

const TRIP_DATE = new Date('2026-05-09T00:00:00-04:00');

export default function FrenchWidget() {
  const [parisTime, setParisTime] = useState('');
  const [parisWeather, setParisWeather] = useState<any>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [verbIndex, setVerbIndex] = useState(0);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [mounted, setMounted] = useState(false);

  // Tourist-focused vocabulary (first 50 entries are most relevant)
  const TOURIST_PHRASES = frenchVocabulary.slice(0, 50);

  // Key tourist verbs
  const TOURIST_VERBS = frenchVerbs.slice(0, 8);

  // Question words (indices 180-200 in frenchVocabulary)
  const QUESTION_WORDS = [
    { french: 'Qui?', pronunciation: 'KEE', english: 'Who?' },
    { french: 'Quoi?', pronunciation: 'KWAH', english: 'What?' },
    { french: 'Où?', pronunciation: 'OO', english: 'Where?' },
    { french: 'Quand?', pronunciation: 'KAHN', english: 'When?' },
    { french: 'Pourquoi?', pronunciation: 'poor-KWAH', english: 'Why?' },
    { french: 'Comment?', pronunciation: 'koh-MAHN', english: 'How?' },
    { french: 'Lequel?', pronunciation: 'luh-KEL', english: 'Which one?' },
    { french: 'Combien?', pronunciation: 'kom-BEE-en', english: 'How many?' },
  ];

  useEffect(() => {
    setMounted(true);

    // Paris time
    const updateParisTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { 
        timeZone: 'Europe/Paris', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setParisTime(time);
    };
    updateParisTime();
    const parisInterval = setInterval(updateParisTime, 1000);

    // Paris weather
    const fetchParisWeather = () => {
      fetch('/api/paris-weather')
        .then(r => r.json())
        .then(setParisWeather)
        .catch(console.error);
    };
    fetchParisWeather();
    const weatherInterval = setInterval(fetchParisWeather, 10 * 60 * 1000);

    // Countdown
    const updateCountdown = () => {
      const now = new Date();
      const diff = TRIP_DATE.getTime() - now.getTime();
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        });
      }
    };
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 60000);

    // Rotate content
    const phraseInterval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % TOURIST_PHRASES.length);
    }, 30000);

    const verbInterval = setInterval(() => {
      setVerbIndex((prev) => (prev + 1) % TOURIST_VERBS.length);
    }, 45000);

    return () => {
      clearInterval(parisInterval);
      clearInterval(weatherInterval);
      clearInterval(countdownInterval);
      clearInterval(phraseInterval);
      clearInterval(verbInterval);
    };
  }, []);

  const iconMap: Record<string, string> = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };

  const currentPhrase = TOURIST_PHRASES[phraseIndex];
  const currentVerb = TOURIST_VERBS[verbIndex];

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
      {/* Section 1: Paris Countdown + Time/Weather */}
      <div className="bg-[#2B2930] rounded-xl p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">✈️</span>
            <h3 className="text-sm font-medium text-white/70 uppercase">Paris Trip</h3>
          </div>
          {mounted && (
            <div className="flex gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-white">{countdown.days}</div>
                <div className="text-[10px] text-white/50">Days</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{countdown.hours}</div>
                <div className="text-[10px] text-white/50">Hrs</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{countdown.minutes}</div>
                <div className="text-[10px] text-white/50">Min</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">🗼</span>
            <span className="text-xl font-mono text-white">{parisTime || '--:--'}</span>
          </div>
          {parisWeather && (
            <div className="flex items-center gap-2">
              <span className="text-xl">{iconMap[parisWeather.icon] || '🌡️'}</span>
              <span className="text-lg text-white">{parisWeather.temp}°F</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Vocabulary - Tourist Phrases */}
      <div className="bg-[#2B2930] rounded-xl p-3 flex-1 min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🗣️</span>
          <h3 className="text-sm font-medium text-white/70 uppercase">
            Phrases ({phraseIndex + 1}/{TOURIST_PHRASES.length})
          </h3>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-medium text-white">{currentPhrase?.french}</div>
          <div className="text-base text-blue-300 italic">[{currentPhrase?.pronunciation}]</div>
          <div className="text-base text-white/70">{currentPhrase?.english}</div>
        </div>
      </div>

      {/* Section 3: Verb Conjugations */}
      <div className="bg-[#2B2930] rounded-xl p-3 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📝</span>
          <h3 className="text-sm font-medium text-white/70 uppercase">
            Verbs ({verbIndex + 1}/{TOURIST_VERBS.length})
          </h3>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-medium text-white">{currentVerb?.verb} ({currentVerb?.meaning})</div>
          <div className="text-sm text-purple-300">{currentVerb?.present}</div>
        </div>
      </div>

      {/* Section 4: Question Words */}
      <div className="bg-[#2B2930] rounded-xl p-3 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">❓</span>
          <h3 className="text-sm font-medium text-white/70 uppercase">Questions</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {QUESTION_WORDS.map((q, i) => (
            <div key={i}>
              <span className="text-blue-300 font-medium">{q.french}</span>
              <span className="text-white/50"> - {q.english}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 2.2 Remove FrenchColumn from page.tsx

In `page.tsx`, DELETE the entire `FrenchColumn` function (lines ~214-355 approximately).

### 2.3 Update Column 3 in page.tsx

**Current:**
```tsx
{/* Column 3: French */}
<section className="h-full min-h-0">
  <FrenchColumn />
</section>
```

**New:**
```tsx
{/* Column 3: French */}
<section className="h-full min-h-0">
  <FrenchWidget />
</section>
```

Also remove the import of `frenchVocabulary` and `frenchVerbs` from the page.tsx imports since they're no longer needed there.

---

## Task 3: Fix News Column Heights (`page.tsx`)

### 3.1 Update NewsColumn Component

**Current (50/50 split):**
```tsx
function NewsColumn() {
  return (
    <div className="flex flex-col h-full min-h-0 gap-6">
      {/* Top Stories - 50% height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full min-h-0">
          <TopStoriesWidget expanded />
        </div>
      </div>

      {/* French News - 50% height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full min-h-0">
          <FrenchNewsWidget />
        </div>
      </div>
    </div>
  );
}
```

**New (60/40 split):**
```tsx
function NewsColumn() {
  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {/* Top Stories - 60% height */}
      <div className="h-[60%] min-h-0 overflow-hidden">
        <div className="h-full min-h-0">
          <TopStoriesWidget expanded />
        </div>
      </div>

      {/* French News - 40% height */}
      <div className="h-[40%] min-h-0 overflow-hidden">
        <div className="h-full min-h-0">
          <FrenchNewsWidget />
        </div>
      </div>
    </div>
  );
}
```

---

## Task 4: Fix Header Distribution (`page.tsx`)

### 4.1 Update Header Layout

**Current header:**
```tsx
<header className="flex-none flex items-center justify-between px-8 py-6 border-b-2" style={{ borderColor: 'var(--outline)' }}>
  <div className="flex items-baseline gap-12">
    <DateDisplay />
    <Clock />
  </div>
  <div className="flex items-center gap-12">
    <HeaderStocksWidget />
    <WeatherWidget />
  </div>
</header>
```

**New (evenly distributed):**
```tsx
<header className="flex-none grid grid-cols-4 items-center px-8 py-6 border-b-2" style={{ borderColor: 'var(--outline)' }}>
  <div className="flex justify-start">
    <DateDisplay />
  </div>
  <div className="flex justify-center">
    <Clock />
  </div>
  <div className="flex justify-center">
    <HeaderStocksWidget />
  </div>
  <div className="flex justify-end">
    <WeatherWidget />
  </div>
</header>
```

---

## Task 5: Add Pi Performance Mode

### 5.1 Create Low Power Mode Hook

Create new file: `src/lib/low-power.ts`

```typescript
// Low Power Mode detection and utilities

export const isLowPowerMode = (): boolean => {
  if (typeof process !== 'undefined') {
    return process.env.NEXT_PUBLIC_LOW_POWER === 'true';
  }
  return false;
};

export const getRefreshInterval = (baseMinutes: number): number => {
  return isLowPowerMode() ? baseMinutes * 2 : baseMinutes;
};

export const shouldAnimate = (): boolean => {
  return !isLowPowerMode();
};
```

### 5.2 Update .env.example

Add to the end of `.env.example`:

```bash
# Performance Mode (set to true for Raspberry Pi/low-power devices)
# Disables Framer Motion, reduces refresh intervals, makes ticker static
NEXT_PUBLIC_LOW_POWER=false
```

### 5.3 Update page.tsx - Conditional Framer Motion

**At the top of page.tsx:**
```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import FrenchWidget from '@/components/widgets/FrenchWidget';
import FrenchNewsWidget from '@/components/widgets/FrenchNewsWidget';

// Check low power mode
const LOW_POWER = process.env.NEXT_PUBLIC_LOW_POWER === 'true';
const ANIMATE = !LOW_POWER;
```

**Replace all Framer Motion `motion.div` with conditional wrapper:**

Instead of using `<motion.div>` directly, create a helper:

```typescript
// Animation wrapper - uses motion.div when animations enabled, plain div when disabled
const AnimatedDiv = ({ children, className, ...props }: any) => {
  if (ANIMATE) {
    return <motion.div className={className} {...props}>{children}</motion.div>;
  }
  return <div className={className}>{children}</div>;
};
```

However, looking at the current page.tsx, there are NO motion.div elements - the animations come from CSS and the NewsTicker. So we need to focus on:

1. Adjusting refresh intervals based on LOW_POWER mode
2. Making the NewsTicker static when in low power mode

### 5.4 Update All Refresh Intervals in page.tsx

Update all `setInterval` calls to respect low power mode:

**HeaderStocksWidget:**
```typescript
const interval = setInterval(fetchData, LOW_POWER ? 10 * 60 * 1000 : 5 * 60 * 1000);
```

**WeatherWidget:**
```typescript
const interval = setInterval(fetchData, LOW_POWER ? 20 * 60 * 1000 : 10 * 60 * 1000);
```

**SportsColumn:**
```typescript
const interval = setInterval(fetchData, LOW_POWER ? 10 * 60 * 1000 : 5 * 60 * 1000);
```

**fetchReminders:**
```typescript
const interval = setInterval(fetchReminders, LOW_POWER ? 10 * 60 * 1000 : 5 * 60 * 1000);
```

**checkVersion:**
```typescript
const versionInterval = setInterval(checkVersion, LOW_POWER ? 5 * 60 * 1000 : 2 * 60 * 1000);
```

### 5.5 Update NewsTicker for Static Mode

In the `NewsTicker` component, add low power mode support:

```typescript
function NewsTicker() {
  const [news, setNews] = useState<string[]>([]);
  const LOW_POWER = process.env.NEXT_PUBLIC_LOW_POWER === 'true';

  const fetchData = () => {
    fetch('/api/news')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNews(data);
        } else if (data.items) {
          setNews(data.items);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, LOW_POWER ? 10 * 60 * 1000 : 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (news.length === 0) {
    return (
      <div className="news-ticker border-t-2 h-20 px-8 flex items-center" style={{ background: 'var(--surface)', borderColor: 'var(--outline)' }}>
        <span className="text-2xl text-white/50">Loading breaking news...</span>
      </div>
    );
  }

  const text = news.join('  •  ');

  if (LOW_POWER) {
    // Static ticker for low power mode
    return (
      <div className="bg-[#2A1212] border-t-2 border-red-500/30 h-16 px-8 flex items-center overflow-hidden">
        <div className="text-lg text-white/80 truncate">
          {text}
        </div>
      </div>
    );
  }

  // Animated ticker for normal mode
  return (
    <div className="news-ticker bg-[#2A1212] border-t-2 border-red-500/30 h-16 px-8 flex items-center overflow-hidden ticker">
      <div className="ticker-track">
        <span className="ticker-text">{text}</span>
        <span className="ticker-sep">•</span>
        <span className="ticker-text">{text}</span>
      </div>
    </div>
  );
}
```

---

## Task 6: Remove Unused TEAM_LOGOS References

In `page.tsx`, the `LatestScoresWidget` and `SportsColumn` have `TEAM_LOGOS` objects that include Georgia and Auburn. Remove these entries:

```typescript
const TEAM_LOGOS: Record<string, string> = {
  // SEC
  'Kentucky': '/logos/sec/kentucky.png',
  // Remove: 'Georgia': '/logos/sec/georgia.png',
  // Remove: 'Auburn': '/logos/sec/auburn.png',
  // ... rest of logos
};
```

---

## Implementation Order

1. **Start with `/api/sports/route.ts`** - This is backend-only and can be tested independently
2. **Update `.env.example`** - Add the new environment variable documentation
3. **Create `src/lib/low-power.ts`** - Utility module
4. **Rewrite `FrenchWidget.tsx`** - Complete replacement
5. **Update `page.tsx`** - Multiple changes:
   - Remove FrenchColumn function
   - Update imports
   - Fix header grid layout
   - Update NewsColumn heights
   - Add LOW_POWER checks to all intervals
   - Update NewsTicker for static mode
   - Remove Georgia/Auburn from TEAM_LOGOS

---

## Testing Checklist

After implementation, verify:

- [ ] `npm run build` completes without errors
- [ ] Sports API returns only user teams (no Georgia/Auburn, no other teams like Arsenal)
- [ ] French column shows all 4 vertical sections (Countdown, Phrases, Verbs, Questions)
- [ ] News column has Top Stories at ~60% height, French News at ~40%
- [ ] Header widgets are evenly spaced in 4 columns
- [ ] Setting `NEXT_PUBLIC_LOW_POWER=true` disables ticker animation
- [ ] Setting `NEXT_PUBLIC_LOW_POWER=true` reduces refresh intervals

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `/api/sports/route.ts` | Update INTERESTING_TEAMS, remove Georgia/Auburn, limit to 6-7 games, add sorting |
| `src/components/widgets/FrenchWidget.tsx` | Complete rewrite with vertical layout |
| `src/app/page.tsx` | Remove FrenchColumn, update header, update NewsColumn heights, add Pi mode support |
| `src/lib/low-power.ts` | New file for low power utilities |
| `.env.example` | Add NEXT_PUBLIC_LOW_POWER documentation |

---

## Notes for Implementer

1. **FrenchWidget is a complete replacement** - Don't try to merge with old code, replace entirely
2. **Keep the same color scheme** - Use `#2B2930` for card backgrounds
3. **Test at multiple resolutions** - Dashboard targets 4K and 1080p displays
4. **Watch for TypeScript errors** - Ensure all imports and types are correct
5. **The Paris countdown date is hardcoded** - May 9, 2026 (TRIP_DATE)
