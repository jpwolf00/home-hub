import { NextResponse } from 'next/server'
import axios from 'axios'

const API_KEY = process.env.FOOTBALL_DATA_API_KEY || ''

// Premier League competition ID
const LEAGUE_ID = 2021

export async function GET() {
  // If no API key, return mock data
  if (!API_KEY) {
    return NextResponse.json(getMockMatches())
  }

  try {
    const response = await axios.get(
      `https://api.football-data.org/v4/competitions/${LEAGUE_ID}/matches`,
      {
        headers: { 'X-Auth-Token': API_KEY },
        params: {
          dateFrom: new Date().toISOString().split('T')[0],
          dateTo: new Date().toISOString().split('T')[0],
        },
      }
    )
    
    const matches = response.data.matches?.slice(0, 5).map((m: any) => ({
      id: m.id,
      homeTeam: m.homeTeam.shortName,
      awayTeam: m.awayTeam.shortName,
      homeScore: m.score.fullTime.home ?? null,
      awayScore: m.score.fullTime.away ?? null,
      status: m.status,
      date: m.utcDate,
      league: m.competition.name,
    })) || []
    
    return NextResponse.json(matches)
  } catch (error) {
    console.error('Sports API error:', error)
    return NextResponse.json(getMockMatches())
  }
}

function getMockMatches() {
  return [
    {
      id: 1,
      homeTeam: 'Arsenal',
      awayTeam: 'Liverpool',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date: new Date(Date.now() + 86400000).toISOString(),
      league: 'Premier League',
    },
    {
      id: 2,
      homeTeam: 'Man City',
      awayTeam: 'Chelsea',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      date: new Date(Date.now() + 172800000).toISOString(),
      league: 'Premier League',
    },
  ]
}
