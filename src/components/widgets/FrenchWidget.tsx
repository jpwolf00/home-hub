'use client';

import { useState, useEffect } from 'react';

// Top 100+ travel French phrases
const FRENCH_PHRASES = [
  // Basics
  { french: 'Bonjour', english: 'Hello / Good morning' },
  { french: 'Bonsoir', english: 'Good evening' },
  { french: 'Au revoir', english: 'Goodbye' },
  { french: 'Merci', english: 'Thank you' },
  { french: "Merci beaucoup", english: 'Thank you very much' },
  { french: "S'il vous plaît", english: 'Please' },
  { french: 'Excusez-moi', english: 'Excuse me' },
  { french: 'Pardon', english: 'Sorry / Pardon' },
  { french: 'Oui', english: 'Yes' },
  { french: 'Non', english: 'No' },
  { french: "Je ne comprends pas", english: "I don't understand" },
  { french: "Parlez-vous anglais?", english: 'Do you speak English?' },
  { french: 'Je parle un peu français', english: 'I speak a little French' },
  
  // Getting around
  { french: "Où est...?", english: 'Where is...?' },
  { french: 'À gauche', english: 'To the left' },
  { french: 'À droite', english: 'To the right' },
  { french: 'Tout droit', english: 'Straight ahead' },
  { french: 'C’est loin?', english: 'Is it far?' },
  { french: 'C’est près?', english: 'Is it near?' },
  { french: 'L.address, s’il vous plaît', english: 'The address, please' },
  { french: 'Le métro', english: 'The subway/metro' },
  { french: 'La gare', english: 'The train station' },
  { french: "L'aéroport", english: 'The airport' },
  { french: 'Le bus', english: 'The bus' },
  { french: 'Le taxi', english: 'The taxi' },
  { french: 'Une billet, s’il vous plaît', english: 'A ticket, please' },
  
  // Transportation
  { french: 'Un billet aller', english: 'One-way ticket' },
  { french: 'Un billet retour', english: 'Return ticket' },
  { french: "C'est quelle heure?", english: 'What time is it?' },
  { french: 'À quelle heure?', english: 'At what time?' },
  { french: 'Le train pour...', english: 'The train to...' },
  { french: 'Le vol pour...', english: 'The flight to...' },
  { french: 'La valise', english: 'Suitcase' },
  { french: 'La carte d embarquement', english: 'Boarding pass' },
  { french: 'Le passeport', english: 'Passport' },
  { french: 'La sortie', english: 'Exit' },
  { french: "L'entrée", english: 'Entrance' },
  
  // Accommodation
  { french: 'Une chambre', english: 'A room' },
  { french: 'Une chambre double', english: 'Double room' },
  { french: 'Une chambre single', english: 'Single room' },
  { french: "L'hôtel", english: 'Hotel' },
  { french: "L'auberge de jeunesse", english: 'Youth hostel' },
  { french: 'La clé', english: 'The key' },
  { french: "L'ascenseur", english: 'Elevator' },
  { french: "L'escalier", english: 'Stairs' },
  { french: 'Le petit déjeuner', english: 'Breakfast' },
  { french: 'Le déjeuner', english: 'Lunch' },
  { french: 'Le dîner', english: 'Dinner' },
  { french: 'La facture', english: 'The bill/check' },
  { french: "L'addition, s'il vous plaît", english: 'The bill, please' },
  { french: 'Acceptez-vous carte?', english: 'Do you accept card?' },
  { french: 'Acceptez-vous espèces?', english: 'Do you accept cash?' },
  
  // Food & Drink
  { french: "C'est délicieux!", english: "It's delicious!" },
  { french: "L'eau, s'il vous plaît", english: 'Water, please' },
  { french: 'Le café', english: 'Coffee' },
  { french: 'Le thé', english: 'Tea' },
  { french: 'Le vin', english: 'Wine' },
  { french: 'La bière', english: 'Beer' },
  { french: 'Le champagne', english: 'Champagne' },
  { french: "Un café, s'il vous plaît", english: 'A coffee, please' },
  { french: "L'addition, s'il vous plaît", english: 'The check, please' },
  { french: 'Le menu', english: 'The menu' },
  { french: 'La carte', english: 'The wine list / menu' },
  { french: 'Je suis allergique à...', english: 'I am allergic to...' },
  { french: 'Végétarien', english: 'Vegetarian' },
  { french: 'Végan', english: 'Vegan' },
  { french: 'Sans porc', english: 'No pork' },
  { french: 'Sans gluten', english: 'Gluten-free' },
  { french: 'Le petit-déjeuner inclus?', english: 'Is breakfast included?' },
  
  // Shopping
  { french: "C'est combien?", english: 'How much is it?' },
  { french: "Combien ça coûte?", english: 'How much does it cost?' },
  { french: 'Trop cher', english: 'Too expensive' },
  { french: "J'achète", english: 'I buy / I will take it' },
  { french: "Je ne suis pas interéssé(e)", english: "I'm not interested" },
  { french: 'La taille', english: 'Size' },
  { french: 'La couleur', english: 'Color' },
  { french: "C'est trop petit", english: 'It is too small' },
  { french: "C'est trop grand", english: 'It is too big' },
  { french: 'Essayage', english: 'Fitting room' },
  { french: 'Peut-on payer par carte?', english: 'Can we pay by card?' },
  
  // Emergency & Health
  { french: "J'ai besoin d'aide", english: 'I need help' },
  { french: "Appelez la police!", english: 'Call the police!' },
  { french: "Appelez un médecin!", english: 'Call a doctor!' },
  { french: "L'hôpital", english: 'Hospital' },
  { french: 'La pharmacie', english: 'Pharmacy' },
  { french: 'Le médecin', english: 'Doctor' },
  { french: "J'ai mal...", english: 'I have pain in...' },
  { french: "J'ai besoin de...", english: 'I need...' },
  { french: "Où est le médecin?", english: 'Where is the doctor?' },
  { french: 'Aide-moi!', english: 'Help me!' },
  
  // Social
  { french: "Comment vous appelez-vous?", english: 'What is your name?' },
  { french: 'Je m appelle...', english: 'My name is...' },
  { french: "Enchanté(e)", english: 'Nice to meet you' },
  { french: "Comment allez-vous?", english: 'How are you?' },
  { french: "Très bien, merci", english: 'Very well, thank you' },
  { french: "Et vous?", english: 'And you?' },
  { french: "Je suis américain/américaine", english: "I'm American" },
  { french: "Je suis anglais/anglaise", english: "I'm English" },
  { french: "D'où venez-vous?", english: 'Where are you from?' },
  { french: 'Je viens de...', english: 'I am from...' },
  { french: "Qu'est-ce que vous faites?", english: 'What do you do?' },
  { french: 'Le travail', english: 'Work' },
  { french: 'Les vacances', english: 'Vacation/Holiday' },
  { french: 'Le tourisme', english: 'Tourism' },
];

// Countdown target date: May 9, 2026 (Paris trip)
const TRIP_DATE = new Date('2026-05-09T00:00:00-04:00'); // Eastern time

export default function FrenchWidget() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Rotate phrases every 60 seconds
    const phraseInterval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % FRENCH_PHRASES.length);
    }, 60000);

    // Update countdown
    const updateCountdown = () => {
      const now = new Date();
      const diff = TRIP_DATE.getTime() - now.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown({ days, hours, minutes });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0 });
      }
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 60000);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  const phrase = FRENCH_PHRASES[phraseIndex];

  return (
    <div className="bg-[#2B2930] rounded-2xl p-6">
      {/* Countdown to Trip */}
      <div className="mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">✈️</span>
          <h3 className="text-lg font-medium text-white/70 uppercase tracking-wider">Paris Trip</h3>
        </div>
        <div className="flex gap-4">
          {!mounted ? (
            <div className="text-xl text-white/40">Loading...</div>
          ) : (
            <>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{countdown.days}</div>
                <div className="text-xs text-white/50">Days</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{countdown.hours}</div>
                <div className="text-xs text-white/50">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{countdown.minutes}</div>
                <div className="text-xs text-white/50">Minutes</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* French Phrase */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🇫🇷</span>
        <h3 className="text-xl font-medium text-white/70 uppercase tracking-wider">French</h3>
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-medium text-white">{phrase.french}</div>
        <div className="text-xl text-white/60">{phrase.english}</div>
        <div className="text-xs text-white/30 mt-2">
          {phraseIndex + 1} / {FRENCH_PHRASES.length}
        </div>
      </div>
    </div>
  );
}
