export interface SavedAnalysis {
  id: string;
  parcel_name: string | null;
  ph: string | number | null;
  moisture_pct: number | null;
  hectares: string | number | null;
  soil_type: string | null;
  goal: string | null;
  fit_score: number | null;
  recommendation: { crop?: string; reason?: string; water?: string } | null;
  created_at: string;
}

export const SOIL_LABELS: Record<string, string> = {
  loam: "Limon profond",
  clay: "Argile / Latérite",
  sandy: "Sableux",
  silt: "Limon alluvial",
};

export const GOAL_LABELS: Record<string, string> = {
  max_yield: "Rendement maximal",
  cash: "Meilleur prix / ha",
  sustainability: "Santé du sol",
};

export function num(value: unknown): number {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
