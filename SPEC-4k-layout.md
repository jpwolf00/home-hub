# 4K Dashboard Layout Specification

## Target Resolution: 3840x2160

---

## Vertical Space Calculation

### Total: 2160px

| Section | Current | Required for 4K |
|---------|---------|----------------|
| Header | `px-8 py-4` | `px-8 py-6` (increase for 4K scale) |
| Main Grid | `p-8 pb-24 gap-6` | `p-8 pb-8 gap-6` (reduce bottom padding) |
| Ticker | `h-14` (56px) | `h-16` (64px) |
| **Total** | **~2200px (scroll)** | **2160px (exact fit)** |

### Exact Calculation

```
2160px total viewport
- 192px header (py-6 = 24px × 2 = 48px + content ~144px)
- 1808px main content area
  - 32px top padding (p-8)
  - 32px bottom padding (p-8)
  - 72px gaps (gap-6 × 3 = 18px × 4 columns = but only 3 gaps)
    Actually: gap-6 = 24px, for 4 columns = 3 gaps = 72px
  - Content height: 1808 - 32 - 32 - 72 = 1672px content area
- 64px ticker (h-16)
----------------------------------
= 2160px exact
```

---

## Grid Configuration

### Current (causing issues)
```tsx
gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
```

### Required for 4K
```tsx
gridTemplateColumns: 'repeat(4, 1fr)'
```

This ensures exactly 4 columns at 4K resolution instead of auto-fitting based on content.

---

## Code Changes Required in page.tsx

### 1. Header Section
**Current:**
```tsx
<header className="flex items-center justify-between px-8 py-4 border-b-2" ...>
```

**Required:**
```tsx
<header className="flex items-center justify-between px-8 py-6 border-b-2" ...>
```

### 2. Main Grid Section
**Current:**
```tsx
<main className="flex-1 grid gap-6 p-8 pb-24" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
```

**Required:**
```tsx
<main className="flex-1 grid gap-6 p-8 pb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
```

### 3. News Ticker Section
**Current:**
```tsx
<div className="news-ticker bg-[#2A1212] border-t-2 border-red-500/30 h-14 px-8 flex items-center overflow-hidden ticker">
```

**Required:**
```tsx
<div className="news-ticker bg-[#2A1212] border-t-2 border-red-500/30 h-16 px-8 flex items-center overflow-hidden ticker">
```

---

## Tailwind Classes Summary

| Component | Current Class | New Class |
|-----------|---------------|------------|
| Header | `px-8 py-4` | `px-8 py-6` |
| Main Grid | `p-8 pb-24 gap-6` | `p-8 pb-8 gap-6` |
| Grid Columns | `auto-fit, minmax(320px, 1fr)` | `repeat(4, 1fr)` |
| Ticker | `h-14` | `h-16` |

---

## Implementation Notes

1. **py-6** adds 8px more vertical padding per side (16px total) to header, accommodating larger 4K text elements
2. **pb-8** (was pb-24) removes 64px of bottom padding from main grid
3. **h-16** adds 8px more height to ticker for better visibility at 4K
4. **repeat(4, 1fr)** locks exactly 4 columns regardless of content, proper for 4K landscape

---

## Testing Checklist

- [ ] No vertical scrollbar at 3840x2160
- [ ] News ticker visible at bottom of screen
- [ ] 4 equal-width columns
- [ ] All widgets readable without scrolling
- [ ] Header properly sized with clock/date visible
