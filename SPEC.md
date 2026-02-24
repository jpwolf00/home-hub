# HH-010: French Dashboard Improvements

## Overview

Create a unified French learning section that combines vocabulary, verb conjugations, and question words into a cohesive, well-organized widget. The new French widget should replace the current separate FrenchWidget.tsx and inline verb conjugation sections.

## Current State

- **FrenchWidget.tsx**: Contains ~89 travel French phrases with translations
- **page.tsx**: Contains VERB_CONJUGATIONS array with ~20 common French verbs
- **Issue**: Sections are separate and verb conjugations are being pushed off screen

## Requirements

### 1. Unified French Learning Widget

**Replace both current sections with a single, cohesive FrenchWidget component that includes:**

#### A. Vocabulary Section (200 words/phrases)

Expand from current ~89 phrases to **200 vocabulary items** covering:

- **Basics (20)**: Greetings, common expressions
- **Getting Around (30)**: Directions, transportation, locations
- **Food & Drink (30)**: Restaurant phrases, food items
- **Shopping (25)**: Bargaining, sizes, payments
- **Emergency & Health (15)**: Medical, help phrases
- **Social (40)**: Introductions, conversation starters
- **Business (20)**: Work, professional phrases
- **Travel (20)**: Booking, sightseeing phrases

#### B. Question Words Section (15 words)

Add a dedicated section with French question words and translations:

- Qui (Who) - /ki/
- Qu'est-ce que (What) - /kɛs k/
- Quoi (What) - /kwɑ/
- Où (Where) - /u/
- Quand (When) - /kɑ̃/
- Pourquoi (Why) - /pwar kwi/
- Comment (How) - /kɔmɑ̃/
- Combien (How much) - /kɔ̃ bjɛ̃/
- Quel/Quelle (Which) - /kɛl/
- Lequel/Quelle (Which one)
- Quelque chose (Something) - /kɛlk ʃoz/
- Aujourd'hui (Today) - /o-ʒuʁ-dɥi/
- Demain (Tomorrow) - /dəmɛ̃/
- Hier (Yesterday) - /iʁ/
- Quelle heure (What time) - /kɛl œʁ/

#### C. Verb Conjugation Section (20 verbs)

Keep current VERB_CONJUGATIONS with enhanced presentation:

- être (to be)
- avoir (to have)
- aller (to go)
- faire (to do/make)
- venir (to come)
- voir (to see)
- savoir (to know - facts)
- connaître (to know - people)
- vouloir (to want)
- pouvoir (to can/may)
- devoir (must/have to)
- dire (to say/tell)
- parler (to speak)
- manger (to eat)
- boire (to drink)
- prendre (to take)
- partir (to leave)
- arriver (to arrive)
- rester (to stay)
- faire attention (to pay attention)

**Enhancement**: Improve verb table presentation to prevent scrolling issues

### 2. UI/UX Improvements

#### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  ✈️ French Learning (200 phrases + 20 verbs + 15    │
│  question words)                                    │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐│
│  │  🔢 Vocabulary Progress                         ││
│  │  200 / 200 items complete ✓                     ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │  🇫🇷 Question Words (15 words)                   ││
│  │  [Qui] - [Qu'est-ce que] - [Où] - [Quand]...    ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │  📝 Verb Conjugations (20 verbs)                ││
│  │  être: je suis, tu es, il/elle est, etc.       ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

#### Interactive Features

- **Tabs navigation**: Switch between Vocabulary, Question Words, and Verb Conjugations
- **Progress indicator**: Show completion percentage (200/200 words)
- **Scrollable content**: Each section should be scrollable independently
- **Auto-rotation**: Change content every 30 seconds (not 60s)
- **Paris trip countdown**: Keep existing countdown (May 9, 2026)

#### Responsive Design

- Tablet: 3 columns (Vocabulary | Question Words | Verbs)
- Desktop: Single column with vertical scrolling
- Mobile: Single column with compact tabs

### 3. Technical Implementation

#### Component Structure

```typescript
// src/components/widgets/FrenchWidget.tsx
interface FrenchPhrase {
  french: string;
  english: string;
  pronunciation?: string; // Optional hint
  category?: string; // For grouping
}

interface FrenchQuestion {
  word: string;
  english: string;
  pronunciation: string;
}

interface FrenchVerb {
  verb: string;
  present: string;
  english: string;
}

// Component hierarchy
FrenchWidget
  ├── ParisTripCountdown
  ├── NavigationTabs
  │   ├── VocabularyTab
  │   ├── QuestionWordsTab
  │   └── VerbConjugationsTab
  ├── VocabularySection
  ├── QuestionWordsSection
  └── VerbConjugationsSection
```

#### Data Organization

- Keep all data in single file (FrenchWidget.tsx)
- Organize data by category with clear comments
- Use enums/types for better code structure

#### Styling Requirements

- Maintain existing color scheme (#2B2930 background, white text, primary colors)
- Use consistent spacing and typography
- Add hover effects on interactive elements
- Ensure good contrast ratios
- Support night mode

### 4. Migration Plan

1. Create new FrenchWidget component with all requirements
2. Update imports in page.tsx to use new FrenchWidget
3. Remove old FrenchWidget.tsx (or keep as backup)
4. Test all functionality
5. Verify responsive behavior

## Acceptance Criteria

- [ ] Single French widget component with tabs navigation
- [ ] 200 vocabulary items across 8 categories
- [ ] 15 question words with pronunciation
- [ ] 20 verb conjugations with improved layout
- [ ] Paris trip countdown preserved
- [ ] Progress indicator (200/200)
- [ ] Auto-rotation every 30 seconds
- [ ] No scrolling issues
- [ ] Responsive design (tablet/desktop/mobile)
- [ ] Night mode compatible
- [ ] Clean, modern UI

## Dependencies

- React 18+ (existing)
- Tailwind CSS (existing)
- No external dependencies required

## Estimated Effort

- **Development**: 4-6 hours
- **Testing**: 2-3 hours
- **Total**: 6-9 hours

## Notes

- Maintain all existing French features (Paris countdown)
- Keep pronunciation hints for question words
- Ensure accessibility (ARIA labels, keyboard navigation)
- Test on multiple screen sizes