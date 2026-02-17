'use client'

import { useState, useEffect } from 'react'

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

// Team logo URLs (Wikipedia)
const TEAM_LOGOS: Record<string, string> = {
  'Kentucky': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Kentucky_Wildcats_logo.svg',
  'Georgia': 'https://upload.wikimedia.org/wikipedia/commons/9/94/Georgia_Bulldogs_logo.svg',
  'Auburn': 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Auburn_Tigers_logo.svg',
  'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Burnley': 'https://upload.wikimedia.org/wikipedia/en/6/62/Burnley_FC.svg',
  'Wrexham': 'https://upload.wikimedia.org/wikipedia/en/d/d6/Wrexham_AFC_logo.svg',
  'Wycombe': 'https://upload.wikimedia.org/wikipedia/en/5/5d/Wycombe_Wanderers_FC.svg',
  'PSG': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_FC.svg',
  'Lille': 'https://upload.wikimedia.org/wikipedia/en/8/86/Lille_OSC_logo.svg',
  'Bristol City': 'https://upload.wikimedia.org/wikipedia/en/8/8a/Bristol_City_FC.svg',
}

const getLogo = (team: string) => TEAM_LOGOS[team] || null;

export default function SportsWidget() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/sports')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setMatches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'text-red-400'
      case 'FINISHED': return 'text-white/50'
      default: return 'text-primary-300'
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const gameDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const gameTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return { gameDate, gameTime }
  }

  return (
    <div className="card card-hover p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white/70">Upcoming Matches</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-white/10 rounded animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-white/50 text-sm">
          <p>Scores unavailable</p>
          <p className="text-xs mt-1 opacity-50">{error}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          <p className="text-2xl mb-2">⚽</p>
          <p className="text-sm">No matches today</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.slice(0, 4).map(match => {
            const { gameDate, gameTime } = formatDateTime(match.date)
            const homeLogo = getLogo(match.homeTeam)
            const awayLogo = getLogo(match.awayTeam)
            const homeAwayLabel = match.isHome === true ? 'HOME' : match.isHome === false ? 'AWAY' : ''
            return (
            <li key={match.id} className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${getStatusColor(match.status)}`}>
                  {match.status === 'LIVE' ? '● LIVE' : `${gameDate} • ${gameTime}`}
                </span>
                <span className="text-xs text-white/30">{match.league}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {homeLogo ? (
                    <img src={homeLogo} alt={match.homeTeam} className="w-6 h-6 object-contain" />
                  ) : (
                    <span className="text-lg">⚽</span>
                  )}
                  <span className="text-sm text-white font-medium">{match.homeTeam}</span>
                  {homeAwayLabel === 'HOME' && <span className="text-[10px] bg-green-500/30 text-green-300 px-1.5 py-0.5 rounded">HOME</span>}
                </div>
                <span className="text-sm text-white/70 px-2">
                  {match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{match.awayTeam}</span>
                  {awayLogo ? (
                    <img src={awayLogo} alt={match.awayTeam} className="w-6 h-6 object-contain" />
                  ) : (
                    <span className="text-lg">⚽</span>
                  )}
                  {homeAwayLabel === 'AWAY' && <span className="text-[10px] bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded">AWAY</span>}
                </div>
              </div>
            </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
