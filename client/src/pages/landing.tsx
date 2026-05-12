import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";

export default function Landing() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("fu-visible");
            observerRef.current?.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fu").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#0F172A", background: "#fff", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        :root {
          --teal: #0D7C66;
          --teal-dk: #0a6454;
          --teal-lt: #e6f4f1;
          --s900: #0F172A;
          --s700: #334155;
          --s500: #64748B;
          --s400: #94A3B8;
          --s300: #CBD5E1;
          --s200: #E2E8F0;
          --s100: #F1F5F9;
          --s50: #F8FAFC;
          --r: 6px;
          --mw: 1200px;
        }
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes fu { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fu { opacity: 0; }
        .fu-visible { animation: fu .5s cubic-bezier(.16,1,.3,1) forwards; }
        .fu-d1 { animation-delay: .1s; }
        .fu-d2 { animation-delay: .2s; }
        .badge-dot { width:6px;height:6px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite;flex-shrink:0; }
        .mockup-item:hover { background:rgba(255,255,255,.07) !important; }
        .feature-card:hover { border-color:var(--s300) !important; box-shadow:0 4px 24px rgba(15,23,42,.07) !important; transform:translateY(-2px) !important; }
        .step:hover .step-num { background:var(--teal) !important; color:#fff !important; border-color:var(--teal) !important; }
        .sp-logo:hover { color:var(--s400) !important; }
        .nav-link:hover { color:var(--s900) !important; }
        .btn-ghost:hover { border-color:var(--s300) !important; background:var(--s50) !important; color:var(--s900) !important; }
        .testi-card:hover { box-shadow:0 4px 24px rgba(15,23,42,.07); }
        .footer-link:hover { color:var(--s300) !important; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-actions-full { display: none !important; }
          .nav-mobile-cta { display: flex !important; }
          .hamburger { display: flex !important; }

          .mobile-menu {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 64px; left: 0; right: 0;
            background: #fff;
            border-bottom: 1px solid var(--s200);
            padding: 20px 20px 28px;
            gap: 4px;
            z-index: 99;
            box-shadow: 0 8px 24px rgba(15,23,42,.08);
          }
          .mobile-menu a, .mobile-menu button {
            font-size: 15px; font-weight: 500;
            padding: 12px 0;
            border-bottom: 1px solid var(--s100);
            color: var(--s700);
            text-decoration: none;
            background: none;
            border-left: none; border-right: none; border-top: none;
            text-align: left;
            cursor: pointer;
          }
          .mobile-menu .menu-cta {
            margin-top: 12px;
            padding: 13px 20px;
            background: var(--teal);
            color: #fff !important;
            border: none !important;
            border-radius: var(--r);
            text-align: center;
            font-weight: 600;
          }

          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-h1 { font-size: 36px !important; line-height: 1.12 !important; }
          .hero-p { font-size: 16px !important; }
          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .hero-btns button { width: 100% !important; justify-content: center !important; }
          .hero-pill { display: none !important; }
          .hero-mockup-float-top { display: none !important; }
          .hero-mockup-float-bot { display: none !important; }

          .social-proof-inner { flex-wrap: wrap !important; gap: 16px !important; }
          .social-proof-logos { flex-wrap: wrap !important; gap: 16px !important; }
          .social-divider { display: none !important; }

          .features-grid { grid-template-columns: 1fr !important; }
          .section-h2 { font-size: 28px !important; }
          .section-pad { padding: 64px 20px !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .step-connector { display: none !important; }

          .metrics-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .metric-num { font-size: 40px !important; }

          .testi-grid { grid-template-columns: 1fr !important; }

          .cta-btns { flex-direction: column !important; align-items: center !important; }
          .cta-btns button { width: 100% !important; max-width: 320px !important; justify-content: center !important; }

          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .footer-brand { grid-column: 1 / -1 !important; }
          .footer-bottom-inner { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
          .footer-legal-links { flex-wrap: wrap !important; justify-content: center !important; gap: 16px !important; }
        }

        @media (max-width: 480px) {
          .hero-h1 { font-size: 30px !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--s200)",
        transition: "box-shadow .2s",
        boxShadow: scrolled ? "0 1px 12px rgba(15,23,42,.06)" : "none",
      }}>
        <div style={{ maxWidth: "var(--mw)", margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--s900)", flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, background: "var(--teal)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
                <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
                <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
                <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.02em" }}>CERTIFIVE</span>
          </a>

          <ul className="nav-links" style={{ display: "flex", alignItems: "center", gap: 32, listStyle: "none" }}>
            {[["#features","Funcionalidades"],["#how","Cómo funciona"],["#metrics","Resultados"],["#testimonials","Clientes"]].map(([href, label]) => (
              <li key={href}><a href={href} className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: "var(--s500)", textDecoration: "none", transition: "color .15s" }}>{label}</a></li>
            ))}
          </ul>

          <div className="nav-actions-full" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => navigate("/login")} style={{ fontSize: 14, fontWeight: 500, color: "var(--s700)", background: "none", border: "none", cursor: "pointer", padding: "6px 0", transition: "color .15s" }}>
              Iniciar Sesión
            </button>
            <button onClick={() => navigate("/registro")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "var(--teal)", color: "#fff", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
              onMouseOver={e => (e.currentTarget.style.background = "var(--teal-dk)")}
              onMouseOut={e => (e.currentTarget.style.background = "var(--teal)")}>
              Empezar Gratis
            </button>
          </div>

          {/* Mobile right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="nav-mobile-cta"
              onClick={() => navigate("/registro")}
              style={{ display: "none", padding: "8px 16px", background: "var(--teal)", color: "#fff", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Empezar
            </button>
            <button
              className="hamburger"
              onClick={() => setMenuOpen(o => !o)}
              style={{ display: "none", flexDirection: "column", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <span style={{ width: 22, height: 2, background: "var(--s700)", borderRadius: 2, transition: "all .2s", transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }}/>
              <span style={{ width: 22, height: 2, background: "var(--s700)", borderRadius: 2, transition: "all .2s", opacity: menuOpen ? 0 : 1 }}/>
              <span style={{ width: 22, height: 2, background: "var(--s700)", borderRadius: 2, transition: "all .2s", transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }}/>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu">
            {[["#features","Funcionalidades"],["#how","Cómo funciona"],["#metrics","Resultados"],["#testimonials","Clientes"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <button onClick={() => { setMenuOpen(false); navigate("/login"); }}>Iniciar Sesión</button>
            <button className="menu-cta" onClick={() => { setMenuOpen(false); navigate("/registro"); }}>Empezar Gratis</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="section-pad" style={{ paddingTop: 148, paddingBottom: 100, background: "linear-gradient(180deg,#fff 0%,#F8FAFC 100%)" }}>
        <div className="hero-grid" style={{ maxWidth: "var(--mw)", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--teal-lt)", color: "var(--teal)", fontSize: 12, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 4, marginBottom: 28 }}>
              <div className="badge-dot" />
              Plataforma profesional de certificación
            </div>
            <h1 className="hero-h1" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-.03em", color: "var(--s900)", marginBottom: 20, textWrap: "balance" } as any}>
              Automatiza tu negocio de{" "}
              <em style={{ fontStyle: "normal", color: "var(--teal)" }}>certificación energética.</em>
            </h1>
            <p className="hero-p" style={{ fontSize: 18, lineHeight: 1.7, color: "var(--s500)", marginBottom: 40, maxWidth: 480, fontWeight: 400 }}>
              Gestiona expedientes, genera certificados CEE y presenta ante el registro autonómico — todo desde una sola plataforma diseñada para técnicos habilitados.
            </p>
            <div className="hero-btns" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 44 }}>
              <button onClick={() => navigate("/registro")}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "var(--teal)", color: "#fff", border: "none", borderRadius: "var(--r)", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
                onMouseOver={e => (e.currentTarget.style.background = "var(--teal-dk)")}
                onMouseOut={e => (e.currentTarget.style.background = "var(--teal)")}>
                Empezar Gratis — 7 días gratis
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--s400)" }}>
              <div style={{ display: "flex" }}>
                {["M","A","R","L","+"].map((l, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #fff", background: "var(--s200)", marginRight: i < 4 ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "var(--s500)", zIndex: 5 - i }}>{l}</div>
                ))}
              </div>
              <span>+2.400 técnicos certificadores en España</span>
            </div>
          </div>

          {/* Dark mockup */}
          <div style={{ position: "relative" }}>
            <div className="hero-mockup-float-top" style={{ position: "absolute", top: -16, right: -20, background: "#fff", border: "1px solid var(--s200)", borderRadius: 8, padding: "12px 16px", boxShadow: "0 8px 24px rgba(15,23,42,.10)", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", zIndex: 10 }}>
              <div style={{ width: 32, height: 32, background: "var(--teal-lt)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2z" fill="#0D7C66"/></svg>
              </div>
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: "var(--s900)" }}>Certificado generado</div>
                <div style={{ color: "var(--s500)", fontSize: 11 }}>C/ Serrano 44, Madrid · hace 2 min</div>
              </div>
            </div>

            <div style={{ background: "var(--s900)", borderRadius: 10, overflow: "hidden", boxShadow: "0 24px 64px rgba(15,23,42,.18),0 2px 8px rgba(15,23,42,.08)", border: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ background: "rgba(255,255,255,.04)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }}/>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }}/>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }}/>
                <div style={{ flex: 1, background: "rgba(255,255,255,.05)", height: 22, borderRadius: 4, margin: "0 16px", display: "flex", alignItems: "center", padding: "0 10px" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.25)", fontFamily: "monospace" }}>certifive.app/dashboard</span>
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>Expedientes activos</span>
                  <span style={{ fontSize: 10, background: "var(--teal)", color: "#fff", padding: "2px 8px", borderRadius: 3, fontWeight: 600, letterSpacing: ".04em" }}>LIVE</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { name: "Edificio Paseo de Gracia 78", meta: "Barcelona · Vivienda unifamiliar", status: "Completado", done: true, rev: false },
                    { name: "C/ Alcalá 200, Madrid", meta: "Madrid · Oficinas", status: "En revisión", done: false, rev: true },
                    { name: "Avda. Diagonal 550, Barcelona", meta: "Barcelona · Bloque plurifamiliar", status: "Pendiente", done: false, rev: false },
                    { name: "Plaza España 1, Sevilla", meta: "Sevilla · Vivienda unifamiliar", status: "Completado", done: true, rev: false },
                  ].map((item, i) => (
                    <div key={i} className="mockup-item" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 5, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "default", transition: "background .15s" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 4, background: item.done ? "rgba(13,124,102,.15)" : "rgba(100,116,139,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="12" rx="1.5" stroke={item.done ? "#0D7C66" : "#64748B"} strokeWidth="1.2"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke={item.done ? "#0D7C66" : "#64748B"} strokeWidth="1.2" strokeLinecap="round"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.75)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 2 }}>{item.meta}</div>
                      </div>
                      <div style={{ fontSize: 10, padding: "2px 7px", borderRadius: 3, fontWeight: 600, flexShrink: 0, background: item.done ? "rgba(13,124,102,.2)" : item.rev ? "rgba(234,179,8,.15)" : "rgba(100,116,139,.15)", color: item.done ? "#34d399" : item.rev ? "#fbbf24" : "rgba(255,255,255,.4)" }}>
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
                  {[["38","Este mes"],["4.2h","Ahorro/cert."],["99%","Aprobados"]].map(([n, l]) => (
                    <div key={l} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 5, padding: "10px 12px" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--teal)", letterSpacing: "-.02em" }}>{n}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".05em" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="hero-mockup-float-bot" style={{ position: "absolute", bottom: -16, left: -24, background: "#fff", border: "1px solid var(--s200)", borderRadius: 8, padding: "10px 14px", boxShadow: "0 8px 24px rgba(15,23,42,.10)", zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--teal)", letterSpacing: "-.03em" }}>A</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--s500)" }}>Calificación media</div>
                  <div style={{ fontSize: 10, color: "var(--s400)", marginTop: 2 }}>+12% vs. mes anterior</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <div style={{ background: "var(--s50)", borderTop: "1px solid var(--s200)", borderBottom: "1px solid var(--s200)", padding: "28px 24px" }}>
        <div className="social-proof-inner" style={{ maxWidth: "var(--mw)", margin: "0 auto", display: "flex", alignItems: "center", gap: 32 }}>
          <span style={{ fontSize: 12, color: "var(--s400)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap", flexShrink: 0 }}>Usado en</span>
          <div className="social-divider" style={{ width: 1, height: 32, background: "var(--s200)", flexShrink: 0 }}/>
          <div className="social-proof-logos" style={{ display: "flex", alignItems: "center", gap: 32, flex: 1, flexWrap: "nowrap" }}>
            {["Madrid","Catalunya","Andalucía","País Vasco","C. Valenciana"].map(r => (
              <span key={r} className="sp-logo" style={{ fontSize: 13, fontWeight: 700, color: "var(--s300)", letterSpacing: "-.01em", whiteSpace: "nowrap", transition: "color .2s", cursor: "default" }}>{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="section-pad" style={{ padding: "100px 32px" }}>
        <div style={{ maxWidth: "var(--mw)", margin: "0 auto 56px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 12 }}>Funcionalidades</div>
          <h2 className="section-h2" style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-.02em", color: "var(--s900)", marginBottom: 16, textWrap: "balance" } as any}>Todo lo que necesita un técnico habilitado</h2>
          <p style={{ fontSize: 17, color: "var(--s500)", maxWidth: 540, lineHeight: 1.65 }}>Construida desde cero para los flujos reales de la certificación energética en España. Sin compromiso.</p>
        </div>
        <div className="features-grid" style={{ maxWidth: "var(--mw)", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {[
            { title: "Gestión de expedientes", desc: "Centraliza todos tus proyectos con seguimiento en tiempo real. Documentación, planos, datos del cliente y estado del registro, todo en un mismo lugar.", icon: <svg viewBox="0 0 40 40" fill="none" style={{ width: 40, height: 40, color: "var(--teal)", marginBottom: 20 }}><rect x="6" y="4" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 14h16M12 20h16M12 26h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
            { title: "Automatización CE3X / HULC", desc: "Importa resultados directamente desde CE3X y HULC. La plataforma genera el certificado CEE listo para presentar al registro autonómico.", icon: <svg viewBox="0 0 40 40" fill="none" style={{ width: 40, height: 40, color: "var(--teal)", marginBottom: 20 }}><path d="M8 20c0-6.627 5.373-12 12-12s12 5.373 12 12-5.373 12-12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M20 12v8l5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 28l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            { title: "Registro autonómico directo", desc: "Presentación automática ante RUCE y registros autonómicos. Trazabilidad completa de cada trámite con confirmación de recepción integrada.", icon: <svg viewBox="0 0 40 40" fill="none" style={{ width: 40, height: 40, color: "var(--teal)", marginBottom: 20 }}><path d="M20 6l3 8h9l-7 5 3 8-8-6-8 6 3-8-7-5h9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
            { title: "Facturación integrada", desc: "Genera facturas automáticamente al completar un expediente. Control de cobros, recordatorios y exportación contable directa sin apps adicionales.", icon: <svg viewBox="0 0 40 40" fill="none" style={{ width: 40, height: 40, color: "var(--teal)", marginBottom: 20 }}><rect x="8" y="8" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="22" y="8" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="8" y="22" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="22" y="22" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg> },
            { title: "Portal del cliente", desc: "Tus clientes reciben acceso a un portal propio para ver el estado de su certificado, descargar documentos y firmar online. Profesionaliza tu servicio.", icon: <svg viewBox="0 0 40 40" fill="none" style={{ width: 40, height: 40, color: "var(--teal)", marginBottom: 20 }}><circle cx="20" cy="16" r="6" stroke="currentColor" strokeWidth="1.8"/><path d="M8 36c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
            { title: "Análisis y métricas", desc: "Panel de control con ingresos por periodo, rendimiento por tipo de inmueble, tiempo medio por expediente y comparativas mensuales detalladas.", icon: <svg viewBox="0 0 40 40" fill="none" style={{ width: 40, height: 40, color: "var(--teal)", marginBottom: 20 }}><path d="M8 28V16l12-8 12 8v12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><rect x="14" y="22" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M20 22v10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
          ].map((f, i) => (
            <div key={i} className={`feature-card fu ${i > 0 ? (i % 3 === 1 ? "fu-d1" : "fu-d2") : ""}`} style={{ background: "#fff", border: "1px solid var(--s200)", borderRadius: 8, padding: "32px 28px", transition: "border-color .2s,box-shadow .2s,transform .2s", cursor: "default" }}>
              {f.icon}
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--s900)", marginBottom: 8, letterSpacing: "-.01em" }}>{f.title}</div>
              <p style={{ fontSize: 14, color: "var(--s500)", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="section-pad" style={{ padding: "100px 32px", background: "var(--s50)", borderTop: "1px solid var(--s200)", borderBottom: "1px solid var(--s200)" }}>
        <div style={{ maxWidth: "var(--mw)", margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 12 }}>Proceso</div>
          <h2 className="section-h2" style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-.02em", color: "var(--s900)", marginBottom: 16 }}>De la visita al certificado en cuatro pasos</h2>
          <p style={{ fontSize: 17, color: "var(--s500)", maxWidth: 540, lineHeight: 1.65 }}>Un flujo diseñado para eliminar el trabajo administrativo repetitivo y que puedas centrarte en lo técnico.</p>

          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, position: "relative", marginTop: 56 }}>
            <div className="step-connector" style={{ position: "absolute", top: 24, left: "calc(12.5% + 20px)", right: "calc(12.5% + 20px)", height: 1, background: "var(--s200)" }}/>
            {[
              { n: "01", title: "Alta del expediente", desc: "Crea el proyecto con los datos del inmueble y el propietario. La plataforma genera automáticamente la documentación inicial." },
              { n: "02", title: "Cálculo y simulación", desc: "Importa tu archivo de CE3X o HULC. CERTIFIVE extrae los datos, calcula la calificación y detecta posibles incidencias antes de presentar." },
              { n: "03", title: "Generación del certificado", desc: "El sistema genera el certificado CEE con todos los campos requeridos por la normativa vigente, listo para firma digital cualificada." },
              { n: "04", title: "Presentación al registro", desc: "Presentación automática ante el registro autonómico correspondiente. Recibirás confirmación y el número de inscripción en tu panel." },
            ].map((s, i) => (
              <div key={i} className="step" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "0 20px", position: "relative" }}>
                <div className="step-num fu" style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", border: "1px solid var(--s200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--teal)", marginBottom: 24, position: "relative", zIndex: 1, transition: "background .2s,border-color .2s,color .2s" }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--s900)", marginBottom: 8, letterSpacing: "-.01em" }}>{s.title}</div>
                <p style={{ fontSize: 13, color: "var(--s500)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── METRICS ── */}
      <section id="metrics" className="section-pad" style={{ background: "var(--s900)", padding: "100px 32px" }}>
        <div className="metrics-grid" style={{ maxWidth: "var(--mw)", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 12 }}>Resultados</div>
            <h2 className="section-h2" style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-.02em", color: "#fff", marginBottom: 16 }}>Cifras que hablan por sí solas</h2>
            <p style={{ fontSize: 17, color: "var(--s400)", maxWidth: 440, lineHeight: 1.65 }}>Los técnicos que usan CERTIFIVE procesan más expedientes, cometen menos errores y cobran antes. Los datos son de nuestra propia plataforma.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {[
              { n: "4.2h", l: "ahorradas por expediente frente al proceso manual" },
              { n: "+2.400", l: "técnicos certificadores activos en España" },
              { n: "98.7%", l: "de expedientes aprobados al primer intento" },
            ].map((m, i) => (
              <div key={i} className={`fu ${i > 0 ? (i === 1 ? "fu-d1" : "fu-d2") : ""}`} style={{ borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 28 }}>
                <div className="metric-num" style={{ fontSize: 52, fontWeight: 800, color: "var(--teal)", letterSpacing: "-.04em", lineHeight: 1, marginBottom: 6 }}>{m.n}</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,.55)", fontWeight: 400 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="section-pad" style={{ padding: "100px 32px", background: "#fff" }}>
        <div style={{ maxWidth: "var(--mw)", margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 12 }}>Testimonios</div>
          <h2 className="section-h2" style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-.02em", color: "var(--s900)", marginBottom: 8 }}>Lo que dicen los técnicos</h2>
          <p style={{ fontSize: 17, color: "var(--s500)", marginBottom: 48 }}>Profesionales reales. Resultados reales.</p>
          <div className="testi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { text: '"Antes tardaba un día entero en completar un expediente. Con CERTIFIVE lo tengo listo en dos horas y el registro autonómico lo acepta a la primera. La diferencia es brutal."', name: "Miguel Ángel Torres", role: "Ingeniero Industrial · Madrid", init: "MA" },
              { text: '"La integración con CE3X es un antes y un después. Nada de copiar datos a mano. El sistema los importa, los valida y genera el certificado en minutos. Puro ahorro."', name: "Laura García Fonts", role: "Arquitecta Técnica · Barcelona", init: "LG" },
              { text: '"Gestiono más de 60 expedientes al mes yo solo. Sin CERTIFIVE sería imposible. El portal del cliente también me ha diferenciado mucho frente a otros técnicos de la zona."', name: "Roberto Vega Morales", role: "Ingeniero de Edificación · Sevilla", init: "RV" },
            ].map((t, i) => (
              <div key={i} className="testi-card fu" style={{ border: "1px solid var(--s200)", borderRadius: 8, padding: "28px 24px", background: "#fff", transition: "box-shadow .2s" }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                  {"★★★★★".split("").map((s, j) => <span key={j} style={{ color: "var(--teal)", fontSize: 14 }}>{s}</span>)}
                </div>
                <p style={{ fontSize: 14, color: "var(--s700)", lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>{t.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--s100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--s500)", flexShrink: 0 }}>{t.init}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--s900)" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--s400)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="section-pad" style={{ padding: "100px 32px", textAlign: "center", background: "var(--s50)", borderTop: "1px solid var(--s200)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 12 }}>Empieza hoy</div>
          <h2 className="section-h2" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-.02em", color: "var(--s900)", marginBottom: 16 }}>Tu despacho merece herramientas profesionales</h2>
          <p style={{ fontSize: 17, color: "var(--s500)", margin: "0 auto 40px", lineHeight: 1.65 }}>7 días de prueba gratuita. Sin tarjeta de crédito. Sin permanencia.</p>
          <div className="cta-btns" style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
            <button onClick={() => navigate("/registro")}
              style={{ padding: "14px 32px", fontSize: 15, fontWeight: 600, borderRadius: "var(--r)", cursor: "pointer", transition: "all .15s", background: "var(--teal)", color: "#fff", border: "none" }}
              onMouseOver={e => (e.currentTarget.style.background = "var(--teal-dk)")}
              onMouseOut={e => (e.currentTarget.style.background = "var(--teal)")}>
              Empezar Gratis — 7 días
            </button>
          </div>
          <p style={{ fontSize: 13, color: "var(--s400)" }}>
            ¿Tienes un equipo grande?{" "}
            <a href="#" style={{ color: "var(--teal)", textDecoration: "none", fontWeight: 500 }}>Contacta para precios Enterprise.</a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "var(--s900)", padding: "60px 24px 40px", color: "var(--s400)" }}>
        <div style={{ maxWidth: "var(--mw)", margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div className="footer-brand">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 24, height: 24, background: "var(--teal)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9"/><rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9"/></svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>CERTIFIVE</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--s500)", maxWidth: 240 }}>Plataforma de automatización para técnicos de certificación energética en España.</p>
            </div>
            {[
              { title: "Producto", links: ["Funcionalidades","Precios","Novedades","Hoja de ruta","API"] },
              { title: "Recursos", links: ["Documentación","Guías de inicio","Webinars","Blog","Soporte"] },
              { title: "Empresa", links: ["Sobre nosotros","Contacto","Prensa","Afiliados"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(255,255,255,.45)", marginBottom: 16 }}>{col.title}</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="footer-link" style={{ fontSize: 13, color: "var(--s500)", textDecoration: "none", transition: "color .15s" }}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 28 }}>
            <div className="footer-bottom-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--s500)" }}>© 2026 CERTIFIVE Technologies S.L. Todos los derechos reservados.</span>
              <div className="footer-legal-links" style={{ display: "flex", gap: 24 }}>
                {["Privacidad","Términos","Cookies","RGPD"].map(l => (
                  <a key={l} href="#" className="footer-link" style={{ fontSize: 12, color: "var(--s500)", textDecoration: "none", transition: "color .15s" }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    