# SPEC-4k-layout-v3.md - Home Hub Dashboard Fix: 50/50 Splits + French Content

## Overview
Fix the 4K layout v2 to enforce strict 50/50 vertical splits in Column 1 (Sports) and Column 4 (News), and ensure French column has all intended content blocks.

---

## Issues Identified (from Jason's Screenshot)

### Column 1: Sports
- **Problem:** Upcoming Games card is very tall, Latest Scores at bottom, **giant empty gap** between them
- **Root Cause:** Missing `flex-1` on card wrappers, or inner containers not using `h-full`

### Column 4: News  
- **Problem:** Top Stories is taking **much more than 50%** height; French News is smaller than 50%
- **Root Cause:** Same as Column 1 - no enforced 50/50 split

### French Column
- **Problem:** Missing verb conjugation and additional French cards
- **Current State:** Shows Paris Trip + Paris Time + French Phrase
- **Should Include:** Verb Conjugation + potentially French News

---

## Target Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER: Date | Clock | HeaderStocksWidget | Weather                   │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │  SPORTS     │ │   TASKS     │ │   FRENCH    │ │   NEWS      │       │
│ │             │ │             │ │             │ │             │       │
│ │ ┌─────────┐ │ │ Family      │ │ Paris       │ │ ┌─────────┐ │       │
│ │ │Upcoming  │ │ │ Tasks       │ │ Countdown   │ │ │Top      │ │       │
│ │ │Games     │ │ │             │ │             │ │ │Stories  │ │       │
│ │ │(50%!)   │ │ │ Work        │ │ Paris       │ │ │(50%!)  │ │       │
│ │ └─────────┘ │ │ Tasks       │ │ Time        │ │ └─────────┘ │       │
│ │             │ │             │ │             │ │             │       │
│ │ ┌─────────┐ │ │             │ │ Phrase      │ │ ┌─────────┐ │       │
│ │ │Latest   │ │ │             │ │ Conjugation │ │ │French   │ │       │
│ │ │Scores   │ │ │             │ │             │ │ │News     │ │       │
│ │ │(50%!)   │ │ │             │ │             │ │ │(50%!)  │ │       │
│ │ └─────────┘ │ │             │ │             │ │ └─────────┘ │       │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│ NEWS TICKER (bottom, always visible)                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1) Column 1 & 4: Fix 50/50 Splits

### Container Structure Required

**Column Wrapper (Col 1 & Col 4):**
```tsx
className="flex flex-col h-full gap-6"
```

**Each Half Card Wrapper:**
```tsx
className="flex-1 overflow-hidden"
```

**Inside Each Half - Widget Container:**
```tsx
// Must use h-full so widget fills its half
<div className="h-full">
  <WidgetComponent />
</div>
```

### Remove Conflicting Height Caps

**DO NOT use:**
- `max-h-[Xpx]` on the outer wrappers
- `max-h-[X%]` on the outer wrappers

**YOU MAY keep:**
- Internal list caps (e.g., `max-h-[Xpx]` inside the widget to limit items shown)
- `overflow-hidden` on outer wrappers

### Updated SportsColumn Code

```tsx
function SportsColumn() {
  return (
    <div className="flex flex-col h-full gap-6">
      {/* Upcoming Games - EXACTLY 50% */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full bg-[#2B2930] rounded-2xl p-6">
          <h3 className="text-2xl mb-4 section-title">Upcoming Games</h3>
          {/* Content with internal item cap if needed */}
        </div>
      </div>
      
      {/* Latest Scores - EXACTLY 50% */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full bg-[#2B2930] rounded-2xl p-6">
          <h3 className="text-2xl mb-4 section-title">Latest Scores</h3>
          {/* Content */}
        </div>
      </div>
    </div>
  );
}
```

### Updated NewsColumn Code

```tsx
function NewsColumn() {
  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top Stories - EXACTLY 50% */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <TopStoriesWidget expanded />
        </div>
      </div>
      
      {/* French News - EXACTLY 50% */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <FrenchNewsWidget />
        </div>
      </div>
    </div>
  );
}
```

### Key CSS Classes Summary

| Element | Required Classes |
|---------|------------------|
| Column wrapper | `flex flex-col h-full gap-6` |
| Each half card wrapper | `flex-1 overflow-hidden` |
| Inner widget container | `h-full` (ensures widget fills the half) |
| Widget root (inside) | May have internal `max-h-*` for item caps only |

---

## 2) French Column: Ensure All Content Blocks

### Current Content (verified in page.tsx)
1. ✅ Paris Trip Countdown
2. ✅ Paris Time/Weather
3. ✅ French Phrase with Pronunciation
4. ✅ Verb Conjugation

### Recommended Ordering
```
1. Paris Trip Countdown (compact)
2. Paris Time + Weather
3. French Phrase (featured, larger)
4. Verb Conjugation
```

### Height Allocation (no-scroll at 4K)
- At 4K: ~1400px column height minus gaps (~24px) = ~1376px usable
- 4 blocks with gap-8 (~32px each): 4 × ~300px = ~1200px content
- Remaining ~176px buffer handles variation

### Internal Item Caps (if needed)
```tsx
// French Phrase - no cap needed (rotates)
// Verb Conjugation - no cap needed (rotates)
// If adding French News back to this column, cap at 4 items
```

---

## 3) Latest Scores: Requirements

### Data Requirements
1. **Must show date** - Format: "Mon, Feb 18" or "Yesterday"
2. **Must show team icons** - Use existing TEAM_LOGOS mapping
3. **Must sort most recent first** - Sort by date descending
4. **Fallback if no FINISHED games:**
   ```
   Display: "No recent scores" (as currently implemented)
   ```

### Current Implementation (verified in page.tsx)
- ✅ Uses `/api/sports` endpoint
- ✅ Filters: `m.status === 'FINISHED'`
- ✅ Sorts: `new Date(b.date).getTime() - new Date(a.date).getTime()`
- ✅ Shows 5 most recent: `.slice(0, 5)`
- ✅ Shows date with `formatDate()`
- ✅ Shows relative date: "Yesterday", "2 days ago"
- ✅ Uses team logos from TEAM_LOGOS

**No changes needed** - implementation is correct.

---

## 4) Acceptance Criteria

### Visual Checkpoints

| Criterion | Validation Method |
|-----------|-------------------|
| **No scrollbars** at 3840x2160 | DevTools viewport 3840×2160, verify no scroll |
| **Col1 = 50/50 split** | Upcoming Games and Latest Scores each exactly half of column |
| **Col4 = 50/50 split** | Top Stories and French News each exactly half of column |
| **No giant empty gaps** | No whitespace between Upcoming Games and Latest Scores |
| **French column complete** | Shows: Paris Countdown, Paris Time/Weather, Phrase, Conjugation |

### Height Verification (DevTools)
1. Select Column 1 container → should be `h-full` (fills available space)
2. Select Upcoming Games wrapper → should be `flex-1` (50% of column)
3. Select Latest Scores wrapper → should be `flex-1` (50% of column)
4. Same for Column 4

### Test Viewport
```bash
# Chrome DevTools
1. Press F12 → Toggle Device Toolbar
2. Set Custom: 3840 × 2160
3. Refresh page
4. Verify no scrollbars
5. Verify 50/50 splits visually
```

---

## 5) Implementation Notes

### Files to Modify
1. `src/app/page.tsx` - Update SportsColumn and NewsColumn container structure

### Specific Changes

**SportsColumn:**
```tsx
// BEFORE:
<div className="flex flex-col h-full gap-6">
  <div className="flex-1 overflow-hidden bg-[#2B2930] rounded-2xl p-6">
    {/* Upcoming Games */}
  </div>
  <div className="flex-1 overflow-hidden">
    <LatestScoresWidget />
  </div>
</div>

// AFTER:
<div className="flex flex-col h-full gap-6">
  <div className="flex-1 overflow-hidden">
    <div className="h-full bg-[#2B2930] rounded-2xl p-6">
      {/* Upcoming Games */}
    </div>
  </div>
  <div className="flex-1 overflow-hidden">
    <div className="h-full bg-[#2B2930] rounded-2xl p-6">
      {/* Latest Scores content */}
    </div>
  </div>
</div>
```

**NewsColumn:**
```tsx
// BEFORE:
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-hidden">
    <TopStoriesWidget expanded />
  </div>
  <div className="flex-1 overflow-hidden">
    <FrenchNewsWidget />
  </div>
</div>

// AFTER:
<div className="flex flex-col h-full gap-6">
  <div className="flex-1 overflow-hidden">
    <div className="h-full">
      <TopStoriesWidget expanded />
    </div>
  </div>
  <div className="flex-1 overflow-hidden">
    <div className="h-full">
      <FrenchNewsWidget />
    </div>
  </div>
</div>
```

### Key Fix: Add `gap-6` to NewsColumn
- SportsColumn already has `gap-6`
- NewsColumn currently has **no gap** - add `gap-6`

---

## 6) Test Plan

### Phase 1: Build
```bash
cd /home/jpwolf00/.openclaw/workspace/home-hub
npm run build
# Expected: Success
```

### Phase 2: Visual Verification (3840×2160)
1. Open browser DevTools
2. Set viewport: 3840 × 2160
3. Refresh page
4. **Check Column 1:**
   - Upcoming Games starts at top
   - Latest Scores starts exactly halfway down column
   - No gap between them
5. **Check Column 4:**
   - Top Stories starts at top
   - French News starts exactly halfway down column
   - No gap between them
6. **Check French Column:**
   - All 4 blocks visible: Countdown, Time/Weather, Phrase, Conjugation
7. **Check scroll:** No vertical scrollbar anywhere

### Phase 3: Screenshot Comparison
- Take screenshot at 3840×2160
- Compare to previous screenshot
- Verify gap issues are resolved

---

## Summary

| Issue | Fix |
|-------|-----|
| Col1 gap between Upcoming/Scores | Add `h-full` wrapper inside each `flex-1` |
| Col4 uneven split | Add `gap-6` + `h-full` wrapper inside each `flex-1` |
| French column missing blocks | Already has all blocks; verify rendering |
| No scroll at 4K | Already working; verify no regression |

**Minimal changes required:** Add `gap-6` to NewsColumn + add inner `h-full` wrappers.
