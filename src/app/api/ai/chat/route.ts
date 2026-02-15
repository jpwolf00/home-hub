import { NextResponse } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://192.168.85.50:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:14b'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    // Format messages for Ollama
    const ollamaMessages: Message[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }))

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: ollamaMessages,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      message: {
        role: 'assistant',
        content: data.message?.content || 'No response',
      },
    })
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}
