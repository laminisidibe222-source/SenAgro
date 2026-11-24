import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Leaf, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
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
    else navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen bg-page text-ink">
      {/* Formulaire */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <Link to="/" className="mono mb-10 text-[10px] uppercase tracking-[0.3em] text-ink/40 hover:text-accent">
          ← SenAgro
        </Link>
        <h1 className="font-display text-4xl font-bold text-ink">Bon retour,<br /><span className="text-gradient-gold">agriculteur.</span></h1>
        <p className="mt-3 text-ink-soft">Connectez-vous pour retrouver vos parcelles et recommandations.</p>

        {error && (
          <div className="mt-6 flex gap-2 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />{error}
          </div>
        )}

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mono mb-1.5 block text-[10px] uppercase tracking-widest text-ink/50">E-mail</label>
            <div className="relative">
              <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
              <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exploitation.com" className="w-full rounded-2xl border border-ink/10 bg-white py-3.5 pl-12 pr-4 text-ink placeholder-ink/30 outline-none focus:border-gold-400/50" />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mono mb-1.5 block text-[10px] uppercase tracking-widest text-ink/50">Mot de passe</label>
            <div className="relative">
              <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
              <input id="password" type={showPw ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-2xl border border-ink/10 bg-white py-3.5 pl-12 pr-12 text-ink placeholder-ink/30 outline-none focus:border-gold-400/50" />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Masquer" : "Afficher"} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full justify-center !py-4 disabled:opacity-60">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Connexion…</> : (<>Se connecter <ArrowRight size={17} /></>)}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink/55">
          Pas encore de compte ?{" "}
          <Link to="/signup" className="font-semibold text-accent hover:text-accent">Créez-en un</Link>
        </p>
      </div>

      {/* Panneau visuel (desktop) */}
      <div className="relative hidden overflow-hidden border-l border-ink/5 lg:block lg:w-1/2">
        <div className="absolute inset-0 bg-[#141a10]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('/scenes/senegal-field.jpg')" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(16,15,12,0.9)_100%)]" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold-400 text-[#241a05]">
            <Leaf size={24} strokeWidth={2.2} />
          </div>
          <h2 className="font-display mt-5 text-3xl font-bold leading-tight text-white">
            La terre a des choses<br />à vous dire.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/70">
            SenAgro traduit le sol, le climat et la biologie en décisions — pour chaque hectare, chaque saison.
          </p>
        </div>
      </div>
    </div>
  );
}
