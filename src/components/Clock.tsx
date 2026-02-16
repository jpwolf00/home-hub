'use client';

import { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const greeting = () => {
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="text-center">
      {/* Large clock */}
      <div className="text-7xl md:text-8xl font-bold text-white tracking-tight font-mono">
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
        <span className="text-3xl md:text-4xl text-white/50 ml-1">
          :{String(seconds).padStart(2, '0')}
        </span>
      </div>
      
      {/* Date and greeting */}
      <p className="text-xl text-white/70 mt-2">{dateStr}</p>
      <p className="text-lg text-white/50">{greeting()}, Jason</p>
    </div>
  );
}
