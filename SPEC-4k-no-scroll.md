# SPEC: 4K Kiosk "No Scroll Ever" Layout

## Goal
On exact 4K viewport (3840×2160), dashboard must have **zero scroll** — no page scroll and no internal main scroll. This is a kiosk display with no input devices.

---

## 1. Layout Changes

### 1.1 Main Container (src/app/page.tsx)

**Current:**
```tsx
<main className="flex-1 overflow-auto grid gap-6 p-8 pb-8" ...>
```

**Change to:**
```tsx
<main className="flex-1 overflow-hidden grid gap-6 p-8" ...>
```

- `overflow-auto` → `overflow-hidden` (eliminates page scroll)
- `pb-8` removed (no need since no scroll)

### 1.2 FrenchNewsWidget (src/components/widgets/FrenchNewsWidget.tsx)

**Current:**
```tsx
<div className="bg-[#2B2930] rounded-2xl p-8 h-full overflow-y-auto">
```

**Change to:**
```tsx
<div className="bg-[#2B2930] rounded-2xl p-6 h-full overflow-hidden">
```

- `overflow-y-auto` → `overflow-hidden` (eliminates internal scroll in French column)
- `p-8` → `p-6` (slight reduction to maximize space)

### 1.3 Sports Column Container

Add `overflow-hidden` to prevent any internal scroll from TopStoriesWidget:

**Current (SportsColumn):**
```tsx
<div className="bg-[#2B2930] rounded-2xl p-8 flex-1 overflow-hidden">
```

**Already has overflow-hidden** — verify this is present (it is in current code).

### 1.4 Task Columns

Wrap tasks in overflow-hidden container:

**Current (TasksColumn):**
```tsx
<div className="bg-[#2B2930] rounded-2xl p-8 h-full">
  <div className="space-y-6">
```

**Change to:**
```tsx
<div className="bg-[#2B2930] rounded-2xl p-8 h-full overflow-hidden">
  <div className="space-y-4 overflow-hidden">
```

---

## 2. Height Budgeting Strategy

### 2.1 Viewport Breakdown

| Component | Height | Notes |
|-----------|--------|-------|
| Header | ~120px | Clock, date, stocks, weather |
| Main content | ~1876px | 2160 - 120 - 64 (ticker) |
| Ticker | 64px (h-16) | Fixed at bottom |

### 2.2 Tallest Components Analysis

| Component | Risk Level | Mitigation |
|-----------|------------|------------|
| **TopStoriesWidget** | Medium | Already limited to 4 visible items via rotation; add `max-h` |
| **Tasks Lists** | High | Can grow unbounded; limit to 6-8 tasks max per list |
| **FrenchColumn** | Medium | Multiple sections; countdown + weather + phrase + conjugation + news |
| **MarketColumn** | Low | Fixed content (indices only) |
| **FrenchNewsWidget** | Medium | Shows 4 headlines; already limited |

### 2.3 Explicit Caps

1. **TopStoriesWidget**: 
   - Already shows 4 items (rotating)
   - Add explicit container `max-h` to ensure it doesn't grow
   - Current: `flex-1` — change to `flex-1 max-h-[600px]` (estimated safe max)

2. **TasksColumn**:
   - Limit each list to **8 tasks maximum** (display only first 8)
   - Add `max-h-[700px]` to prevent overflow

3. **FrenchNewsWidget**:
   - Already limited to 4 items (`slice(0, 4)`)
   - Change container from `flex-1` to explicit height

4. **SportsColumn (upcomingGames)**:
   - Already limited to 5 games (`slice(0, 5)`)
   - Safe as-is

### 2.4 Additional CSS Constraints

Add to `globals.css`:

```css
/* Prevent any horizontal overflow */
* {
  overflow-x: hidden;
}

/* Ensure grid columns don't overflow */
main {
  overflow: hidden;
}
```

---

## 3. Concrete Code Changes

### 3.1 src/app/page.tsx

```diff
-      <main className="flex-1 overflow-auto grid gap-6 p-8 pb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
+      <main className="flex-1 overflow-hidden grid gap-6 p-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
```

### 3.2 SportsColumn → TopStoriesWidget container

```diff
-    <div className="bg-[#2B2930] rounded-2xl p-8 flex-1 overflow-hidden">
+    <div className="bg-[#2B2930] rounded-2xl p-8 flex-1 max-h-[650px] overflow-hidden">
```

### 3.3 TasksColumn

```diff
-      <div className="bg-[#2B2930] rounded-2xl p-8 h-full">
-        <h3 className="text-3xl font-medium mb-8 uppercase tracking-wider">
+      <div className="bg-[#2B2930] rounded-2xl p-8 h-full max-h-[850px] overflow-hidden">
+        <h3 className="text-3xl font-medium mb-4 uppercase tracking-wider">
         ...
-        <div className="space-y-6">
+        <div className="space-y-3 overflow-hidden">
```

### 3.4 TasksColumn - Limit displayed tasks

In the render loop, slice tasks:
```diff
-        {tasks.map((task: any) => (
+        {tasks.slice(0, 8).map((task: any) => (
```

### 3.5 src/components/widgets/FrenchNewsWidget.tsx

```diff
-    <div className="bg-[#2B2930] rounded-2xl p-8 h-full overflow-y-auto">
+    <div className="bg-[#2B2930] rounded-2xl p-6 h-full max-h-[400px] overflow-hidden">
```

### 3.6 FrenchColumn - Clamp French news section height

```diff
-      <div className="bg-[#2B2930] rounded-2xl p-6 min-h-[400px] overflow-hidden">
+      <div className="bg-[#2B2930] rounded-2xl p-6 h-full max-h-[450px] overflow-hidden">
```

---

## 4. Acceptance Criteria

| Criteria | Verification |
|----------|--------------|
| **No scrollbars** | At 3840×2160, no vertical or horizontal scrollbars visible in any column |
| **Ticker visible** | News ticker visible at bottom, scrolling animation works |
| **4 equal-width columns** | Grid displays 4 columns of equal width |
| **Content fits** | No content cutoff that looks broken; acceptable: fewer list items than typical |
| **Header visible** | Clock, date, weather, stocks all visible |
| **All widgets render** | Sports, tasks, French, market all display content |

### Visual Checkpoints

1. **Full viewport screenshot** at 3840×2160 shows:
   - Header with clock/date (top)
   - 4 columns (middle)
   - Ticker (bottom)
   - No scrollbars anywhere

2. **Content verification**:
   - Top Stories shows 4 rotating headlines
   - Task lists show up to 8 items each
   - French column shows countdown, weather, phrase, conjugation, news
   - Market shows 3 indices (SPY, QQQ, DIA)

---

## 5. Test Plan

### 5.1 Browser DevTools Validation

1. Open browser DevTools (F12)
2. Click device toggle or set custom viewport:
   - Width: `3840`
   - Height: `2160`
3. Verify:
   - No scrollbars on any element
   - Body/html has `overflow: hidden`
   - Main element has `overflow: hidden`
4. Screenshot the full viewport

### 5.2 Manual Inspection Checklist

- [ ] Clock shows correct time
- [ ] Date displays correctly
- [ ] Weather widget shows current weather
- [ ] Stocks show 3 indices with values
- [ ] Column 1: Sports + Top Stories visible
- [ ] Column 2: Task lists visible (up to 8 each)
- [ ] Column 3: French content (countdown, phrase, etc.)
- [ ] Column 4: Market indices
- [ ] Ticker scrolls at bottom
- [ ] No scrollbars anywhere

### 5.3 API Sanity Check

```bash
# Verify all endpoints return valid data
curl -s http://localhost:3000/api/top-stories | head -c 500
curl -s http://localhost:3000/api/reminders | head -c 500
curl -s http://localhost:3000/api/weather | head -c 500
curl -s http://localhost:3000/api/stocks | head -c 500
curl -s http://localhost:3000/api/sports | head -c 500
curl -s http://localhost:3000/api/french-news | head -c 500
```

All should return JSON without errors.

### 5.4 Build Verification

```bash
cd /home/jpwolf00/.openclaw/workspace/home-hub
npm run build
```

Must succeed with no TypeScript errors.

---

## Summary

| Change | File | Impact |
|--------|------|--------|
| `overflow-auto` → `overflow-hidden` | page.tsx (main) | Eliminates page scroll |
| Add `max-h` caps | page.tsx (widgets) | Prevents content overflow |
| `overflow-y-auto` → `overflow-hidden` | FrenchNewsWidget.tsx | Removes internal scroll |
| Limit task display to 8 | page.tsx (TasksColumn) | Prevents task list overflow |
| Reduce padding | Various | Maximizes available space |

The key principle: **limit content count + cap heights + hide overflow** = zero scroll.
