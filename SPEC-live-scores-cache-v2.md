# SPEC-live-scores-cache-v2.md

## Goal
Provide **real finished scores** (no mocks) for the dashboard while keeping upstream usage minimal.

- **Primary source:** ESPN “site.api” scoreboard endpoints (no key)
- **Fallback source:** RapidAPI endpoints (keyed)
- **Caching:** refresh **once/day** for **yesterday** only; dashboard reads from local cache only
- **Resilience:** if refresh fails, keep last good cache and mark it **stale**

This spec is designed to be incremental and low-risk.

---

## Data Sources

### A) ESPN (primary)
Undocumented but widely used endpoints.

#### Soccer scoreboards (examples)
Use `dates=YYYYMMDD`.

- Premier League:
  - `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=YYYYMMDD`
- Ligue 1:
  - `https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard?dates=YYYYMMDD`
- UEFA Champions League:
  - `https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard?dates=YYYYMMDD`

(We can add more leagues later; initial list covers Chelsea/PSG + European matches. Wrexham may require EFL League One endpoint if needed.)

#### Men’s college basketball scoreboard
- `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=YYYYMMDD`


### B) RapidAPI (fallback)
Used only if ESPN fails/misses required teams.

#### Football (scheduled events by date)
- `GET https://sportapi7.p.rapidapi.com/api/v1/sport/football/scheduled-events/YYYY-MM-DD`
Headers:
- `x-rapidapi-host: sportapi7.p.rapidapi.com`
- `x-rapidapi-key: $RAPIDAPI_KEY`

#### Men’s college basketball scoreboard
- `GET https://mens-college-basketball-mbb.p.rapidapi.com/scoreboard?year=YYYY&month=MM&day=DD&group=50`
Headers:
- `x-rapidapi-host: mens-college-basketball-mbb.p.rapidapi.com`
- `x-rapidapi-key: $RAPIDAPI_KEY`

---

## Normalized Model

### `ScoreEvent`
```ts
type ScoreEvent = {
  id: string;                 // stable id (source + event id)
  sport: 'soccer' | 'mbb';
  league: string;             // e.g., "Premier League"
  dateUtc: string;            // ISO
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;

  homeLogo?: string | null;
  awayLogo?: string | null;

  source: 'espn' | 'rapidapi';
  sourceEventId?: string;     // raw id
};
```

### Mapping notes

#### ESPN mapping (common)
- Events: `data.events[]`
- ID: `event.id`
- Date/time: `event.date` (ISO)
- Status:
  - `event.status.type.state` or `event.status.type.name`
  - Map to FINISHED when `event.status.type.completed === true`
- Teams + scores:
  - `event.competitions[0].competitors[]`
  - `homeAway` indicates home/away
  - score: `Number(competitor.score)` (string)
  - logo: `competitor.team.logo`
- League label:
  - `data.leagues[0].name` or `event.leagues`/`event.season` depending on endpoint

#### sportapi7 RapidAPI mapping
- Events: `events[]`
- ID: `event.id`
- Date/time: from `startTimestamp` (seconds) → ISO
- Status: `event.status.type` (`finished`, `inprogress`, etc.)
- Teams:
  - `homeTeam.name`, `awayTeam.name`
- Score:
  - `homeScore.current`, `awayScore.current`
- League:
  - `event.tournament.uniqueTournament.name`
- Logos:
  - Not guaranteed; use existing local logo mapping fallback.

#### MBB RapidAPI mapping
- Events: `events[]`
- ID: `event.id`
- Date/time: `event.date` (ISO)
- Status: `event.competitions[0].status.type.completed`
- Teams/scores:
  - `competitions[0].competitors[]`
  - score: `Number(competitor.score)`
  - logo: `competitor.team.logo`

---

## Cache Design

### Storage
Store JSON under an app-writable path.

Recommended: `home-hub/data/scores-cache.json` (mounted persistent volume in Coolify) OR Next.js-friendly `./data/` directory.

### Cache format
```json
{
  "generatedAtUtc": "2026-02-19T06:05:00.000Z",
  "forDate": "2026-02-18",
  "sources": {
    "espn": {"ok": true, "fetchedAtUtc": "..."},
    "rapidapi": {"ok": false, "error": "..."}
  },
  "events": [ /* ScoreEvent[] */ ]
}
```

### Retention
Keep last **7 days** (either in one file keyed by date, or 7 files). Start with single-file “yesterday only” for simplicity.

---

## Refresh Strategy (Once/Day)

### When
Run once per day (e.g., **06:10 America/New_York**) to fetch **yesterday**.

### How to enforce once/day
Server-side guard:
- If cache already has `forDate === yesterday` and `generatedAtUtc` is today → do nothing.

### Failure behavior
- If ESPN fails: attempt RapidAPI.
- If both fail: keep last cache unchanged and set `sources.*.ok=false` + error.

---

## API Endpoints (Home Hub)

1) `GET /api/scores`
- Returns cached `ScoreEvent[]` + metadata.

2) `POST /api/scores/refresh` (protected)
- Runs refresh logic (with once/day guard)
- For manual triggers.

---

## Fallback Policy

1. Fetch ESPN for configured leagues.
2. Filter to teams of interest (Chelsea, PSG, Wrexham, Kentucky).
3. If any team-of-interest has **0 finished games** for yesterday from ESPN, allow a RapidAPI fallback call for that sport.

This keeps RapidAPI usage near-zero while maintaining coverage.

---

## UI Integration

- Update **Latest Scores** widget to call `/api/scores`.
- Show:
  - date (localized)
  - logos (use provided logo URLs; if missing, fall back to local logo map)
  - most recent finished first
  - if cache is stale, show subtle `STALE` label.

---

## Secrets / Config

Coolify env vars:
- `RAPIDAPI_KEY`

Optional:
- `SCORES_CACHE_PATH` (default to `./data/scores-cache.json`)

Security note: API key was shared in chat; rotate it after initial wiring.

---

## Acceptance Criteria

- Latest Scores displays **real finished games only** (no mock data)
- No RapidAPI calls during normal dashboard refreshes
- Refresh runs at most **once/day** per sport
- Stale-safe: if refresh fails, dashboard still shows last cached results + stale indicator

---

## Test Plan (Reviewer)

1) Build:
- `npm run build`

2) Local API sanity:
- `curl http://<app>/api/scores` returns JSON with events.

3) Refresh behavior:
- `POST /api/scores/refresh` once → updates cache
- Call again same day → no new upstream fetch (verify via logs/metadata)

4) Live validation:
- Deployed app shows scores with logos + dates
- If upstream fails, app still renders cached data
