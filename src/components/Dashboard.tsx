'use client'

import { useState, useEffect } from 'react'
import Header from './layout/Header'
import WeatherWidget from './widgets/WeatherWidget'
import TasksWidget from './widgets/TasksWidget'
import UnraidWidget from './widgets/UnraidWidget'
import SportsWidget from './widgets/SportsWidget'
import AICopilotWidget from './widgets/AICopilotWidget'

export default function Dashboard() {
  const [time, setTime] = useState(new Date())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const greeting = () => {
    const hour = time.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-6">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {greeting()}, Jason
          </h1>
          {isClient && (
            <p className="text-white/60 mt-1">
              {time.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • {time.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          )}
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Row 1: Important at a glance */}
          <div className="md:col-span-2">
            <TasksWidget />
          </div>
          <div>
            <WeatherWidget />
          </div>
          
          {/* Row 2: Servers & Info */}
          <div className="md:col-span-2 lg:col-span-2">
            <UnraidWidget />
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <SportsWidget />
          </div>

          {/* Row 3: AI & More */}
          <div className="md:col-span-2 lg:col-span-3">
            <AICopilotWidget />
          </div>
        </div>
      </div>
    </div>
  )
}
