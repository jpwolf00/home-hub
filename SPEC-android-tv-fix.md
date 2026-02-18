# SPEC.md - Android TV Dashboard Display Fix

## Problem Summary
The Home Hub dashboard displays correctly on Mac mini browsers but shows a mobile-like/broken view on Android TV using Fully Kiosk Browser on a 4K display.

## Root Cause Analysis

### Primary Issue: Viewport Width Mismatch
Fully Kiosk Browser on Android TV reports a **narrow viewport width** (typically 360px-960px) even on 4K displays because:
1. Android TV devices often use a fixed logical DPI that doesn't match the physical resolution
2. Fully Kiosk defaults to "device width" scaling which compresses the viewport
3. The Android WebView on TV hardware may report mobile-like dimensions

### Current Code Analysis
- **layout.tsx**: Uses standard viewport meta tag: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`
- **page.tsx**: Uses responsive grid: `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))`

The grid layout is correct, but with a narrow viewport (e.g., 360px), `minmax(320px, 1fr)` forces a single-column mobile layout because 320px > 360px/2.

### What Was Already Tried
1. ❌ Viewport meta tag with `width=1920` — didn't work (too rigid)
2. ❌ Viewport meta tag with `width=device-width` — didn't work (reports narrow width)
3. ⚠️ Auto-fit grid — not yet tested properly

## Recommended Solution

### Option A: CSS-First Approach (Recommended)
Keep the responsive grid but force a minimum viewport width that works for TV displays. Add to `globals.css`:

```css
/* Force a minimum viewport width for TV-like displays */
@supports (width: 100vw) {
  html {
    min-width: 1280px;
  }
}

/* Alternatively, use container queries or force landscape orientation */
@media (orientation: landscape) and (min-aspect-ratio: 16/9) {
  /* Ensure grid columns expand properly on TV */
  main {
    grid-template-columns: repeat(4, 1fr) !important;
  }
}
```

Or modify the grid in page.tsx to be more explicit for large displays:

```tsx
// In page.tsx - use explicit columns for large screens
style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}
// Or for TV specifically:
style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
```

### Option B: Viewport Meta Tag Fix
Change the viewport in `layout.tsx` to:

```tsx
export const metadata: Metadata = {
  // ... existing
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, target-densityDpi=device-dpi',
}
```

**Note**: `target-densityDpi=device-dpi` helps on some Nexus Player/Android TV devices but isn't guaranteed to work on all.

### Option C: Fully Kiosk Configuration (Critical)
The issue is likely **Fully Kiosk settings**, not code. Configure these settings in Fully Kiosk:

| Setting | Recommended Value | Purpose |
|---------|-------------------|---------|
| **Use Wide Viewport** | ✅ ON | Respects webpage's viewport meta tag properly |
| **Load in Overview Mode** | ❌ OFF | Prevents downscaling to device width |
| **Initial Scale** | 100% | Use actual device resolution |
| **Enable Zoom** | ❌ OFF | Prevents user from breaking layout |
| **Graphics Acceleration** | Hardware | Better rendering for CSS |

### Option D: JavaScript Detection (Fallback)
Add viewport detection and adjustment in the client:

```tsx
// In page.tsx - detect and handle narrow viewports
useEffect(() => {
  const isTV = window.innerWidth < 800 && window.innerHeight > 500;
  if (isTV) {
    document.body.style.minWidth = '1280px';
  }
}, []);
```

## Acceptance Criteria

### Must Pass
- [ ] Dashboard displays in **4-column layout** on 4K Android TV
- [ ] Each widget is large and readable from ~10 feet (TV viewing distance)
- [ ] Clock displays at minimum 4rem (64px) font size
- [ ] Weather icon/temp clearly visible
- [ ] No horizontal scrolling
- [ ] Grid columns are equal-width or appropriately sized

### Visual Checkpoints
1. **Header**: Clock should be ~96px (text-8xl), date ~36px, stocks/weather visible
2. **Grid**: 4 columns visible, not 1-2 columns
3. **No overflow**: No horizontal scrollbar, no cut-off content
4. **Readability**: Text readable from 10+ feet

## Alternative Browsers to Consider

If Fully Kiosk continues to have issues, these browsers may work better:

| Browser | Pros | Cons |
|---------|------|------|
| **TV Bro** | Open source, TV-optimized | Less configuration |
| **Puffin TV** | Cloud rendering option | May have latency |
| **Kiwi Browser** | Chrome-based, many features | Not TV-optimized UI |

## Recommended Next Steps

1. **First**: Adjust Fully Kiosk settings (Option C) — this is most likely to fix the issue without code changes
2. **Second**: Add CSS fix (Option A) as a fallback
3. **Third**: Test on actual TV hardware, not just browser dev tools

## Testing Procedure

1. Open Fully Kiosk Browser on Android TV
2. Navigate to http://192.168.85.202:3000
3. Take a screenshot
4. Verify: 4 columns, large text, no horizontal scroll
5. If failing, check Fully Kiosk settings under "Web Zoom and Scaling"

---

**Recommendation**: Start with **Option C (Fully Kiosk Configuration)** — it's the simplest fix and addresses the most common cause. If that doesn't work, combine with **Option A (CSS fix)** for a robust solution.
