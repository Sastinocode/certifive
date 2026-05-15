import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [calcCerts, setCalcCerts] = useState(10);
  const [heroTab, setHeroTab] = useState("Expedientes");
  const [showcaseTab, setShowcaseTab] = useState("Expedientes");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const layers = Array.from(document.querySelectorAll<HTMLElement>(".parallax-layer")).map(el => ({
      el,
      speed: parseFloat(el.dataset.speed || "0.2"),
      rotate: parseFloat(el.dataset.rotate || "0"),
    }));
    let scrollY = window.scrollY;
    let ticking = false;
    function update() {
      for (const l of layers) {
        const y = scrollY * l.speed;
        const r = scrollY * l.rotate * 0.02;
        l.el.style.transform = `translate3d(0,${y}px,0)` + (r ? ` rotate(${r}deg)` : "");
      }
      ticking = false;
    }
    const onParallax = () => {
      scrollY = window.scrollY;
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    };
    window.addEventListener("scroll", onParallax, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onParallax);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  // Plan checkout: redirect to Stripe if authenticated, otherwise to /register
  const startPlan = async (plan: string) => {
    if (!isAuthenticated) { navigate("/register"); return; }
    try {
      const data = await apiRequest("POST", "/api/stripe/create-checkout-session", { plan });
      if (data.url) window.location.href = data.url;
    } catch {
      navigate("/register");
    }
  };

  const prices = {
    basic:   { m: "19", a: "15", annual: "190€/año — 2 meses gratis" },
    pro:     { m: "49", a: "40", annual: "490€/año — 2 meses gratis" },
    empresa: { m: "99", a: "82", annual: "990€/año — 2 meses gratis" },
  };
  const P = (k: keyof typeof prices) => isAnnual ? prices[k].a : prices[k].m;
  const Ann = (k: keyof typeof prices) => isAnnual ? prices[k].annual : "";

  const steps = [
    { n: "01", t: "Envía el enlace al cliente", d: "Con un clic mandas por WhatsApp un formulario personalizado. El cliente rellena sus datos desde el móvil. Sin llamadas, sin papeleos, sin ir al inmueble antes de tiempo." },
    { n: "02", t: "El cliente rellena en 2 minutos", d: "Datos del inmueble, fotos, acceso. Todo desde su móvil. Tú no tocas nada hasta que esté completo. Cero correos de ida y vuelta." },
    { n: "03", t: "Certifive cruza con el Catastro", d: "La API del Catastro rellena automáticamente superficie, año de construcción y referencia catastral. Sin errores manuales. Sin buscar PDFs." },
    { n: "04", t: "Tú decides cómo cobras", d: "Fija tu tarifa, añade extras, aplica descuentos. La factura se genera sola y el cobro queda registrado en tu panel." },
    { n: "05", t: "Envía el certificado y factura ×5", d: "El certificado llega al cliente por WhatsApp o email con un clic. Expediente cerrado. Tú ya estás con el siguiente." },
  ];

  const faqs = [
    { q: "¿Sustituye Certifive a CE3X o HULC?", a: "No. CE3X y HULC siguen siendo tuyas para el cálculo energético. Certifive se integra con ellas e importa los resultados, automatizando todo lo demás: expediente, certificado, registro, facturación y comunicación con el cliente." },
    { q: "¿Funciona con todas las comunidades autónomas?", a: "Sí. Certifive presenta automáticamente ante los registros autonómicos de Madrid, Cataluña, Andalucía, País Vasco, Comunidad Valenciana, Galicia y el resto del territorio español." },
    { q: "¿Cuánto tiempo tardo en empezar?", a: "Menos de 15 minutos. Te damos acceso, importas tus clientes desde Excel o tu CRM, y puedes presentar tu primer expediente el mismo día. Soporte gratuito durante todo el onboarding." },
    { q: "¿Hay permanencia o coste de implantación?", a: "Cero. 7 días de prueba gratuita sin tarjeta, planes mensuales sin permanencia, y cancelación con un solo clic. Si necesitas formación para tu equipo está incluida en cualquier plan." },
    { q: "¿Puedo usar Certifive si solo hago certificados puntualmente?", a: "Sí. El plan Pay-per-use a 3€/certificado es perfecto para técnicos que certifican de forma esporádica. Sin cuota mensual, sin compromisos, pagas solo lo que usas." },
  ];

  const LogoSVG = ({ dark = false }: { dark?: boolean }) => (
    <svg width="140" height="36" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 17L6 28L22 28L22 17L14 9Z" fill="none" stroke="#1FA94B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      <rect x="9" y="22" width="2.5" height="6" rx="0.5" fill="#1FA94B"/>
      <rect x="13" y="19" width="2.5" height="9" rx="0.5" fill="#84CC16"/>
      <rect x="17" y="16" width="2.5" height="12" rx="0.5" fill="#F59E0B"/>
      <text x="30" y="26" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="19" fill={dark ? "#ffffff" : "#0F172A"}>certifive</text>
    </svg>
  );

  const CheckIcon = ({ cls = "plan-check" }: { cls?: string }) => (
    <svg className={cls} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const TrustIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7l3.5 3.5L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", color: "#0F172A", background: "#fff", overflowX: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        a{color:inherit;text-decoration:none}
        img{display:block;max-width:100%}

        :root{
          --green:#1FA94B;
          --green-dk:#178A3C;
          --green-lt:#e8f6ec;
          --green-50:#f3faf5;
          --lime:#84CC16;
          --orange:#F59E0B;
          --ink:#0F172A;
          --ink700:#1E293B;
          --s600:#475569;
          --s500:#64748B;
          --s400:#94A3B8;
          --s300:#CBD5E1;
          --s200:#E5E7EB;
          --s100:#F1F5F9;
          --s50:#F8FAFC;
          --r:8px;--rl:14px;--rxl:20px;
          --mw:1240px;
          --shadow-card:0 1px 2px rgba(15,23,42,.04),0 12px 32px rgba(15,23,42,.06);
        }

        .container{max-width:var(--mw);margin:0 auto;padding:0 32px}

        /* ── NAV ── */
        .nav{
          position:fixed;top:0;left:0;right:0;z-index:100;
          background:rgba(255,255,255,.92);
          backdrop-filter:blur(14px);
          border-bottom:1px solid transparent;
          transition:border-color .25s,box-shadow .25s;
        }
        .nav.scrolled{border-bottom-color:var(--s200);box-shadow:0 1px 14px rgba(15,23,42,.04)}
        .nav-inner{
          max-width:var(--mw);margin:0 auto;padding:0 32px;
          height:72px;display:flex;align-items:center;justify-content:space-between;gap:32px;
        }
        .nav-logo{display:flex;align-items:center;flex-shrink:0;cursor:pointer}
        .nav-logo img{height:36px;width:auto}
        .footer-top > div:first-child img{height:32px;width:auto}
        .nav-links{display:flex;align-items:center;gap:36px;list-style:none;flex:1;justify-content:center}
        .nav-links a{font-size:15px;font-weight:500;color:var(--ink700);transition:color .15s;cursor:pointer}
        .nav-links a:hover{color:var(--green)}
        .nav-actions{display:flex;align-items:center;gap:12px}
        .nav-login{font-size:14px;font-weight:500;color:var(--ink700);cursor:pointer;transition:color .15s}
        .nav-login:hover{color:var(--green)}

        /* ── BUTTONS ── */
        .btn{
          display:inline-flex;align-items:center;justify-content:center;
          gap:8px;font-weight:600;cursor:pointer;border-radius:var(--r);
          transition:transform .1s,background .2s,box-shadow .2s,border-color .2s,color .2s;
          border:none;font-family:inherit;white-space:nowrap;
        }
        .btn:active{transform:scale(.98)}
        .btn-primary{
          background:var(--green);color:white;padding:12px 24px;font-size:15px;
          box-shadow:0 1px 2px rgba(31,169,75,.2),0 4px 12px rgba(31,169,75,.18);
        }
        .btn-primary:hover{background:var(--green-dk);box-shadow:0 1px 2px rgba(31,169,75,.3),0 6px 18px rgba(31,169,75,.25)}
        .btn-primary.lg{padding:16px 32px;font-size:16px}
        .btn-primary.sm{padding:10px 20px;font-size:14px}
        .btn-ghost{
          background:white;color:var(--ink);padding:12px 24px;font-size:15px;
          border:1.5px solid var(--s200);
        }
        .btn-ghost:hover{border-color:var(--green);color:var(--green)}
        .btn-ghost.lg{padding:16px 32px;font-size:16px}
        .btn-ghost.sm{padding:10px 20px;font-size:14px}

        /* ── HERO ── */
        .hero{position:relative;padding:132px 0 80px;overflow:hidden}
        .hero-dots{
          position:absolute;top:120px;right:32px;
          width:120px;height:120px;
          background-image:radial-gradient(circle,rgba(31,169,75,.35) 1.8px,transparent 1.8px);
          background-size:14px 14px;z-index:0;
        }
        .hero-wave{position:absolute;bottom:0;left:0;width:100%;height:220px;pointer-events:none;z-index:0;overflow:hidden}
        .hero-inner{
          position:relative;z-index:1;
          display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);
          gap:56px;align-items:center;
        }
        .hero-text{max-width:580px}
        .hero-badge{
          display:inline-flex;align-items:center;gap:10px;
          background:var(--green-lt);color:var(--green-dk);
          font-size:13px;font-weight:600;padding:7px 14px;border-radius:999px;
          margin-bottom:28px;border:1px solid rgba(31,169,75,.18);
        }
        .hero-badge-dot{
          width:7px;height:7px;background:var(--green);border-radius:50%;
          box-shadow:0 0 0 4px rgba(31,169,75,.18);
          animation:gpulse 2s infinite;
        }
        @keyframes gpulse{
          0%,100%{box-shadow:0 0 0 4px rgba(31,169,75,.18)}
          50%{box-shadow:0 0 0 8px rgba(31,169,75,.10)}
        }
        .hero h1{
          font-size:60px;font-weight:800;line-height:1.05;
          letter-spacing:-.035em;color:var(--ink);margin-bottom:24px;text-wrap:balance;
        }
        .accent{color:var(--green)}
        .hero-sub{font-size:19px;line-height:1.65;color:var(--s500);margin-bottom:36px;max-width:520px}
        .hero-sub strong{color:var(--ink);font-weight:700}
        .hero-ctas{display:flex;align-items:center;gap:14px;margin-bottom:36px;flex-wrap:wrap}
        .trust-checks{display:flex;gap:22px;flex-wrap:wrap}
        .trust-checks span{display:inline-flex;align-items:center;gap:6px;color:var(--s600);font-size:13px;font-weight:500}
        .trust-checks svg{color:var(--green);flex-shrink:0}

        /* Hero dashboard mock */
        .hero-visual{
          background:white;border-radius:var(--rxl);
          border:1px solid var(--s200);
          box-shadow:0 24px 64px rgba(15,23,42,.12);
          overflow:hidden;padding:24px;
        }
        .dash-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .dash-title{font-size:15px;font-weight:700;color:var(--ink)}
        .dash-live{
          background:var(--green-lt);color:var(--green);
          font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;
          display:flex;align-items:center;gap:5px;
        }
        .dash-live-dot{width:6px;height:6px;background:var(--green);border-radius:50%;animation:gpulse 2s infinite}
        .dash-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
        .dash-stat{background:var(--s50);border-radius:var(--rl);padding:14px;text-align:center}
        .dash-stat-n{font-size:22px;font-weight:800;color:var(--green)}
        .dash-stat-l{font-size:11px;color:var(--s500);font-weight:500;margin-top:2px}
        .dash-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--s100)}
        .dash-row:last-child{border-bottom:none}
        .cal-tag{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;flex-shrink:0}
        .cal-a{background:#dcfce7;color:#15803d}
        .cal-b{background:#d1fae5;color:#059669}
        .cal-c{background:#fef9c3;color:#a16207}
        .cal-d{background:#fee2e2;color:#dc2626}
        .dash-row-main{flex:1;min-width:0}
        .dash-row-name{font-size:13px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dash-row-sub{font-size:11px;color:var(--s400)}
        .cert-status{font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;flex-shrink:0}
        .st-done{background:var(--green-lt);color:var(--green)}
        .st-pending{background:#fef3c7;color:#d97706}
        .st-new{background:var(--s100);color:var(--s500)}

        /* ── HERO INTERACTIVE TABS ── */
        .hero-tabs{display:flex;border-bottom:1px solid var(--s200);margin:0 -24px 14px;padding:0 24px;overflow-x:auto;scrollbar-width:none}
        .hero-tabs::-webkit-scrollbar{display:none}
        .hero-tab{font-size:11px;font-weight:600;padding:8px 10px;color:var(--s400);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;transition:color .15s,border-color .15s;flex-shrink:0}
        .hero-tab:hover{color:var(--ink700)}
        .hero-tab.active{color:var(--green);border-bottom-color:var(--green)}

        /* ── STATS STRIP ── */
        .stats-strip{
          position:relative;z-index:2;background:white;
          border-top:1px solid var(--s100);border-bottom:1px solid var(--s100);
          padding:40px 0;
        }
        .stats-inner{display:grid;grid-template-columns:repeat(4,1fr);gap:32px;align-items:center}
        .stat{text-align:center;border-right:1px solid var(--s200);padding:4px 0}
        .stat:last-child{border-right:none}
        .stat-n{font-size:36px;font-weight:800;color:var(--green);letter-spacing:-.03em;line-height:1;margin-bottom:6px}
        .stat-l{font-size:13px;color:var(--s500);font-weight:500}

        /* ── SECTION SHELL ── */
        .section{padding:110px 0;position:relative;overflow:hidden}
        .section.alt{background:var(--s50)}
        .section-head{text-align:center;max-width:720px;margin:0 auto 64px}
        .section-eyebrow{
          display:inline-block;font-size:13px;font-weight:600;
          letter-spacing:.08em;text-transform:uppercase;color:var(--green);
          margin-bottom:16px;padding:4px 14px;background:var(--green-lt);border-radius:999px;
        }
        .section-title{
          font-size:44px;font-weight:800;letter-spacing:-.03em;
          color:var(--ink);margin-bottom:18px;text-wrap:balance;line-height:1.1;
        }
        .section-sub{font-size:18px;color:var(--s500);line-height:1.65;max-width:580px;margin:0 auto}

        /* ── SHOWCASE MOCK ── */
        .showcase-mock{
          background:white;border:1px solid var(--s200);
          border-radius:var(--rxl);box-shadow:var(--shadow-card);overflow:hidden;
        }
        .showcase-tabs{display:flex;border-bottom:1px solid var(--s200);padding:0 24px}
        .showcase-tab{
          font-size:13px;font-weight:600;padding:14px 18px;color:var(--s500);
          cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;
        }
        .showcase-tab.active{color:var(--green);border-bottom-color:var(--green)}
        .showcase-body{padding:24px}
        .showcase-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
        .showcase-card{background:var(--s50);border-radius:var(--rl);padding:16px;text-align:center}
        .showcase-card-n{font-size:24px;font-weight:800;color:var(--green);margin-bottom:4px}
        .showcase-card-l{font-size:11px;color:var(--s500);font-weight:500}
        .showcase-list{display:flex;flex-direction:column}
        .showcase-row{
          display:flex;align-items:center;gap:16px;
          padding:12px 0;border-bottom:1px solid var(--s100);
        }
        .showcase-row:last-child{border-bottom:none}
        .cert-id{font-size:12px;font-weight:700;color:var(--s400);font-family:monospace;flex-shrink:0}
        .cert-name{font-size:13px;font-weight:600;color:var(--ink);flex:1}

        /* ── MULTIPLICA MOCK ── */
        .mult-mock{
          background:white;border:1px solid var(--s200);
          border-radius:var(--rxl);padding:32px;box-shadow:var(--shadow-card);
        }
        .mult-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
        .mult-title{font-size:17px;font-weight:700;color:var(--ink)}
        .mult-badge{
          font-size:13px;font-weight:700;color:var(--green);
          background:var(--green-lt);padding:5px 12px;border-radius:999px;
        }
        .chart-bars{
          display:flex;align-items:flex-end;gap:8px;height:130px;
          border-bottom:1px solid var(--s200);padding-bottom:12px;margin-bottom:12px;
        }
        .chart-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
        .chart-bar{width:100%;border-radius:6px 6px 0 0}
        .chart-label{font-size:11px;color:var(--s400);font-weight:500}
        .chart-val{font-size:11px;font-weight:700}
        .mult-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
        .mult-kpi{text-align:center}
        .mult-kpi-n{font-size:28px;font-weight:800;color:var(--green);letter-spacing:-.02em}
        .mult-kpi-l{font-size:12px;color:var(--s500);font-weight:500;margin-top:2px}

        /* ── PROCESS ── */
        .process-grid{
          display:grid;grid-template-columns:repeat(5,1fr);
          gap:16px;position:relative;
        }
        .process-grid::before{
          content:'';position:absolute;top:28px;left:8%;right:8%;
          height:1px;border-top:1.5px dashed var(--s300);z-index:0;
        }
        .step{
          background:white;border:1px solid var(--s200);
          border-radius:var(--rl);padding:28px 18px 24px;
          text-align:center;position:relative;z-index:1;overflow:hidden;
          transition:transform .2s,box-shadow .2s,border-color .2s;
        }
        .step:hover{transform:translateY(-4px);box-shadow:var(--shadow-card);border-color:rgba(31,169,75,.4)}
        .step-num{
          width:56px;height:56px;border-radius:50%;
          background:linear-gradient(135deg,#1FA94B 0%,#178A3C 100%);
          color:white;display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:18px;margin:0 auto 18px;
          box-shadow:0 6px 16px rgba(31,169,75,.3);
        }
        .step-t{font-size:14px;font-weight:700;color:var(--ink);margin-bottom:8px;letter-spacing:-.01em}
        .step-d{font-size:13px;color:var(--s500);line-height:1.6}

        /* ── TESTIMONIALS ── */
        .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
        .testi{
          background:white;border:1px solid var(--s200);
          border-radius:var(--rl);padding:32px;
          position:relative;overflow:hidden;
          transition:box-shadow .2s,transform .2s;
        }
        .testi:hover{box-shadow:var(--shadow-card);transform:translateY(-2px)}
        .testi-stars{display:flex;gap:2px;margin-bottom:18px;color:var(--green)}
        .testi-text{font-size:15px;line-height:1.7;color:var(--ink700);margin-bottom:24px}
        .testi-text::before{content:'"';color:var(--green);font-weight:700}
        .testi-text::after{content:'"';color:var(--green);font-weight:700}
        .testi-author{display:flex;align-items:center;gap:12px;padding-top:18px;border-top:1px solid var(--s100)}
        .testi-avatar{
          width:44px;height:44px;border-radius:50%;
          background:linear-gradient(135deg,var(--green) 0%,var(--green-dk) 100%);
          color:white;display:flex;align-items:center;justify-content:center;
          font-size:15px;font-weight:700;flex-shrink:0;
        }
        .testi-name{font-size:14px;font-weight:700;color:var(--ink)}
        .testi-role{font-size:13px;color:var(--s500)}

        /* ── PRICING ── */
        .pricing-toggle{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:48px}
        .toggle-label{font-size:15px;font-weight:600;color:var(--ink)}
        .toggle-label.off{color:var(--s400)}
        .toggle-switch{
          width:52px;height:28px;background:var(--green);
          border-radius:999px;position:relative;cursor:pointer;
          border:none;padding:0;transition:background .2s;
        }
        .toggle-switch.off{background:var(--s300)}
        .toggle-knob{
          position:absolute;top:3px;left:3px;width:22px;height:22px;
          background:white;border-radius:50%;
          transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.15);
        }
        .toggle-knob.on{transform:translateX(24px)}
        .annual-badge{
          background:var(--green-lt);color:var(--green);
          font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;
        }
        .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:24px}
        .plan-card{
          background:white;border:1.5px solid var(--s200);
          border-radius:var(--rxl);padding:32px;
          transition:border-color .2s,box-shadow .2s,transform .2s;position:relative;
        }
        .plan-card:hover{border-color:rgba(31,169,75,.4);box-shadow:var(--shadow-card);transform:translateY(-4px)}
        .plan-card.featured{
          background:var(--ink);border-color:var(--ink);
          box-shadow:0 20px 56px rgba(15,23,42,.2);
          transform:scale(1.025);z-index:1;
        }
        .plan-card.featured:hover{box-shadow:0 24px 64px rgba(15,23,42,.26)}
        .plan-badge{
          position:absolute;top:-12px;left:50%;transform:translateX(-50%);
          background:var(--green);color:white;
          font-size:11px;font-weight:700;padding:4px 14px;border-radius:999px;white-space:nowrap;
        }
        .plan-name{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--s500);margin-bottom:8px}
        .featured .plan-name{color:rgba(255,255,255,.45)}
        .plan-price{font-size:44px;font-weight:800;color:var(--ink);letter-spacing:-.04em}
        .featured .plan-price{color:white}
        .plan-period{font-size:15px;color:var(--s400);font-weight:500}
        .featured .plan-period{color:rgba(255,255,255,.45)}
        .plan-annual{font-size:13px;color:var(--green);font-weight:600;margin-bottom:24px;min-height:22px}
        .featured .plan-annual{color:var(--lime)}
        .plan-divider{border:none;border-top:1px solid var(--s200);margin:20px 0}
        .featured .plan-divider{border-top-color:rgba(255,255,255,.12)}
        .plan-features{list-style:none;display:flex;flex-direction:column;gap:12px;margin-bottom:32px}
        .plan-features li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--ink700);line-height:1.5}
        .featured .plan-features li{color:rgba(255,255,255,.8)}
        .plan-check{color:var(--green);flex-shrink:0;margin-top:1px}
        .featured .plan-check{color:var(--lime)}
        .plan-cta{width:100%;text-align:center;padding:14px;border-radius:var(--rl);font-size:15px}
        .ppu-card{
          background:white;border:1.5px solid var(--s200);
          border-radius:var(--rl);padding:24px 32px;
          display:flex;align-items:center;gap:24px;flex-wrap:wrap;
        }
        .ppu-icon{
          width:52px;height:52px;border-radius:var(--rl);
          background:var(--green-lt);color:var(--green);
          display:flex;align-items:center;justify-content:center;
          font-size:22px;flex-shrink:0;
        }
        .ppu-text{flex:1;min-width:200px}
        .ppu-title{font-size:17px;font-weight:700;color:var(--ink);margin-bottom:4px}
        .ppu-sub{font-size:14px;color:var(--s500);line-height:1.5}
        .ppu-price{font-size:28px;font-weight:800;color:var(--green);letter-spacing:-.03em;flex-shrink:0}
        .ppu-price span{font-size:14px;color:var(--s500);font-weight:500;margin-left:4px}

        /* ── FAQ ── */
        .faq-grid{max-width:800px;margin:0 auto}
        .faq-item{border-bottom:1px solid var(--s200);padding:24px 0;cursor:pointer}
        .faq-item:first-child{padding-top:0}
        .faq-q{display:flex;justify-content:space-between;align-items:center;font-size:17px;font-weight:600;color:var(--ink);gap:16px}
        .faq-toggle{
          width:28px;height:28px;border-radius:50%;
          background:var(--green-lt);color:var(--green);
          display:flex;align-items:center;justify-content:center;
          font-size:16px;font-weight:700;flex-shrink:0;
          transition:transform .25s,background .2s;
        }
        .faq-toggle.open{transform:rotate(45deg);background:var(--green);color:white}
        .faq-a{
          overflow:hidden;font-size:15px;color:var(--s500);line-height:1.7;
          max-height:0;transition:max-height .35s ease,padding .25s ease;
        }
        .faq-a.open{max-height:240px;padding-top:14px}

        /* ── CTA FINAL ── */
        .cta-final{
          background:linear-gradient(135deg,var(--green) 0%,var(--green-dk) 100%);
          padding:100px 0;text-align:center;position:relative;overflow:hidden;
        }
        .cta-final::before{
          content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.08) 0%,transparent 65%);
        }
        .cta-inner{position:relative;z-index:1}
        .cta-eyebrow{display:inline-block;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:20px}
        .cta-final h2{font-size:48px;font-weight:800;color:white;line-height:1.1;letter-spacing:-.03em;margin-bottom:20px;text-wrap:balance}
        .cta-final p{font-size:18px;color:rgba(255,255,255,.75);margin-bottom:40px;max-width:520px;margin-left:auto;margin-right:auto}
        .cta-btns{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}
        .btn-white{
          background:white;color:var(--green);
          padding:16px 32px;font-size:16px;font-weight:700;border-radius:var(--rl);
          box-shadow:0 4px 20px rgba(0,0,0,.12);border:none;cursor:pointer;
          transition:box-shadow .2s,transform .1s;font-family:inherit;
        }
        .btn-white:hover{box-shadow:0 8px 32px rgba(0,0,0,.18);transform:translateY(-2px)}
        .btn-white:active{transform:scale(.98)}
        .btn-outline-white{
          background:transparent;color:white;
          padding:16px 32px;font-size:16px;font-weight:600;
          border:2px solid rgba(255,255,255,.35);border-radius:var(--rl);
          cursor:pointer;font-family:inherit;
          transition:border-color .2s,background .2s;
        }
        .btn-outline-white:hover{border-color:white;background:rgba(255,255,255,.08)}
        .cta-trust{
          margin-top:28px;font-size:14px;color:rgba(255,255,255,.6);
          display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;
        }
        .cta-trust span{display:flex;align-items:center;gap:6px}

        /* ── FOOTER ── */
        footer{background:var(--ink);color:rgba(255,255,255,.65);padding:72px 0 32px;position:relative;overflow:hidden}
        footer::before{
          content:'';position:absolute;top:0;left:0;right:0;height:4px;
          background:linear-gradient(90deg,var(--green) 0%,var(--lime) 50%,var(--orange) 100%);
        }
        .footer-top{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr 1fr;gap:48px;margin-bottom:56px}
        .footer-tagline{font-size:14px;line-height:1.65;color:rgba(255,255,255,.55);max-width:280px;margin:12px 0 20px}
        .footer-social{display:flex;gap:10px}
        .footer-social a{
          width:36px;height:36px;background:rgba(255,255,255,.08);
          border-radius:8px;display:inline-flex;align-items:center;justify-content:center;
          color:rgba(255,255,255,.75);text-decoration:none;
          transition:background .2s,color .2s;font-size:12px;font-weight:700;
        }
        .footer-social a:hover{background:var(--green);color:white}
        .footer-col-t{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:white;margin-bottom:18px}
        .footer-links{list-style:none;display:flex;flex-direction:column;gap:12px}
        .footer-links a{font-size:14px;color:rgba(255,255,255,.6);text-decoration:none;transition:color .15s}
        .footer-links a:hover{color:white}
        .footer-bottom{
          border-top:1px solid rgba(255,255,255,.08);padding-top:28px;
          display:flex;justify-content:space-between;align-items:center;
          font-size:13px;color:rgba(255,255,255,.4);flex-wrap:wrap;gap:16px;
        }
        .footer-legal{display:flex;gap:24px}
        .footer-legal a{color:rgba(255,255,255,.4);text-decoration:none;transition:color .15s}
        .footer-legal a:hover{color:rgba(255,255,255,.7)}
        .footer-disclaimer{
          font-size:11px;color:rgba(255,255,255,.28);max-width:760px;
          line-height:1.6;margin-top:20px;
          border-top:1px solid rgba(255,255,255,.06);padding-top:20px;
        }

        /* ── RESPONSIVE ── */
        @media(max-width:1024px){
          .hero h1{font-size:48px}
          .process-grid{grid-template-columns:repeat(3,1fr)}
          .process-grid::before{display:none}
          .footer-top{grid-template-columns:1fr 1fr 1fr}
        }
        @media(max-width:768px){
          .hero{padding:100px 0 60px}
          .hero-inner{grid-template-columns:1fr}
          .hero h1{font-size:38px}
          .hero-sub{font-size:17px}
          .hero-visual{display:none}
          .stats-inner{grid-template-columns:repeat(2,1fr)}
          .stat{border-right:none;border-bottom:1px solid var(--s200);padding-bottom:16px}
          .stat:nth-child(odd){border-right:1px solid var(--s200)}
          .stat:last-child{border-bottom:none}
          .section{padding:72px 0}
          .section-title{font-size:32px}
          .showcase-grid{grid-template-columns:repeat(2,1fr)}
          .process-grid{grid-template-columns:1fr 1fr}
          .testi-grid{grid-template-columns:1fr}
          .pricing-grid{grid-template-columns:1fr}
          .plan-card.featured{transform:none}
          .footer-top{grid-template-columns:1fr 1fr;gap:32px}
          .cta-final h2{font-size:34px}
          .container{padding:0 20px}
          .nav-links{display:none}
        }

        /* ── PARALLAX LAYERS ── */
        .parallax-layer{position:absolute;pointer-events:none;z-index:0;will-change:transform}

        /* ── REVEAL ON SCROLL ── */
        .reveal{opacity:0;transform:translateY(24px)}
        .reveal.visible{
          transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1);
          opacity:1;transform:translateY(0);
        }
        .reveal.d1.visible{transition-delay:.08s}
        .reveal.d2.visible{transition-delay:.16s}
        .reveal.d3.visible{transition-delay:.24s}

        /* ── STEP WATERMARK + TOP LINE ── */
        .step::before{
          content:attr(data-num);
          position:absolute;bottom:-38px;right:-10px;
          font-size:160px;font-weight:900;line-height:1;letter-spacing:-.06em;
          color:transparent;-webkit-text-stroke:1.5px rgba(31,169,75,.08);pointer-events:none;
        }
        .step:hover::before{-webkit-text-stroke-color:rgba(31,169,75,.18)}
        .step::after{
          content:'';position:absolute;top:0;left:24px;right:24px;
          height:2px;
          background:linear-gradient(90deg,transparent,var(--green),transparent);
          opacity:0;transition:opacity .25s;
        }
        .step:hover::after{opacity:1}

        /* ── TESTI DECORATIVE ELEMENTS ── */
        .testi::before{
          content:'"';
          position:absolute;top:-30px;right:14px;
          font-family:Georgia,serif;font-size:160px;font-weight:700;line-height:1;
          color:rgba(31,169,75,.07);pointer-events:none;
        }
        .testi:hover::before{color:rgba(31,169,75,.14)}
        .testi::after{
          content:'';position:absolute;top:0;right:0;
          width:80px;height:80px;
          background:radial-gradient(circle at top right,rgba(31,169,75,.06),transparent 70%);
          pointer-events:none;
        }
        .testi-stars,.testi-text,.testi-author{position:relative;z-index:1}

        /* ── STAT HOVER UNDERLINE ── */
        .stat{position:relative;cursor:default}
        .stat::before{
          content:'';position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);
          width:24px;height:2px;background:var(--green);opacity:0;
          transition:width .25s,opacity .25s;
        }
        .stat:hover::before{width:40px;opacity:1}

        /* ── NAV CARET ── */
        .nav-item{display:flex;align-items:center;gap:5px}
        .nav-caret{transition:transform .2s}
        .nav-item:hover .nav-caret{transform:rotate(180deg)}

        /* ── REDUCED MOTION ── */
        @media(prefers-reduced-motion:reduce){
          .parallax-layer{transform:none !important}
          .reveal{opacity:1;transform:none}
          .reveal.visible{transition:none}
        }
      `}</style>

      {/* ── PARALLAX DECOR ── */}
      <div className="parallax-layer" data-speed="0.15" style={{ top: 80, left: "3%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(31,169,75,.14) 0%,transparent 70%)", filter: "blur(60px)" }} />
      <div className="parallax-layer" data-speed="-0.2" style={{ top: 200, right: "5%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(132,204,22,.18) 0%,transparent 70%)", filter: "blur(60px)" }} />
      <div className="parallax-layer" data-speed="0.3" style={{ top: 600, left: "8%", width: 160, height: 160, borderRadius: "50%", border: "1.2px dashed rgba(31,169,75,.25)" }} />
      <div className="parallax-layer" data-speed="-0.15" style={{ top: 400, right: "10%", width: 120, height: 100, backgroundImage: "radial-gradient(circle,rgba(31,169,75,.32) 1.4px,transparent 1.4px)", backgroundSize: "16px 16px" }} />
      <div className="parallax-layer" data-speed="0.25" data-rotate="0.3" style={{ top: 900, left: "5%", width: 18, height: 18, background: "linear-gradient(135deg,#1FA94B,#84CC16)", opacity: 0.14, transform: "rotate(20deg)", borderRadius: 2 }} />
      <div className="parallax-layer" data-speed="-0.35" style={{ top: 1200, right: "3%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,.14) 0%,transparent 70%)", filter: "blur(60px)" }} />
      <div className="parallax-layer" data-speed="0.2" style={{ top: 1500, left: "12%", width: 200, height: 200, borderRadius: "50%", border: "1.2px solid rgba(31,169,75,.12)" }} />
      <div className="parallax-layer" data-speed="-0.1" style={{ top: 1800, right: "8%", width: 160, height: 160, backgroundImage: "radial-gradient(circle,rgba(31,169,75,.32) 1.4px,transparent 1.4px)", backgroundSize: "16px 16px" }} />
      <div className="parallax-layer" data-speed="0.4" data-rotate="0.2" style={{ top: 2000, right: "15%", width: 14, height: 14, background: "linear-gradient(135deg,#1FA94B,#84CC16)", opacity: 0.18, transform: "rotate(20deg)", borderRadius: 2 }} />
      <div className="parallax-layer" data-speed="-0.25" style={{ top: 2400, left: "2%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(31,169,75,.12) 0%,transparent 70%)", filter: "blur(60px)" }} />
      <div className="parallax-layer" data-speed="0.1" style={{ top: 2700, right: "6%", width: 140, height: 140, borderRadius: "50%", border: "1.2px dashed rgba(31,169,75,.25)" }} />
      <div className="parallax-layer" data-speed="-0.3" style={{ top: 3000, left: "15%", width: 120, height: 100, backgroundImage: "radial-gradient(circle,rgba(31,169,75,.32) 1.4px,transparent 1.4px)", backgroundSize: "16px 16px" }} />
      <div className="parallax-layer" data-speed="0.35" data-rotate="-0.2" style={{ top: 3200, left: "7%", width: 26, height: 26, background: "linear-gradient(135deg,#1FA94B,#84CC16)", opacity: 0.12, transform: "rotate(20deg)", borderRadius: 2 }} />
      <div className="parallax-layer" data-speed="-0.2" style={{ top: 3500, right: "4%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(132,204,22,.14) 0%,transparent 70%)", filter: "blur(60px)" }} />
      <div className="parallax-layer" data-speed="0.6" style={{ top: 3800, right: "20%", width: 160, height: 160, backgroundImage: "radial-gradient(circle,rgba(31,169,75,.32) 1.4px,transparent 1.4px)", backgroundSize: "16px 16px" }} />

      {/* ── NAVBAR ── */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img src="/assets/logo-horizontal.png" height={36} alt="Certifive" />
          </div>
          <ul className="nav-links">
            <li><a className="nav-item" onClick={scrollTo("flujo")}>Producto<svg className="nav-caret" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></a></li>
            <li><a className="nav-item" onClick={scrollTo("proceso")}>Cómo funciona<svg className="nav-caret" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></a></li>
            <li><a onClick={scrollTo("precios")}>Precios</a></li>
            <li><a onClick={scrollTo("faq")}>FAQ</a></li>
          </ul>
          <div className="nav-actions">
            <span className="nav-login" onClick={() => navigate("/login")}>Iniciar sesión</span>
            <button className="btn btn-primary sm" onClick={() => navigate("/register")}>Prueba gratis</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-dots" />
        <div className="hero-wave">
          <svg viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ position: "absolute", bottom: -40, left: 0, width: "100%", height: "100%" }}>
            <path d="M0,120 C320,200 560,40 760,120 C960,200 1200,80 1440,140 L1440,200 L0,200 Z" fill="rgba(31,169,75,0.08)"/>
            <path d="M0,140 C300,80 600,200 900,130 C1140,80 1320,180 1440,120 L1440,200 L0,200 Z" fill="rgba(31,169,75,0.12)"/>
          </svg>
        </div>
        <div className="container hero-inner">
          <div className="hero-text reveal">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Software para certificadores energéticos · España
            </div>
            <h1>
              Automatiza tu negocio<br />
              de <span className="accent">certificación energética.</span>
            </h1>
            <p className="hero-sub">
              <strong>Multiplica <span style={{ color: "var(--green)", fontWeight: 900 }}>×5</span> tu productividad e ingresos.</strong>{" "}
              Gestiona expedientes, clientes, certificados y cobros desde una sola plataforma.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-primary lg" onClick={() => navigate("/register")}>
                Solicita una demo
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="btn btn-ghost lg" onClick={scrollTo("proceso")}>
                Ver cómo funciona
              </button>
            </div>
            <div className="trust-checks">
              <span><TrustIcon /> 7 días gratis</span>
              <span><TrustIcon /> Sin permanencia</span>
              <span><TrustIcon /> Soporte en español</span>
            </div>
          </div>

          {/* Dashboard mock — Interactive Demo */}
          <div className="hero-visual reveal d1">
            <div className="dash-header">
              <div className="dash-title">Panel de control</div>
              <div className="dash-live">
                <span className="dash-live-dot" />
                En vivo
              </div>
            </div>

            {/* Tab navigation */}
            <div className="hero-tabs">
              {["Expedientes","Clientes","Informes","Cuestionarios","WhatsApp"].map(tab => (
                <div
                  key={tab}
                  className={`hero-tab${heroTab === tab ? " active" : ""}`}
                  onClick={() => setHeroTab(tab)}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* ── Tab: Expedientes ── */}
            {heroTab === "Expedientes" && (
              <>
                <div className="dash-stats">
                  {[
                    { n: "47",     l: "Activos"   },
                    { n: "3.840€", l: "Este mes"  },
                    { n: "94%",    l: "Aprobados" },
                  ].map(s => (
                    <div className="dash-stat" key={s.l}>
                      <div className="dash-stat-n">{s.n}</div>
                      <div className="dash-stat-l">{s.l}</div>
                    </div>
                  ))}
                </div>
                {[
                  { id: "CEE-2408", name: "C/ Almería 14, Madrid",  cal: "B", calCls: "cal-b", status: "Registrado", stCls: "st-done"    },
                  { id: "CEE-2407", name: "Av. Diagonal 88, BCN",    cal: "A", calCls: "cal-a", status: "En proceso", stCls: "st-pending" },
                  { id: "CEE-2406", name: "C/ Gran Vía 12, Madrid",  cal: "C", calCls: "cal-c", status: "Registrado", stCls: "st-done"    },
                  { id: "CEE-2405", name: "C/ Colón 5, Valencia",    cal: "B", calCls: "cal-b", status: "Nuevo",      stCls: "st-new"     },
                ].map(row => (
                  <div className="dash-row" key={row.id}>
                    <span className={`cal-tag ${row.calCls}`}>{row.cal}</span>
                    <div className="dash-row-main">
                      <div className="dash-row-name">{row.name}</div>
                      <div className="dash-row-sub">{row.id}</div>
                    </div>
                    <span className={`cert-status ${row.stCls}`}>{row.status}</span>
                  </div>
                ))}
              </>
            )}

            {/* ── Tab: Clientes ── */}
            {heroTab === "Clientes" && (
              <>
                {[
                  { ini: "MG", name: "María García Ruiz",   tel: "612 345 678", certs: 3,  ult: "hace 2 días"   },
                  { ini: "JM", name: "Juan Martínez López", tel: "634 890 123", certs: 7,  ult: "hace 1 semana" },
                  { ini: "RF", name: "Rosa Fernández Vila", tel: "678 901 234", certs: 2,  ult: "hace 3 días"   },
                  { ini: "CS", name: "Carlos Soler Ibáñez", tel: "655 432 198", certs: 12, ult: "hoy"           },
                ].map(c => (
                  <div className="dash-row" key={c.ini}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: "linear-gradient(135deg,var(--green) 0%,var(--green-dk) 100%)",
                      color: "white", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>{c.ini}</div>
                    <div className="dash-row-main">
                      <div className="dash-row-name">{c.name}</div>
                      <div className="dash-row-sub">{c.tel}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <span style={{
                        background: "var(--green-lt)", color: "var(--green)",
                        fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                      }}>{c.certs} cert.</span>
                      <span style={{ fontSize: 10, color: "var(--s400)" }}>{c.ult}</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── Tab: Certificados ── */}
            {/* ── Tab: Informes ── */}
            {heroTab === "Informes" && (
              <>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 5, marginBottom: 4 }}>
                  {[
                    { mes: "Ene", val: 1800 },
                    { mes: "Feb", val: 2100 },
                    { mes: "Mar", val: 2400 },
                    { mes: "Abr", val: 2200 },
                    { mes: "May", val: 2800 },
                    { mes: "Jun", val: 3200 },
                  ].map((b, i) => (
                    <div key={b.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: i === 5 ? "var(--green)" : "var(--s400)" }}>
                        {b.val >= 1000 ? (b.val / 1000).toFixed(1) + "k" : b.val}
                      </div>
                      <div style={{
                        width: "100%",
                        height: Math.round((b.val / 3200) * 72) + "px",
                        background: i === 5 ? "var(--green)" : "rgba(31,169,75,.3)",
                        borderRadius: "3px 3px 0 0",
                      }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 5, borderBottom: "1px solid var(--s200)", paddingBottom: 10, marginBottom: 10 }}>
                  {["Ene","Feb","Mar","Abr","May","Jun"].map(m => (
                    <div key={m} style={{ flex: 1, fontSize: 9, color: "var(--s400)", textAlign: "center" }}>{m}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {[
                    { n: "3.200€", l: "Ingresos del mes"     },
                    { n: "21",     l: "Certificados emitidos" },
                    { n: "94%",    l: "Tasa de aprobación"    },
                  ].map(k => (
                    <div key={k.l} style={{ background: "var(--s50)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)", letterSpacing: "-.02em" }}>{k.n}</div>
                      <div style={{ fontSize: 10, color: "var(--s500)", marginTop: 2, lineHeight: 1.3 }}>{k.l}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Tab: Cuestionarios ── */}
            {heroTab === "Cuestionarios" && (
              <div style={{ background: "var(--s50)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>
                  📋 Formulario del cliente
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {[
                    { label: "Nombre del propietario", placeholder: "Ej: María García Ruiz"      },
                    { label: "Dirección",              placeholder: "Calle, número, piso"        },
                    { label: "Tipo de inmueble",       placeholder: "Piso / Unifamiliar / Local" },
                    { label: "Superficie (m²)",        placeholder: "Ej: 85 m²"                  },
                    { label: "Año de construcción",    placeholder: "Ej: 1985"                   },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--s600)", marginBottom: 3 }}>{f.label}</div>
                      <div style={{
                        background: "white", border: "1px solid var(--s200)",
                        borderRadius: 6, padding: "6px 10px",
                        fontSize: 11, color: "var(--s400)",
                      }}>{f.placeholder}</div>
                    </div>
                  ))}
                  <button style={{
                    background: "var(--green)", color: "white",
                    border: "none", borderRadius: 8, padding: "9px",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 2,
                  }}>
                    Enviar cuestionario
                  </button>
                </div>
              </div>
            )}

            {/* ── Tab: WhatsApp ── */}
            {heroTab === "WhatsApp" && (
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--s200)" }}>
                <div style={{
                  background: "#075E54", padding: "8px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "#25D366", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 12, fontWeight: 700,
                    color: "white", flexShrink: 0,
                  }}>MG</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>María García</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.65)" }}>en línea</div>
                  </div>
                </div>
                <div style={{
                  background: "#E5DDD5", padding: "12px 10px",
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <div style={{ alignSelf: "flex-end", maxWidth: "84%" }}>
                    <div style={{
                      background: "#DCF8C6", borderRadius: "12px 12px 2px 12px",
                      padding: "8px 10px", fontSize: 11, lineHeight: 1.5, color: "#1a1a1a",
                    }}>
                      Hola María 👋 Soy Carlos, técnico certificador. Te envío el formulario para
                      preparar tu certificado energético:{" "}
                      <span style={{ color: "#128C7E", textDecoration: "underline" }}>certifive.es/form/abc123</span>{" "}
                      El presupuesto estimado es de 120€. ¿Alguna duda?
                    </div>
                    <div style={{ fontSize: 9, color: "var(--s400)", textAlign: "right", marginTop: 2 }}>10:32 ✓✓</div>
                  </div>
                  <div style={{ alignSelf: "flex-start", maxWidth: "70%" }}>
                    <div style={{
                      background: "white", borderRadius: "12px 12px 12px 2px",
                      padding: "8px 10px", fontSize: 11, lineHeight: 1.5, color: "#1a1a1a",
                    }}>
                      Perfecto, ahora mismo lo relleno 👍
                    </div>
                    <div style={{ fontSize: 9, color: "var(--s400)", marginTop: 2 }}>10:34</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-inner">
            <div className="stat reveal"><div className="stat-n">×5</div><div className="stat-l">más productividad por técnico</div></div>
            <div className="stat reveal d1"><div className="stat-n">+2.400</div><div className="stat-l">certificadores en España</div></div>
            <div className="stat reveal d2"><div className="stat-n">4,2 h</div><div className="stat-l">ahorradas por expediente</div></div>
            <div className="stat reveal d3"><div className="stat-n">98,7%</div><div className="stat-l">expedientes aprobados a la 1.ª</div></div>
          </div>
        </div>
      </section>

      {/* ── FLUJO SHOWCASE ── */}
      <section className="section" id="flujo">
        <div className="container">
          <div className="section-head reveal">
            <span className="section-eyebrow">Plataforma todo-en-uno</span>
            <h2 className="section-title">Todo tu flujo de certificación, <span className="accent">en un solo lugar.</span></h2>
            <p className="section-sub">Centraliza cada etapa del proceso y toma decisiones más inteligentes con Certifive.</p>
          </div>
          <div className="showcase-mock reveal d1">
            <div className="showcase-tabs">
              {["Expedientes","Clientes","Certificados","Informes","Cuestionarios","WhatsApp"].map(t => (
                <div
                  key={t}
                  className={`showcase-tab${showcaseTab === t ? " active" : ""}`}
                  onClick={() => setShowcaseTab(t)}
                  style={{ cursor: "pointer" }}
                >{t}</div>
              ))}
            </div>
            <div className="showcase-body">

              {/* ── Tab: Expedientes ── */}
              {showcaseTab === "Expedientes" && (
                <>
                  <div className="showcase-grid">
                    {[
                      { n: "47",     l: "Expedientes activos" },
                      { n: "12",     l: "Pendientes registro" },
                      { n: "35",     l: "Completados"         },
                      { n: "3.840€", l: "Facturado este mes"  },
                    ].map(s => (
                      <div className="showcase-card" key={s.l}>
                        <div className="showcase-card-n">{s.n}</div>
                        <div className="showcase-card-l">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="showcase-list">
                    {[
                      { id: "CEE-2408", name: "C/ Almería 14, 3.º D — Madrid",    cal: "B", calCls: "cal-b", status: "Registrado", stCls: "st-done"    },
                      { id: "CEE-2407", name: "Av. Diagonal 88, 1.º — Barcelona",  cal: "A", calCls: "cal-a", status: "En proceso", stCls: "st-pending" },
                      { id: "CEE-2406", name: "C/ Gran Vía 12, 5.º — Madrid",      cal: "C", calCls: "cal-c", status: "Registrado", stCls: "st-done"    },
                      { id: "CEE-2405", name: "C/ Colón 5, 4.º A — Valencia",      cal: "B", calCls: "cal-b", status: "Nuevo",      stCls: "st-new"     },
                    ].map(row => (
                      <div className="showcase-row" key={row.id}>
                        <span className="cert-id">{row.id}</span>
                        <span className="cert-name">{row.name}</span>
                        <span className={`cal-tag ${row.calCls}`}>{row.cal}</span>
                        <span className={`cert-status ${row.stCls}`}>{row.status}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Tab: Clientes ── */}
              {showcaseTab === "Clientes" && (
                <div className="showcase-list">
                  {[
                    { ini: "MG", name: "María García Ruiz",    tel: "612 345 678", certs: 3,  ult: "hace 2 días"   },
                    { ini: "JM", name: "Juan Martínez López",  tel: "634 890 123", certs: 7,  ult: "hace 1 semana" },
                    { ini: "RF", name: "Rosa Fernández Vila",  tel: "678 901 234", certs: 2,  ult: "hace 3 días"   },
                    { ini: "CS", name: "Carlos Soler Ibáñez",  tel: "655 432 198", certs: 12, ult: "hoy"           },
                  ].map(c => (
                    <div className="showcase-row" key={c.ini}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg,var(--green) 0%,var(--green-dk) 100%)",
                        color: "white", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 12, fontWeight: 700,
                      }}>{c.ini}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "var(--s400)" }}>{c.tel}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                        <span style={{
                          background: "var(--green-lt)", color: "var(--green)",
                          fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
                        }}>{c.certs} cert.</span>
                        <span style={{ fontSize: 11, color: "var(--s400)" }}>{c.ult}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Tab: Certificados ── */}
              {showcaseTab === "Certificados" && (
                <div className="showcase-list">
                  {[
                    { ref: "4528301LM2847", addr: "C/ Almería 14, 3.º D — Madrid",    cal: "A", calCls: "cal-a", est: "Registrado", stCls: "st-done"    },
                    { ref: "7812934CS9034", addr: "Av. Diagonal 88, 1.º — Barcelona",  cal: "C", calCls: "cal-c", est: "En proceso", stCls: "st-pending" },
                    { ref: "3309182KL5619", addr: "C/ Gran Vía 12, 5.º — Madrid",      cal: "B", calCls: "cal-b", est: "Registrado", stCls: "st-done"    },
                    { ref: "9021765AB1258", addr: "C/ Colón 5, 4.º A — Valencia",      cal: "A", calCls: "cal-a", est: "Registrado", stCls: "st-done"    },
                  ].map(c => (
                    <div className="showcase-row" key={c.ref}>
                      <span className={`cal-tag ${c.calCls}`}>{c.cal}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{c.addr}</div>
                        <div style={{ fontSize: 11, color: "var(--s400)", fontFamily: "monospace" }}>{c.ref}</div>
                      </div>
                      <span className={`cert-status ${c.stCls}`}>{c.est}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Tab: Informes ── */}
              {showcaseTab === "Informes" && (
                <>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
                    {[
                      { mes: "Ene", val: 1800 },
                      { mes: "Feb", val: 2100 },
                      { mes: "Mar", val: 2400 },
                      { mes: "Abr", val: 2200 },
                      { mes: "May", val: 2800 },
                      { mes: "Jun", val: 3200 },
                    ].map((b, i) => (
                      <div key={b.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: i === 5 ? "var(--green)" : "var(--s400)" }}>
                          {b.val >= 1000 ? (b.val / 1000).toFixed(1) + "k" : b.val}
                        </div>
                        <div style={{
                          width: "100%",
                          height: Math.round((b.val / 3200) * 100) + "px",
                          background: i === 5 ? "var(--green)" : "rgba(31,169,75,.3)",
                          borderRadius: "4px 4px 0 0",
                        }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--s200)", paddingBottom: 12, marginBottom: 16 }}>
                    {["Ene","Feb","Mar","Abr","May","Jun"].map(m => (
                      <div key={m} style={{ flex: 1, fontSize: 11, color: "var(--s400)", textAlign: "center" }}>{m}</div>
                    ))}
                  </div>
                  <div className="showcase-grid">
                    {[
                      { n: "3.200€", l: "Ingresos del mes"     },
                      { n: "21",     l: "Certificados emitidos" },
                      { n: "94%",    l: "Tasa de aprobación"    },
                      { n: "4,2 h",  l: "Ahorro por expediente" },
                    ].map(k => (
                      <div className="showcase-card" key={k.l}>
                        <div className="showcase-card-n">{k.n}</div>
                        <div className="showcase-card-l">{k.l}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Tab: Cuestionarios ── */}
              {showcaseTab === "Cuestionarios" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>📋 Formulario enviado al cliente</div>
                    <div style={{ fontSize: 13, color: "var(--s500)", marginBottom: 20, lineHeight: 1.6 }}>
                      El cliente rellena desde su móvil. Tú recibes los datos listos para trabajar.
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { label: "Nombre del propietario", placeholder: "Ej: María García Ruiz"      },
                        { label: "Dirección",              placeholder: "Calle, número, piso"        },
                        { label: "Tipo de inmueble",       placeholder: "Piso / Unifamiliar / Local" },
                        { label: "Superficie (m²)",        placeholder: "Ej: 85 m²"                  },
                        { label: "Año de construcción",    placeholder: "Ej: 1985"                   },
                      ].map(f => (
                        <div key={f.label}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--s600)", marginBottom: 4 }}>{f.label}</div>
                          <div style={{
                            background: "var(--s50)", border: "1px solid var(--s200)",
                            borderRadius: 7, padding: "8px 12px",
                            fontSize: 13, color: "var(--s400)",
                          }}>{f.placeholder}</div>
                        </div>
                      ))}
                      <button style={{
                        background: "var(--green)", color: "white", border: "none",
                        borderRadius: 8, padding: "11px", fontSize: 14,
                        fontWeight: 700, cursor: "pointer", marginTop: 4,
                      }}>Enviar cuestionario</button>
                    </div>
                  </div>
                  <div style={{ background: "var(--green-lt)", borderRadius: 14, padding: "24px 20px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 16 }}>✓ Datos recibidos automáticamente</div>
                    {[
                      { l: "Propietario",     v: "María García Ruiz"   },
                      { l: "Dirección",       v: "C/ Almería 14, 3.º D" },
                      { l: "Tipo",            v: "Piso"                 },
                      { l: "Superficie",      v: "85 m²"                },
                      { l: "Año const.",      v: "1987"                 },
                    ].map(r => (
                      <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(31,169,75,.15)" }}>
                        <span style={{ fontSize: 12, color: "var(--s600)", fontWeight: 500 }}>{r.l}</span>
                        <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab: WhatsApp ── */}
              {showcaseTab === "WhatsApp" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>💬 Comunicación directa con el cliente</div>
                    <div style={{ fontSize: 13, color: "var(--s500)", marginBottom: 20, lineHeight: 1.6 }}>
                      Envía el formulario y presupuesto por WhatsApp con un solo clic. Sin llamadas, sin emails perdidos.
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { icon: "✓", text: "Formulario de datos enviado automáticamente" },
                        { icon: "✓", text: "Presupuesto personalizado incluido"          },
                        { icon: "✓", text: "Enlace de pago online adjunto"               },
                        { icon: "✓", text: "Recordatorios automáticos si no responde"    },
                      ].map(i => (
                        <div key={i.text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 14, marginTop: 1 }}>{i.icon}</span>
                          <span style={{ fontSize: 13, color: "var(--s600)", lineHeight: 1.5 }}>{i.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--s200)", boxShadow: "0 4px 16px rgba(15,23,42,.06)" }}>
                    <div style={{ background: "#075E54", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", background: "#25D366",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
                      }}>MG</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>María García</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)" }}>en línea</div>
                      </div>
                    </div>
                    <div style={{ background: "#E5DDD5", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ alignSelf: "flex-end", maxWidth: "88%" }}>
                        <div style={{
                          background: "#DCF8C6", borderRadius: "12px 12px 2px 12px",
                          padding: "10px 12px", fontSize: 12, lineHeight: 1.55, color: "#1a1a1a",
                        }}>
                          Hola María 👋 Soy Carlos, técnico certificador. Te envío el formulario para preparar tu certificado energético:{" "}
                          <span style={{ color: "#128C7E", textDecoration: "underline" }}>certifive.es/form/abc123</span>{" "}
                          El presupuesto estimado es de 120€. ¿Alguna duda?
                        </div>
                        <div style={{ fontSize: 10, color: "var(--s400)", textAlign: "right", marginTop: 3 }}>10:32 ✓✓</div>
                      </div>
                      <div style={{ alignSelf: "flex-start", maxWidth: "70%" }}>
                        <div style={{
                          background: "white", borderRadius: "12px 12px 12px 2px",
                          padding: "10px 12px", fontSize: 12, lineHeight: 1.55, color: "#1a1a1a",
                        }}>
                          Perfecto, ahora mismo lo relleno 👍
                        </div>
                        <div style={{ fontSize: 10, color: "var(--s400)", marginTop: 3 }}>10:34</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ── CALCULADORA DE PRODUCTIVIDAD ── */}
      <section className="section alt" id="multiplica">
        <div className="container">
          <div className="section-head reveal">
            <span className="section-eyebrow">Calcula tu potencial</span>
            <h2 className="section-title">Multiplica <span className="accent">×5</span> tus ventas y tu eficiencia.</h2>
            <p className="section-sub">Mueve el slider y comprueba el impacto real de Certifive en tu negocio.</p>
          </div>

          {(() => {
            const PRECIO   = 150;
            const H_SIN    = 4;
            const H_CON    = 0.75;
            const MULT     = 1.8;
            const PLAN_PRICE = calcCerts <= 10 ? 19 : calcCerts <= 20 ? 49 : 99;

            const certsSin = calcCerts;
            const certsCon = Math.round(calcCerts * MULT);
            const horasSin = certsSin * H_SIN;
            const horasCon = Math.round(certsCon * H_CON);
            const ingSin   = certsSin * PRECIO;
            const ingCon   = certsCon * PRECIO;
            const horasRec = horasSin - horasCon;
            const ganancia = ingCon - ingSin - PLAN_PRICE;
            const fmtEur   = (n: number) => n.toLocaleString("es-ES") + "€";

            const rows = [
              { label: "Certificados / mes",     sin: `${certsSin}`,   con: `${certsCon}`   },
              { label: "Tiempo por certificado", sin: "4 h",           con: "45 min"        },
              { label: "Ingresos al mes",        sin: fmtEur(ingSin),  con: fmtEur(ingCon)  },
              { label: "Horas trabajadas",       sin: `${horasSin} h`, con: `${horasCon} h` },
            ];

            return (
              <div className="reveal d1" style={{
                background: "white", borderRadius: 16, border: "1px solid var(--s200)",
                boxShadow: "var(--shadow-card)", overflow: "hidden",
                maxWidth: 680, margin: "0 auto",
              }}>
                {/* Single slider */}
                <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid var(--s100)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--s600)" }}>Certificados al mes</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "var(--green)", letterSpacing: "-.02em" }}>{calcCerts} cert.</span>
                  </div>
                  <input
                    type="range"
                    min={1} max={30} step={1}
                    value={calcCerts}
                    onChange={(e) => setCalcCerts(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--green)", cursor: "pointer", height: 4 }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: "var(--s400)" }}>1</span>
                    <span style={{ fontSize: 10, color: "var(--s400)" }}>30</span>
                  </div>
                </div>

                {/* Two-column comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  {/* Sin Certifive */}
                  <div style={{ background: "var(--s50)", padding: "16px 20px", borderRight: "1px solid var(--s200)" }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: "var(--s400)",
                      textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12,
                    }}>Sin Certifive</div>
                    {rows.map(r => (
                      <div key={r.label} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: "var(--s400)", fontWeight: 500, marginBottom: 1 }}>{r.label}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", letterSpacing: "-.02em" }}>{r.sin}</div>
                      </div>
                    ))}
                  </div>

                  {/* Con Certifive */}
                  <div style={{ background: "#e8f6ec", padding: "16px 20px" }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: "var(--green)",
                      textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12,
                    }}>Con Certifive ✓</div>
                    {rows.map(r => (
                      <div key={r.label} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: "var(--green)", fontWeight: 500, marginBottom: 1, opacity: .75 }}>{r.label}</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--green)", letterSpacing: "-.02em" }}>{r.con}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic phrase */}
                <div style={{
                  padding: "14px 24px",
                  background: "linear-gradient(135deg,var(--green) 0%,var(--green-dk) 100%)",
                  textAlign: "center",
                }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "white", lineHeight: 1.5, margin: 0 }}>
                    Recuperas{" "}
                    <strong style={{ fontSize: 20, fontWeight: 800 }}>{horasRec}h</strong>{" "}
                    al mes. Ganas{" "}
                    <strong style={{ fontSize: 20, fontWeight: 800 }}>+{fmtEur(ganancia)}</strong>{" "}
                    más. Por solo{" "}
                    <strong style={{ fontSize: 20, fontWeight: 800 }}>{PLAN_PRICE}€/mes.</strong>
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── PROCESO — 5 PASOS ── */}
      <section className="section" id="proceso">
        <div className="container">
          <div className="section-head reveal">
            <span className="section-eyebrow">Cómo funciona</span>
            <h2 className="section-title">De la visita al <span className="accent">certificado registrado</span> en cinco pasos.</h2>
            <p className="section-sub">Un flujo pensado para que dejes de perder horas en tareas administrativas.</p>
          </div>
          <div className="process-grid">
            {steps.map((s, i) => (
              <div className={`step reveal${i > 0 ? ` d${Math.min(i, 3)}` : ""}`} key={s.n} data-num={s.n}>
                <div className="step-num">{s.n}</div>
                <div className="step-t">{s.t}</div>
                <p className="step-d">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="section alt" id="testimonios">
        <div className="container">
          <div className="section-head reveal">
            <span className="section-eyebrow">Testimonios</span>
            <h2 className="section-title">Lo que dicen los <span className="accent">técnicos</span> que ya usan Certifive.</h2>
            <p className="section-sub">Profesionales reales. Resultados medibles. Más expedientes, menos errores.</p>
          </div>
          <div className="testi-grid">
            {[
              { ini: "MA", name: "Miguel Ángel Torres", role: "Ingeniero Industrial · Madrid", text: "Antes tardaba un día en cerrar un expediente. Con Certifive lo tengo listo en dos horas y al registro autonómico le entra a la primera. La diferencia es brutal." },
              { ini: "LG", name: "Laura García Fonts", role: "Arquitecta Técnica · Barcelona", text: "La integración con CE3X es un antes y un después. Nada de copiar datos a mano. El sistema importa, valida y deja el certificado listo en minutos." },
              { ini: "RV", name: "Roberto Vega Morales", role: "Ingeniero de Edificación · Sevilla", text: "Gestiono más de 60 expedientes al mes yo solo. Sin Certifive sería imposible. El portal del cliente me ha diferenciado mucho frente a otros técnicos." },
            ].map((t, i) => (
              <div className={`testi reveal${i > 0 ? ` d${i}` : ""}`} key={t.ini}>
                <div className="testi-stars">{"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-author">
                  <div className="testi-avatar">{t.ini}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section" id="precios">
        <div className="container">
          <div className="section-head reveal">
            <span className="section-eyebrow">Precios</span>
            <h2 className="section-title">Planes para cada tipo de <span className="accent">profesional.</span></h2>
            <p className="section-sub">Sin letra pequeña. Sin costes ocultos. Cancela cuando quieras.</p>
          </div>

          <div className="pricing-toggle">
            <span className={`toggle-label${isAnnual ? " off" : ""}`}>Mensual</span>
            <button className={`toggle-switch${isAnnual ? "" : " off"}`} onClick={() => setIsAnnual(!isAnnual)}>
              <div className={`toggle-knob${isAnnual ? " on" : ""}`} />
            </button>
            <span className={`toggle-label${isAnnual ? "" : " off"}`}>Anual</span>
            {isAnnual && <span className="annual-badge">2 meses gratis</span>}
          </div>

          <div className="pricing-grid">
            {/* Básico */}
            <div className="plan-card">
              <div className="plan-name">Básico</div>
              <div>
                <span className="plan-price">{P("basic")}€</span>
                <span className="plan-period">/mes</span>
              </div>
              <div className="plan-annual">{Ann("basic")}</div>
              <hr className="plan-divider" />
              <ul className="plan-features">
                {["Hasta 10 certificados/mes", "Expedientes ilimitados", "Integración CE3X / HULC", "Generación PDF del certificado", "Soporte por email"].map((f) => (
                  <li key={f}><CheckIcon /> {f}</li>
                ))}
              </ul>
              <button className="btn btn-ghost plan-cta" onClick={() => startPlan("basico")}>Empezar gratis</button>
            </div>

            {/* Profesional */}
            <div className="plan-card featured">
              <div className="plan-badge">★ Más popular</div>
              <div className="plan-name">Profesional</div>
              <div>
                <span className="plan-price">{P("pro")}€</span>
                <span className="plan-period">/mes</span>
              </div>
              <div className="plan-annual">{Ann("pro")}</div>
              <hr className="plan-divider" />
              <ul className="plan-features">
                {["Hasta 50 certificados/mes", "Todo lo del plan Básico", "Envío por WhatsApp y email", "Cobros por tramos y Stripe", "Facturación legal española", "Soporte prioritario"].map((f) => (
                  <li key={f}><CheckIcon /> {f}</li>
                ))}
              </ul>
              <button className="btn btn-primary plan-cta" onClick={() => startPlan("profesional")}>Prueba 7 días gratis</button>
            </div>

            {/* Empresa */}
            <div className="plan-card">
              <div className="plan-name">Empresa</div>
              <div>
                <span className="plan-price">{P("empresa")}€</span>
                <span className="plan-period">/mes</span>
              </div>
              <div className="plan-annual">{Ann("empresa")}</div>
              <hr className="plan-divider" />
              <ul className="plan-features">
                {["Certificados ilimitados", "Hasta 5 técnicos", "Todo lo del plan Profesional", "API e integraciones avanzadas", "IA para clasificación automática", "Onboarding dedicado"].map((f) => (
                  <li key={f}><CheckIcon /> {f}</li>
                ))}
              </ul>
              <button className="btn btn-ghost plan-cta" onClick={() => startPlan("empresa")}>Hablar con ventas</button>
            </div>
          </div>

          {/* PPU */}
          <div className="ppu-card">
            <div className="ppu-icon">⚡</div>
            <div className="ppu-text">
              <div className="ppu-title">Pay-per-use</div>
              <div className="ppu-sub">Sin cuota mensual. Paga solo lo que usas. Perfecto si certificas de forma puntual o quieres probar la plataforma sin compromiso.</div>
            </div>
            <div className="ppu-price">3€ <span>/certificado</span></div>
            <button className="btn btn-ghost" onClick={() => startPlan("pay_per_use")}>Empezar sin suscripción</button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section alt" id="faq">
        <div className="container">
          <div className="section-head reveal">
            <span className="section-eyebrow">Preguntas frecuentes</span>
            <h2 className="section-title">Todo lo que querías saber antes de empezar.</h2>
          </div>
          <div className="faq-grid">
            {faqs.map((faq, i) => (
              <div className="faq-item" key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-q">
                  {faq.q}
                  <div className={`faq-toggle${openFaq === i ? " open" : ""}`}>+</div>
                </div>
                <div className={`faq-a${openFaq === i ? " open" : ""}`}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="cta-final" id="cta">
        <div className="container cta-inner">
          <div className="cta-eyebrow">Empieza hoy</div>
          <h2>Multiplica ×5 tus resultados<br />desde el primer expediente.</h2>
          <p>7 días gratis. Sin tarjeta. Sin permanencia. Soporte en español incluido.</p>
          <div className="cta-btns">
            <button className="btn-white" onClick={() => navigate("/register")}>Solicitar demo gratuita</button>
            <button className="btn-outline-white" onClick={scrollTo("precios")}>Ver planes y precios</button>
          </div>
          <div className="cta-trust">
            <span>✓ Configuración en 5 minutos</span>
            <span>✓ Sin contrato de permanencia</span>
            <span>✓ Soporte en español incluido</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="container">
          <div className="footer-top">
            <div>
              <img src="/assets/logo-horizontal.png" height={32} alt="Certifive" style={{ filter: "brightness(0) invert(1)", marginBottom: 12 }} />
              <p className="footer-tagline">Software de gestión para profesionales de la certificación energética en España.</p>
              <div className="footer-social">
                <a href="#" aria-label="LinkedIn">in</a>
                <a href="#" aria-label="Twitter">𝕏</a>
                <a href="#" aria-label="YouTube">▶</a>
              </div>
            </div>
            <div>
              <div className="footer-col-t">Producto</div>
              <ul className="footer-links">
                {["Certificados", "Clientes", "Operaciones", "Informes", "Integraciones"].map((l) => <li key={l}><a href="#">{l}</a></li>)}
              </ul>
            </div>
            <div>
              <div className="footer-col-t">Soluciones</div>
              <ul className="footer-links">
                {["Técnicos autónomos", "Despachos", "Inmobiliarias", "Administradores"].map((l) => <li key={l}><a href="#">{l}</a></li>)}
              </ul>
            </div>
            <div>
              <div className="footer-col-t">Recursos</div>
              <ul className="footer-links">
                {["Documentación", "Centro de ayuda", "Webinars", "Blog", "API"].map((l) => <li key={l}><a href="#">{l}</a></li>)}
              </ul>
            </div>
            <div>
              <div className="footer-col-t">Empresa</div>
              <ul className="footer-links">
                {["Sobre nosotros", "Trabaja con nosotros", "Contacto", "Prensa"].map((l) => <li key={l}><a href="#">{l}</a></li>)}
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Certifive · Todos los derechos reservados.</span>
            <div className="footer-legal">
              {["Privacidad", "Términos", "Cookies", "RGPD"].map((l) => <a key={l} href="#">{l}</a>)}
            </div>
          </div>
          <p className="footer-disclaimer">
            Certifive es una herramienta de gestión. El certificado de eficiencia energética oficial debe generarse con un Documento Reconocido por el Ministerio (CE3X, HULC, CYPETHERM u otro) y registrarse en el organismo competente de la Comunidad Autónoma correspondiente.
          </p>
        </div>
      </footer>
    </div>
  );
}
