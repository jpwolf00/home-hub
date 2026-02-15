'use client'

import { useState, useEffect } from 'react'

interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  description: string
  icon: string
  city: string
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/weather')
      .then(res => res.json())
      .then(data => {
        setWeather(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const getIcon = (icon: string) => {
    const icons: Record<string, string> = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    }
    return icons[icon] || '🌤️'
  }

  return (
    <div className="card card-hover p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-white/70">Weather</h2>
        <span className="text-2xl">{weather?.icon ? getIcon(weather.icon) : '🌤️'}</span>
      </div>
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-24 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-32"></div>
        </div>
      ) : error ? (
        <div className="text-white/50 text-sm">
          <p>Weather unavailable</p>
          <p className="text-xs mt-1 opacity-50">{error}</p>
        </div>
      ) : weather ? (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{Math.round(weather.temp)}°</span>
            <span className="text-white/60">F</span>
          </div>
          <p className="text-white/70 text-sm capitalize mt-1">{weather.description}</p>
          <div className="flex gap-4 mt-3 text-xs text-white/50">
            <span>💧 {weather.humidity}%</span>
            <span>Feels {Math.round(weather.feelsLike)}°</span>
          </div>
        </div>
      ) : (
        <p className="text-white/50 text-sm">No data</p>
      )}
    </div>
  )
}
