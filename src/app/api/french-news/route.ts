import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Sample French news headlines for language learning
// These rotate to provide variety
const FRENCH_HEADLINES = [
  "Le président announce une nouvelle politique économique",
  "La météo prévoit des températures record pour ce week-end",
  "Les négociations commerciales reprendre à Paris",
  "Une découverte scientifique majeure dans le domaine médical",
  "Le championship de football débute ce samedi",
  "Les actions de l'entreprise montent en bourse",
  "Le gouvernement présente son budget annuel",
  "Une nouvelle espèce animale découverte en Amazonie",
  "Le sommet européen se tient à Bruxelles",
  "Les étudiants manifestent pour le climat",
  "Une œuvre d'art restaurée après dix ans de travail",
  "Le tourisme reprend dans les régions françaises",
  "Les technologies de l'IA se développent rapidement",
  "La culture française honored lors d'une cérémonie",
  "Les infrastructures de transport s'améliorer",
  "Un nuevo traité signé entre les deux pays",
  "Les entreprises françaises investissent à l'étranger",
  "La littérature française celebrate son patrimoine",
  "Le sport français brille aux compétitions internationales",
  "Les questions environnementales au cœur du débat public"
];

export async function GET() {
  // Return shuffled headlines for variety
  const shuffled = [...FRENCH_HEADLINES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 8);
  
  return NextResponse.json({ 
    headlines: shuffled,
    source: 'French News (Sample)'
  });
}
