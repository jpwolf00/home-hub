import { NextResponse } from 'next/server'

export async function GET() {
  const MAC_IP = '192.168.85.109'
  const MAC_PORT = '3456'
  
  const start = Date.now()
  
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(`http://${MAC_IP}:${MAC_PORT}/reminders`, {
      signal: controller.signal
    })
    
    clearTimeout(timeout)
    const text = await response.text()
    const data = JSON.parse(text)
    const latency = Date.now() - start
    
    return NextResponse.json({
      success: true,
      latency,
      count: data.length,
      reminders: data.slice(0, 3),
      raw: text.substring(0, 500)
    })
  } catch (error) {
    const latency = Date.now() - start
    const errMsg = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json({
      success: false,
      latency,
      error: errMsg,
      mac: `${MAC_IP}:${MAC_PORT}`
    })
  }
}
