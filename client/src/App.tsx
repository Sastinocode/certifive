import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "./hooks/useAuth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicForm from "./pages/PublicForm";
import PublicSolicitud from "./pages/PublicSolicitud";
import PublicPresupuesto from "./pages/PublicPresupuesto";
import PublicPayment from "./pages/PublicPayment";
import PublicCEEForm from "./pages/PublicCEEForm";
import CertifierLanding from "./pages/CertifierLanding";
import Layout from "./components/Layout";

type View = "landing" | "login" | "register";

function AppContent() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<View>("landing");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-white font-black text-2xl">C5</span>
          </div>
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (user) return <Layout />;

  if (view === "login") return <Login onBack={() => setView("landing")} onShowRegister={() => setView("register")} />;
  if (view === "register") return <Register onBack={() => setView("landing")} onShowLogin={() => setView("login")} />;

  return <Landing onShowLogin={() => setView("login")} onShowRegister={() => setView("register")} />;
}

export default function App() {
  const path = window.location.pathname;

  const formMatch = path.match(/^\/form\/([A-Za-z0-9_-]+)$/);
  if (formMatch) {
    return (
      <QueryClientProvider client={queryClient}>
        <PublicForm token={formMatch[1]} />
      </QueryClientProvider>
    );
  }

  const solicitudMatch = path.match(/^\/solicitud\/([A-Za-z0-9_-]+)$/);
  if (solicitudMatch) {
    return (
      <QueryClientProvider client={queryClient}>
        <PublicSolicitud token={solicitudMatch[1]} />
      </QueryClientProvider>
    );
  }

  const presupuestoMatch = path.match(/^\/presupuesto\/([A-Za-z0-9_-]+)$/);
  if (presupuestoMatch) {
    return (
      <QueryClientProvider client={queryClient}>
        <PublicPresupuesto token={presupuestoMatch[1]} />
      </QueryClientProvider>
    );
  }

  const payMatch = path.match(/^\/pay\/([A-Za-z0-9_-]+)$/);
  if (payMatch) {
    return (
      <QueryClientProvider client={queryClient}>
        <PublicPayment token={payMatch[1]} />
      </QueryClientProvider>
    );
  }

  const ceeMatch = path.match(/^\/formulario-cee\/([A-Za-z0-9_-]+)$/);
  if (ceeMatch) {
    return (
      <QueryClientProvider client={queryClient}>
        <PublicCEEForm token={ceeMatch[1]} />
      </QueryClientProvider>
    );
  }

  const certifierMatch = path.match(/^\/c\/([A-Za-z0-9_-]+)$/);
  if (certifierMatch) {
    return (
      <QueryClientProvider client={queryClient}>
        <CertifierLanding slug={certifierMatch[1]} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
