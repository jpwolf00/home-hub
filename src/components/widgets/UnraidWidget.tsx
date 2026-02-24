'use client'

import { useState, useEffect } from 'react'

interface ServerStats {
  cpu: number
  memory: number
  disk: number
  containers: number
  runningContainers: number
  uptime: string
  hostname: string
}

export default function UnraidWidget() {
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/unraid')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (value: number) => {
    if (value < 50) return 'bg-green-500'
    if (value < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="card card-hover p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <h2 className="text-sm font-medium text-white/70">Unraid Server</h2>
        </div>
        <span className="text-xs text-white/40">{stats?.hostname || '...'}</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-white/10 rounded w-16 animate-pulse"></div>
              <div className="h-2 bg-white/10 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-white/50 text-sm">
          <p>Server unreachable</p>
          <p className="text-xs mt-1 opacity-50">{error}</p>
        </div>
      ) : stats ? (
        <div className="space-y-4">
          {/* CPU */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">CPU</span>
              <span className="text-white">{stats.cpu}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getStatusColor(stats.cpu)} transition-all duration-500`}
                style={{ width: `${stats.cpu}%` }}
              />
            </div>
          </div>

          {/* Memory */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">Memory</span>
              <span className="text-white">{stats.memory}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getStatusColor(stats.memory)} transition-all duration-500`}
                style={{ width: `${stats.memory}%` }}
              />
            </div>
          </div>

          {/* Disk */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">Disk</span>
              <span className="text-white">{stats.disk}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getStatusColor(stats.disk)} transition-all duration-500`}
                style={{ width: `${stats.disk}%` }}
              />
            </div>
          </div>

          {/* Containers */}
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-xs text-white/60">Containers</span>
            <span className="text-sm font-medium text-white">
              {stats.runningContainers} / {stats.containers}
            </span>
          </div>

          {/* Uptime */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/60">Uptime</span>
            <span className="text-xs text-white">{stats.uptime}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
