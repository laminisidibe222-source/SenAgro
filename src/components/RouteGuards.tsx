import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/** Seul un chemin interne est accepté comme destination après connexion. */
export function safeNext(raw: unknown, fallback = "/dashboard") {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-page">
      <Loader2 size={26} className="animate-spin text-accent" aria-label="Chargement" />
    </div>
  );
}

/**
 * Routes du compte : visiteur non connecté → inscription (ou connexion),
 * en retenant la page demandée pour l'ouvrir après authentification.
 */
export function RequireAuth({ children, to = "/login" }: { children: ReactNode; to?: "/login" | "/signup" }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={to} replace state={{ from }} />;
  }
  return <>{children}</>;
}

/**
 * Pages marketing et formulaires d'authentification : un compte déjà connecté
 * n'a rien à y faire, il repart sur son tableau de bord.
 */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
