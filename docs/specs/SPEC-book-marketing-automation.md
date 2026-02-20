# SPEC — Book Marketing Plan + Automated Workflow (Hal)

## Project
**Book:** *Finding Space: A Soccer Guide for American Sports Fans*  
**Website:** https://findingspacebook.com/  
**Retail:** KDP / Amazon

## 1) Positioning (Approved)
Do **not** position as tactics-only.

### Core Position
**"Soccer fluency for Americans"** — helps readers understand:
1. How to watch the game (tactics/match reading)
2. How football works as a business (transfers/team-building)
3. How fan culture works (identity/chants/community)
4. How soccer is evolving in the U.S.

### Target Segments
- **Primary:** curious U.S. sports fans new to soccer
- **Secondary:** hardcore fans who recommend the book to friends/family

## 2) Business Goals (90-day)
1. Increase qualified traffic to findingspacebook.com
2. Increase click-throughs from site to Amazon listing
3. Build owned audience (email list)
4. Build repeatable content engine with human approval checkpoints

## 3) Funnel
1. Social post / community contribution
2. Website landing (interactive concept clip/page)
3. CTA to Amazon KDP page
4. Optional email opt-in for companion updates
5. Weekly nurture + soft CTA

## 4) Channel + Account Architecture
## Must-have
1. X/Twitter account (author/book branded)
2. Reddit author account (value-first, no spam)
3. Email platform + capture form on website

## Optional phase 2
4. YouTube Shorts / TikTok (animation clips)
5. Instagram Reels/Carousel
6. LinkedIn (sports business/culture angle)

## Naming + Profile Guidance
Use consistent handle where possible: `FindingSpaceBook`.
Bio pattern: “Soccer fluency for American fans — tactics, business, culture, and the U.S. game.”

## 5) Content Pillars
1. **Watch Better** (rules, shapes, offside, match-reading)
2. **Business of Football** (transfers, squad building, incentives)
3. **Fan Culture** (club identity, rituals, chants, fandom psychology)
4. **U.S. Soccer Context** (MLS/global pathways, growth, friction points)

## 6) Weekly Content Mix
- 3 short posts (quick insights)
- 1 thread/deep post
- 1 personal/author story post
- 1 conversion post (book + site CTA)

### Ratio
- 70% educational value
- 20% culture/business perspective
- 10% direct promotion

## 7) Agent Workflow on Hal
Use existing multi-agent pipeline with explicit marketing roles.

## 7.1 Agents + Personas
### A) `marketing-strategist` (new)
- Persona: audience researcher + campaign planner
- Responsibilities:
  - Monthly campaign themes
  - Weekly plan + KPI targets
  - Segment-specific messaging (primary vs secondary audience)

### B) `content-studio` (new)
- Persona: editorial producer
- Responsibilities:
  - Draft posts, threads, captions, newsletter drafts
  - Adapt one core idea into multi-platform variants
  - Attach source chapter/pillar tags

### C) `community-operator` (new)
- Persona: human, respectful community participant
- Responsibilities:
  - Draft Reddit replies and X engagement responses
  - Enforce anti-spam rules
  - Flag sensitive interactions for Jason approval

### D) `distribution-ops` (new)
- Persona: scheduler + QA gatekeeper
- Responsibilities:
  - Queue approved posts
  - Validate link correctness and UTM tags
  - Execute posting windows

### E) `analytics-auditor` (new)
- Persona: performance analyst
- Responsibilities:
  - Daily/weekly performance rollups
  - Detect content winners/losers
  - Recommend next-week adjustments

> Implementation note: these can be separate agent IDs or handled initially as role prompts in existing architect/implementer/reviewer structure.

## 7.2 Control Points (Human-in-the-loop)
Jason approval required for:
1. First 2 weeks of all outbound posts
2. Any direct promotional claim
3. Any controversial/cultural hot-take content
4. Any Reddit post with direct book link
5. Any change in posting frequency >25%

Auto-approved after confidence threshold (later):
- low-risk educational posts with no explicit sales claim

## 7.3 Guardrails
- No fake/incentivized reviews
- No automated DM spam
- No astroturfing in communities
- Respect subreddit rules and self-promo policies
- Always disclose author affiliation when relevant

## 8) Automation Design
## 8.1 Recurring Jobs (Cron)
1. **Weekly Plan Job** (Sun evening)
   - Input: prior week analytics
   - Output: week plan + draft content bundle
2. **Daily Draft Job** (morning)
   - Output: same-day suggested post(s)
3. **Daily Performance Job** (night)
   - Pull metrics + anomalies
4. **Weekly Retro Job** (Sat)
   - Winner patterns + next-week recommendations

## 8.2 Workflow States
`idea -> draft -> review -> approved -> scheduled -> published -> measured -> iterated`

## 8.3 Storage
- Content calendar: `/mnt/hal-openclaw/workspace/home-hub/docs/marketing/calendar/`
- Draft bank: `/mnt/hal-openclaw/workspace/home-hub/docs/marketing/drafts/`
- Metrics exports: `/mnt/hal-openclaw/workspace/home-hub/docs/marketing/metrics/`
- Weekly reports: `/mnt/hal-openclaw/workspace/home-hub/docs/marketing/reports/`

## 9) KPI Dashboard Requirements
## Top-level KPIs
1. Website sessions from social
2. Animation engagement (views/time-on-interactive pages)
3. Clicks to Amazon (CTA CTR)
4. Email signups
5. Post engagement rate by platform

## Diagnostic KPIs
- By pillar (Watch Better vs Business vs Culture vs U.S.)
- By segment lane (new fans vs hardcore-referrer content)
- By format (short post/thread/video)

## 10) Phase Plan
## Phase 1 (Weeks 1-2): Setup + baseline
- Account setup and profile optimization
- Tracking/UTM setup
- First 2-week calendar + manual approval mode

## Phase 2 (Weeks 3-6): Controlled automation
- Daily drafts and scheduled publishing
- Weekly retros
- Tight human approvals remain

## Phase 3 (Weeks 7-12): Scale winners
- Increase output for top-performing pillars/formats
- Introduce optional short-video channel
- Relax approval for low-risk educational posts

## 11) Deliverables
1. Channel playbook (X, Reddit, Email)
2. Prompt library (pillar-specific)
3. 30-day content calendar
4. Approval rubric + escalation policy
5. Weekly reporting template

## 12) Acceptance Criteria
1. Weekly content produced and reviewed on schedule
2. No policy violations/spam incidents
3. Dashboard shows KPI trends by pillar and channel
4. Clear evidence of iteration based on analytics
5. Jason can pause/override at any stage

## 13) Immediate Next Tasks for Hal
1. Architect: translate this into execution architecture + job specs
2. Implementer: create folder structure, templates, and cron scaffolding
3. Reviewer: validate guardrails and approval gates before first post
4. Main: present first 14-day calendar for Jason approval
