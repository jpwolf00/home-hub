import { NextResponse } from 'next/server'

// Simple in-memory task store (will reset on server restart)
// For production, add Prisma/SQLite later
let tasks: Task[] = [
  { id: '1', title: 'Welcome to Home Hub!', completed: false, priority: 'high', createdAt: new Date().toISOString() },
  { id: '2', title: 'Add your API keys in Coolify', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
]

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
  priority: string
  source?: string
  externalId?: string
  createdAt: string
  updatedAt?: string
}

export async function GET() {
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  try {
    const { title, description, dueDate, priority } = await request.json()
    
    const task: Task = {
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
    }
    
    tasks.unshift(task)
    
    // If Apple Reminders webhook is set, call it
    const webhook = process.env.APPLE_REMINDERS_WEBHOOK
    if (webhook) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, dueDate }),
        })
      } catch (e) {
        console.error('Failed to sync to Apple Reminders:', e)
      }
    }
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('Tasks POST error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
