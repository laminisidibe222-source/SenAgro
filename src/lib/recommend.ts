import { CROPS, type Crop } from "./crops";

/**
 * Recommendation engine.
 *
 * Four signals decide the crop, each capped so no single one can carry a
 * decision the soil cannot support:
 *   pH fit (0–44) · soil match (0–24) · moisture fit (0–22) · goal (0–10)
 *
 * The previous version gave every crop the same soil bonus and ignored the
 * moisture reading, so the highest-yielding crop won almost every time —
 * which is why Maïs came back whatever the input.
 */
export type SoilId = "loam" | "clay" | "sandy" | "silt";

export interface RecommendationResult {
  crop: string;
  reason: string;
  score: number;
  water: string;
  pH: string;
  plan: string[];
  breakdown: { crop: string; total: number }[];
}

const SOIL_LABEL: Record<SoilId, string> = {
  loam: "limon",
  clay: "argile",
  sandy: "sable",
  silt: "limon alluvial",
};

const CASH: Record<string, number> = { peanut: 10, corn: 8, soybean: 7, rice: 6, wheat: 5, sorghum: 5, millet: 4 };
const SUSTAIN: Record<string, number> = { soybean: 10, millet: 9, sorghum: 7, peanut: 7, wheat: 6, corn: 4, rice: 3 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function scoreCrop(crop: Crop, ph: number, moisture: number, soil: SoilId, goal: string) {
  const [lo, hi] = crop.soil;
  const centre = (lo + hi) / 2;
  const half = Math.max(0.2, (hi - lo) / 2);

  // pH: full marks inside the band, a soft preference near its centre.
  const outside = ph < lo ? lo - ph : ph > hi ? ph - hi : 0;
  const centring = outside === 0 ? 4 * (1 - Math.abs(ph - centre) / half) : 0;
  const phScore = outside === 0 ? 40 + centring : Math.max(0, 40 + centring - outside * 16);

  // Soil: only the textures the crop can actually be grown on score high.
  const soilScore = crop.soils.includes(soil) ? 24 : 0;

  // Moisture: distance to the crop's band, 2 points per missing percent.
  const [mLo, mHi] = crop.moisture;
  const mMiss = moisture < mLo ? mLo - moisture : moisture > mHi ? moisture - mHi : 0;
  const moistureScore = mMiss === 0 ? 22 : Math.max(0, 22 - mMiss * 2.2);

  // Goal: a preference weight, never more than 10 points.
  const goalScore =
    goal === "max_yield" ? crop.yieldIdx / 10 : goal === "cash" ? (CASH[crop.id] ?? 4) : (SUSTAIN[crop.id] ?? 4);

  return { phScore, soilScore, moistureScore, goalScore, total: phScore + soilScore + moistureScore + goalScore };
}

export function recommend(ph: number, moisture: number, soil: SoilId, goal: string): RecommendationResult {
  const ranked = CROPS.map((crop) => {
    const s = scoreCrop(crop, ph, moisture, soil, goal);
    // Round for display, keep decimals for a deterministic sort.
    return { crop, ...s, shown: Math.min(98, Math.round(s.total)) };
  }).sort((a, b) => b.total - a.total || a.crop.name.localeCompare(b.crop.name));

  const best = ranked[0];
  const crop = best.crop;
  const score = best.shown;

  const n1 = (v: number) => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const reasons = [
    `pH ${n1(ph)} dans sa plage ${n1(crop.soil[0])}–${n1(crop.soil[1])}`,
    `sol ${SOIL_LABEL[soil]} compatible`,
    `humidité ${Math.round(moisture)} % dans sa plage ${crop.moisture[0]}–${crop.moisture[1]} %`,
    goal === "max_yield"
      ? "le meilleur potentiel de rendement de la sélection"
      : goal === "cash"
        ? "le meilleur revenu à l'hectare de la sélection"
        : "elle protège le capital sol de la parcelle",
  ];
  const reason = `${crop.tagline}. Adaptée car : ${reasons.join(" · ")}.`;

  return {
    crop: crop.name,
    reason,
    score,
    water: crop.water,
    pH: `${crop.soil[0].toLocaleString("fr-FR")}–${crop.soil[1].toLocaleString("fr-FR")}`,
    plan: [
      `Semaines 1–2 · Préparation : labour adapté au sol ${SOIL_LABEL[soil]} + chaulage vers pH ${(
        (crop.soil[0] + crop.soil[1]) /
        2
      ).toFixed(1)}`,
      `Semaine 3 · Semis de ${crop.name}, écartement selon la densité recommandée`,
      `Semaines 5–6 · Premier désherbage + apport d'engrais NPK fractionné`,
      `Semaines 10–12 · Contrôle du stress hydrique — irriguer sous 35 %`,
      `Récolte · À maturité physiologique ; restituer les résidus au sol`,
    ],
    breakdown: ranked.map((r) => ({ crop: r.crop.name, total: r.shown })),
  };
}

export { clamp };
