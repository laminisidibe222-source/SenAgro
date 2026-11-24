import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Lenis from "lenis";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { PublicOnly, RequireAuth } from "./components/RouteGuards";
import Landing from "./pages/Landing";
import Analyze from "./pages/Analyze";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Marketing et formulaires : interdits une fois connecté */}
          <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

          {/* Compte : un visiteur est renvoyé vers l'inscription, puis ramené ici */}
          <Route path="/analyze" element={<RequireAuth to="/signup"><Analyze /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

          {/* Les forfaits se consultent dans les deux cas (page marketing ou coquille compte) */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
