'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Color tokens from spec
const COLORS = {
  background: '#1C1B1F',
  surface: '#2B2930',
  work: '#D1E4FF',
  personal: '#FFE082',
  success: '#B4E495',
  critical: '#FFB4AB',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
};

// Clock component
function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return (
    <span className="font-mono text-5xl tracking-tight">
      {displayHours}:{String(minutes).padStart(2, '0')} {ampm}
    </span>
  );
}

// Date component
function DateDisplay() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return <span className="text-lg">{dateStr}</span>;
}

// Weather widget
function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.json())
      .then(setWeather)
      .catch(() => {});
  }, []);

  if (!weather) return <span className="text-sm text-[#fff8]">Loading...</span>;

  const iconMap: Record<string, string> = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-2xl">{iconMap[weather.icon] || '🌡️'}</span>
      <div>
        <div className="font-medium">{weather.temp}°F {weather.description}</div>
        <div className="text-xs text-[#fff8]">{weather.city}</div>
      </div>
    </div>
  );
}

// Sports Column
function SportsColumn() {
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/sports')
      .then(r => r.json())
      .then(setMatches)
      .catch(() => {});
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Recent Scores */}
      <div className="bg-[#2B2930] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#fff8] mb-3 uppercase tracking-wide">Recent</h3>
        <div className="space-y-2">
          {matches.slice(0, 3).filter(m => m.status === 'FINISHED').map((m: any) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="font-medium">{m.homeTeam}</span>
              </div>
              <span className="font-mono">{m.homeScore} - {m.awayScore}</span>
              <span className="font-medium">{m.awayTeam}</span>
            </div>
          ))}
          {matches.filter(m => m.status === 'FINISHED').length === 0 && (
            <div className="text-sm text-[#fff6]">No recent games</div>
          )}
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-[#2B2930] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#fff8] mb-3 uppercase tracking-wide">Upcoming</h3>
        <div className="space-y-3">
          {matches.filter(m => m.status === 'SCHEDULED').slice(0, 3).map((m: any) => (
            <div key={m.id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{m.homeTeam}</span>
                <span className="text-xs text-[#fff8]">vs</span>
                <span className="font-medium">{m.awayTeam}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#fff8]">
                <span>{formatDate(m.date)}</span>
                <span>{formatTime(m.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tasks Column
function TasksColumn({ title, tasks, accentColor }: { title: string, tasks: any[], accentColor: string }) {
  return (
    <div className="bg-[#2B2930] rounded-lg p-4 h-full">
      <h3 className="text-sm font-medium mb-4 uppercase tracking-wide flex items-center gap-2">
        <span style={{ color: accentColor }}>●</span>
        {title}
      </h3>
      <div className="space-y-2">
        {tasks.map((task: any) => (
          <label key={task.id} className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              defaultChecked={task.completed}
              className="mt-1 w-5 h-5 rounded border-2 border-[#fff6] bg-transparent accent-current"
              style={{ color: accentColor }}
            />
            <span className={`text-sm group-hover:text-white transition-colors ${task.completed ? 'line-through opacity-50' : ''}`}>
              {task.title}
            </span>
          </label>
        ))}
        {tasks.length === 0 && <div className="text-sm text-[#fff6]">No tasks</div>}
      </div>
    </div>
  );
}

// Market Watch Column
function MarketColumn() {
  const [stocks, setStocks] = useState<any[]>([
    { symbol: 'SPY', price: 502.34, change: 0.45 },
    { symbol: 'QQQ', price: 438.12, change: -0.23 },
    { symbol: 'AAPL', price: 189.45, change: 1.23 },
    { symbol: 'GOOG', price: 142.67, change: -0.56 },
    { symbol: 'TSLA', price: 248.90, change: 2.34 },
  ]);

  return (
    <div className="bg-[#2B2930] rounded-lg p-4 h-full">
      {/* Indices */}
      <div className="mb-4 pb-4 border-b border-[#fff2]">
        <h3 className="text-sm font-medium text-[#fff8] mb-3 uppercase tracking-wide">Indices</h3>
        {['SPY', 'QQQ'].map(sym => {
          const stock = stocks.find(s => s.symbol === sym);
          if (!stock) return null;
          const isUp = stock.change >= 0;
          return (
            <div key={sym} className="flex items-center justify-between mb-2">
              <span className="font-medium">{sym}</span>
              <div className="text-right">
                <span className="font-mono">${stock.price}</span>
                <span className={`ml-2 text-sm ${isUp ? 'text-[#B4E495]' : 'text-[#FFB4AB]'}`}>
                  {isUp ? '↑' : '↓'} {Math.abs(stock.change).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Watchlist */}
      <h3 className="text-sm font-medium text-[#fff8] mb-3 uppercase tracking-wide">Watchlist</h3>
      <div className="space-y-2">
        {stocks.filter(s => !['SPY', 'QQQ'].includes(s.symbol)).map((stock) => {
          const isUp = stock.change >= 0;
          return (
            <div key={stock.symbol} className="flex items-center justify-between">
              <span className="font-medium">{stock.symbol}</span>
              <div className="text-right">
                <span className="font-mono">${stock.price}</span>
                <span className={`ml-2 text-sm ${isUp ? 'text-[#B4E495]' : 'text-[#FFB4AB]'}`}>
                  {isUp ? '↑' : '↓'} {Math.abs(stock.change).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// News Ticker
function NewsTicker() {
  const [news, setNews] = useState<string[]>([
    'BREAKING: Market opens higher amid positive economic data',
    'Chelsea face Burnley in Premier League action this weekend',
    'Tech stocks rally as AI investments continue to grow',
    'Federal Reserve signals steady interest rates ahead',
  ]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1C1B1F] border-t border-[#fff2] py-2 px-4 flex items-center">
      <span className="bg-[#BA1A1A] text-white text-xs font-bold px-2 py-1 rounded mr-4 shrink-0">
        BREAKING
      </span>
      <div className="overflow-hidden whitespace-nowrap">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="inline-block"
        >
          {news.join('  •  ')}
        </motion.div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [workTasks, setWorkTasks] = useState([
    { id: 1, title: 'Review Q1 pipeline', completed: false },
    { id: 2, title: 'Follow up with prospects', completed: false },
    { id: 3, title: 'Update CRM records', completed: true },
  ]);

  const [personalTasks, setPersonalTasks] = useState([
    { id: 1, title: 'HomeLab backup', completed: false },
    { id: 2, title: 'Rental property - fix leak', completed: false },
    { id: 3, title: 'Dog walk - Fauci', completed: false },
  ]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: COLORS.background, color: COLORS.text }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#fff2]">
        <div className="flex items-baseline gap-6">
          <DateDisplay />
          <Clock />
        </div>
        <WeatherWidget />
      </header>

      {/* Main Grid - 4 Columns */}
      <main className="flex-1 grid grid-cols-4 gap-4 p-6 pb-20">
        {/* Column 1: Sports */}
        <section>
          <SportsColumn />
        </section>

        {/* Column 2: Work Tasks */}
        <section>
          <TasksColumn
            title="Work - BD"
            tasks={workTasks}
            accentColor={COLORS.work}
          />
        </section>

        {/* Column 3: Personal Tasks */}
        <section>
          <TasksColumn
            title="Personal"
            tasks={personalTasks}
            accentColor={COLORS.personal}
          />
        </section>

        {/* Column 4: Market */}
        <section>
          <MarketColumn />
        </section>
      </main>

      {/* News Ticker */}
      <NewsTicker />
    </div>
  );
}
