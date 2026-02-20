// ScoreEvent model - normalized across all providers
export type ScoreEvent = {
  id: string; // stable id (source + event id)
  sport: 'soccer' | 'mbb';
  league: string; // e.g., "Premier League"
  dateUtc: string; // ISO
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  homeLogo?: string | null;
  awayLogo?: string | null;
  source: 'espn' | 'rapidapi';
  sourceEventId?: string; // raw id
};

// Cache format
export type ScoresCache = {
  generatedAtUtc: string;
  forDate: string; // YYYY-MM-DD
  sources: {
    espn: { ok: boolean; fetchedAtUtc?: string; error?: string };
    rapidapi: { ok: boolean; fetchedAtUtc?: string; error?: string };
  };
  events: ScoreEvent[];
};

// Teams of interest for fallback logic
export const TEAMS_OF_INTEREST = [
  'Chelsea',
  'PSG',
  'Paris SG',
  'Paris Saint-Germain',
  'Wrexham',
  'Kentucky',
];

// ESPN league configurations
export const ESPN_LEAGUES: { id: string; name: string; sport: 'soccer' | 'mbb' }[] = [
  { id: 'eng.1', name: 'Premier League', sport: 'soccer' },
  { id: 'fra.1', name: 'Ligue 1', sport: 'soccer' },
  { id: 'uefa.champions', name: 'Champions League', sport: 'soccer' },
  { id: 'eng.3', name: 'League One', sport: 'soccer' }, // Wrexham
  { id: 'mens-college-basketball', name: 'NCAA Basketball', sport: 'mbb' },
];
