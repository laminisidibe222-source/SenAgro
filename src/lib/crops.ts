export interface Crop {
  id: string;
  name: string;         // nom français (site FR)
  fr: string;           // alias français court (carte)
  tagline: string;
  image: string;
  yieldIdx: number;     // indice de rendement relatif
  water: string;        // besoin en eau
  soil: [number, number]; // plage de pH optimale
  soils: ("loam" | "clay" | "sandy" | "silt")[]; // textures où la culture est réellement viable
  moisture: [number, number]; // humidité du sol optimale, en %
  season: string;
  best: string;
}

export const CROPS: Crop[] = [
  { id: "wheat", name: "Blé", fr: "Blé", tagline: "Le grenier du Sahel", image: "/crops/wheat.jpg", yieldIdx: 92, water: "Moyenne", soil: [6.0, 7.5], soils: ["loam", "clay"], moisture: [40, 65], season: "Nov – Mars", best: "Limon profond · pH 6,0–7,5" },
  { id: "corn", name: "Maïs", fr: "Maïs", tagline: "Cycles rapides, gros rendements", image: "/crops/corn.jpg", yieldIdx: 100, water: "Élevée", soil: [5.8, 7.0], soils: ["loam", "silt"], moisture: [50, 75], season: "Juin – Oct.", best: "Limon bien drainé · pH 5,8–7,0" },
  { id: "soybean", name: "Soja", fr: "Soja", tagline: "Fixe l'azote en vous nourrissant", image: "/crops/soybean.jpg", yieldIdx: 88, water: "Moyenne", soil: [6.0, 6.8], soils: ["clay", "loam"], moisture: [45, 70], season: "Juin – Oct.", best: "Limon argileux · pH 6,0–6,8" },
  { id: "sorghum", name: "Sorgho", fr: "Sorgho", tagline: "Conçu pour la saison sèche", image: "/crops/sorghum.jpg", yieldIdx: 84, water: "Faible", soil: [5.5, 8.0], soils: ["sandy", "loam"], moisture: [25, 50], season: "Juin – Sep.", best: "Limon sableux · pH 5,5–8,0" },
  { id: "millet", name: "Millet perlé", fr: "Millet", tagline: "Prospère avec presque aucune pluie", image: "/crops/millet.jpg", yieldIdx: 76, water: "Très faible", soil: [5.0, 8.5], soils: ["sandy"], moisture: [15, 40], season: "Juin – Sep.", best: "Sols sableux · pH 5,0–8,5" },
  { id: "rice", name: "Riz", fr: "Riz", tagline: "Uniquement là où l'eau tient", image: "/crops/rice.jpg", yieldIdx: 95, water: "Très élevée", soil: [5.5, 7.0], soils: ["clay", "silt"], moisture: [60, 90], season: "Juil. – Oct.", best: "Bas-fonds argileux · pH 5,5–7,0" },
  { id: "peanut", name: "Arachide", fr: "Arachide", tagline: "La culture de rente dorée du Sénégal", image: "/crops/peanut.jpg", yieldIdx: 81, water: "Moyenne", soil: [5.3, 6.8], soils: ["sandy", "loam"], moisture: [25, 50], season: "Juin – Oct.", best: "Limon sableux léger · pH 5,3–6,8" },
];
