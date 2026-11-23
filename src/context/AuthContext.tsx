import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  apiFetch,
  getStoredSession,
  setStoredSession,
  clearStoredSession,
} from "../lib/api";

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function applyPayload(payload: any): { user: AppUser | null; error: string | null } {
  // Accepte la forme { session: { access_token, user } } renvoyée par /api/auth
  const sess = payload?.session;
  if (sess?.access_token && sess?.user?.id) {
    setStoredSession(sess);
    return { user: { id: sess.user.id, email: sess.user.email, name: sess.user.name ?? "" }, error: null };
  }
  return { user: null, error: "Réponse d'authentification inattendue." };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = getStoredSession();
      if (stored?.access_token) {
        const { data } = await apiFetch("/api/auth", { body: { action: "me" } });
        if (cancelled) return;
        if (data?.user) setUser({ id: data.user.id, email: data.user.email, name: data.user.name ?? "" });
        else clearStoredSession();
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { data, error } = await apiFetch("/api/auth", {
      body: { action: "signin", email, password },
      requireAuth: false,
    });
    if (error) return { error: error.message };
    const { user: u, error: e } = applyPayload(data);
    setUser(u);
    return { error: e };
  };

  const signUp: AuthContextValue["signUp"] = async (name, email, password) => {
    const { data, error } = await apiFetch("/api/auth", {
      body: { action: "signup", name, email, password },
      requireAuth: false,
    });
    if (error) return { error: error.message };
    const { user: u, error: e } = applyPayload(data);
    setUser(u);
    return { error: e };
  };

  const signOut = () => {
    clearStoredSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
