import { NextResponse } from 'next/server'

// Paris coordinates
const LAT = 48.85
const LON = 2.35

export async function GET() {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch Paris weather')
    }
    
    const data = await response.json()
    const current = data.current
    
    const weatherCodes: Record<number, { description: string; icon: string }> = {
      0: { description: 'Clear', icon: '01d' },
      1: { description: 'Mainly clear', icon: '01d' },
      2: { description: 'Partly cloudy', icon: '02d' },
      3: { description: 'Overcast', icon: '03d' },
      45: { description: 'Foggy', icon: '50d' },
      51: { description: 'Drizzle', icon: '09d' },
      61: { description: 'Rain', icon: '10d' },
      71: { description: 'Snow', icon: '13d' },
      95: { description: 'Thunderstorm', icon: '11d' },
    }
    
    const code = current.weather_code
    const weather = weatherCodes[code] || { description: 'Unknown', icon: '01d' }
    
    return NextResponse.json({
      temp: Math.round(current.temperature_2m),
      description: weather.description,
      icon: weather.icon,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
