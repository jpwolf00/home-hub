'use client'

import { useState, useEffect } from 'react'

interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  priority: string
}

export default function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask }),
      })
      const task = await res.json()
      setTasks([task, ...tasks])
      setNewTask('')
    } catch (err) {
      console.error('Failed to add task:', err)
    }
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const incompleteTasks = tasks.filter(t => !t.completed).slice(0, 6)

  return (
    <div className="card card-hover p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white/70">Tasks</h2>
        <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded-full">
          {incompleteTasks.length} left
        </span>
      </div>

      {/* Add Task */}
      <form onSubmit={addTask} className="mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary-500"
        />
      </form>

      {/* Task List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-white/10 rounded animate-pulse"></div>
          ))}
        </div>
      ) : incompleteTasks.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          <p className="text-2xl mb-2">✨</p>
          <p className="text-sm">All caught up!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {incompleteTasks.map(task => (
            <li key={task.id} className="flex items-center gap-3 group">
              <button
                onClick={() => toggleTask(task.id)}
                className="w-5 h-5 rounded-full border-2 border-white/30 hover:border-primary-500 hover:bg-primary-500/20 transition-all flex-shrink-0"
              />
              <span className="text-white text-sm truncate">{task.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
