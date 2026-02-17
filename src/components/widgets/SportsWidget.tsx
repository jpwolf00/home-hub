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

// Team logo paths
const TEAM_LOGOS: Record<string, string> = {
  // SEC
  'Kentucky': '/logos/sec/kentucky.png',
  'Georgia': '/logos/sec/georgia.png',
  'Auburn': '/logos/sec/auburn.png',
  // Premier League
  'Chelsea': '/logos/premier-league/chelsea.png',
  'Burnley': '/logos/premier-league/burnley.png',
  // Ligue 1
  'PSG': '/logos/ligue-1/psg.png',
  'Lille': '/logos/ligue-1/lille.png',
  'Monaco': '/logos/ligue-1/monaco.png',
  // English leagues
  'Wrexham': '/logos/english-leagues/wrexham.png',
  'Wycombe': '/logos/english-leagues/wycombe.png',
  'Bristol City': '/logos/english-leagues/bristol-city.png',
  // Championship
  'Leicester': '/logos/championship/leicester.png',
  'Sheffield Wednesday': '/logos/championship/sheffield-wednesday.png',
  'Sunderland': '/logos/championship/sunderland.png',
  'Middlesbrough': '/logos/championship/middlesbrough.png',
  'West Brom': '/logos/championship/west-bromwich-albion.png',
  'Watford': '/logos/championship/watford.png',
  'Preston': '/logos/championship/preston-north-end.png',
  'Hull': '/logos/championship/hull-city.png',
  'Cardiff': '/logos/championship/cardiff-city.png',
  'Swansea': '/logos/championship/swanseacity.png',
  'Blackburn': '/logos/championship/blackburn-rovers.png',
  'Derby': '/logos/championship/derby-county.png',
  'Oxford': '/logos/championship/oxford-united.png',
  'Millwall': '/logos/championship/millwall.png',
  'Luton': '/logos/championship/luton-town.png',
  'QPR': '/logos/championship/queens-park-rangers.png',
  'Coventry': '/logos/championship/coventry-city.png',
  'Ipswich': '/logos/championship/ipswich.png',
}

const getLogo = (team: string) => {
  if (!team) return '';
  
  // Try exact match first
  if (TEAM_LOGOS[team]) return TEAM_LOGOS[team];
  
  // Try lowercase
  const lower = team.toLowerCase();
  if (TEAM_LOGOS[team]) return TEAM_LOGOS[team];
  
  // Try common variations
  const variations: Record<string, string> = {
    'manchester united': '/logos/premier-league/manchester-united.png',
    'manchester city': '/logos/premier-league/manchester-city.png',
    'man utd': '/logos/premier-league/manchester-united.png',
    'man city': '/logos/premier-league/manchester-city.png',
    'tottenham': '/logos/premier-league/tottenham-hotspur.png',
    'spurs': '/logos/premier-league/tottenham-hotspur.png',
    'west ham': '/logos/premier-league/west-ham-united.png',
    'wolves': '/logos/premier-league/wolverhampton-wanderers.png',
    'wolverhampton': '/logos/premier-league/wolverhampton-wanderers.png',
    'brighton': '/logos/premier-league/brighton.png',
    'arsenal': '/logos/premier-league/arsenal.png',
    'aston villa': '/logos/premier-league/aston-villa.png',
    'bournemouth': '/logos/premier-league/bournemouth.png',
    'brentford': '/logos/premier-league/brentford.png',
    'crystal palace': '/logos/premier-league/crystal-palace.png',
    'everton': '/logos/premier-league/everton.png',
    'fulham': '/logos/premier-league/fulham.png',
    'liverpool': '/logos/premier-league/liverpool.png',
    'newcastle': '/logos/premier-league/newcastle-united.png',
    'nottingham': '/logos/premier-league/nottingham-forest.png',
    'forest': '/logos/premier-league/nottingham-forest.png',
    'southampton': '/logos/premier-league/southampton.png',
    'ipswich town': '/logos/premier-league/ipswich.png',
    // Ligue 1
    'paris saint-germain': '/logos/ligue-1/psg.png',
    'olympique lyon': '/logos/ligue-1/olympique-lyon.png',
    'olympique marseille': '/logos/ligue-1/olympique-marseille.png',
    'lyon': '/logos/ligue-1/olympique-lyon.png',
    'marseille': '/logos/ligue-1/olympique-marseille.png',
    'lens': '/logos/ligue-1/rc-lens.png',
    'nice': '/logos/ligue-1/ogc-nice.png',
    'brest': '/logos/ligue-1/stade-brestois-29.png',
    'rennes': '/logos/ligue-1/stade-rennais-fc.png',
    'strasbourg': '/logos/ligue-1/rc-strasbourg-alsace.png',
    'toulouse': '/logos/ligue-1/fc-toulouse.png',
    'nantes': '/logos/ligue-1/fc-nantes.png',
    'metz': '/logos/ligue-1/fc-metz.png',
    'lorient': '/logos/ligue-1/fc-lorient.png',
    // Championship
    'leeds united': '/logos/championship/leeds-united.png',
    'leeds': '/logos/championship/leeds-united.png',
    'sheffield wednesday': '/logos/championship/sheffield-wednesday.png',
    'sunderland': '/logos/championship/sunderland.png',
    'middlesbrough': '/logos/championship/middlesbrough.png',
    'west bromwich': '/logos/championship/west-bromwich-albion.png',
    'preston north end': '/logos/championship/preston-north-end.png',
    'hull city': '/logos/championship/hull-city.png',
    'cardiff city': '/logos/championship/cardiff-city.png',
    'swansea city': '/logos/championship/swanseacity.png',
    'blackburn rovers': '/logos/championship/blackburn-rovers.png',
    'derby county': '/logos/championship/derby-county.png',
    'oxford united': '/logos/championship/oxford-united.png',
    'luton town': '/logos/championship/luton-town.png',
    'queens park rangers': '/logos/championship/queens-park-rangers.png',
    'stoke city': '/logos/championship/stoke-city.png',
    'coventry city': '/logos/championship/coventry-city.png',
    // SEC
    'kentucky wildcats': '/logos/sec/kentucky.png',
    'georgia bulldogs': '/logos/sec/georgia.png',
    'auburn tigers': '/logos/sec/auburn.png',
    'alabama': '/logos/sec/alabama.png',
    'arkansas': '/logos/sec/arkansas.png',
    'florida': '/logos/sec/florida.png',
    'lsu': '/logos/sec/lsu.png',
    'mississippi state': '/logos/sec/mississippi-state.png',
    'missouri': '/logos/sec/missouri.png',
    'oklahoma': '/logos/sec/oklahoma.png',
    'ole miss': '/logos/sec/ole-miss.png',
    'south carolina': '/logos/sec/south-carolina.png',
    'tennessee': '/logos/sec/tennessee.texas.png',
    'texas a&m': '/logos/sec/texas-am.png',
    'texas': '/logos/sec/texas.png',
    'vanderbilt': '/logos/sec/vanderbilt.png',
  };
  
  return variations[lower] || '';
};

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
          <p className="text-sm">No matches today</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.slice(0, 4).map(match => {
            const { gameDate, gameTime } = formatDateTime(match.date)
            const homeAwayLabel = match.isHome === true ? 'HOME' : match.isHome === false ? 'AWAY' : ''
            const homeLogo = getLogo(match.homeTeam)
            const awayLogo = getLogo(match.awayTeam)
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
                  {homeLogo && <img src={homeLogo} alt={match.homeTeam} className="w-6 h-6 object-contain" />}
                  <span className="text-sm text-white font-medium">{match.homeTeam}</span>
                  {homeAwayLabel === 'HOME' && <span className="text-[10px] bg-green-500/30 text-green-300 px-1.5 py-0.5 rounded">HOME</span>}
                </div>
                <span className="text-sm text-white/70 px-2">
                  {match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{match.awayTeam}</span>
                  {awayLogo && <img src={awayLogo} alt={match.awayTeam} className="w-6 h-6 object-contain" />}
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
