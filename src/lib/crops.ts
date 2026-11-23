export interface Crop {
  id: string;
  name: string;         // nom français (site FR)
  fr: string;           // alias français court (carte)
  tagline: string;
  image: string;
  yieldIdx: number;     // indice de rendement relatif
  water: string;        // besoin en eau
  soil: [number, number]; // plage de pH optimale
  season: string;
  best: string;
}

export const CROPS: Crop[] = [
  { id: "wheat", name: "Blé", fr: "Blé", tagline: "Le grenier du Sahel", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=900&q=80", yieldIdx: 92, water: "Moyenne", soil: [6.0, 7.5], season: "Nov – Mars", best: "Limon profond · pH 6,0–7,5" },
  { id: "corn", name: "Maïs", fr: "Maïs", tagline: "Cycles rapides, gros rendements", image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=900&q=80", yieldIdx: 100, water: "Élevée", soil: [5.8, 7.0], season: "Juin – Oct.", best: "Limon bien drainé · pH 5,8–7,0" },
  { id: "soybean", name: "Soja", fr: "Soja", tagline: "Fixe l'azote en vous nourrissant", image: "https://images.unsplash.com/photo-1625246333195-78d4f61ad8dc?w=900&q=80", yieldIdx: 88, water: "Moyenne", soil: [6.0, 6.8], season: "Juin – Oct.", best: "Limon argileux · pH 6,0–6,8" },
  { id: "sorghum", name: "Sorgho", fr: "Sorgho", tagline: "Conçu pour la saison sèche", image: "https://images.unsplash.com/photo-1601758123927-2d4b1a8b8f0a?w=900&q=80", yieldIdx: 84, water: "Faible", soil: [5.5, 8.0], season: "Juin – Sep.", best: "Limon sableux · pH 5,5–8,0" },
  { id: "millet", name: "Millet perlé", fr: "Millet", tagline: "Prospère avec presque aucune pluie", image: "https://images.unsplash.com/photo-1596035207222-e0e8c8b3a8f3?w=900&q=80", yieldIdx: 76, water: "Très faible", soil: [5.0, 8.5], season: "Juin – Sep.", best: "Sols sableux · pH 5,0–8,5" },
  { id: "rice", name: "Riz", fr: "Riz", tagline: "Uniquement là où l'eau tient", image: "https://images.unsplash.com/photo-1536304993881-ff86e4d515c9?w=900&q=80", yieldIdx: 95, water: "Très élevée", soil: [5.5, 7.0], season: "Juil. – Oct.", best: "Bas-fonds argileux · pH 5,5–7,0" },
  { id: "peanut", name: "Arachide", fr: "Arachide", tagline: "La culture de rente dorée du Sénégal", image: "https://images.unsplash.com/photo-1568108776012-f43c4d6a3a52?w=900&q=80", yieldIdx: 81, water: "Moyenne", soil: [5.3, 6.8], season: "Juin – Oct.", best: "Limon sableux léger · pH 5,3–6,8" },
];
