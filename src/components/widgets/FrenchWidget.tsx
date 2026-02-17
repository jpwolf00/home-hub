'use client';

import { useState, useEffect } from 'react';

// Common travel French phrases
const FRENCH_PHRASES = [
  { french: 'Bonjour', english: 'Hello / Good morning' },
  { french: 'Merci', english: 'Thank you' },
  { french: "S'il vous plaît", english: 'Please' },
  { french: 'Excusez-moi', english: 'Excuse me' },
  { french: 'Où est...?', english: 'Where is...?' },
  { french: "Je ne comprends pas", english: "I don't understand" },
  { french: 'Parlez-vous anglais?', english: 'Do you speak English?' },
  { french: "L'addition, s'il vous plaît", english: 'The bill, please' },
  { french: 'Quanto ça coûte?', english: 'How much does it cost?' },
  { french: "C'est délicieux!", english: "It's delicious!" },
  { french: 'Au revoir', english: 'Goodbye' },
  { french: 'Bonsoir', english: 'Good evening' },
  { french: 'Oui / Non', english: 'Yes / No' },
  { french: "Pardon", english: "Sorry / Pardon" },
  { french: "Je voudrais...", english: "I would like..." },
  { french: "L'eau, s'il vous plaît", english: "Water, please" },
  { french: "Le toilettes, s'il vous plaît", english: "The restroom, please" },
  { french: "Comment allez-vous?", english: "How are you?" },
  { french: "Très bien, merci", english: "Very well, thank you" },
  { french: "Enchanté(e)", english: "Nice to meet you" },
  { french: "Avez-vous...?", english: "Do you have...?" },
  { french: "Je suis perdu(e)", english: "I'm lost" },
  { french: "Pouvez-vous m'aider?", english: "Can you help me?" },
  { french: "C'est combien?", english: "How much is it?" },
  { french: "Je suis américain/américaine", english: "I'm American" },
];

export default function FrenchWidget() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Rotate every 60 seconds
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % FRENCH_PHRASES.length);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const phrase = FRENCH_PHRASES[index];

  return (
    <div className="bg-[#2B2930] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🇫🇷</span>
        <h3 className="text-xl font-medium text-white/70 uppercase tracking-wider">French</h3>
      </div>
      <div className="space-y-3">
        <div className="text-3xl font-medium text-white">{phrase.french}</div>
        <div className="text-xl text-white/60">{phrase.english}</div>
        <div className="text-xs text-white/30 mt-2">
          {index + 1} / {FRENCH_PHRASES.length}
        </div>
      </div>
    </div>
  );
}
