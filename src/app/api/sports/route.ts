import { NextResponse } from 'next/server'
import axios from 'axios'

const API_KEY = process.env.FOOTBALL_DATA_API_KEY || ''

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
      axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.leagueOne}/matches`, {
        headers: { 'X-Auth-Token': API_KEY },
        params: { dateFrom: today, dateTo: twoWeeksLater },
      }),
    ])

    // Process all matches - filter to teams we care about
    const teamIds = [15, 524, 1012] // Chelsea, PSG, Wrexham
    
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
  // Current schedule - will update weekly
  return [
    // UK Wildcats Basketball
    {
      id: 101,
      homeTeam: 'Kentucky',
      awayTeam: 'Georgia',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date: '2026-02-17T21:00:00Z',
      league: 'NCAA Basketball',
    },
    {
      id: 102,
      homeTeam: 'Kentucky',
      awayTeam: 'Auburn',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date: '2026-02-21T01:30:00Z',
      league: 'NCAA Basketball',
    },
    // Chelsea
    {
      id: 201,
      homeTeam: 'Chelsea',
      awayTeam: 'Burnley',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date: '2026-02-21T15:00:00Z',
      league: 'Premier League',
    },
    // Wrexham
    {
      id: 301,
      homeTeam: 'Wrexham',
      awayTeam: 'Wycombe',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date: '2026-02-22T15:00:00Z',
      league: 'League One',
    },
  ]
}
