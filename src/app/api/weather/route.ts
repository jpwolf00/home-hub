import { NextResponse } from 'next/server'

// Open-Meteo is free, no API key needed
// Coordinates for Lexington, KY
const LAT = 38.04
const LON = -84.50

export async function GET() {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather')
    }
    
    const data = await response.json()
    const current = data.current
    const daily = data.daily
    
    // Map weather code to description and icon
    const weatherCodes: Record<number, { description: string; icon: string }> = {
      0: { description: 'Clear sky', icon: '01d' },
      1: { description: 'Mainly clear', icon: '01d' },
      2: { description: 'Partly cloudy', icon: '02d' },
      3: { description: 'Overcast', icon: '03d' },
      45: { description: 'Foggy', icon: '50d' },
      48: { description: 'Depositing rime fog', icon: '50d' },
      51: { description: 'Light drizzle', icon: '09d' },
      53: { description: 'Moderate drizzle', icon: '09d' },
      55: { description: 'Dense drizzle', icon: '09d' },
      61: { description: 'Slight rain', icon: '10d' },
      63: { description: 'Moderate rain', icon: '10d' },
      65: { description: 'Heavy rain', icon: '10d' },
      71: { description: 'Slight snow', icon: '13d' },
      73: { description: 'Moderate snow', icon: '13d' },
      75: { description: 'Heavy snow', icon: '13d' },
      80: { description: 'Slight rain showers', icon: '09d' },
      81: { description: 'Moderate rain showers', icon: '09d' },
      82: { description: 'Violent rain showers', icon: '09d' },
      95: { description: 'Thunderstorm', icon: '11d' },
      96: { description: 'Thunderstorm with hail', icon: '11d' },
      99: { description: 'Thunderstorm with heavy hail', icon: '11d' },
    }
    
    const code = current.weather_code
    const weather = weatherCodes[code] || { description: 'Unknown', icon: '01d' }
    
    // Build forecast array
    const forecast = daily.time.map((date: string, i: number) => {
      const dayCode = daily.weather_code[i]
      const dayWeather = weatherCodes[dayCode] || { description: 'Unknown', icon: '01d' }
      return {
        date,
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        high: Math.round(daily.temperature_2m_max[i]),
        low: Math.round(daily.temperature_2m_min[i]),
        icon: dayWeather.icon,
        description: dayWeather.description,
      }
    })
    
    return NextResponse.json({
      temp: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      description: weather.description,
      icon: weather.icon,
      city: 'Lexington',
      forecast,
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    )
  }
}
