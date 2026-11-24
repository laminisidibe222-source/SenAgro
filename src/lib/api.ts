// Fetch JSON avec session JWT SenAgro — le navigateur ne parle
// jamais directement à Neon ; tout passe par /api (serverless).
const SESSION_KEY = "senagro.session";

export function getStoredSession(): { access_token: string; user: { id: string; email: string; name: string } } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: unknown) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** Fetch JSON + bearer auth — renvoie { data, error }. */
export async function apiFetch(
  path: string,
  options: { method?: string; body?: unknown; requireAuth?: boolean } = {}
): Promise<{ data: any; error: { message: string; status?: number; code?: string } | null }> {
  const { method = "POST", body, requireAuth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (requireAuth) {
    const token = getStoredSession()?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  // A suspended Neon compute can leave the request hanging; fail visibly instead
  // of leaving the dashboard on its skeleton forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(path, {
      method,
      headers,
      signal: controller.signal,
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
    });
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    if (!res.ok) {
      const message =
        (typeof payload?.error === "string" ? payload.error : payload?.error?.message) ??
        `Requête échouée (${res.status}).`;
      return {
        data: null,
        error: { message: String(message), status: res.status, code: payload?.code },
      };
    }
    return { data: payload, error: null };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    const message = aborted ? "Le serveur met trop de temps à répondre. Réessayez." : err instanceof Error ? err.message : "Échec du réseau.";
    return { data: null, error: { message } };
  } finally {
    clearTimeout(timeout);
  }
}

export interface PlanInfo {
  plan: "free" | "pro" | "elite";
  status: string;
  currentPeriodEnd: string | null;
  limits: { label: string; analysesPer30d: number | null };
  analysesLast30d: number;
  remaining: number | null;
}

/** Current plan + quota for the signed-in user. */
export async function getPlanInfo(): Promise<{ data: PlanInfo | null; error: string | null }> {
  const { data, error } = await apiFetch("/api/subscription", { method: "GET" });
  if (error) return { data: null, error: error.message };
  return { data: data as PlanInfo, error: null };
}

/** Create a SasPay checkout for "pro" | "elite" and return the hosted URL. */
export async function startCheckout(plan: "pro" | "elite"): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await apiFetch("/api/pay", { body: { plan } });
  if (error) return { url: null, error: error.message };
  if (!data?.checkout_url) return { url: null, error: "SasPay n'a pas renvoyé d'URL de paiement." };
  return { url: data.checkout_url, error: null };
}
