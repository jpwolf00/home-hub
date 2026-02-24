'use client';

import { useState, useEffect } from 'react';
import { frenchVocabulary, frenchVerbs } from '@/lib/french-data';

const TRIP_DATE = new Date('2026-05-09T00:00:00-04:00');

export default function FrenchWidget() {
  const [parisTime, setParisTime] = useState('');
  const [parisWeather, setParisWeather] = useState<any>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [verbIndex, setVerbIndex] = useState(0);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [mounted, setMounted] = useState(false);

  const TOURIST_PHRASES = frenchVocabulary.slice(0, 200);
  const TOURIST_VERBS = frenchVerbs.slice(0, 8);

  const QUESTION_WORDS = [
    { french: 'Qui?', pronunciation: 'KEE', english: 'Who?' },
    { french: 'Quoi?', pronunciation: 'KWAH', english: 'What?' },
    { french: 'Où?', pronunciation: 'OO', english: 'Where?' },
    { french: 'Quand?', pronunciation: 'KAHN', english: 'When?' },
    { french: 'Pourquoi?', pronunciation: 'poor-KWAH', english: 'Why?' },
    { french: 'Comment?', pronunciation: 'koh-MAHN', english: 'How?' },
    { french: 'Lequel?', pronunciation: 'luh-KEL', english: 'Which one?' },
    { french: 'Combien?', pronunciation: 'kom-BEE-en', english: 'How many?' },
  ];

  useEffect(() => {
    setMounted(true);

    const updateParisTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { 
        timeZone: 'Europe/Paris', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setParisTime(time);
    };
    updateParisTime();
    const parisInterval = setInterval(updateParisTime, 1000);

    const fetchParisWeather = () => {
      fetch('/api/paris-weather')
        .then(r => r.json())
        .then(setParisWeather)
        .catch(console.error);
    };
    fetchParisWeather();
    const weatherInterval = setInterval(fetchParisWeather, 10 * 60 * 1000);

    const updateCountdown = () => {
      const now = new Date();
      const diff = TRIP_DATE.getTime() - now.getTime();
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        });
      }
    };
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 60000);

    const phraseInterval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % TOURIST_PHRASES.length);
    }, 30000);

    const verbInterval = setInterval(() => {
      setVerbIndex((prev) => (prev + 1) % TOURIST_VERBS.length);
    }, 45000);

    return () => {
      clearInterval(parisInterval);
      clearInterval(weatherInterval);
      clearInterval(countdownInterval);
      clearInterval(phraseInterval);
      clearInterval(verbInterval);
    };
  }, []);

  const iconMap: Record<string, string> = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };

  const currentPhrase = TOURIST_PHRASES[phraseIndex];
  const currentVerb = TOURIST_VERBS[verbIndex];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Section 1: Paris Countdown + Time/Weather */}
      <div className="flex-[7] min-h-0 bg-[#2B2930] rounded-xl p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <h3 className="text-base font-medium text-white/70 uppercase tracking-wide">Paris Trip</h3>
          </div>
          {mounted && (
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{countdown.days}</div>
                <div className="text-xs text-white/50 uppercase">Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{countdown.hours}</div>
                <div className="text-xs text-white/50 uppercase">Hrs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{countdown.minutes}</div>
                <div className="text-xs text-white/50 uppercase">Min</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗼</span>
            <span className="text-2xl font-mono text-white">{parisTime || '--:--'}</span>
          </div>
          {parisWeather && (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{iconMap[parisWeather.icon] || '🌡️'}</span>
              <span className="text-xl text-white">{parisWeather.temp}°F</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Vocabulary */}
      <div className="flex-[6] min-h-0 bg-[#2B2930] rounded-xl p-4 overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🗣️</span>
          <h3 className="text-base font-medium text-white/70 uppercase tracking-wide">
            Phrases ({phraseIndex + 1}/{TOURIST_PHRASES.length})
          </h3>
        </div>
        <div className="space-y-2">
          <div className="text-[36px] font-medium text-white leading-tight">{currentPhrase?.french}</div>
          <div className="text-xl text-blue-300 italic font-mono">[{currentPhrase?.pronunciation}]</div>
          <div className="text-xl text-white/70">→ {currentPhrase?.english}</div>
        </div>
      </div>

      {/* Section 3: Verb Conjugations */}
      <div className="flex-[8] min-h-0 bg-[#2B2930] rounded-xl p-4 overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl">📝</span>
          <h3 className="text-base font-medium text-white/70 uppercase tracking-wide">
            Verbs ({verbIndex + 1}/{TOURIST_VERBS.length})
          </h3>
        </div>
        <div className="space-y-2">
          <div className="text-xl font-medium text-white">{currentVerb?.verb} <span className="text-white/50">({currentVerb?.meaning})</span></div>
          <div className="text-base text-purple-300 font-mono leading-relaxed">{currentVerb?.present}</div>
        </div>
      </div>

      {/* Section 4: Question Words */}
      <div className="flex-[10] min-h-0 bg-[#2B2930] rounded-xl p-4 overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl">❓</span>
          <h3 className="text-base font-medium text-white/70 uppercase tracking-wide">Questions</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {QUESTION_WORDS.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-blue-300 font-medium">{q.french}</span>
              <span className="text-white/30">|</span>
              <span className="text-white/50 text-xs font-mono">{q.pronunciation}</span>
              <span className="text-white/30">→</span>
              <span className="text-white/70">{q.english}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
