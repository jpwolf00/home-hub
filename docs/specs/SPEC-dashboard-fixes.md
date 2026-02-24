# SPEC: Home Hub Dashboard Fixes

## Overview
Fix sports team filtering, French column layout, header spacing, and add Pi performance mode to the Home Hub dashboard.

## User Story
As a user viewing the Home Hub dashboard on a 4K display and Raspberry Pi, I want to see only my teams' games, have a clean French learning column, evenly-spaced header widgets, and smooth performance on low-power devices.

## Acceptance Criteria

### Sports Widget (Column 1)
- [ ] Upcoming games shows maximum 6-7 games, sorted by soonest date first
- [ ] Latest scores shows maximum 6-7 games, sorted by most recent first  
- [ ] ONLY shows games involving user's teams: Chelsea, PSG, Wrexham, USA Men's Soccer, USA Women's Soccer, Kentucky Basketball, Kentucky Football
- [ ] Georgia and Auburn removed from team configurations
- [ ] No games involving other teams (Arsenal, Liverpool, etc.) appear

### French Column (Column 3)
- [ ] Single vertical stack layout from top to bottom:
  1. Paris trip countdown + Paris time/weather (polished UX)
  2. Vocabulary: Tourist phrases with pronunciation + English translation
  3. Verb conjugations: Essential tourist verbs
  4. Question words section
- [ ] No code duplication (consolidate FrenchWidget/FrenchColumn)
- [ ] No overlap with news ticker
- [ ] Clean Material Design 3 card styling
- [ ] Uses full column height appropriately

### News Column (Column 4)
- [ ] Top Stories widget takes maximum 60% of column height
- [ ] French News widget takes remaining ~40% of column height
- [ ] No overlap with news ticker

### Header
- [ ] Even distribution: Date | Clock | Stocks | Weather
- [ ] No large blank space between time and stocks
- [ ] Widgets aligned and evenly spaced

### Pi Performance Mode
- [ ] Environment variable `NEXT_PUBLIC_LOW_POWER=true` detected
- [ ] Framer Motion animations disabled when low power mode active
- [ ] Refresh intervals reduced (10 min instead of 5 min)
- [ ] News ticker is static instead of scrolling
- [ ] Fonts and spacing appropriate for TV viewing distance

## Technical Design

### Files to Modify

1. **`/api/sports/route.ts`**
   - Update `INTERESTING_TEAMS` array with correct team names
   - Remove Georgia and Auburn from `TEAMS` config
   - Add USA team name variations for matching
   - Limit ESPN results to 6-7 games per section
   - Sort upcoming by date ascending, latest by date descending

2. **`src/app/page.tsx`**
   - Remove inline `FrenchColumn` function
   - Replace with `<FrenchWidget />` component usage
   - Fix header layout: redistribute flexbox spacing
   - Add Pi mode detection and Framer Motion conditional
   - Reduce refresh intervals based on mode

3. **`src/components/widgets/FrenchWidget.tsx`**
   - Expand to include all French learning sections
   - Add pronunciation guides to vocabulary
   - Organize into vertical sections: Countdown, Vocabulary, Verbs, Questions
   - Remove duplicate countdown code

4. **`src/components/widgets/FrenchNewsWidget.tsx`**
   - Adjust to fit 40% column height constraint
   - Verify no ticker overlap

5. **`.env.example`**
   - Add `NEXT_PUBLIC_LOW_POWER=false` documentation

### Data Flow
```
Sports API → Filter by YOUR_TEAMS → Limit 6-7 → Sort → Display
French Widget → Vertical sections → Rotate content → Display
Header → Even flex distribution → Display
```

### Layout Structure
```
Header: [Date] [Clock] [Stocks] [Weather] (evenly spaced)

Main Grid (4 columns):
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Column 1       │  Column 2       │  Column 3       │  Column 4       │
│  Sports         │  Tasks          │  French         │  News           │
│                 │                 │                 │                 │
│  ┌───────────┐  │  ┌───────────┐  │  ┌───────────┐  │  ┌───────────┐  │
│  │ Upcoming  │  │  │ Work      │  │  │ Paris     │  │  │ Top Stories│  │
│  │ 6-7 games │  │  │ Tasks     │  │  │ Countdown │  │  │ 60% height│  │
│  └───────────┘  │  └───────────┘  │  ├───────────┤  │  └───────────┘  │
│  ┌───────────┐  │  ┌───────────┐  │  │ Vocabulary│  │  ┌───────────┐  │
│  │ Latest    │  │  │ Personal  │  │  ├───────────┤  │  │ French News│  │
│  │ Scores    │  │  │ Tasks     │  │  │ Verbs     │  │  │ 40% height│  │
│  │ 6-7 games │  │  └───────────┘  │  ├───────────┤  │  └───────────┘  │
│  └───────────┘  │                 │  │ Questions │  │                 │
│                 │                 │  └───────────┘  │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
[Ticker - full width, no overlap]
```

## Implementation Subtasks

1. **Fix Sports API** (`/api/sports/route.ts`)
   - [ ] Update INTERESTING_TEAMS with correct USA team variations
   - [ ] Remove Georgia and Auburn from TEAMS object
   - [ ] Add Kentucky Football team matching
   - [ ] Limit results to 6-7 per section with proper sorting
   - [ ] Test filtering works correctly

2. **Consolidate French Widget** (`FrenchWidget.tsx`)
   - [ ] Add all vocabulary sections (phrases, verbs, questions)
   - [ ] Include pronunciation in brackets
   - [ ] Add Paris time/weather section at top
   - [ ] Ensure countdown uses same date
   - [ ] Style with consistent Material Design 3 cards

3. **Fix Page Layout** (`page.tsx`)
   - [ ] Remove FrenchColumn function
   - [ ] Replace with <FrenchWidget /> in Column 3
   - [ ] Fix header flexbox to evenly distribute widgets
   - [ ] Adjust Column 4 heights (60% / 40% split)

4. **Add Pi Performance Mode**
   - [ ] Create `useLowPowerMode()` hook or helper
   - [ ] Conditionally disable Framer Motion
   - [ ] Adjust refresh intervals based on mode
   - [ ] Make ticker static in low power mode
   - [ ] Update .env.example

5. **Test & Deploy**
   - [ ] Verify sports only shows user teams
   - [ ] Check French column layout
   - [ ] Confirm header spacing
   - [ ] Test Pi mode with env var
   - [ ] Deploy to Apps VM

## Definition of Done

- [ ] Code builds without errors (`npm run build`)
- [ ] Sports API returns only 7 teams' games (Chelsea, PSG, Wrexham, USA Men, USA Women, Kentucky BB, Kentucky FB)
- [ ] French column displays all 4 sections vertically without overlap
- [ ] Header widgets evenly spaced with no large gaps
- [ ] Pi mode disables animations when enabled
- [ ] Deployed to Apps VM (192.168.85.205) via Operator agent
- [ ] Reviewer validates all acceptance criteria met

## Test Plan

1. **Sports Filtering Test**
   - Call `/api/sports` endpoint
   - Verify only user teams appear
   - Confirm Georgia/Auburn games excluded
   - Check max 6-7 games per section

2. **French Layout Test**
   - Open dashboard at 1920x1080 and 4K resolutions
   - Verify all 4 French sections visible
   - Confirm no ticker overlap
   - Check Paris countdown accurate

3. **Header Test**
   - Measure spacing between widgets
   - Verify no large blank spaces
   - Check responsive at different widths

4. **Pi Mode Test**
   - Set `NEXT_PUBLIC_LOW_POWER=true`
   - Restart app
   - Verify no animations
   - Check static ticker
   - Verify reduced refresh intervals

5. **End-to-End Test**
   - Deploy to Apps VM
   - Access via browser
   - Verify all functionality works

## Security Considerations

- No hardcoded secrets in docker-compose
- Environment variables for sensitive config
- SSH key authentication for deployments

## Notes

- Use existing French vocabulary data from `french-data.ts`
- Maintain Material Design 3 color scheme
- ESPN API is primary (no key), football-data.org is fallback
- Keep existing auto-refresh logic, just adjust intervals for Pi mode
