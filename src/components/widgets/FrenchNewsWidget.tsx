// French News Widget - Shows French headlines for language learning
'use client';
import { useState, useEffect } from 'react';

function FrenchNewsWidget() {
  const [news, setNews] = useState<{ headlines: string[] }>({ headlines: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/french-news')
      .then(r => r.json())
      .then(data => {
        setNews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#2B2930] rounded-2xl p-8 h-full">
      <h3 className="text-2xl mb-6 section-title">French News</h3>
      <div className="space-y-4">
        {loading ? (
          <div className="text-xl text-white/40">Loading...</div>
        ) : news.headlines.length === 0 ? (
          <div className="text-xl text-white/40">No headlines available</div>
        ) : (
          news.headlines.slice(0, 5).map((headline, i) => (
            <div key={i} className="border-b border-white/10 pb-4 last:border-0">
              <span className="text-2xl text-white/80 block leading-snug">
                {headline}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FrenchNewsWidget;
