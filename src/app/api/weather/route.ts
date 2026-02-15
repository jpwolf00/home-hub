import { NextResponse } from 'next/server'
import axios from 'axios'

const API_KEY = process.env.OPENWEATHERMAP_API_KEY || ''
const CITY = 'Morris Plains' // Jason's location

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: 'No API key' }, { status: 500 })
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=imperial&appid=${API_KEY}`
    )
    
    const data = response.data
    return NextResponse.json({
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    )
  }
}
