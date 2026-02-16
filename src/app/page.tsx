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
};

// Clock component - LARGE for display
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
    <span className="font-mono text-8xl tracking-tight font-medium">
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

  return <span className="text-3xl font-medium">{dateStr}</span>;
}

// Weather widget - LARGE
function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.json())
      .then(setWeather)
      .catch(() => {});
  }, []);

  if (!weather) return <span className="text-2xl text-white/50">Loading...</span>;

  const iconMap: Record<string, string> = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };

  return (
    <div className="flex items-center gap-6">
      <span className="text-6xl">{iconMap[weather.icon] || '🌡️'}</span>
      <div>
        <div className="text-4xl font-medium">{weather.temp}°F</div>
        <div className="text-xl text-white/60">{weather.description}</div>
        <div className="text-lg text-white/40">{weather.city}</div>
      </div>
    </div>
  );
}

// Sports Column - LARGE
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

  const recentGames = matches.filter(m => m.status === 'FINISHED').slice(0, 5);
  const upcomingGames = matches.filter(m => m.status === 'SCHEDULED').slice(0, 5);

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Recent Scores */}
      <div className="bg-[#2B2930] rounded-2xl p-8 flex-1">
        <h3 className="text-2xl font-medium text-white/70 mb-6 uppercase tracking-widest">Recent</h3>
        <div className="space-y-4">
          {recentGames.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between text-2xl">
              <div className="flex items-center gap-4">
                <span className="text-green-400 text-2xl">✓</span>
                <span className="font-medium">{m.homeTeam}</span>
              </div>
              <span className="font-mono text-3xl">{m.homeScore} - {m.awayScore}</span>
              <span className="font-medium">{m.awayTeam}</span>
            </div>
          ))}
          {recentGames.length === 0 && (
            <div className="text-2xl text-white/40">No recent games</div>
          )}
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-[#2B2930] rounded-2xl p-8 flex-1">
        <h3 className="text-2xl font-medium text-white/70 mb-6 uppercase tracking-widest">Upcoming</h3>
        <div className="space-y-6">
          {upcomingGames.map((m: any) => (
            <div key={m.id}>
              <div className="flex items-center justify-between text-2xl mb-2">
                <span className="font-medium">{m.homeTeam}</span>
                <span className="text-lg text-white/50">vs</span>
                <span className="font-medium">{m.awayTeam}</span>
              </div>
              <div className="flex items-center justify-between text-xl text-white/50">
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

// Tasks Column - LARGE
function TasksColumn({ title, tasks, accentColor }: { title: string, tasks: any[], accentColor: string }) {
  return (
    <div className="bg-[#2B2930] rounded-2xl p-8 h-full">
      <h3 className="text-3xl font-medium mb-8 uppercase tracking-wider flex items-center gap-4">
        <span style={{ color: accentColor, fontSize: '2rem' }}>●</span>
        {title}
      </h3>
      <div className="space-y-6">
        {tasks.map((task: any) => (
          <label key={task.id} className="flex items-start gap-6 cursor-pointer group">
            <input
              type="checkbox"
              defaultChecked={task.completed}
              className="mt-2 w-8 h-8 rounded border-4 border-white/30 bg-transparent accent-current"
              style={{ color: accentColor }}
            />
            <span className={`text-2xl group-hover:text-white transition-colors ${task.completed ? 'line-through opacity-40' : ''}`}>
              {task.title}
            </span>
          </label>
        ))}
        {tasks.length === 0 && <div className="text-2xl text-white/30">No tasks</div>}
      </div>
    </div>
  );
}

// Market Watch Column - LARGE
function MarketColumn() {
  const [stocks, setStocks] = useState<any[]>([
    { symbol: 'SPY', price: 502.34, change: 0.45 },
    { symbol: 'QQQ', price: 438.12, change: -0.23 },
    { symbol: 'AAPL', price: 189.45, change: 1.23 },
    { symbol: 'GOOG', price: 142.67, change: -0.56 },
    { symbol: 'TSLA', price: 248.90, change: 2.34 },
  ]);

  return (
    <div className="bg-[#2B2930] rounded-2xl p-8 h-full flex flex-col">
      {/* Indices */}
      <div className="mb-8 pb-8 border-b-2 border-white/10">
        <h3 className="text-2xl font-medium text-white/70 mb-6 uppercase tracking-widest">Indices</h3>
        {['SPY', 'QQQ'].map(sym => {
          const stock = stocks.find(s => s.symbol === sym);
          if (!stock) return null;
          const isUp = stock.change >= 0;
          return (
            <div key={sym} className="flex items-center justify-between mb-4">
              <span className="text-3xl font-medium">{sym}</span>
              <div className="text-right">
                <span className="text-3xl font-mono">${stock.price}</span>
                <span className={`ml-4 text-2xl ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isUp ? '↑' : '↓'} {Math.abs(stock.change).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Watchlist */}
      <h3 className="text-2xl font-medium text-white/70 mb-6 uppercase tracking-widest">Watchlist</h3>
      <div className="space-y-4 flex-1">
        {stocks.filter(s => !['SPY', 'QQQ'].includes(s.symbol)).map((stock) => {
          const isUp = stock.change >= 0;
          return (
            <div key={stock.symbol} className="flex items-center justify-between">
              <span className="text-2xl font-medium">{stock.symbol}</span>
              <div className="text-right">
                <span className="text-2xl font-mono">${stock.price}</span>
                <span className={`ml-3 text-xl ${isUp ? 'text-green-400' : 'text-red-400'}`}>
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

// News Ticker - Rotating headlines
function NewsTicker() {
  const [news, setNews] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNews(data)
        } else if (data.items) {
          setNews(data.items)
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (news.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % news.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [news.length]);

  if (news.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#1C1B1F] border-t-2 border-white/10 py-4 px-8 flex items-center h-20">
        <span className="text-2xl text-white/50">Loading news...</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1C1B1F] border-t-2 border-white/10 py-4 px-8 flex items-center h-20">
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="flex-1"
      >
        <span className="text-3xl text-white/90">{news[index]}</span>
      </motion.div>
      <div className="flex gap-2 ml-8">
        {news.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [workTasks, setWorkTasks] = useState([
    { id: 1, title: 'Loading from Mac...', completed: false },
  ]);

  const [personalTasks, setPersonalTasks] = useState([
    { id: 1, title: 'Loading from Mac...', completed: false },
  ]);

  // Fetch from iCloud (or fallback to Mac)
  useEffect(() => {
    fetch('/api/icloud-reminders')
      .then(r => r.json())
      .then(data => {
        console.log('Reminders response:', data);
        if (data && Array.isArray(data) && data.length > 0) {
          setWorkTasks(data.slice(0, 5).map((t: any, i: number) => ({ id: i, title: t.title || t.name || 'Untitled', completed: t.completed })));
          setPersonalTasks(data.slice(5, 10).map((t: any, i: number) => ({ id: i + 100, title: t.title || t.name || 'Untitled', completed: t.completed })));
        } else {
          // No reminders - use fallback
          setWorkTasks([
            { id: 1, title: 'Review Q1 pipeline', completed: false },
            { id: 2, title: 'Follow up with prospects', completed: false },
          ]);
          setPersonalTasks([
            { id: 3, title: 'HomeLab backup', completed: false },
            { id: 4, title: 'Dog walk - Fauci', completed: false },
          ]);
        }
      })
      .catch(() => {
        // API failed - use fallback
        setWorkTasks([
          { id: 1, title: 'Review Q1 pipeline', completed: false },
          { id: 2, title: 'Follow up with prospects', completed: false },
        ]);
        setPersonalTasks([
          { id: 3, title: 'HomeLab backup', completed: false },
          { id: 4, title: 'Dog walk - Fauci', completed: false },
        ]);
      });
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: COLORS.background, color: '#FFF' }}
    >
      {/* Header - LARGE */}
      <header className="flex items-center justify-between px-12 py-8 border-b-2 border-white/10">
        <div className="flex items-baseline gap-12">
          <DateDisplay />
          <Clock />
        </div>
        <WeatherWidget />
      </header>

      {/* Main Grid - 4 Columns */}
      <main className="flex-1 grid grid-cols-4 gap-8 p-12 pb-24">
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
