import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { safeNext } from "../components/RouteGuards";
import AuthLayout, { AuthHeading } from "../components/AuthLayout";

const FIELD =
  "w-full rounded-xl border border-ink/8 bg-[#F4F1E8] py-3.5 pl-11 pr-4 text-[13.5px] text-ink placeholder-ink/45 outline-none transition-colors focus:border-gold-400/70 focus:bg-white";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = safeNext((location.state as { from?: string } | null)?.from);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (err) setError(err);
    else navigate(next, { replace: true });
  };

  return (
    <AuthLayout panel="login">
      <AuthHeading title="Bon retour." subtitle="Connectez-vous pour retrouver vos parcelles et vos recommandations." />

      {error && (
        <div className="mt-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700" role="alert">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div className="relative">
          <label htmlFor="email" className="sr-only">
            Adresse e-mail
          </label>
          <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Adresse e-mail"
            className={FIELD}
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className="sr-only">
            Mot de passe
          </label>
          <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            id="password"
            type={showPw ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className={`${FIELD} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-3.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink/40 hover:text-ink"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full justify-center !bg-gold-400 !bg-none !py-3.5 !text-[13.5px] !shadow-[0_10px_24px_-18px_rgba(180,138,24,0.9)] hover:!translate-y-0 hover:!scale-100 disabled:opacity-60">
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Connexion…
            </>
          ) : (
            <>
              Se connecter <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-ink/40">
        <span className="h-px flex-1 bg-ink/15" />
        ou
        <span className="h-px flex-1 bg-ink/15" />
      </div>

      <Link
        to="/signup"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/10 bg-white py-3 text-[13px] font-semibold text-ink transition-colors hover:border-gold-400/60"
      >
        Créer un compte
      </Link>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-ink/40">
        Pas encore de compte agricole ?{" "}
        <Link to="/signup" className="font-semibold text-accent hover:underline">
          Inscrivez-vous en 1 minute
        </Link>
      </p>

      <p className="mt-4 text-center">
        <Link to="/" className="mono text-[9px] uppercase tracking-[0.2em] text-ink/30 hover:text-ink/60">
          ← Retour au site
        </Link>
      </p>
    </AuthLayout>
  );
}
