'use client';

import { motion } from 'framer-motion';
import Header from './layout/Header';
import Clock from './Clock';
import ServerMiniGrid from './widgets/ServerMiniGrid';
import WeatherWidget from './widgets/WeatherWidget';
import AICopilotWidget from './widgets/AICopilotWidget';
import NewsTicker from './widgets/NewsTicker';
import SystemHealthBar from './layout/SystemHealthBar';

export default function Dashboard() {
  return (
    <div className="min-h-screen pb-12">
      <Header />
      
      {/* Main Content - Two Column Layout */}
      <main className="max-w-7xl mx-auto mt-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Hero Zone (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Clock & Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card p-8 text-center"
            >
              <Clock />
            </motion.div>

            {/* Server Mini Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ServerMiniGrid />
            </motion.div>

            {/* AI Copilot - Collapsed by default */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AICopilotWidget collapsed />
            </motion.div>
          </div>

          {/* RIGHT COLUMN - Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Weather Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <WeatherWidget />
            </motion.div>

            {/* Reminders Widget - Placeholder for now */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card p-4"
            >
              <h3 className="text-sm font-medium text-white/70 mb-3">Reminders</h3>
              <div className="text-white/40 text-sm">
                <p>No reminders yet</p>
                <p className="text-xs mt-1 opacity-50">Connect Apple Reminders to see your tasks</p>
              </div>
            </motion.div>

            {/* Sports Widget - Placeholder for now */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="card p-4"
            >
              <h3 className="text-sm font-medium text-white/70 mb-3">Sports</h3>
              <div className="text-white/40 text-sm">
                <p>No games today</p>
                <p className="text-xs mt-1 opacity-50">Configure your teams to see scores</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* News Ticker - Fixed at bottom */}
      <NewsTicker />
    </div>
  );
}
