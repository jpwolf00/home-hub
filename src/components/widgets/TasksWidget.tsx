'use client'

import { useState, useEffect } from 'react'

interface Reminder {
  title: string
  completed: boolean
  list?: string
}

export default function TasksWidget() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReminders()
    const interval = setInterval(fetchReminders, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/icloud-reminders')
      const data = await res.json()
      if (data.error) {
        setError(data.needsSetup ? 'iCloud credentials not configured' : data.error)
        setReminders([])
      } else if (Array.isArray(data)) {
        setReminders(data)
        setError(null)
      } else {
        setError('Unexpected response format')
        setReminders([])
      }
    } catch (err) {
      console.error('Failed to fetch reminders:', err)
      setError('Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  const incompleteReminders = reminders.filter(r => !r.completed).slice(0, 8)
  const lists = [...new Set(incompleteReminders.map(r => r.list).filter(Boolean))]

  return (
    <div className="card card-hover p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white/70">Reminders</h2>
        <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded-full">
          {incompleteReminders.length} pending
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-white/10 rounded animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-white/40">
          <p className="text-sm">{error}</p>
          {error.includes('credentials') && (
            <p className="text-xs mt-2 text-white/30">Set ICLOUD_EMAIL and ICLOUD_APP_PASSWORD in Coolify</p>
          )}
        </div>
      ) : incompleteReminders.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          <p className="text-2xl mb-2">✨</p>
          <p className="text-sm">All caught up!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {incompleteReminders.map((reminder, idx) => (
            <li key={idx} className="flex items-center gap-3 group">
              <div className="w-5 h-5 rounded-full border-2 border-white/30 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-white text-sm truncate block">{reminder.title}</span>
                {reminder.list && (
                  <span className="text-white/30 text-xs">{reminder.list}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
