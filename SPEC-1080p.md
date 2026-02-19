# Dashboard 1080p Optimization Spec

## Overview
Optimize the home-hub dashboard for 1080p (1920x1080) resolution on Raspberry Pi 3 with FullPageOS. Reduce vertical space usage while maintaining readability and information density.

## Target Display
- **Resolution**: 1920x1080 (Full HD)
- **Device**: Raspberry Pi 3 with FullPageOS
- **Viewing Distance**: ~6-10 feet (wall-mounted display)

---

## Vertical Space Allocation

| Section | Current | Proposed | Savings |
|---------|---------|----------|---------|
| Header | ~180px | ~110px | 70px |
| Main Grid Padding | 176px (p-6 + pb-32) | 48px (p-3) | 128px |
| Card Internal Padding | 24-32px | 12-16px | ~16px |
| Ticker | 100px (h-20 + mb-5) | 52px (h-12 + mb-2) | 48px |
| **Total** | ~556px | ~258px | **~298px** |

---

## Exact Tailwind Classes

### Header Section
```
header:
  - px-6 py-4 (reduced from px-12 py-8)
  - flex items-center justify-between

Clock:
  - text-5xl (reduced from text-8xl)
  - font-mono tracking-tight font-medium

Date:
  - text-xl (reduced from text-3xl)
  - font-medium

Weather Widget:
  - Container: gap-4 (reduced from gap-8)
  - Icon: text-4xl (reduced from text-7xl)
  - Temp: text-3xl (reduced from text-5xl)
  - Description: text-base (reduced from text-2xl)
  - City: text-sm (reduced from text-lg)
  - Vertical separator: h-12 (reduced from h-20)
  - Forecast gap: gap-4 (reduced from gap-8)
  - Forecast text: text-sm (reduced from text-lg/3xl)
  - Forecast days: min-w-[50px] (reduced from min-w-[70px])

Stocks Widget:
  - Container gap: gap-4 (reduced from gap-6)
  - Label: text-xs (reduced from text-lg)
  - Price: text-base (reduced from text-xl)
  - Change: text-xs (reduced from text-sm)
```

### Main Grid
```
main:
  - gap-3 (reduced from gap-6)
  - p-3 (reduced from p-6)
  - pb-6 (reduced from pb-32) - CRITICAL FIX
  - grid-template-columns: repeat(4, 1fr) (explicit, not auto-fit)
```

### Card Base Styles
```
Cards (all widgets):
  - p-3 to p-4 (reduced from p-6 to p-8)
  - rounded-xl (reduced from rounded-2xl)
```

### French Column Specific
```
Paris Trip Countdown:
  - p-4 (reduced from p-6)
  - Title: text-base (reduced from text-xl)
  - Numbers: text-3xl (reduced from text-5xl)
  - Labels: text-xs (reduced from text-lg)
  - Gap: gap-4 (reduced from gap-8)

Paris Time/Weather:
  - p-4 (reduced from p-6)
  - Title: text-base (reduced from text-xl)
  - Time: text-2xl (reduced from text-4xl)
  - Weather icon: text-2xl (reduced from text-4xl)

French Phrase:
  - p-4 (reduced from p-6)
  - Title: text-base (reduced from text-xl)
  - French text: text-3xl (reduced from text-5xl)
  - Pronunciation: text-lg (reduced from text-2xl)
  - English: text-base (reduced from text-xl)

Verb Conjugation:
  - p-4 (reduced from p-6)
  - Title: text-sm (reduced from text-lg)
  - Verb: text-lg (reduced from text-2xl)
  - Conjugation: text-sm (reduced from text-lg)
  - English: text-xs (reduced from text-md)

French News:
  - min-h-[200px] (reduced from min-h-[400px])
```

### Sports Column
```
Container:
  - p-4 (reduced from p-8)
  - gap-4 (reduced from gap-8)

Title: text-base (reduced from text-2xl)
Date/Time: text-sm (reduced from text-xl)
Team names: text-base (reduced from text-2xl)

Top Stories:
  - p-4 (reduced from p-8)
  - Title: text-base (reduced from text-2xl)
  - Gap: gap-3 (reduced from gap-6)
  - Thumbnail: w-20 h-14 (reduced from w-28 h-20)
  - Story title: text-sm (reduced from text-2xl)
  - Category tag: text-xs (reduced from text-sm)
```

### Tasks Column
```
Container:
  - p-4 (reduced from p-8)
  - gap-4 (reduced from gap-6)

Title: text-lg (reduced from text-3xl)
Checkbox: w-5 h-5 (reduced from w-8 h-8)
Task text: text-base (reduced from text-2xl)
```

### Market Column
```
Container:
  - p-4 (reduced from p-8)
  - gap-4 (reduced from gap-8)

Title: text-base (reduced from text-2xl)
Index labels: text-xl (reduced from text-3xl)
Index prices: text-xl (reduced from text-3xl)
Index change: text-base (reduced from text-2xl)
Border: border-b-1 (reduced from border-b-2)
```

### Home Network Widget
```
Container:
  - p-3 (reduced from p-5)

Title: text-base (reduced from text-2xl)
Server name: text-base (reduced from text-2xl)
Status text: text-xs (reduced from text-sm)
Bar labels: text-xs
Grid gap: gap-2 (reduced from gap-4)
```

### News Ticker
```
Container:
  - h-12 (reduced from h-20) = 48px
  - mb-2 (reduced from mb-5) = 8px
  - Total: 56px (reduced from 100px)
  - px-4 (reduced from px-8)
  - border-t-1 (reduced from border-t-2)
  - text-base (reduced from text-2xl)
```

---

## Font Size Summary

| Element | Current | Proposed | Reduction |
|---------|---------|----------|-----------|
| Clock | 8xl (96px) | 5xl (60px) | -36px |
| Date | 3xl (48px) | xl (24px) | -24px |
| Weather temp | 7xl (84px) | 4xl (36px) | -48px |
| Weather desc | 2xl (36px) | base (16px) | -20px |
| Card titles | 2xl-3xl | base-lg | -24px |
| Body text | 2xl | base-sm | -18px |

---

## Acceptance Criteria

1. **No Vertical Scroll** - All content fits within 1080px viewport height
2. **4-Column Layout** - Grid displays exactly 4 columns on 1920px width
3. **Readable Text** - All text legible from 6-10 feet (minimum text-base/16px)
4. **Ticker Visible** - News ticker visible at bottom without cutting off
5. **No Content Overflow** - No cards clipped or truncated
6. **Consistent Spacing** - Uniform gaps and padding throughout

### Test Commands
```bash
# Check viewport meta tag in layout
grep -i "viewport" src/app/layout.tsx

# Build test
npm run build

# Start dev server and test at 1920x1080
npm run dev
```

---

## Test Plan

### 1. Visual Verification (Browser DevTools)
1. Open dashboard in Chrome/Edge
2. Open DevTools (F12)
3. Toggle Device Toolbar (Ctrl+Shift+M)
4. Select "1920x1080" or custom 1920x1080
5. Verify:
   - [ ] Header fully visible (clock, weather, stocks)
   - [ ] All 4 columns visible without horizontal scroll
   - [ ] No content cut off at bottom
   - [ ] News ticker visible at bottom
   - [ ] No vertical scrollbar

### 2. CSS Validation
```javascript
// In browser console
const h = document.documentElement.scrollHeight;
const vh = window.innerHeight;
console.log(`Scroll: ${h}, Viewport: ${vh}, Fits: ${h <= vh}`);
```

### 3. Build Verification
```bash
cd /home/jpwolf00/.openclaw/workspace/home-hub
npm run build
# Should complete with no errors
```

### 4. Production Deployment Test
After deploying to Coolify:
1. Access via Raspberry Pi browser at 1920x1080 resolution
2. Verify no scrollbars appear
3. Check all widgets render correctly
4. Confirm ticker scrolls at bottom

---

## Implementation Notes

1. **Grid Template** - Use explicit `repeat(4, 1fr)` instead of `auto-fit` to ensure exactly 4 columns
2. **Viewport Units** - Consider using `calc(100vh - XXXpx)` for problematic containers
3. **Overflow Hidden** - Add `overflow-hidden` to main container as safety measure
4. **Ticker Animation** - Ensure CSS animation still works with reduced height
5. **Test on Pi** - Final verification must happen on actual Raspberry Pi 3

---

## Files to Modify

1. `/home/jpwolf00/.openclaw/workspace/home-hub/src/app/page.tsx` - Main layout (all changes above)
2. Consider updating `src/app/globals.css` if custom CSS animations need adjustment for reduced height
