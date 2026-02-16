import { NextResponse } from 'next/server'
import axios from 'axios'

const API_KEY = process.env.FOOTBALL_DATA_API_KEY || ''

// Team IDs for the teams Jason cares about
const TEAMS = {
  Chelsea: 15,      // Premier League
  PSG: 524,        // Ligue 1
  Wrexham: 1012,   // League Two
  USMNT: 1843,     // USA Men's
  USWNT: 17698,    // USA Women's
}

// Competition IDs
const COMPETITIONS = {
  premier: 2021,   // Premier League
  ligue1: 2019,    // Ligue 1
  leagueone: 2016, // League One (Wrexham)
  women: 2098,     // SheBelieves Cup / Women's tournaments
}

export async function GET() {
  // If no API key, return smart mock data
  if (!API_KEY) {
    return NextResponse.json(getMockMatches())
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const matches: any[] = []

    // Fetch from multiple competitions in parallel
    const results = await Promise.allSettled([
      // Premier League (Chelsea)
      axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.premier}/matches`, {
        headers: { 'X-Auth-Token': API_KEY },
        params: { dateFrom: today, dateTo: today },
      }),
      // Ligue 1 (PSG)
      axios.get(`https://api.football-data.org/v4/competitions/${COMPETITIONS.ligue1}/matches`, {
        headers: { 'X-Auth-Token': API_KEY },
        params: { dateFrom: today, dateTo: today },
      }),
    ])

    // Process Premier League
    if (results[0].status === 'fulfilled') {
      const plMatches = results[0].value.data.matches || []
      plMatches.forEach((m: any) => {
        if (m.homeTeam.id === TEAMS.Chelsea || m.awayTeam.id === TEAMS.Chelsea) {
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

    // Process Ligue 1
    if (results[1].status === 'fulfilled') {
      const l1Matches = results[1].value.data.matches || []
      l1Matches.forEach((m: any) => {
        if (m.homeTeam.id === TEAMS.PSG || m.awayTeam.id === TEAMS.PSG) {
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

    return NextResponse.json(matches.length > 0 ? matches : getMockMatches())
  } catch (error) {
    console.error('Sports API error:', error)
    return NextResponse.json(getMockMatches())
  }
}

function getMockMatches() {
  return [
    {
      id: 1,
      homeTeam: 'Chelsea',
      awayTeam: 'Arsenal',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date: new Date(Date.now() + 86400000).toISOString(),
      league: 'Premier League',
    },
    {
      id: 2,
      homeTeam: 'PSG',
      awayTeam: 'Monaco',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date: new Date(Date.now() + 172800000).toISOString(),
      league: 'Ligue 1',
    },
    {
      id: 3,
      homeTeam: 'Wrexham',
      awayTeam: 'Sunderland',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date: new Date(Date.now() + 259200000).toISOString(),
      league: 'League One',
    },
  ]
}
