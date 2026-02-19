# SPEC-4k-layout-v2.md - Home Hub Dashboard Re-Layout

## Overview
Re-layout the Home Hub dashboard to eliminate duplication (Indices column), expand News into its own column, and add a Latest Scores widget to Sports.

---

## Current Layout (Problem State)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER: Date | Clock | HeaderStocksWidget (SPY/QQQ/DIA) | Weather    │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │  SPORTS     │ │   TASKS     │ │   FRENCH    │ │  MARKET     │       │
│ │ Upcoming    │ │ Family      │ │ Paris       │ │ Indices     │       │
│ │ Games       │ │ Tasks       │ │ Countdown   │ │ (DUPLICATE! │ │
│ │ +            │ │ Work        │ │ Paris       │ │  Header     │
│ │ Top Stories │ │ Tasks       │ │ Time/Weather│ │  Stocks)    │
│ │ (clipped)   │ │             │ │ Phrase      │ │             │
│ │             │ │             │ │ Conjugation │ │             │
│ │             │ │             │ │ French News │ │             │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│ NEWS TICKER (bottom, always visible)                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Problems:**
1. Column 4 (Market/Indices) duplicates HeaderStocksWidget
2. News is split and cramped (TopStories in Sports, FrenchNews in French)
3. No Latest Scores widget - only Upcoming Games
4. At 3840x2160, right column wastes space

---

## Target Layout (v2)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER: Date | Clock | HeaderStocksWidget | Weather                   │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │  SPORTS     │ │   TASKS     │ │   FRENCH    │ │   NEWS      │       │
│ │             │ │             │ │             │ │             │       │
│ │ Upcoming    │ │ Family      │ │ Paris       │ │ Top Stories │       │
│ │ Games       │ │ Tasks       │ │ Countdown   │ │ (expanded!) │       │
│ │             │ │             │ │             │ │             │       │
│ │ ──────────  │ │ Work        │ │ Paris       │ │             │       │
│ │             │ │ Tasks       │ │ Time/Weather│ │ ──────────  │       │
│ │ Latest      │ │             │ │             │ │             │       │
│ │ Scores      │ │             │ │ Phrase      │ │ French News │       │
│ │ (NEW!)      │ │             │ │ Conjugation │ │             │       │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│ NEWS TICKER (bottom, always visible)                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1) New 4-Column Layout Definition

### Column 1: SportsSection (Combined Upcoming + Scores)

**Components:**
- **Upcoming Games Widget** - Existing, shows next 5 scheduled/live games
- **Latest Scores Widget** (NEW) - Shows recently finished games with scores

**Height Allocation at 4K:**
- Upcoming Games: ~45% of column height
- Latest Scores: ~55% of column height
- Total column: flex-1, max-h capped to prevent overflow

**Implementation in page.tsx:**
```tsx
// Replace SportsColumn with:
function SportsSection() {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Upcoming Games - keep existing */}
      <div className="flex-1 min-h-0">...</div>
      
      {/* Latest Scores - NEW widget below */}
      <div className="flex-1 min-h-0">...</div>
    </div>
  )
}
```

### Column 2: Tasks (Family + Work)

**No changes from current** - Already working well at 4K.

### Column 3: French

**No structural changes** - Keep existing:
- Paris Trip Countdown
- Paris Time/Weather
- French Phrase
- Verb Conjugation
- French News (move to Column 4 in full implementation, but keep here for now as backup)

### Column 4: NewsColumn (NEW - replaces Market)

**Components:**
- **Top Stories Widget** - Expanded from 4 items to 8-10 items
- **French News Widget** - Moved from French column

**Height Allocation at 4K:**
- Top Stories: ~60% of column height (show 8-10 items)
- French News: ~40% of column height
- Use `max-h-[Xpx]` and `overflow-hidden` to guarantee no scroll

**Implementation:**
```tsx
function NewsColumn() {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Top Stories - expanded */}
      <div className="flex-1 min-h-0 max-h-[55%] overflow-hidden">
        <TopStoriesWidget expanded />
      </div>
      
      {/* French News */}
      <div className="flex-1 min-h-0 max-h-[45%] overflow-hidden">
        <FrenchNewsWidget />
      </div>
    </div>
  )
}
```

**Remove completely:**
- MarketColumn component
- Column 4's Market section from main grid

---

## 2) No-Scroll Guarantees

### CSS Structure (Keep Existing)
```tsx
<div className="h-screen flex flex-col overflow-hidden">
  <header className="flex-none ...">...</header>
  <main className="flex-1 overflow-hidden grid ...">...</main>
  <NewsTicker className="flex-none" />
</div>
```

### Per-Widget Height Caps

| Widget | Max Height | Items Shown |
|--------|------------|--------------|
| Upcoming Games | 380px | 5 games |
| Latest Scores | 450px | 5 games |
| Top Stories | 700px | 10 stories |
| French News | 400px | 8 items |
| Tasks (each) | 400px | 8 tasks |

### Implementation Pattern
```tsx
// Example: Top Stories with caps
<div className="max-h-[700px] overflow-hidden">
  {stories.slice(0, 10).map(...)}
</div>
```

### NewsColumn Specific
- Increase from 4 visible stories to 8-10
- Use `grid` or `flex` with gap
- Still cap at max-height to prevent overflow
- At 4K, ~1400px available height per column minus gaps (~24px) = ~1376px usable
- Top Stories (700px) + French News (400px) + gap (24px) = 1124px < 1376px ✓

---

## 3) Latest Scores Widget

### Data Source Strategy

**Recommended: Option A (Reuse /api/sports, derive scores)**

```tsx
function LatestScoresWidget() {
  const [matches, setMatches] = useState<Match[]>([]);
  
  useEffect(() => {
    fetch('/api/sports')
      .then(r => r.json())
      .then(data => {
        // Filter for FINISHED games, sort by most recent
        const finished = data
          .filter((m: Match) => m.status === 'FINISHED')
          .sort((a: Match, b: Match) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 5); // Show 5 most recent
        setMatches(finished);
      });
  }, []);
  
  // Render with scores: Home 2 - 1 Away format
}
```

**Fallback: Option B (Stubbed /api/scores endpoint)**

If Option A produces no results (no finished games in dataset):
```ts
// src/app/api/scores/route.ts
// Returns stubbed "recent" scores for display purposes
// Real implementation would aggregate from sports API
export async function GET() {
  return Response.json([
    { homeTeam: 'Chelsea', awayTeam: 'Liverpool', homeScore: 2, awayScore: 1, date: '2026-02-18T15:00:00Z', league: 'Premier League' },
    { homeTeam: 'PSG', awayTeam: 'Monaco', homeScore: 3, awayScore: 0, date: '2026-02-18T20:00:00Z', league: 'Ligue 1' },
    // ... more stubbed data
  ]);
}
```

**Why Option A first:**
- No new API endpoint needed
- Uses existing `/api/sports` which already has score data
- Graceful fallback: if no finished games, show "No recent scores" message
- No external API keys required

### Widget UI Design
```
┌────────────────────────────────┐
│  LATEST SCORES                 │
├────────────────────────────────┤
│  Chelsea  2 - 1  Liverpool     │
│  Premier League • Yesterday   │
│                                │
│  PSG     3 - 0  Monaco         │
│  Ligue 1 • Yesterday           │
│                                │
│  (etc...)                      │
└────────────────────────────────┘
```

- Show final scores (not live)
- Include league name
- Show relative date ("Yesterday", "2 days ago")
- Use same team logo logic as Upcoming Games

---

## 4) Acceptance Criteria

### Visual Checkpoints

| Criterion | Validation Method |
|-----------|-------------------|
| No scrollbars at 3840x2160 | Open DevTools, set viewport to 3840x2160, verify no scroll |
| Ticker visible | Confirm bottom ticker renders with scrolling text |
| No duplicated Indices | Column 4 is now News, not Market. Header stocks still present |
| News column expanded | Top Stories shows 8-10 items (was 4) |
| Sports has Scores | Latest Scores widget visible below Upcoming Games |
| Layout = 4 columns | All 4 columns visible: Sports, Tasks, French, News |

### Build Verification
```bash
cd /home/jpwolf00/.openclaw/workspace/home-hub
npm run build
# Must succeed with no errors
```

### Runtime Verification
```bash
# Test at 4K viewport
# 1. Open browser DevTools
# 2. Set viewport: 3840 x 2160
# 3. Verify: no vertical scrollbar on main content
# 4. Verify: all 4 columns render
# 5. Verify: bottom ticker visible
```

---

## 5) Test Plan

### Phase 1: Build & Type Check
```bash
npm run build
# Expected: Success with no TypeScript errors
```

### Phase 2: Visual Testing (DevTools)

1. **4K Viewport Test**
   - Open Chrome DevTools → Toggle Device Toolbar
   - Set Custom: 3840 x 2160
   - Refresh page
   - Screenshot
   
2. **No-Scroll Verification**
   - Inspect `main` element: should have `overflow-hidden`
   - No scrollbars visible on any column
   
3. **Layout Structure**
   - Column 1: Sports (Upcoming + Scores)
   - Column 2: Tasks
   - Column 3: French
   - Column 4: News (not Market)
   
4. **Component Verification**
   - Header stocks widget present (SPY/QQQ/DIA)
   - Weather widget present
   - News ticker at bottom

### Phase 3: Functional Testing

1. **Latest Scores**
   - Check for scores display (may be empty if no finished games)
   - Verify "No recent scores" fallback works

2. **Top Stories**
   - Verify 8-10 items visible (not 4)

3. **Responsive Behavior**
   - Test at 1920x1080 (standard monitor)
   - Verify columns still render without overflow

### Phase 4: Deployment Test
```bash
# Deploy to Coolify
curl -X POST "http://192.168.85.202:8000/api/deploy" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid": "noc0so844sksg8wsc0gc0w00"}'

# Verify live at:
# http://noc0so844sksg8wsc0gc0w00.104.254.218.236.sslip.io
```

---

## Implementation Notes

### Files to Modify
1. `src/app/page.tsx` - Main layout (remove MarketColumn, add NewsColumn)
2. Create `src/components/widgets/LatestScoresWidget.tsx` - NEW widget
3. Update `src/components/widgets/TopStoriesWidget.tsx` - Add `expanded` prop for 10 items
4. Optional: `src/app/api/scores/route.ts` - Stubbed scores endpoint (if needed)

### Dependencies
- No new dependencies required
- Uses existing `/api/sports` endpoint
- Same styling (Tailwind + CSS variables)

### Estimated Effort
- Latest Scores widget: ~1 hour
- Layout restructure: ~1 hour
- Testing & verification: ~1 hour
- **Total: ~3 hours**

---

## Summary

| Change | Impact |
|--------|--------|
| Remove Market column | Eliminates duplication with header stocks |
| Add Latest Scores widget | Sports column now has Upcoming + Scores |
| News column (Col4) | Top Stories expands to 10 items + French News |
| No-scroll guarantee | Height caps + overflow-hidden maintained |
| 4K optimization | ~1400px usable per column, distributed as above |
