import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { Bot, ArrowRight, CheckCircle, Users, Sparkles } from "lucide-react";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 3,
  duration: 4 + Math.random() * 6,
  delay: Math.random() * 4,
}));

export default function Automations() {
  const [selectedTab, setSelectedTab] = useState("automations");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/waitlist/count/automations"],
  });

  const joinMutation = useMutation({
    mutationFn: (data: { email?: string; phone?: string; module: string }) =>
      apiRequest("POST", "/api/waitlist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist/count/automations"] });
      setSubmitted(true);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar tu registro. Inténtalo de nuevo.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;
    const isEmail = contact.includes("@");
    joinMutation.mutate({
      module: "automations",
      ...(isEmail ? { email: contact.trim() } : { phone: contact.trim() }),
    });
  };

  const count = countData?.count ?? 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0F172A" }}>
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />

      <div className="flex-1 overflow-y-auto relative">
        {/* Animated background */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", top: "-15%", right: "-10%", width: "55%", height: "55%", borderRadius: "50%", background: "radial-gradient(circle, #0D7C66 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.18, 0.1] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            style={{ position: "absolute", bottom: "-15%", left: "-8%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, #0a5a4a 0%, transparent 70%)" }}
          />
          {/* Grid overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(13,124,102,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(13,124,102,.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              animate={{ y: [0, -40, 0], opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
              style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: "50%", background: "#0D7C66" }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "60px 32px", textAlign: "center" }}>

          {/* Animated icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            style={{ position: "relative", width: 80, height: 80, marginBottom: 32 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px dashed rgba(13,124,102,.5)" }}
            />
            <div style={{ position: "absolute", inset: 6, borderRadius: "50%", background: "rgba(13,124,102,0.15)", border: "1px solid rgba(13,124,102,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={30} color="#0D7C66" />
            </div>
          </motion.div>

          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(13,124,102,0.15)", border: "1px solid rgba(13,124,102,0.35)", borderRadius: 999, padding: "5px 14px", marginBottom: 24 }}
          >
            <motion.span
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#0D7C66", display: "inline-block" }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0D7C66", letterSpacing: ".06em", textTransform: "uppercase" }}>IA en Construcción</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, color: "#fff", letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 20, maxWidth: 600 }}
          >
            Tu despacho.{" "}
            <span style={{ color: "#0D7C66" }}>Automatizado.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: 18, color: "#94A3B8", lineHeight: 1.65, maxWidth: 460, marginBottom: 48 }}
          >
            IA que gestiona, responde y factura por ti. Próximamente en CERTIFIVE.
          </motion.p>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            style={{ width: "100%", maxWidth: 480, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "32px 28px" }}
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                    style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(13,124,102,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <CheckCircle size={28} color="#0D7C66" />
                  </motion.div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>¡Estás en la lista!</p>
                  <p style={{ fontSize: 14, color: "#94A3B8", textAlign: "center" }}>
                    Serás de los primeros en probar las Automatizaciones IA de CERTIFIVE.
                  </p>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ fontSize: 14, color: "#CBD5E1", marginBottom: 4 }}>
                    Déjanos tu email o teléfono y te avisamos el día del lanzamiento.
                  </p>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="tu@email.com o +34 600 000 000"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                      style={{ width: "100%", height: 48, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "0 16px", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => (e.target.style.borderColor = "#0D7C66")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={joinMutation.isPending || !contact.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ height: 48, background: "#0D7C66", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: joinMutation.isPending ? 0.7 : 1, transition: "background .15s" }}
                    onMouseOver={(e) => { if (!joinMutation.isPending) e.currentTarget.style.background = "#0a6454"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "#0D7C66"; }}
                  >
                    {joinMutation.isPending ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%" }} />
                    ) : (
                      <>Notifícame cuando esté listo <ArrowRight size={16} /></>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 28, color: "#64748B", fontSize: 13 }}
          >
            <Users size={14} />
            <span>
              <motion.span
                key={count}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ color: "#0D7C66", fontWeight: 700 }}
              >
                {count > 0 ? count : "…"}
              </motion.span>
              {" "}profesionales ya esperando
            </span>
            <Sparkles size={13} color="#0D7C66" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
