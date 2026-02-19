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

const API_KEY = process.env.FOOTBALL_DATA_API_KEY || ''

// Team configurations with logos
const TEAMS: Record<string, { name: string; logo: string; isHome?: (team: string) => boolean }> = {
  'Chelsea': { name: 'Chelsea', logo: '🔵' },
  'PSG': { name: 'Paris SG', logo: '🔴🔵' },
  'Monaco': { name: 'Monaco', logo: '🔴' },
  'Wrexham': { name: 'Wrexham', logo: '🐉' },
  'Kentucky': { name: 'Kentucky', logo: '🔵' },
  'Georgia': { name: 'Georgia', logo: '🔴' },
  'Auburn': { name: 'Auburn', logo: '🟠' },
  'Burnley': { name: 'Burnley', logo: '🟣' },
  'Wycombe': { name: 'Wycombe', logo: '🟡' },
}

// Competition IDs to fetch
const COMPETITIONS = {
  premier: 2021,   // Premier League
  faCup: 2024,      // FA Cup
  champions: 2001,  // Champions League
  leagueCup: 2013, // Carabao Cup
  Ligue1: 2019,     // Ligue 1
  leagueOne: 2016, // League One (Wrexham)
}

export async function GET() {
  // If no API key, return local schedule
  if (!API_KEY) {
    return NextResponse.json(getLocalSchedule())
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const matches: any[] = []

    // Fetch from all competitions in parallel
    const results = await Promise.allSettled([
      axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.premier}/matches`, {
        headers: { 'X-Auth-Token': API_KEY },
        params: { dateFrom: today, dateTo: twoWeeksLater },
      }),
      axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.faCup}/matches`, {
        headers: { 'X-Auth-Token': API_KEY },
        params: { dateFrom: today, dateTo: twoWeeksLater },
      }),
      axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.champions}/matches`, {
        headers: { 'X-Auth-Token': API_KEY },
        params: { dateFrom: today, dateTo: twoWeeksLater },
      }),
      axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.leagueOne}/matches`, {
        headers: { 'X-Auth-Token': API_KEY },
        params: { dateFrom: today, dateTo: twoWeeksLater },
      }),
    ])

    // Process all matches - filter to teams we care about
    const teamIds = [15, 524, 1012, 2624] // Chelsea, PSG, Wrexham, Kentucky (NCAA)
    
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
              isHome: true, // API doesn't easily tell us, default to home for now
            })
          }
        })
      }
    })

    return NextResponse.json(matches.length > 0 ? matches : getLocalSchedule())
  } catch (error) {
    console.error('Sports API error:', error)
    return NextResponse.json(getLocalSchedule())
  }
}

function getLocalSchedule() {
  // Dynamic schedule - generates upcoming matches based on current date
  // Also includes FINISHED games for Latest Scores widget testing
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  // Generate dates dynamically
  const getDate = (daysOffset: number, hour: number = 15, minute: number = 0) => {
    const d = new Date(now)
    d.setDate(d.getDate() + daysOffset)
    d.setHours(hour, minute, 0, 0)
    return d.toISOString()
  }

  // Get past date for FINISHED games
  const getPastDate = (daysAgo: number, hour: number = 15, minute: number = 0) => {
    const d = new Date(now)
    d.setDate(d.getDate() - daysAgo)
    d.setHours(hour, minute, 0, 0)
    return d.toISOString()
  }

  // UK Wildcats Basketball (SEC) - typically Wed/Sat
  const kentuckyGames = [
    { opponent: 'Georgia', days: 1, time: [21, 0] },    // Tomorrow (tonight)
    { opponent: 'Auburn', days: 4, time: [21, 0] },       // Sat
    { opponent: 'Florida', days: 6, time: [19, 0] },   // Mon
  ]

  // Chelsea - Premier League matches
  const chelseaGames = [
    { opponent: 'Burnley', days: 4, time: [15, 0] },    // Sat
    { opponent: 'Arsenal', days: 8, time: [11, 30] },   // Wed
  ]

  // PSG - Ligue 1
  const psgGames = [
    { opponent: 'Monaco', days: 2, time: [20, 0] },     // Thu (Champions League)
    { opponent: 'Lille', days: 5, time: [20, 0] },       // Sun
  ]

  // Wrexham - League One
  const wrexhamGames = [
    { opponent: 'Bristol City', days: 1, time: [19, 45] }, // Tomorrow
    { opponent: 'Wycombe', days: 5, time: [15, 0] },     // Sun
    { opponent: 'Oxford', days: 9, time: [15, 0] },       // Thu
  ]

  const schedule: Match[] = []
  let id = 1
  const currentTime = new Date()

  // Helper to check if game is in the future
  const isFuture = (dateStr: string) => new Date(dateStr) > currentTime

  // Add Kentucky games
  kentuckyGames.forEach(g => {
    const date = getDate(g.days, g.time[0], g.time[1])
    if (!isFuture(date)) return // Skip past games
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

  // Add Chelsea games
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

  // Add PSG games
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

  // Add Wrexham games
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

  // Add FINISHED games for Latest Scores testing
  const finishedGames = [
    { home: 'Chelsea', away: 'Liverpool', homeScore: 2, awayScore: 1, daysAgo: 0, time: [15, 0], league: 'Premier League' },
    { home: 'PSG', away: 'Monaco', homeScore: 3, awayScore: 0, daysAgo: 0, time: [20, 0], league: 'Champions League' },
    { home: 'Kentucky', away: 'Tennessee', homeScore: 78, awayScore: 65, daysAgo: 1, time: [19, 0], league: 'NCAA Basketball' },
    { home: 'Wrexham', away: 'Bristol City', homeScore: 1, awayScore: 1, daysAgo: 1, time: [15, 0], league: 'League One' },
    { home: 'Arsenal', away: 'Newcastle', homeScore: 2, awayScore: 0, daysAgo: 2, time: [16, 0], league: 'Premier League' },
    { home: 'Manchester City', away: 'Tottenham', homeScore: 4, awayScore: 2, daysAgo: 2, time: [12, 30], league: 'Premier League' },
    { home: 'Leeds', away: 'Sunderland', homeScore: 2, awayScore: 0, daysAgo: 3, time: [15, 0], league: 'Championship' },
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
