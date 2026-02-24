import { NextResponse } from 'next/server'
import axios from 'axios'

interface Match {
  id: number
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  status: string
  date: string
  league: string
  isHome?: boolean
}

const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY || ''

// Team configurations
const TEAMS: Record<string, { name: string; logo: string }> = {
  'Chelsea': { name: 'Chelsea', logo: '🔵' },
  'PSG': { name: 'Paris SG', logo: '🔴🔵' },
  'Monaco': { name: 'Monaco', logo: '🔴' },
  'Wrexham': { name: 'Wrexham', logo: '🐉' },
  'Kentucky': { name: 'Kentucky', logo: '🔵' },
  'Burnley': { name: 'Burnley', logo: '🟣' },
  'Wycombe': { name: 'Wycombe', logo: '🟡' },
}

// ESPN League endpoints (primary - no API key)
const ESPN_LEAGUES = [
  { id: 'eng.1', name: 'Premier League', sport: 'soccer' },
  { id: 'fra.1', name: 'Ligue 1', sport: 'soccer' },
  { id: 'uefa.champions', name: 'Champions League', sport: 'soccer' },
  { id: 'eng.2', name: 'Championship', sport: 'soccer' },
  { id: 'usa.22', name: 'US League One', sport: 'soccer' },
]

const MBB_LEAGUE = { id: 'mens-college-basketball', name: 'NCAA Basketball' }

// Teams we care about
const INTERESTING_TEAMS = [
  'Chelsea', 'Paris SG', 'PSG', 'Wrexham',
  'USA', 'United States', 'USMNT', 'USA Women', 'USWNT',
  'Kentucky',
]

export async function GET() {
  try {
    // Try ESPN first (primary - no API key)
    const espnData = await fetchESPNData()
    if (espnData && espnData.length > 0) {
      return NextResponse.json(espnData)
    }
  } catch (error) {
    console.error('ESPN fetch failed:', error)
  }

  // Fallback: football-data.org
  if (FOOTBALL_DATA_KEY) {
    try {
      const footballData = await fetchFootballData(FOOTBALL_DATA_KEY)
      if (footballData && footballData.length > 0) {
        return NextResponse.json(footballData)
      }
    } catch (error) {
      console.error('Football-data.org fetch failed:', error)
    }
  }

  // Final fallback: local schedule
  return NextResponse.json(getLocalSchedule())
}

async function fetchESPNData(): Promise<Match[]> {
  const matches: Match[] = []
  const today = new Date()
  
  // Get past 7 days and next 7 days for comprehensive game list
  const dates: string[] = []
  for (let i = 7; i >= 1; i--) {
    dates.push(formatESPNDate(new Date(today.getTime() - i * 24 * 60 * 60 * 1000)))
  }
  dates.push(formatESPNDate(today)) // today
  for (let i = 1; i <= 7; i++) {
    dates.push(formatESPNDate(new Date(today.getTime() + i * 24 * 60 * 60 * 1000)))
  }

  // Fetch soccer leagues
  for (const league of ESPN_LEAGUES) {
    for (const date of dates) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard?dates=${date}`
        const response = await axios.get(url, { timeout: 5000 })
        const events = response.data?.events || []
        
        events.forEach((event: any) => {
          const competitors = event.competitions?.[0]?.competitors || []
          const home = competitors.find((c: any) => c.homeAway === 'home')
          const away = competitors.find((c: any) => c.homeAway === 'away')
          
          if (!home || !away) return
          
          const homeTeam = home.team?.shortDisplayName || home.team?.name
          const awayTeam = away.team?.shortDisplayName || away.team?.name
          
          // Skip Louisville - not our team
          if (homeTeam === 'Louisville' || awayTeam === 'Louisville') {
            return
          }
          
          // Check if interesting team
          const isInteresting = INTERESTING_TEAMS.some(t => homeTeam?.includes(t) || awayTeam?.includes(t))
          if (!isInteresting) {
            return
          }
          
          const status = event.status?.type?.state || 'SCHEDULED'
          const isFinished = event.status?.type?.completed === true || status === 'post' || status === 'final'
          const isLive = status === 'in' || status === 'live'
          
          matches.push({
            id: parseInt(event.id) || Math.random() * 100000,
            homeTeam,
            awayTeam,
            homeScore: home.score ? parseInt(home.score) : null,
            awayScore: away.score ? parseInt(away.score) : null,
            status: isFinished ? 'FINISHED' : isLive ? 'LIVE' : status.toUpperCase(),
            date: event.date,
            league: event.competitions?.[0]?.league?.name || league.name,
            isHome: true,
          })
        })
      } catch (error) {
        // Continue to next
      }
    }
  }

  // Fetch college basketball
  for (const date of dates) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/${MBB_LEAGUE.id}/scoreboard?dates=${date}`
      const response = await axios.get(url, { timeout: 5000 })
      const events = response.data?.events || []
      
      events.forEach((event: any) => {
        const competitors = event.competitions?.[0]?.competitors || []
        const home = competitors.find((c: any) => c.homeAway === 'home')
        const away = competitors.find((c: any) => c.homeAway === 'away')
        
        if (!home || !away) return
        
        const homeTeam = home.team?.shortDisplayName || home.team?.name
        const awayTeam = away.team?.shortDisplayName || away.team?.name
        
        // Skip Louisville - not our team
        if (homeTeam === 'Louisville' || awayTeam === 'Louisville') {
          return
        }
        
        // Check for Kentucky or other teams we care about
        const isInteresting = INTERESTING_TEAMS.some(t => homeTeam?.includes(t) || awayTeam?.includes(t))
        if (!isInteresting) {
          return
        }
        
        const status = event.status?.type?.state || 'SCHEDULED'
        const isFinished = event.status?.type?.completed === true || status === 'post' || status === 'final'
        const isLive = status === 'in' || status === 'live'
        
        matches.push({
          id: parseInt(event.id) || Math.random() * 100000,
          homeTeam,
          awayTeam,
          homeScore: home.score ? parseInt(home.score) : null,
          awayScore: away.score ? parseInt(away.score) : null,
          status: isFinished ? 'FINISHED' : isLive ? 'LIVE' : status.toUpperCase(),
          date: event.date,
          league: MBB_LEAGUE.name,
          isHome: true,
        })
      })
    } catch (error) {
      // Continue
    }
  }

  // After collecting all matches, filter and limit
  const filteredMatches = matches.filter(m => {
    // Exclude Georgia and Auburn explicitly
    const isExcluded = m.homeTeam === 'Georgia' || m.awayTeam === 'Georgia' ||
                       m.homeTeam === 'Auburn' || m.awayTeam === 'Auburn';
    return !isExcluded;
  });

  // Split into upcoming and finished
  const upcoming = filteredMatches
    .filter(m => m.status !== 'FINISHED' && m.status !== 'post' && m.status !== 'final')
    .sort((a, b) => {
      // LIVE games first, then by date
      const aLive = a.status === 'LIVE' || a.status === 'IN';
      const bLive = b.status === 'LIVE' || b.status === 'IN';
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .slice(0, 7);

  const finished = filteredMatches
    .filter(m => m.status === 'FINISHED' || m.status === 'post' || m.status === 'final')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return [...upcoming, ...finished]
}

async function fetchFootballData(apiKey: string): Promise<Match[]> {
  const matches: Match[] = []
  const today = new Date().toISOString().split('T')[0]
  const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const COMPETITIONS = {
    premier: 2021,
    faCup: 2024,
    champions: 2001,
    leagueOne: 2016,
  }

  const teamIds = [15, 524, 1012, 2624]

  const results = await Promise.allSettled([
    axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.premier}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      params: { dateFrom: today, dateTo: twoWeeksLater },
    }),
    axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.faCup}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      params: { dateFrom: today, dateTo: twoWeeksLater },
    }),
    axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.champions}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      params: { dateFrom: today, dateTo: twoWeeksLater },
    }),
    axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.leagueOne}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      params: { dateFrom: today, dateTo: twoWeeksLater },
    }),
  ])

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const compMatches = result.value.data.matches || []
      compMatches.forEach((m: any) => {
        if (teamIds.includes(m.homeTeam.id) || teamIds.includes(m.awayTeam.id)) {
          matches.push({
            id: m.id,
            homeTeam: m.homeTeam.shortName,
            awayTeam: m.awayTeam.shortName,
            homeScore: m.score.fullTime.home ?? null,
            awayScore: m.score.fullTime.away ?? null,
            status: m.status,
            date: m.utcDate,
            league: m.competition.name,
            isHome: true,
          })
        }
      })
    }
  })

  return matches
}

function formatESPNDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function getLocalSchedule() {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  const getDate = (daysOffset: number, hour: number = 15, minute: number = 0) => {
    const d = new Date(now)
    d.setDate(d.getDate() + daysOffset)
    d.setHours(hour, minute, 0, 0)
    return d.toISOString()
  }

  const getPastDate = (daysAgo: number, hour: number = 15, minute: number = 0) => {
    const d = new Date(now)
    d.setDate(d.getDate() - daysAgo)
    d.setHours(hour, minute, 0, 0)
    return d.toISOString()
  }

  const kentuckyGames = [
    { opponent: 'Florida', days: 6, time: [19, 0] },
  ]

  const chelseaGames = [
    { opponent: 'Burnley', days: 4, time: [15, 0] },
    { opponent: 'Arsenal', days: 8, time: [11, 30] },
  ]

  const psgGames = [
    { opponent: 'Monaco', days: 2, time: [20, 0] },
    { opponent: 'Lille', days: 5, time: [20, 0] },
  ]

  const wrexhamGames = [
    { opponent: 'Bristol City', days: 1, time: [19, 45] },
    { opponent: 'Wycombe', days: 5, time: [15, 0] },
    { opponent: 'Oxford', days: 9, time: [15, 0] },
  ]

  const schedule: Match[] = []
  let id = 1
  const currentTime = new Date()

  const isFuture = (dateStr: string) => new Date(dateStr) > currentTime

  kentuckyGames.forEach(g => {
    const date = getDate(g.days, g.time[0], g.time[1])
    if (!isFuture(date)) return
    schedule.push({
      id: id++,
      homeTeam: 'Kentucky',
      awayTeam: g.opponent,
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date,
      league: 'NCAA Basketball',
      isHome: true,
    })
  })

  chelseaGames.forEach(g => {
    const date = getDate(g.days, g.time[0], g.time[1])
    if (!isFuture(date)) return
    schedule.push({
      id: id++,
      homeTeam: 'Chelsea',
      awayTeam: g.opponent,
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date,
      league: 'Premier League',
      isHome: true,
    })
  })

  psgGames.forEach(g => {
    const date = getDate(g.days, g.time[0], g.time[1])
    if (!isFuture(date)) return
    schedule.push({
      id: id++,
      homeTeam: 'PSG',
      awayTeam: g.opponent,
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date,
      league: g.opponent === 'Monaco' ? 'Champions League' : 'Ligue 1',
      isHome: true,
    })
  })

  wrexhamGames.forEach(g => {
    const date = getDate(g.days, g.time[0], g.time[1])
    if (!isFuture(date)) return
    schedule.push({
      id: id++,
      homeTeam: 'Wrexham',
      awayTeam: g.opponent,
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date: getDate(g.days, g.time[0], g.time[1]),
      league: 'League One',
      isHome: g.days !== 0,
    })
  })

  const finishedGames = [
    { home: 'Chelsea', away: 'Liverpool', homeScore: 2, awayScore: 1, daysAgo: 0, time: [15, 0], league: 'Premier League' },
    { home: 'PSG', away: 'Monaco', homeScore: 3, awayScore: 0, daysAgo: 0, time: [20, 0], league: 'Champions League' },
    { home: 'Kentucky', away: 'Tennessee', homeScore: 78, awayScore: 65, daysAgo: 1, time: [19, 0], league: 'NCAA Basketball' },
    { home: 'Wrexham', away: 'Bristol City', homeScore: 1, awayScore: 1, daysAgo: 1, time: [15, 0], league: 'League One' },
  ]

  finishedGames.forEach(g => {
    schedule.push({
      id: id++,
      homeTeam: g.home,
      awayTeam: g.away,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      status: 'FINISHED',
      date: getPastDate(g.daysAgo, g.time[0], g.time[1]),
      league: g.league,
    })
  })

  return schedule
}
