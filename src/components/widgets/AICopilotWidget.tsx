'use client'

import { useState, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AICopilotWidget() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load greeting on mount
  useEffect(() => {
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: [{ role: 'user', content: 'Say hello and introduce yourself briefly' }] 
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setMessages([{ role: 'assistant', content: data.message.content }])
        }
      })
      .catch(() => {
        // Silently fail for greeting
      })
  }, [])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: userMessage }] 
        }),
      })
      
      if (!res.ok) throw new Error('Failed to get response')
      
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message.content }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card card-hover p-4 h-full flex flex-col" style={{ minHeight: '300px' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm">🤖</span>
        </div>
        <div>
          <h2 className="text-sm font-medium text-white">AI Copilot</h2>
          <p className="text-xs text-white/40">Local Ollama</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setMessages([])}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-48">
        {messages.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">
            Ask me anything!
          </p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary-500/20 text-white' 
                  : 'bg-white/10 text-white/90'
              }`}>
                {msg.content}
              </span>
            </div>
          ))
        )}
        {loading && (
          <div className="text-left">
            <span className="inline-block px-3 py-2 rounded-lg text-sm bg-white/10 text-white/50 animate-pulse">
              Thinking...
            </span>
          </div>
        )}
        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          disabled={loading}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}
