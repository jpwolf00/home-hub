'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FrenchWidget from '@/components/widgets/FrenchWidget';
import FrenchNewsWidget from '@/components/widgets/FrenchNewsWidget';

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
    <div className="flex items-center gap-8">
      {/* Current conditions */}
      <div className="flex items-center gap-6">
        <span className="text-7xl">{iconMap[weather.icon] || '🌡️'}</span>
        <div>
          <div className="text-5xl font-medium">{weather.temp}°F</div>
          <div className="text-2xl text-white/60">{weather.description}</div>
          <div className="text-lg text-white/40">{weather.city}</div>
        </div>
      </div>
      
      {/* Vertical separator */}
      <div className="h-20 w-px bg-white/20 mx-4"></div>
      
      {/* 7-day forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="flex gap-8">
          {weather.forecast.slice(0, 7).map((day: any, i: number) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className="text-lg text-white/50">{day.day}</div>
              <div className="text-3xl">{iconMap[day.icon] || '🌡️'}</div>
              <div className="text-xl text-white">
                <span className="text-white/60">{day.low}°</span>
                <span className="mx-1">/</span>
                <span>{day.high}°</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// French Column - Full column with all French learning content
function FrenchColumn() {
  const [parisTime, setParisTime] = useState('');
  const [parisWeather, setParisWeather] = useState<any>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [conjugationIndex, setConjugationIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Paris countdown
  const PARIS_TRIP = new Date('2026-05-09T00:00:00-04:00');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  // Extended French phrases with pronunciation
  const FRENCH_PHRASES = [
    { french: 'Bonjour', pronunciation: 'bon-ZHOOR', english: 'Hello' },
    { french: 'Merci beaucoup', pronunciation: 'mair-SEE boh-KOO', english: 'Thank you very much' },
    { french: "S'il vous plaît", pronunciation: 'seel voo PLEH', english: 'Please' },
    { french: 'Excusez-moi', pronunciation: 'ex-koo-ZAY mwah', english: 'Excuse me' },
    { french: "Je ne comprends pas", pronunciation: 'zhuh nuh kohm-PRAHN pah', english: "I don't understand" },
    { french: 'Parlez-vous anglais?', pronunciation: 'par-LAY voo on-GLEH', english: 'Do you speak English?' },
    { french: 'Où est...?', pronunciation: 'oo EH', english: 'Where is...?' },
    { french: 'À gauche', pronunciation: 'ah GOHSH', english: 'To the left' },
    { french: 'À droite', pronunciation: 'ah DRWAHT', english: 'To the right' },
    { french: 'Tout droit', pronunciation: 'too DRWAH', english: 'Straight ahead' },
    { french: "C'est loin?", pronunciation: 'seh LWAN', english: 'Is it far?' },
    { french: "L'adresse, s'il vous plaît", pronunciation: 'lah-DRESS seel voo PLEH', english: 'The address, please' },
    { french: 'Le métro', pronunciation: 'luh may-TROH', english: 'The subway' },
    { french: 'La gare', pronunciation: 'lah GAHR', english: 'The train station' },
    { french: "L'aéroport", pronunciation: 'lah-ay-roh-POR', english: 'The airport' },
    { french: 'Un billet, s’il vous plaît', pronunciation: 'un bee-YEH seel voo PLEH', english: 'A ticket, please' },
    { french: "C'est quelle heure?", pronunciation: 'seh kel UHR', english: 'What time is it?' },
    { french: 'Le train pour...', pronunciation: 'luh TRAN poor', english: 'The train to...' },
    { french: 'La valise', pronunciation: 'lah vah-LEEZ', english: 'Suitcase' },
    { french: 'Le passeport', pronunciation: 'luh pahs-POR', english: 'Passport' },
    { french: 'Une chambre', pronunciation: 'oon SHAHM-bruh', english: 'A room' },
    { french: "L'hôtel", pronunciation: 'loh-TEL', english: 'Hotel' },
    { french: 'La clé', pronunciation: 'lah klay', english: 'The key' },
    { french: "L'ascenseur", pronunciation: 'lah-sahn-SUHR', english: 'Elevator' },
    { french: "L'escalier", pronunciation: 'les-kah-LYAY', english: 'Stairs' },
    { french: 'Le petit déjeuner', pronunciation: 'luh puh-TEE day-zhuh-NAY', english: 'Breakfast' },
    { french: 'Le dîner', pronunciation: 'luh dee-NAY', english: 'Dinner' },
    { french: "L'addition, s'il vous plaît", pronunciation: 'lah-dee-SYON seel voo PLEH', english: 'The bill, please' },
    { french: "C'est délicieux!", pronunciation: 'seh day-lee-SYUH', english: "It's delicious!" },
    { french: "L'eau, s'il vous plaît", pronunciation: 'loh seel voo PLEH', english: 'Water, please' },
    { french: 'Le café', pronunciation: 'luh kah-FAY', english: 'Coffee' },
    { french: 'Le vin', pronunciation: 'luh VAN', english: 'Wine' },
    { french: 'La bière', pronunciation: 'lah BYEHR', english: 'Beer' },
    { french: "C'est combien?", pronunciation: 'seh kohm-BYAN', english: 'How much is it?' },
    { french: 'Trop cher', pronunciation: 'troh SHEHR', english: 'Too expensive' },
    { french: "J'achète", pronunciation: 'zhah-SHET', english: 'I buy / I take it' },
    { french: 'La taille', pronunciation: 'lah TAHY', english: 'Size' },
    { french: 'La couleur', pronunciation: 'lah koo-LUHR', english: 'Color' },
    { french: "J'ai besoin d'aide", pronunciation: 'zhay buh-ZWAN DED', english: 'I need help' },
    { french: "Appelez la police!", pronunciation: 'ah-puh-LAY lah poh-LEES', english: 'Call the police!' },
    { french: "Appelez un médecin!", pronunciation: 'ah-puh-LAY un mayd-SAN', english: 'Call a doctor!' },
    { french: "L'hôpital", pronunciation: 'loh-pee-TAHL', english: 'Hospital' },
    { french: 'La pharmacie', pronunciation: 'lah far-mah-SEE', english: 'Pharmacy' },
    { french: "Comment vous appelez-vous?", pronunciation: 'koh-MAHN voo zah-puh-LAY voo', english: 'What is your name?' },
    { french: "Je m'appelle...", pronunciation: "zhuh mah-PEL", english: "My name is..." },
    { french: "Enchanté(e)", pronunciation: 'ahn-shahn-TAY', english: 'Nice to meet you' },
    { french: 'Comment allez-vous?', pronunciation: 'koh-MAHN tah-LAY voo', english: 'How are you?' },
    { french: "Très bien, merci", pronunciation: 'treh BYAN mair-SEE', english: 'Very well, thank you' },
    { french: 'Je suis américain/américaine', pronunciation: 'zhuh swee ah-may-ree-KAN', english: "I'm American" },
    { french: "D'où venez-vous?", pronunciation: 'duh vuh-NAY voo', english: 'Where are you from?' },
    { french: 'Je viens de...', pronunciation: 'zhuh VYAN duh', english: 'I am from...' },
    // More advanced
    { french: 'Je voudrais...', pronunciation: 'zhuh voo-DREH', english: 'I would like...' },
    { french: 'Est-ce que je peux...?', pronunciation: 'ess kuh zhuh PUH', english: 'Can I...?' },
    { french: "Je ne sais pas", pronunciation: 'zhuh nuh SAY pah', english: "I don't know" },
    { french: 'Bien sûr', pronunciation: 'BYAN SOOR', english: 'Of course' },
    { french: 'Peut-être', pronunciation: 'puh-TET-ruh', english: 'Maybe' },
    { french: "Je suis désolé(e)", pronunciation: 'zhuh swee day-zoh-LAY', english: "I'm sorry" },
    { french: 'Pardon', pronunciation: 'par-DON', english: 'Sorry' },
    { french: 'Au revoir', pronunciation: 'oh ruh-VWAHR', english: 'Goodbye' },
    { french: 'Bonne nuit', pronunciation: 'bun NWEE', english: 'Good night' },
    { french: 'À bientôt', pronunciation: 'ah byan-TOO', english: 'See you soon' },
    { french: 'Salut', pronunciation: 'sah-LOO', english: 'Hi / Bye (informal)' },
    { french: 'Monsieur', pronunciation: 'muh-SYUH', english: 'Mr. / Sir' },
    { french: 'Madame', pronunciation: 'mah-DAHM', english: 'Mrs. / Ma\'am' },
    { french: 'Mademoiselle', pronunciation: 'mahdm-WAH-ZEL', english: 'Miss' },
    { french: "C'est quoi...?", pronunciation: 'seh KWAH', english: "What's...?" },
    { french: "Qu'est-ce que c'est?", pronunciation: 'kes kuh SEH', english: 'What is that?' },
    { french: 'Pourquoi?', pronunciation: 'poor-KWAH', english: 'Why?' },
    { french: 'Parce que...', pronunciation: 'pars kuh', english: 'Because...' },
    { french: 'OUI', pronunciation: 'WEE', english: 'Yes' },
    { french: 'NON', pronunciation: 'NOH', english: 'No' },
    { french: 'Peut-être', pronunciation: 'puh-TET-ruh', english: 'Maybe' },
    { french: 'Je ne comprends rien', pronunciation: 'zhuh nuh kohm-PRAHN RYAN', english: "I don't understand anything" },
    { french: "Parlez plus lentement", pronunciation: 'par-LAY ploo lahnt-MAHN', english: 'Speak more slowly' },
    { french: "Pouvez-vous répéter?", pronunciation: 'poo-VAY voo ray-pay-TAY', english: 'Can you repeat?' },
    { french: "Je voudrais payer", pronunciation: 'zhuh voo-DREH pay-YAY', english: 'I would like to pay' },
    { french: 'Acceptez-vous carte?', pronunciation: 'ahk-sep-TAY voo KART', english: 'Do you accept card?' },
    { french: 'Acceptez-vous espèces?', pronunciation: 'ahk-sep-TAY voo ess-PSS', english: 'Do you accept cash?' },
    { french: "Où est la salle de bain?", pronunciation: 'oo EH lah SAL duh BAN', english: 'Where is the bathroom?' },
    { french: 'Les toilettes, s\'il vous plaît', pronunciation: 'lay twah-LET seel voo PLEH', english: 'The toilet, please' },
    { french: "C'est ouvert", pronunciation: 'seh oo-VEHR', english: "It's open" },
    { french: "C'est fermé", pronunciation: 'seh fehr-MAY', english: "It's closed" },
    { french: 'Je suis perdu(e)', pronunciation: 'zhuh swee pehr-DOO', english: "I'm lost" },
    { french: "Aidez-moi!", pronunciation: 'eh-day MWAH', english: 'Help me!' },
    { french: "Au secours!", pronunciation: 'oh suh-KOOR', english: 'Help! (emergency)' },
    // Numbers
    { french: 'Un, deux, trois', pronunciation: 'UN, DUH, TRWAH', english: 'One, two, three' },
    { french: 'Quatre, cinq, six', pronunciation: 'KAH-truh, SANK, SEES', english: 'Four, five, six' },
    { french: 'Sept, huit, neuf', pronunciation: 'SET, WEET, NUF', english: 'Seven, eight, nine' },
    { french: 'Dix, vingt, cent', pronunciation: 'DEE, VAN, SAHN', english: 'Ten, twenty, hundred' },
  ];

  // Verb conjugations
  const VERB_CONJUGATIONS = [
    { verb: 'être (to be)', present: 'je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont', english: 'to be' },
    { verb: 'avoir (to have)', present: 'j\'ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont', english: 'to have' },
    { verb: 'aller (to go)', present: 'je vais, tu vas, il/elle va, nous allons, vous allez, ils/elles vont', english: 'to go' },
    { verb: 'faire (to do/make)', present: 'je fais, tu fais, il/elle fait, nous faisons, vous faites, ils/elles font', english: 'to do / to make' },
    { verb: 'venir (to come)', present: 'je viens, tu viens, il/elle vient, nous venons, vous venez, ils/elles viennent', english: 'to come' },
    { verb: 'voir (to see)', present: 'je vois, tu vois, il/elle voit, nous voyons, vous voyez, ils/elles voient', english: 'to see' },
    { verb: 'savoir (to know)', present: 'je sais, tu sais, il/elle sait, nous savons, vous savez, ils/elles savent', english: 'to know (facts)' },
    { verb: 'connaître (to know)', present: 'je connais, tu connais, il/elle connaît, nous connaissons, vous connaissez, ils/elles connaissent', english: 'to know (people)' },
    { verb: 'vouloir (to want)', present: 'je veux, tu veux, il/elle veut, nous voulons, vous voulez, ils/elles veulent', english: 'to want' },
    { verb: 'pouvoir (to can/may)', present: 'je peux, tu peux, il/elle peut, nous pouvons, vous pouvez, ils/elles peuvent', english: 'to be able to' },
    { verb: 'devoir (must/have to)', present: 'je dois, tu dois, il/elle doit, nous devons, vous devez, ils/elles doivent', english: 'must / to have to' },
    { verb: 'dire (to say/tell)', present: 'je dis, tu dis, il/elle dit, nous disons, vous dites, ils/elles disent', english: 'to say / to tell' },
    { verb: 'parler (to speak)', present: 'je parle, tu parles, il/elle parle, nous parlons, vous parlez, ils/elles parlent', english: 'to speak' },
    { verb: 'manger (to eat)', present: 'je mange, tu manges, il/elle mange, nous mangeons, vous mangez, ils/elles mangent', english: 'to eat' },
    { verb: 'boire (to drink)', present: 'je bois, tu bois, il/elle boit, nous buvons, vous buvez, ils/elles boivent', english: 'to drink' },
    { verb: 'prendre (to take)', present: 'je prends, tu prends, il/elle prend, nous prenons, vous prenez, ils/elles prennent', english: 'to take' },
    { verb: 'venir (to come)', present: 'je viens, tu viens, il/elle vient, nous venons, vous venez, ils/elles viennent', english: 'to come' },
    { verb: 'partir (to leave)', present: 'je pars, tu pars, il/elle part, nous partons, vous partez, ils/elles partir', english: 'to leave / to depart' },
    { verb: 'arriver (to arrive)', present: "j'arrive, tu arrives, il/elle arrive, nous arrivons, vous arrivez, ils/elles arrivent", english: 'to arrive' },
    { verb: 'rester (to stay)', present: 'je reste, tu reste, il/elle reste, nous restons, vous restez, ils/elles restent', english: 'to stay / to remain' },
  ];

  useEffect(() => {
    setMounted(true);
    
    // Paris time
    const updateParisTime = () => {
      const now = new Date();
      const parisTime = now.toLocaleTimeString('en-US', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
      setParisTime(parisTime);
    };
    updateParisTime();
    const parisInterval = setInterval(updateParisTime, 1000);

    // Paris weather
    fetch('/api/paris-weather')
      .then(r => r.json())
      .then(setParisWeather)
      .catch(() => {});

    // Update countdown
    const updateCountdown = () => {
      const now = new Date();
      const diff = PARIS_TRIP.getTime() - now.getTime();
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

    // Rotate phrases every 60 seconds
    const phraseInterval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % FRENCH_PHRASES.length);
    }, 60000);

    // Rotate conjugations every hour (check minute to sync)
    const conjugationInterval = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() === 0) {
        setConjugationIndex((prev) => (prev + 1) % VERB_CONJUGATIONS.length);
      }
    }, 60000);

    return () => {
      clearInterval(parisInterval);
      clearInterval(countdownInterval);
      clearInterval(phraseInterval);
      clearInterval(conjugationInterval);
    };
  }, []);

  const iconMap: Record<string, string> = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌧️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };

  const currentPhrase = FRENCH_PHRASES[phraseIndex];
  const currentVerb = VERB_CONJUGATIONS[conjugationIndex];

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Paris Trip Countdown */}
      <div className="bg-[#2B2930] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">✈️</span>
          <h3 className="text-xl font-medium text-white/70 uppercase tracking-wider">Paris Trip</h3>
        </div>
        {mounted ? (
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-white">{countdown.days}</div>
              <div className="text-lg text-white/50">Days</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white">{countdown.hours}</div>
              <div className="text-lg text-white/50">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white">{countdown.minutes}</div>
              <div className="text-lg text-white/50">Minutes</div>
            </div>
          </div>
        ) : (
          <div className="text-2xl text-white/40">Loading...</div>
        )}
      </div>

      {/* Paris Time & Weather */}
      <div className="bg-[#2B2930] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🗼</span>
          <h3 className="text-xl font-medium text-white/70 uppercase tracking-wider">Paris</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-4xl font-mono text-white">{parisTime || 'Loading...'}</div>
          {parisWeather && (
            <div className="flex items-center gap-3">
              <span className="text-4xl">{iconMap[parisWeather.icon] || '🌡️'}</span>
              <div className="text-right">
                <div className="text-2xl text-white">{parisWeather.temp}°F</div>
                <div className="text-sm text-white/60">{parisWeather.description}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* French Phrase with Pronunciation */}
      <div className="bg-[#2B2930] rounded-2xl p-6 flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🇫🇷</span>
          <h3 className="text-xl font-medium text-white/70 uppercase tracking-wider">French</h3>
        </div>
        <div className="space-y-3">
          <div className="text-5xl font-medium text-white">{currentPhrase.french}</div>
          <div className="text-2xl text-primary-300 italic">{currentPhrase.pronunciation}</div>
          <div className="text-xl text-white/60">{currentPhrase.english}</div>
          <div className="text-sm text-white/30 mt-2">
            {phraseIndex + 1} / {FRENCH_PHRASES.length}
          </div>
        </div>
      </div>

      {/* Verb Conjugation */}
      <div className="bg-[#2B2930] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📝</span>
          <h3 className="text-lg font-medium text-white/70 uppercase tracking-wider">Verb Conjugation</h3>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-medium text-white">{currentVerb.verb}</div>
          <div className="text-lg text-primary-300">{currentVerb.present}</div>
          <div className="text-md text-white/60">{currentVerb.english}</div>
        </div>
      </div>

      {/* French News */}
      <div className="bg-[#2B2930] rounded-2xl p-6 flex-1 overflow-hidden">
        <FrenchNewsWidget />
      </div>
    </div>
  );
}

// Top Stories (Tech/Security/AI) - iOS-style cards
function TopStoriesWidget() {
  const [stories, setStories] = useState<any[]>([]);
  const [start, setStart] = useState(0);

  useEffect(() => {
    const load = () => {
      fetch('/api/top-stories?limit=18')
        .then(r => r.json())
        .then((data) => {
          if (Array.isArray(data)) setStories(data);
        })
        .catch(() => {});
    };

    load();
    const refresh = setInterval(load, 10 * 60 * 1000); // refresh feed every 10 min
    return () => clearInterval(refresh);
  }, []);

  useEffect(() => {
    if (stories.length <= 4) return;
    const interval = setInterval(() => {
      setStart((s) => (s + 1) % stories.length);
    }, 45_000); // rotate every 45 seconds
    return () => clearInterval(interval);
  }, [stories.length]);

  const visible = stories.length <= 4
    ? stories
    : Array.from({ length: 4 }).map((_, idx) => stories[(start + idx) % stories.length]);

  const tagColor = (cat: string) => {
    if (cat === 'security') return 'bg-red-500/20 text-red-200 border-red-500/30';
    if (cat === 'ai') return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
    return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
  };

  return (
    <div className="bg-[#2B2930] rounded-2xl p-8 flex-1 overflow-hidden">
      <h3 className="text-2xl mb-6 section-title">Top Stories</h3>
      <div className="space-y-6">
        {visible.map((s: any) => (
          <div key={s.id || s.link} className="flex gap-6">
            <div className="w-28 h-20 rounded-xl bg-black/20 overflow-hidden flex-shrink-0">
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-sm px-3 py-1 rounded-full border ${tagColor(s.category)} uppercase tracking-wider`}>{s.category}</span>
                <span className="text-sm text-white/40 truncate">{s.source}</span>
              </div>
              <div
                className="text-2xl leading-tight text-white/90"
                style={{ display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}
              >
                {s.title}
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="text-2xl text-white/40">Loading stories…</div>
        )}
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

  // Team logo paths - images for major leagues
  const TEAM_LOGOS: Record<string, string> = {
    // SEC
    'Kentucky': '/logos/sec/kentucky.png',
    'Georgia': '/logos/sec/georgia.png',
    'Auburn': '/logos/sec/auburn.png',
    // Premier League
    'Chelsea': '/logos/premier-league/chelsea.png',
    'Burnley': '/logos/premier-league/burnley.png',
    'Arsenal': '/logos/premier-league/arsenal.png',
    'Aston Villa': '/logos/premier-league/aston-villa.png',
    'Bournemouth': '/logos/premier-league/bournemouth.png',
    'Brentford': '/logos/premier-league/brentford.png',
    'Brighton': '/logos/premier-league/brighton.png',
    'Crystal Palace': '/logos/premier-league/crystal-palace.png',
    'Everton': '/logos/premier-league/everton.png',
    'Fulham': '/logos/premier-league/fulham.png',
    'Liverpool': '/logos/premier-league/liverpool.png',
    'Manchester City': '/logos/premier-league/manchester-city.png',
    'Manchester United': '/logos/premier-league/manchester-united.png',
    'Newcastle': '/logos/premier-league/newcastle-united.png',
    'Nottingham Forest': '/logos/premier-league/nottingham-forest.png',
    'Tottenham': '/logos/premier-league/tottenham-hotspur.png',
    'West Ham': '/logos/premier-league/west-ham-united.png',
    'Wolves': '/logos/premier-league/wolverhampton-wanderers.png',
    'Ipswich': '/logos/premier-league/ipswich.png',
    'Southampton': '/logos/premier-league/southampton.png',
    // Ligue 1
    'PSG': '/logos/ligue-1/psg.png',
    'Lille': '/logos/ligue-1/lille.png',
    'Monaco': '/logos/ligue-1/monaco.png',
    // English leagues
    'Wrexham': '/logos/english-leagues/wrexham.png',
    'Wycombe': '/logos/english-leagues/wycombe.png',
    'Bristol City': '/logos/english-leagues/bristol-city.png',
    // Championship
    'Leicester': '/logos/championship/leicester.png',
    'Leeds': '/logos/championship/leeds-united.png',
    'Sheffield Wednesday': '/logos/championship/sheffield-wednesday.png',
    'Sunderland': '/logos/championship/sunderland.png',
    'Middlesbrough': '/logos/championship/middlesbrough.png',
    'West Brom': '/logos/championship/west-bromwich-albion.png',
    'Watford': '/logos/championship/watford.png',
    'Preston': '/logos/championship/preston-north-end.png',
    'Hull': '/logos/championship/hull-city.png',
    'Cardiff': '/logos/championship/cardiff-city.png',
    'Swansea': '/logos/championship/swanseacity.png',
    'Blackburn': '/logos/championship/blackburn-rovers.png',
    'Derby': '/logos/championship/derby-county.png',
    'Oxford': '/logos/championship/oxford-united.png',
    'Millwall': '/logos/championship/millwall.png',
    'Luton': '/logos/championship/luton-town.png',
    'QPR': '/logos/championship/queens-park-rangers.png',
    'Stoke': '/logos/championship/stoke-city.png',
    'Coventry': '/logos/championship/coventry-city.png',
    'Ipswich Town': '/logos/premier-league/ipswich.png',
  };

  const getLogo = (team: string) => TEAM_LOGOS[team] || '';

  // Sort by date and show next 5 games (include LIVE games)
  const upcomingGames = matches
    .filter(m => m.status === 'SCHEDULED' || m.status === 'LIVE')
    .sort((a, b) => {
      // LIVE games first, then by date
      if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
      if (b.status === 'LIVE' && a.status !== 'LIVE') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="bg-[#2B2930] rounded-2xl p-8 flex-1">
        <h3 className="text-2xl mb-6 section-title">Upcoming Games</h3>
        <div className="space-y-6">
          {upcomingGames.map((m: any) => {
            const homeLogo = getLogo(m.homeTeam);
            const awayLogo = getLogo(m.awayTeam);
            return (
            <div key={m.id} className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-center gap-4 text-xl text-white/50 mb-2">
                <span>{formatDate(m.date)}</span>
                <span>•</span>
                <span>{formatTime(m.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {homeLogo && <img src={homeLogo} alt={m.homeTeam} className="w-8 h-8 object-contain" />}
                  <span className="text-2xl font-medium">{m.homeTeam}</span>
                  {m.isHome === true && <span className="text-[10px] bg-green-500/30 text-green-300 px-1.5 py-0.5 rounded">HOME</span>}
                </div>
                <span className="text-xl text-white/50">vs</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-medium">{m.awayTeam}</span>
                  {awayLogo && <img src={awayLogo} alt={m.awayTeam} className="w-8 h-8 object-contain" />}
                  {m.isHome === false && <span className="text-[10px] bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded">AWAY</span>}
                </div>
              </div>
            </div>
            );
          })}
          {upcomingGames.length === 0 && (
            <div className="text-2xl text-white/40">No upcoming games</div>
          )}
        </div>
      </div>

      <TopStoriesWidget />
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

function HomeNetworkWidget() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = () => {
      fetch('/api/servers')
        .then(r => r.json())
        .then(setData)
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const servers = data?.servers || [];
  const isStale = !!data?.isStale;

  const bar = (value: number, color: string) => (
    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );

  return (
    <div className="mt-2 flex-1">
      <h3 className="text-2xl mb-6 section-title flex items-center justify-between">
        <span>Home Network</span>
        {isStale && <span className="text-sm text-amber-300/90 tracking-wider">STALE</span>}
      </h3>

      <div className="space-y-5">
        {servers.slice(0, 6).map((s: any) => {
          const online = s.status === 'online';
          return (
            <div key={s.id} className="card-inset p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-3 h-3 rounded-full ${online ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-2xl font-medium truncate">{s.name}</span>
                </div>
                <span className={`text-sm uppercase tracking-wider ${online ? 'text-green-200/90' : 'text-red-200/90'}`}>{online ? 'Online' : 'Offline'}</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-white/50 mb-2">
                    <span>CPU</span>
                    <span className="font-mono">{s.cpu}%</span>
                  </div>
                  {bar(Number(s.cpu || 0), 'rgba(96, 165, 250, 0.9)')}
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-white/50 mb-2">
                    <span>RAM</span>
                    <span className="font-mono">{s.memory}%</span>
                  </div>
                  {bar(Number(s.memory || 0), 'rgba(167, 139, 250, 0.9)')}
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-white/50 mb-2">
                    <span>Disk</span>
                    <span className="font-mono">{s.disk}%</span>
                  </div>
                  {bar(Number(s.disk || 0), 'rgba(52, 211, 153, 0.9)')}
                </div>
              </div>
            </div>
          );
        })}

        {servers.length === 0 && (
          <div className="text-2xl text-white/40">Loading servers…</div>
        )}
      </div>
    </div>
  );
}

// Market Watch Column - LARGE
function MarketColumn() {
  const [stocks, setStocks] = useState<any[]>([]);

  useEffect(() => {
    const fetchStocks = () => {
      fetch('/api/stocks?symbols=SPY,QQQ,DIA')
        .then(r => r.json())
        .then((data) => {
          if (Array.isArray(data)) setStocks(data);
        })
        .catch(() => {});
    };
    
    // Fetch immediately and then every 5 minutes
    fetchStocks();
    const interval = setInterval(fetchStocks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#2B2930] rounded-2xl p-8 h-full flex flex-col">
      {/* Indices */}
      <div className="mb-8 pb-8 border-b-2" style={{ borderColor: 'var(--outline)' }}>
        <h3 className="text-2xl mb-6 section-title">Indices</h3>
        {(['SPY', 'QQQ', 'DIA'] as const).map(sym => {
          const stock = stocks.find(s => s.symbol === sym);
          if (!stock || stock.error) return null;
          const isUp = stock.changePct >= 0;
          const label = sym === 'SPY' ? 'S&P 500' : sym === 'QQQ' ? 'NASDAQ' : 'DOW';
          return (
            <div key={sym} className="flex items-center justify-between mb-4">
              <span className="text-3xl font-medium">{label}</span>
              <div className="text-right">
                <span className="text-3xl font-mono">${Number(stock.price).toFixed(2)}</span>
                <span className={`ml-4 text-2xl ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isUp ? '↑' : '↓'} {Math.abs(Number(stock.changePct)).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* French Learning Widget with Countdown */}
      <FrenchWidget />

      {/* French News - Headlines for learning */}
      <FrenchNewsWidget />
    </div>
  );
}

// News Ticker - Continuous scrolling chyron
function NewsTicker() {
  const [news, setNews] = useState<string[]>([]);

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

  if (news.length === 0) {
    return (
      <div className="news-ticker border-t-2 h-20 px-8 flex items-center" style={{ background: 'var(--surface)', borderColor: 'var(--outline)' }}>
        <span className="text-2xl text-white/50">Loading breaking news…</span>
      </div>
    );
  }

  const text = news.join('  •  ');

  return (
    <div className="news-ticker bg-[#2A1212] border-t-2 border-red-500/30 h-20 px-8 flex items-center overflow-hidden ticker">
      <div className="ticker-track">
        <span className="ticker-text">{text}</span>
        <span className="ticker-sep">•</span>
        <span className="ticker-text">{text}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [reminderLists, setReminderLists] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  // Fetch from Mac Reminders server via proxy
  useEffect(() => {
    fetch('/api/reminders')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          // Group reminders by their actual list name
          const grouped: Record<string, any[]> = {};
          data.forEach((t: any, i: number) => {
            const list = t.list || 'General';
            if (!grouped[list]) grouped[list] = [];
            grouped[list].push({ id: i, title: t.title || 'Untitled', completed: t.completed });
          });
          setReminderLists(grouped);
        }
      })
      .catch((err) => console.error('Failed to fetch reminders:', err))
      .finally(() => setLoading(false));
  }, []);

  const listNames = Object.keys(reminderLists);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: COLORS.background, color: '#FFF' }}
    >
      {/* Header - LARGE */}
      <header className="flex items-center justify-between px-12 py-8 border-b-2" style={{ borderColor: 'var(--outline)' }}>
        <div className="flex items-baseline gap-12">
          <DateDisplay />
          <Clock />
        </div>
        <WeatherWidget />
      </header>

      {/* Main Grid - 3 Columns */}
      <main className="flex-1 grid grid-cols-4 gap-8 p-12 pb-32">
        {/* Column 1: Sports + Stories */}
        <section>
          <SportsColumn />
        </section>

        {/* Column 2: Combined Tasks */}
        <section>
          <div className="flex flex-col gap-8 h-full">
            {listNames.slice(0, 2).map((listName, idx) => (
              <TasksColumn
                key={listName}
                title={listName}
                tasks={reminderLists[listName] || []}
                accentColor={idx === 0 ? COLORS.work : COLORS.personal}
              />
            ))}
          </div>
        </section>

        {/* Column 3: French */}
        <section>
          <FrenchColumn />
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
