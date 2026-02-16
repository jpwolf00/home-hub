'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Feature, FeatureStatus, KanbanGrouped } from '@/types/kanban'
import FeatureCard from './FeatureCard'
import NewFeatureForm from './NewFeatureForm'

const COLUMNS: Array<{ key: FeatureStatus; title: string }> = [
  { key: 'planned', title: 'Planned' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'completed', title: 'Completed' },
  { key: 'on_hold', title: 'On Hold' },
]

function emptyGrouped(): KanbanGrouped {
  return { planned: [], in_progress: [], completed: [], on_hold: [] }
}

async function fetchKanban(): Promise<KanbanGrouped> {
  const res = await fetch('/api/kanban', { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load (${res.status})`)
  return (await res.json()) as KanbanGrouped
}

export function KanbanBoard() {
  const [data, setData] = useState<KanbanGrouped>(emptyGrouped())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const next = await fetchKanban()
      setData(next)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  const counts = useMemo(() => {
    return COLUMNS.reduce((acc, c) => {
      acc[c.key] = data[c.key]?.length ?? 0
      return acc
    }, {} as Record<FeatureStatus, number>)
  }, [data])

  async function move(id: string, nextStatus: FeatureStatus) {
    await fetch(`/api/kanban/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    await load()
  }

  async function del(id: string) {
    if (!confirm('Delete this feature?')) return
    await fetch(`/api/kanban/${id}`, { method: 'DELETE' })
    await load()
  }

  async function manualRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold tracking-wide text-zinc-100">Feature Kanban</div>
          <div className="text-xs text-zinc-500">Auto-refresh every 30s</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-60"
            onClick={manualRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <NewFeatureForm onAdd={load} />
        </div>
      </div>

      {error ? <div className="mb-4 rounded border border-red-900 bg-red-900/20 p-3 text-sm text-red-200">{error}</div> : null}

      {loading ? (
        <div className="text-sm text-zinc-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="rounded border border-zinc-800 bg-zinc-950/30">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-300">{col.title}</div>
                <div className="text-xs text-zinc-500">{counts[col.key] ?? 0}</div>
              </div>
              <div className="space-y-3 p-4">
                {(data[col.key] || []).map((f: Feature) => (
                  <FeatureCard feature={f} onStatusChange={move} />
                ))}
                {(data[col.key] || []).length === 0 ? (
                  <div className="text-xs text-zinc-600">No items</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-zinc-300">Live Agent Stats (stub)</div>
        <div className="mt-2 text-sm text-zinc-400">
          For in-progress items with <code className="rounded bg-zinc-900 px-1">agentId</code>, this will call a
          future <code className="rounded bg-zinc-900 px-1">sessions_list</code> integration to populate tokens and
          updated timestamps.
        </div>
      </div>
    </div>
  )
}
