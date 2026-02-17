'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsItem {
  title: string;
  source: string;
}

export default function NewsTicker() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // For now, show placeholder news
    // In production, this would fetch from /api/news
    setNews([
      { title: 'Home Hub v2 is now live', source: 'System' },
      { title: 'Server monitoring active', source: 'Beszel' },
      { title: 'All systems operational', source: 'Status' },
    ]);
  }, []);

  useEffect(() => {
    if (news.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [news.length, isPaused]);

  if (news.length === 0) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-white/10 py-5 px-6 news-ticker"
      data-night-hidden="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        <span className="text-lg font-medium text-primary-400 uppercase tracking-wider shrink-0">
          News
        </span>
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-2xl text-white/90"
            >
              {news[currentIndex]?.title}
              <span className="text-white/40 ml-2">— {news[currentIndex]?.source}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex gap-1 shrink-0">
          {news.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-primary-400' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
