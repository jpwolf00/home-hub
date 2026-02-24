# Home Hub Dashboard - Design Review

**Date:** 2025-02-22  
**Context:** 4-column always-on dashboard for 4K TV display  
**Focus Areas:** French Column Layout, Header Distribution, Pi Performance Mode

---

## 1. French Column Design (Column 3)

### Current Implementation Analysis

The implementation plan proposes replacing the tab-based FrenchWidget with a **vertical stack layout** showing all sections at once:

1. Paris Trip Countdown + Paris Time/Weather (combined)
2. Tourist Vocabulary (rotating phrases)
3. Essential Verb Conjugations
4. Question Words (static grid)

### Recommendation: ✅ **Proceed with Vertical Stack + Auto-Rotation**

**Why vertical stack over tabs/accordion:**

| Approach | Pros | Cons | TV Suitability |
|----------|------|------|----------------|
| **Vertical Stack** (Proposed) | All content glanceable; no interaction needed | Risk of visual clutter | ⭐⭐⭐⭐⭐ |
| **Tabs** (Current) | Clean, focused view | Requires interaction to see all content | ⭐⭐⭐ |
| **Accordion** | Collapsible sections | Requires interaction; animation overhead | ⭐⭐ |
| **Continuous Scroll** | All content accessible | Content hidden off-screen; requires scrolling | ⭐⭐⭐ |

**For an always-on TV display, the goal is zero-interaction information consumption.** The vertical stack achieves this best.

### Design Improvements for TV Viewing

#### Font Sizing for 4K TV Distance

Current proposed sizes may be too small for comfortable TV viewing (typically 6-10 feet):

| Element | Current Size | Recommended Size | Rationale |
|---------|-------------|------------------|-----------|
| Countdown numbers | `text-xl` (~20px) | `text-3xl` (~30px) | Hero element, needs prominence |
| French phrase | `text-2xl` (~24px) | `text-4xl` (~36px) | Primary learning content |
| Pronunciation | `text-base` (~16px) | `text-xl` (~20px) | Secondary but important |
| English translation | `text-base` (~16px) | `text-xl` (~20px) | Reference text |
| Question words | `text-sm` (~14px) | `text-lg` (~18px) | Grid items, smaller acceptable |

#### Material Design 3 Card Consistency

Current cards use `#2B2930` background which aligns with MD3 Surface color. Recommendations:

```css
/* Consistent card styling */
.french-card {
  background: #2B2930;           /* Surface container */
  border-radius: 16px;            /* MD3 large radius */
  padding: 16px;                  /* Comfortable TV touch targets */
  border: 1px solid rgba(255,255,255,0.08); /* Subtle elevation */
}
```

#### Visual Hierarchy Improvements

```
┌─────────────────────────────────────┐
│ ✈️ PARIS TRIP                       │ ← Section label (small, muted)
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │  42  │ │  12  │ │  34  │         │ ← Large numbers (primary)
│ │ Days │ │ Hrs  │ │ Min  │         │ ← Labels (tiny, muted)
│ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────┤
│ 🗼 14:32    ☀️ 68°F                │ ← Secondary info, smaller
├─────────────────────────────────────┤
│ 🗣️ PHRASES (23/200)                 │
│                                     │
│   Bonjour                           │ ← 36px (main content)
│   [bohn-ZHOOR]                      │ ← 20px (pronunciation)
│   Hello                             │ ← 20px (translation)
│                                     │
├─────────────────────────────────────┤
│ 📝 VERBS (5/20)                     │
│   aller (to go)                     │
│   je vais, tu vas...                │
├─────────────────────────────────────┤
│ ❓ QUESTIONS                        │
│ Qui? - Who    Quoi? - What          │ ← 2-column grid
│ Où? - Where   Quand? - When         │
└─────────────────────────────────────┘
```

#### Section Sizing Strategy

Proportional heights for 1080p/4K display:

```
Countdown/Time:    ~15% (compact hero)
Phrases:           ~35% (primary focus, largest text)
Verbs:             ~25% (secondary learning)
Questions:         ~25% (reference, always visible)
```

Use `flex-[1.5]` for phrases section to give it more prominence.

---

## 2. Header Layout

### Current vs Proposed

```
CURRENT:                           PROPOSED (4-column grid):
┌────────────────────────────────┐ ┌────────────────────────────────┐
│ [Date]  [Clock]      [GAP]     │ │ [Date]  [Clock] [Stocks] [Wx]  │
│                      [Stocks]  │ │   ↓        ↓       ↓      ↓    │
│                      [Weather] │ │  left   center  center  right  │
└────────────────────────────────┘ └────────────────────────────────┘
```

### Recommendation: ✅ **Proceed with 4-Column Grid**

The 4-column grid creates visual rhythm that mirrors the main content grid below. This is excellent for TV.

#### Alternative Considerations

| Layout | Pros | Cons | Best For |
|--------|------|------|----------|
| **4-Column Grid** (Proposed) | Visual harmony with main grid; even spacing | May feel spread out at 4K | General dashboard |
| **3-Column (Date/Center/Status)** | Clock prominent center; traditional | Uneven information density | Clock-focused displays |
| **2-Column Split** | Simple; classic header | Doesn't use horizontal space | Smaller screens |
| **Floating Widgets** | Dynamic; modern | Harder to scan quickly | Interactive displays |

**TV-Specific Considerations:**

1. **Safe Zones**: Keep critical info within 90% of screen center (avoid TV overscan edges)
2. **Scanning Pattern**: Users scan TV in "Z" pattern - top-left to top-right, diagonal to bottom-left
3. **Brightness**: Header shouldn't be brightest element (avoid drawing eye away from content)

#### Improved Header Implementation

```tsx
<header className="grid grid-cols-4 gap-4 px-12 py-8">
  {/* Date - aligned left, quieter */}
  <div className="flex items-center justify-start">
    <DateDisplay className="text-2xl text-white/80" />
  </div>
  
  {/* Clock - centered, hero element */}
  <div className="flex items-center justify-center">
    <Clock className="text-7xl font-bold" />
  </div>
  
  {/* Stocks - centered, compact */}
  <div className="flex items-center justify-center">
    <HeaderStocksWidget />
  </div>
  
  {/* Weather - aligned right */}
  <div className="flex items-center justify-end">
    <WeatherWidget compact />
  </div>
</header>
```

**Weather Widget for Header:**
Consider a compact mode that shows only: `☀️ 72°F Louisville` instead of the full 7-day forecast. Full forecast can be an expanded view or moved to a dedicated weather column.

---

## 3. Pi Performance Mode & TV Optimizations

### Current Animation/Refresh Strategy

| Component | Current Refresh | Animation | Pi Impact |
|-----------|----------------|-----------|-----------|
| Clock | 1 second | None | Low |
| News Ticker | 5 min | CSS marquee | **High** |
| French rotation | 30-45 sec | None | Low |
| Weather | 10 min | None | Medium |
| Stocks | 5 min | None | Low |
| Sports | 5 min | None | Low |

### Recommendation: ✅ **Implement Low-Power Mode with Careful Tuning**

#### Animation Alternatives for Pi

**News Ticker Options:**

```
OPTION 1: Static (Recommended for Pi)
┌─────────────────────────────────────────┐
│ BREAKING: Market up 2% • Weather...     │ ← Truncate with ellipsis
└─────────────────────────────────────────┘

OPTION 2: Fade Transition
- Show headline for 10 seconds
- Cross-fade to next headline
- No continuous movement

OPTION 3: Page Indicator
┌─────────────────────────────────────────┐
│ Headline text here...              ●○○  │ ← Dots show position
└─────────────────────────────────────────┘
```

**Implementation:**

```typescript
// Low-power ticker
function LowPowerTicker({ items }: { items: string[] }) {
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % items.length);
    }, 10000); // Change every 10 seconds
    return () => clearInterval(interval);
  }, [items.length]);
  
  return (
    <div className="bg-red-950/30 border-t border-red-500/20 h-14 px-8 
                    flex items-center overflow-hidden">
      <span className="text-lg text-white/90 truncate">
        {items[index]}
      </span>
      <span className="ml-4 text-white/40">
        {index + 1}/{items.length}
      </span>
    </div>
  );
}
```

#### Color Contrast for TV Viewing

TV screens have different contrast characteristics than monitors:

| Element | Current | Recommended | WCAG AA TV* |
|---------|---------|-------------|-------------|
| Primary text | `text-white` | Keep | ✅ Pass |
| Secondary text | `text-white/70` | `text-white/85` | ✅ Better |
| Muted text | `text-white/50` | `text-white/70` | ✅ Better |
| Success (green) | `text-green-400` | `#4ADE80` | ✅ Pass |
| Error (red) | `text-red-400` | `#F87171` | ✅ Pass |

*TV viewing distances and lighting require higher contrast than desktop.

**Specific Recommendations:**

```css
/* Current - may be hard to read from distance */
.text-white\/50     /* Too muted for TV */
.text-white\/30     /* Nearly invisible */

/* Recommended for TV */
.text-white\/90     /* Primary content */
.text-white\/75     /* Secondary content */
.text-white\/60     /* Tertiary/muted */
```

#### Remote Control / Touch Targets

Since this is for TV display, consider:

1. **Focus Indicators**: If navigable via remote, add visible focus rings:
   ```css
   .focus-visible\:ring-2:focus-visible {
     ring: 2px solid #60A5FA;
     ring-offset: 2px;
   }
   ```

2. **Minimum Touch Target**: 48x48dp (even for mouse/remote navigation)

3. **Tab Navigation Order**: Ensure logical flow:
   ```
   Header → Column 1 → Column 2 → Column 3 → Column 4 → Ticker
   ```

#### Refresh Interval Strategy

```typescript
const REFRESH_INTERVALS = {
  // Normal mode
  normal: {
    clock: 1000,        // 1 second
    weather: 10 * 60 * 1000,   // 10 minutes
    stocks: 5 * 60 * 1000,     // 5 minutes
    sports: 5 * 60 * 1000,     // 5 minutes
    news: 5 * 60 * 1000,       // 5 minutes
    reminders: 5 * 60 * 1000,  // 5 minutes
  },
  // Low-power mode
  lowPower: {
    clock: 1000,        // Keep 1s (essential)
    weather: 30 * 60 * 1000,   // 30 minutes
    stocks: 15 * 60 * 1000,    // 15 minutes
    sports: 15 * 60 * 1000,    // 15 minutes
    news: 15 * 60 * 1000,      // 15 minutes
    reminders: 15 * 60 * 1000, // 15 minutes
  }
};
```

---

## 4. Implementation Checklist

### French Widget
- [ ] Increase font sizes (36px for phrases, 30px for countdown)
- [ ] Combine countdown + Paris time into single compact header
- [ ] Use proportional flex sizing (phrases: 1.5x, others: 1x)
- [ ] Ensure question words grid is 2-column, readable from distance
- [ ] Add subtle borders between sections for visual separation

### Header
- [ ] Implement 4-column grid layout
- [ ] Create compact WeatherWidget variant for header
- [ ] Ensure Date is prominent but not competing with Clock
- [ ] Test alignment at both 1080p and 4K resolutions

### Pi Performance
- [ ] Create `LowPowerTicker` component with fade/transition
- [ ] Implement refresh interval config object
- [ ] Increase contrast ratios for all text elements
- [ ] Test CPU usage with `htop` during normal vs low-power mode
- [ ] Consider disabling weather icons if using animated SVGs

### Accessibility
- [ ] Verify all text meets WCAG AA contrast (4.5:1 for normal, 3:1 for large)
- [ ] Add `prefers-reduced-motion` media query support
- [ ] Ensure focus indicators visible for keyboard navigation

---

## 5. Quick Wins (Priority Order)

1. **Increase French phrase font size** - Biggest readability improvement
2. **Implement 4-column header** - Clean, immediate visual improvement
3. **Add low-power ticker** - Essential for Pi stability
4. **Bump contrast ratios** - Better TV visibility
5. **Combine Paris countdown + time** - Cleaner French column header

---

## Appendix: Reference Resolutions

| Display | Resolution | Font Scale | Notes |
|---------|-----------|------------|-------|
| 1080p TV | 1920x1080 | 1.0x | Baseline |
| 4K TV | 3840x2160 | 1.5-2.0x | Primary target |
| 720p (Pi) | 1280x720 | 0.85x | Minimum support |

**Testing Recommendation:** Test at 1080p scaled to 150% to simulate 4K viewing distance.
