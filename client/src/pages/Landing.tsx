import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled]   = useState(false);
  const [isAnnual, setIsAnnual]   = useState(false);

  // Navbar scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Smooth scroll helper for anchor links
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  // Pricing display
  const prices = {
    basic:   { m: "19", a: "15", annual: "190€/año — 2 meses gratis" },
    pro:     { m: "49", a: "40", annual: "490€/año — 2 meses gratis" },
    empresa: { m: "99", a: "82", annual: "990€/año — 2 meses gratis" },
  };
  const P = (key: keyof typeof prices) =>
    isAnnual ? prices[key].a : prices[key].m;
  const Ann = (key: keyof typeof prices) =>
    isAnnual ? prices[key].annual : "";

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", color:"#0F172A", background:"#fff", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        :root{
          --teal:#0D7C66;--teal-dk:#0a6454;--teal-lt:#e6f4f1;--teal-50:#f0faf8;
          --s900:#0F172A;--s800:#1E293B;--s700:#334155;--s600:#475569;
          --s500:#64748B;--s400:#94A3B8;--s300:#CBD5E1;--s200:#E2E8F0;
          --s100:#F1F5F9;--s50:#F8FAFC;
          --r:8px;--rl:14px;--rxl:20px;--mw:1180px;
        }
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.75)}}

        /* ── NAV ── */
        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);border-bottom:1px solid var(--s200);transition:box-shadow .25s}
        .lp-nav.sc{box-shadow:0 1px 18px rgba(15,23,42,.07)}
        .lp-nav-inner{max-width:var(--mw);margin:0 auto;padding:0 28px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:32px}
        .lp-logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;flex-shrink:0;cursor:pointer}
        .lp-logo-mark{width:30px;height:30px;background:var(--teal);border-radius:7px;display:flex;align-items:center;justify-content:center}
        .lp-logo-text{font-size:15px;font-weight:700;letter-spacing:-.02em}
        .lp-nav-links{display:flex;align-items:center;gap:28px;list-style:none;flex:1;justify-content:center}
        .lp-nav-links a{font-size:14px;font-weight:500;color:var(--s500);text-decoration:none;transition:color .15s;cursor:pointer}
        .lp-nav-links a:hover{color:var(--s900)}
        .lp-nav-actions{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .btn-ghost-sm{font-size:14px;font-weight:500;color:var(--s600);text-decoration:none;padding:7px 16px;border:1px solid var(--s200);border-radius:var(--r);transition:border-color .15s,color .15s;cursor:pointer;background:none}
        .btn-ghost-sm:hover{border-color:var(--s300);color:var(--s900)}
        .btn-teal-sm{display:inline-flex;align-items:center;gap:5px;padding:8px 18px;background:var(--teal);color:#fff;border:none;border-radius:var(--r);font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;transition:background .15s;white-space:nowrap}
        .btn-teal-sm:hover{background:var(--teal-dk)}

        /* ── HERO ── */
        .lp-hero{padding:140px 28px 96px;background:linear-gradient(175deg,#fff 55%,#f4f9f8 100%)}
        .lp-hero-inner{max-width:var(--mw);margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--teal-lt);color:var(--teal);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:4px;margin-bottom:22px}
        .hero-badge-dot{width:6px;height:6px;background:var(--teal);border-radius:50%;animation:pulse 2s infinite}
        .lp-h1{font-size:52px;font-weight:800;line-height:1.07;letter-spacing:-.033em;color:var(--s900);margin-bottom:6px}
        .lp-h1 em{font-style:normal;color:var(--teal)}
        .lp-h1-sub{font-size:26px;font-weight:700;line-height:1.3;letter-spacing:-.02em;color:var(--s600);margin-bottom:22px}
        .lp-hero-p{font-size:17px;line-height:1.75;color:var(--s500);margin-bottom:10px;max-width:510px}
        .lp-hero-note{font-size:13px;color:var(--s400);margin-bottom:36px;max-width:480px;font-style:italic;line-height:1.6}
        .lp-hero-ctas{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .btn-hero{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:var(--teal);color:#fff;border:none;border-radius:var(--r);font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;transition:background .15s}
        .btn-hero:hover{background:var(--teal-dk)}
        .btn-hero-ghost{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;background:transparent;color:var(--s700);border:1px solid var(--s200);border-radius:var(--r);font-size:15px;font-weight:500;cursor:pointer;text-decoration:none;transition:border-color .15s,background .15s}
        .btn-hero-ghost:hover{border-color:var(--s300);background:var(--s50)}
        .hero-trust{margin-top:30px;display:flex;align-items:center;gap:7px;font-size:12px;color:var(--s400)}
        .hero-trust svg{color:var(--teal);flex-shrink:0}

        /* HERO MOCKUP */
        .hero-visual{position:relative}
        .app-card{background:var(--s900);border-radius:18px;overflow:hidden;box-shadow:0 32px 80px rgba(15,23,42,.22),0 2px 8px rgba(15,23,42,.1);border:1px solid rgba(255,255,255,.05)}
        .app-topbar{background:rgba(255,255,255,.04);padding:13px 18px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:7px}
        .app-dot{width:10px;height:10px;border-radius:50%}
        .app-url{flex:1;background:rgba(255,255,255,.05);border-radius:5px;height:22px;margin:0 12px;display:flex;align-items:center;padding:0 10px;font-size:11px;color:rgba(255,255,255,.2);font-family:monospace}
        .app-body{padding:20px}
        .app-sec-lbl{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:14px}
        .app-split{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
        .app-path{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px}
        .app-path.active{border-color:rgba(13,124,102,.35);background:rgba(13,124,102,.08)}
        .app-path-name{font-size:11px;font-weight:600;color:rgba(255,255,255,.8);margin-bottom:4px}
        .app-path-desc{font-size:10px;color:rgba(255,255,255,.35);line-height:1.5}
        .app-path-items{margin-top:10px;display:flex;flex-direction:column;gap:5px}
        .app-item-done{font-size:10px;color:#34d399}
        .app-item-pend{font-size:10px;color:rgba(255,255,255,.25)}
        .app-divider{border:none;border-top:1px solid rgba(255,255,255,.07);margin-bottom:14px}
        .app-footer-row{display:flex;align-items:center;justify-content:space-between}
        .app-footer-lbl{font-size:11px;color:rgba(255,255,255,.35)}
        .app-status{font-size:10px;font-weight:700;background:rgba(13,124,102,.2);color:#34d399;padding:3px 10px;border-radius:20px}
        .hero-float{position:absolute;top:-18px;right:-14px;background:#fff;border-radius:12px;padding:10px 14px;box-shadow:0 8px 28px rgba(15,23,42,.14);display:flex;align-items:center;gap:9px}
        .hero-float-icon{width:30px;height:30px;border-radius:8px;background:var(--teal-lt);display:flex;align-items:center;justify-content:center;font-size:15px}
        .hero-float-lbl{font-size:11px;color:var(--s400);font-weight:400}
        .hero-float-val{font-size:13px;font-weight:700;color:var(--s900)}

        /* ── SP BAR ── */
        .sp-bar{padding:28px;background:var(--s50);border-top:1px solid var(--s200);border-bottom:1px solid var(--s200)}
        .sp-bar-inner{max-width:var(--mw);margin:0 auto;display:flex;align-items:center;justify-content:center}
        .sp-pill{display:inline-flex;align-items:center;gap:10px;background:var(--teal-lt);color:var(--teal);font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px}
        .sp-dot{width:8px;height:8px;background:var(--teal);border-radius:50%;animation:pulse 2s infinite}
        .sp-pill a{color:var(--teal);font-weight:700;text-decoration:none;cursor:pointer}
        .sp-pill a:hover{text-decoration:underline}

        /* ── SECCIÓN ── */
        .lp-section{padding:96px 0}
        .lp-section-sm{padding:64px 0}
        .lp-container{max-width:var(--mw);margin:0 auto;padding:0 28px}
        .sec-label{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--teal);margin-bottom:14px}
        .sec-h2{font-size:38px;font-weight:800;letter-spacing:-.025em;line-height:1.12;color:var(--s900);margin-bottom:16px}
        .sec-h2 em{font-style:normal;color:var(--teal)}
        .sec-sub{font-size:17px;color:var(--s500);line-height:1.7;max-width:640px}
        .sec-intro{margin-bottom:56px}

        /* ── FEATURES ── */
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .feat-card{background:var(--s50);border:1px solid var(--s200);border-radius:var(--rl);padding:28px;transition:border-color .2s,box-shadow .2s}
        .feat-card:hover{border-color:var(--s300);box-shadow:0 4px 20px rgba(15,23,42,.06)}
        .feat-card.star{background:var(--teal-50);border-color:rgba(13,124,102,.18)}
        .feat-card.star:hover{border-color:rgba(13,124,102,.32)}
        .feat-icon{width:42px;height:42px;border-radius:10px;background:#fff;border:1px solid var(--s200);display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(15,23,42,.06)}
        .feat-card.star .feat-icon{background:var(--teal-lt);border-color:transparent}
        .feat-tag{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--teal);background:var(--teal-lt);padding:2px 8px;border-radius:3px;margin-bottom:8px}
        .feat-h{font-size:15px;font-weight:700;color:var(--s900);margin-bottom:8px;line-height:1.35}
        .feat-p{font-size:14px;color:var(--s500);line-height:1.65}

        /* ── CÓMO FUNCIONA ── */
        .how-bg{background:var(--s900);border-radius:24px;padding:64px;position:relative;overflow:hidden}
        .how-bg::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(13,124,102,.5),transparent)}
        .how-bg::after{content:'';position:absolute;top:-80px;right:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(13,124,102,.12) 0%,transparent 70%);pointer-events:none}
        .how-bg .sec-label{color:rgba(13,124,102,.8)}
        .how-bg .sec-h2{color:#fff}
        .how-bg .sec-h2 em{color:#34d399}
        .steps{display:flex;flex-direction:column;margin-top:48px}
        .step{display:grid;grid-template-columns:48px 1fr;gap:0 24px;position:relative}
        .step-line{position:absolute;left:23px;top:50px;bottom:0;width:2px;background:rgba(255,255,255,.06)}
        .step-num{width:38px;height:38px;border-radius:50%;background:rgba(13,124,102,.15);border:1px solid rgba(13,124,102,.3);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#34d399;flex-shrink:0;margin-top:4px}
        .step-body{padding-bottom:40px}
        .step-h{font-size:18px;font-weight:700;color:#fff;margin-bottom:8px}
        .step-p{font-size:14px;color:rgba(255,255,255,.5);line-height:1.7}
        .bifurcacion{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}
        .bif-path{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:20px}
        .bif-path.ca{border-color:rgba(13,124,102,.28);background:rgba(13,124,102,.07)}
        .bif-label{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin-bottom:8px}
        .ca .bif-label{color:#34d399}
        .cb .bif-label{color:rgba(255,255,255,.35)}
        .bif-h{font-size:13px;font-weight:600;color:#fff;margin-bottom:8px}
        .bif-p{font-size:12px;color:rgba(255,255,255,.4);line-height:1.65}
        .bif-note{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.07);font-size:11px;color:rgba(255,255,255,.3);font-style:italic;line-height:1.55}

        /* ── LO QUE NO SOMOS ── */
        .nosomos-bg{background:var(--s50)}
        .nosomos-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:48px}
        .nosomos-col-h{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:20px}
        .nosomos-col-h.no{color:var(--s400)}
        .nosomos-col-h.si{color:var(--teal)}
        .nosomos-item{display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid var(--s200)}
        .nosomos-item:last-child{border-bottom:none}
        .nosomos-icon{font-size:16px;flex-shrink:0;margin-top:1px}
        .nosomos-strong{display:block;color:var(--s900);font-weight:600;margin-bottom:3px;font-size:14px}
        .nosomos-small{font-size:12px;color:var(--s400);line-height:1.6}

        /* ── PRECIOS ── */
        .pricing-header{text-align:center}
        .toggle-wrap{display:flex;align-items:center;justify-content:center;gap:12px;margin:36px 0 52px}
        .toggle-lbl{font-size:14px;font-weight:500;color:var(--s400);transition:color .2s}
        .toggle-lbl.on{color:var(--s900);font-weight:600}
        .toggle-switch{position:relative;width:46px;height:26px;cursor:pointer;display:inline-block}
        .toggle-switch input{opacity:0;width:0;height:0;position:absolute}
        .toggle-track{position:absolute;inset:0;background:var(--teal);border-radius:13px;transition:background .2s}
        .toggle-thumb{position:absolute;width:20px;height:20px;left:3px;top:3px;background:#fff;border-radius:50%;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.15)}
        .toggle-badge{font-size:11px;font-weight:700;letter-spacing:.02em;color:var(--teal);background:var(--teal-lt);padding:3px 10px;border-radius:5px}
        .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:stretch}
        .pricing-card{background:#fff;border:1px solid var(--s200);border-radius:var(--rxl);padding:32px;display:flex;flex-direction:column;transition:border-color .2s,box-shadow .2s;position:relative}
        .pricing-card:hover{border-color:var(--s300);box-shadow:0 8px 32px rgba(15,23,42,.07)}
        .pricing-card.featured{background:var(--s900);border-color:var(--s900);box-shadow:0 20px 56px rgba(15,23,42,.2);transform:scale(1.025);z-index:1}
        .pricing-card.featured:hover{box-shadow:0 24px 64px rgba(15,23,42,.26)}
        .feat-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--teal);color:#fff;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:4px 14px;border-radius:20px;white-space:nowrap}
        .plan-name{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--s400);margin-bottom:16px}
        .featured .plan-name{color:rgba(255,255,255,.45)}
        .plan-price{display:flex;align-items:baseline;gap:3px;margin-bottom:4px}
        .plan-amount{font-size:44px;font-weight:800;letter-spacing:-.03em;color:var(--s900)}
        .featured .plan-amount{color:#fff}
        .plan-unit{font-size:16px;color:var(--s400);font-weight:500}
        .featured .plan-unit{color:rgba(255,255,255,.35)}
        .plan-annual{font-size:12px;color:var(--s400);margin-bottom:6px;min-height:18px}
        .featured .plan-annual{color:rgba(255,255,255,.3)}
        .plan-desc{font-size:13px;color:var(--s500);line-height:1.55;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--s100)}
        .featured .plan-desc{color:rgba(255,255,255,.4);border-bottom-color:rgba(255,255,255,.07)}
        .plan-feats{flex:1;display:flex;flex-direction:column;gap:11px;margin-bottom:28px}
        .plan-feat{display:flex;align-items:flex-start;gap:9px;font-size:14px;color:var(--s600);line-height:1.4}
        .featured .plan-feat{color:rgba(255,255,255,.7)}
        .feat-check{color:var(--teal);flex-shrink:0;font-weight:700}
        .featured .feat-check{color:#34d399}
        .btn-plan{display:block;text-align:center;padding:12px 20px;border-radius:var(--r);font-size:14px;font-weight:600;text-decoration:none;cursor:pointer;border:none;transition:all .15s}
        .btn-plan-teal{background:var(--teal);color:#fff}
        .btn-plan-teal:hover{background:var(--teal-dk)}
        .btn-plan-outline{background:transparent;color:var(--s700);border:1px solid var(--s200)}
        .btn-plan-outline:hover{border-color:var(--s300);background:var(--s50)}
        .btn-plan-white{background:#fff;color:var(--s900)}
        .btn-plan-white:hover{background:var(--s50)}
        .ppu-card{margin-top:18px;background:var(--s50);border:1px solid var(--s200);border-radius:var(--rl);padding:26px 32px;display:flex;align-items:center;justify-content:space-between;gap:24px}
        .ppu-lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--s400);margin-bottom:5px}
        .ppu-price{font-size:22px;font-weight:800;letter-spacing:-.02em;color:var(--s900);margin-bottom:3px}
        .ppu-desc{font-size:13px;color:var(--s500)}
        .ppu-feats{display:flex;gap:20px;flex-wrap:wrap}
        .ppu-feat{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--s600)}
        .ppu-chk{color:var(--teal);font-weight:700}
        .btn-ppu{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border:1px solid var(--s300);border-radius:var(--r);font-size:14px;font-weight:600;color:var(--s700);text-decoration:none;white-space:nowrap;transition:all .15s;flex-shrink:0;background:none;cursor:pointer}
        .btn-ppu:hover{border-color:var(--s400);background:#fff;color:var(--s900)}
        .pricing-note{text-align:center;margin-top:28px;font-size:13px;color:var(--s400)}
        .pricing-note a{color:var(--teal);text-decoration:none;cursor:pointer}
        .pricing-note a:hover{text-decoration:underline}

        /* ── CTA FINAL ── */
        .cta-wrap{background:var(--s900);border-radius:24px;padding:80px;text-align:center;position:relative;overflow:hidden}
        .cta-wrap::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 65% 55% at 50% -15%,rgba(13,124,102,.28) 0%,transparent 65%)}
        .cta-wrap > *{position:relative}
        .cta-wrap .sec-label{display:flex;justify-content:center;color:rgba(13,124,102,.7)}
        .cta-h2{font-size:44px;font-weight:800;letter-spacing:-.03em;color:#fff;margin-bottom:18px;line-height:1.1}
        .cta-sub{font-size:17px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:40px;max-width:500px;margin-left:auto;margin-right:auto}
        .cta-actions{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:20px}
        .btn-cta{display:inline-flex;align-items:center;gap:8px;padding:15px 34px;border-radius:var(--r);background:var(--teal);color:#fff;font-size:16px;font-weight:700;text-decoration:none;transition:background .15s;cursor:pointer}
        .btn-cta:hover{background:var(--teal-dk)}
        .cta-fine{font-size:13px;color:rgba(255,255,255,.28)}

        /* ── FOOTER ── */
        .lp-footer{padding:56px 28px 36px;border-top:1px solid var(--s100)}
        .lp-footer-inner{max-width:var(--mw);margin:0 auto;display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:48px}
        .footer-logo-row{display:flex;align-items:center;gap:9px;margin-bottom:14px}
        .footer-logo-mark{width:28px;height:28px;border-radius:6px;background:var(--teal);display:flex;align-items:center;justify-content:center}
        .footer-logo-text{font-size:14px;font-weight:700;letter-spacing:-.02em;color:var(--s900)}
        .footer-tagline{font-size:13px;color:var(--s400);line-height:1.6;margin-bottom:16px;max-width:210px}
        .footer-email{font-size:13px;font-weight:500;color:var(--teal);text-decoration:none}
        .footer-email:hover{text-decoration:underline}
        .footer-col-h{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--s400);margin-bottom:16px}
        .footer-links{list-style:none;display:flex;flex-direction:column;gap:10px}
        .footer-links a{font-size:13px;color:var(--s500);text-decoration:none;transition:color .15s;cursor:pointer}
        .footer-links a:hover{color:var(--s900)}
        .footer-bottom{max-width:var(--mw);margin:36px auto 0;padding-top:22px;border-top:1px solid var(--s100);display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap}
        .footer-copy{font-size:12px;color:var(--s400)}
        .footer-disclaimer{font-size:11px;color:var(--s400);line-height:1.65;max-width:560px;text-align:right}

        /* ── RESPONSIVE ── */
        @media(max-width:1024px){
          .lp-hero-inner{grid-template-columns:1fr}
          .hero-visual{display:none}
          .feat-grid{grid-template-columns:repeat(2,1fr)}
          .pricing-grid{grid-template-columns:1fr}
          .pricing-card.featured{transform:scale(1)}
          .lp-footer-inner{grid-template-columns:1fr 1fr;gap:32px}
          .how-bg{padding:40px 28px}
          .nosomos-grid{grid-template-columns:1fr}
          .ppu-card{flex-direction:column;align-items:flex-start}
          .cta-wrap{padding:56px 32px}
        }
        @media(max-width:768px){
          .lp-hero{padding:120px 20px 64px}
          .lp-h1{font-size:36px}
          .lp-h1-sub{font-size:20px}
          .sec-h2{font-size:28px}
          .cta-h2{font-size:28px}
          .cta-wrap{padding:44px 20px}
          .bifurcacion{grid-template-columns:1fr}
          .feat-grid{grid-template-columns:1fr}
          .lp-footer-inner{grid-template-columns:1fr;gap:28px}
          .lp-nav-links{display:none}
          .footer-disclaimer{text-align:left}
        }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav className={`lp-nav${scrolled ? " sc" : ""}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => navigate("/")}>
            <div className="lp-logo-mark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 13L8 3L13 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.2 9.5H10.8" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="lp-logo-text">CERTIFIVE</span>
          </div>
          <ul className="lp-nav-links">
            <li><a onClick={scrollTo("funcionalidades")}>Funcionalidades</a></li>
            <li><a onClick={scrollTo("como-funciona")}>Cómo funciona</a></li>
            <li><a onClick={scrollTo("precios")}>Precios</a></li>
          </ul>
          <div className="lp-nav-actions">
            <button className="btn-ghost-sm" onClick={() => navigate("/login")}>Iniciar sesión</button>
            <button className="btn-teal-sm" onClick={() => navigate("/register")}>
              Empezar gratis
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div>
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Beta abierta para técnicos certificadores
            </div>
            <h1 className="lp-h1">Dos maneras de hacer<br/>el <em>trabajo de campo.</em></h1>
            <p className="lp-h1-sub">El propietario desde su móvil.<br/>Tú desde tu tablet en la visita.</p>
            <p className="lp-hero-p">Certifive guía al propietario paso a paso para recoger los datos de su propio inmueble: fotos, medidas, instalaciones. Con esos datos sobre la mesa, tú decides si necesitas ir o no — eso es tu criterio profesional, no el nuestro. Si vas, usas la app en tablet y sales con todo hecho.</p>
            <p className="lp-hero-note">El certificado oficial lo sigues generando tú en CE3X. De eso no nos encargamos nosotros.</p>
            <div className="lp-hero-ctas">
              <button className="btn-hero" onClick={() => navigate("/register")}>Probar gratis 14 días — sin tarjeta</button>
              <a className="btn-hero-ghost" onClick={scrollTo("como-funciona")}>
                Ver cómo funciona
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7H11M7.5 4L11 7L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
            <div className="hero-trust">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><path d="M6.5 1L7.8 4.8H12L8.8 7.1L10 11L6.5 8.6L3 11L4.2 7.1L1 4.8H5.2L6.5 1Z"/></svg>
              Sin permanencia · Sin tarjeta de crédito · Cancela cuando quieras
            </div>
          </div>

          {/* VISUAL MOCKUP */}
          <div className="hero-visual">
            <div style={{ position:"relative" }}>
              <div className="app-card">
                <div className="app-topbar">
                  <div className="app-dot" style={{ background:"#ff5f57" }} />
                  <div className="app-dot" style={{ background:"#febc2e" }} />
                  <div className="app-dot" style={{ background:"#28c840" }} />
                  <div className="app-url">app.certifive.es/expediente/2847</div>
                </div>
                <div className="app-body">
                  <div className="app-sec-lbl">Expediente #2847 · Calle Mayor 12, 3ºB · Madrid</div>
                  <div className="app-split">
                    <div className="app-path active">
                      <div style={{ fontSize:20, marginBottom:8 }}>📱</div>
                      <div className="app-path-name">Camino A — Propietario recoge datos</div>
                      <div className="app-path-desc">Formulario guiado enviado por WhatsApp</div>
                      <div className="app-path-items">
                        <div className="app-item-done">✓ Fachadas y orientación</div>
                        <div className="app-item-done">✓ Ventanas y huecos</div>
                        <div className="app-item-done">✓ Caldera e instalaciones</div>
                        <div className="app-item-pend">◦ Fotos pendientes (2)</div>
                      </div>
                    </div>
                    <div className="app-path">
                      <div style={{ fontSize:20, marginBottom:8 }}>📋</div>
                      <div className="app-path-name">Camino B — Visita con tablet</div>
                      <div className="app-path-desc">Ficha técnica in situ</div>
                      <div className="app-path-items">
                        <div className="app-item-pend">◦ No necesario</div>
                        <div className="app-item-pend">◦ Datos del propietario OK</div>
                        <div className="app-item-pend">◦ Tú decides como técnico</div>
                      </div>
                    </div>
                  </div>
                  <hr className="app-divider" />
                  <div className="app-footer-row">
                    <div className="app-footer-lbl">Datos exportados para CE3X</div>
                    <div className="app-status">✓ Listo para CE3X</div>
                  </div>
                </div>
              </div>
              <div className="hero-float">
                <div className="hero-float-icon">💰</div>
                <div>
                  <div className="hero-float-lbl">1er tramo cobrado</div>
                  <div className="hero-float-val">Antes de la visita</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF ══ */}
      <div className="sp-bar">
        <div className="sp-bar-inner">
          <div className="sp-pill">
            <span className="sp-dot" />
            En desarrollo con certificadores reales de Madrid, Barcelona y Valencia.&nbsp;
            <a onClick={() => navigate("/register")}>Únete a la beta →</a>
          </div>
        </div>
      </div>

      {/* ══ QUÉ HACE CERTIFIVE ══ */}
      <section className="lp-section" id="funcionalidades">
        <div className="lp-container">
          <div className="sec-intro">
            <div className="sec-label">Qué hace Certifive</div>
            <h2 className="sec-h2">Certifive no reemplaza CE3X.<br/><em>Hace todo lo que CE3X no hace.</em></h2>
            <p className="sec-sub">CE3X calcula la calificación energética. Eso no va a cambiar. El problema es todo lo que hay antes y después: la recogida de datos del propietario, el presupuesto, el cobro, las fotos, la documentación, la factura. Certifive lo organiza todo en un solo lugar.</p>
          </div>
          <div className="feat-grid">
            <div className="feat-card star">
              <div className="feat-tag">⭐ Diferenciador clave</div>
              <div className="feat-icon">📱</div>
              <h3 className="feat-h">El propietario hace los deberes. Tú decides con toda la información.</h3>
              <p className="feat-p">Certifive guía al propietario paso a paso para recoger los datos de su inmueble: fotos de fachadas, ventanas, caldera, dimensiones. Con instrucciones en lenguaje normal y ejemplos visuales. Cuando recibes los datos, decides tú —como técnico— si son suficientes o si necesitas completarlos in situ.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📋</div>
              <h3 className="feat-h">Para cuando sí hay que ir: sin papel, sin apuntes sueltos</h3>
              <p className="feat-p">Usas Certifive en tu tablet durante la visita. Secciones guiadas para la envolvente, los huecos y las instalaciones. Al salir, los datos están en la nube listos para CE3X.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📄</div>
              <h3 className="feat-h">Formulario online para el propietario</h3>
              <p className="feat-p">El propietario rellena los datos de su inmueble desde el móvil. Tú recibes todo ordenado, sin llamadas ni emails con adjuntos.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">💶</div>
              <h3 className="feat-h">Presupuesto que el cliente acepta con un clic</h3>
              <p className="feat-p">Genera y envía el presupuesto por WhatsApp o email. El cliente lo acepta y paga online. Sin gestiones manuales ni perseguir pagos. Cobras el primer tramo antes de hacer el trabajo.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📸</div>
              <h3 className="feat-h">Las fotos en su sitio, con descripción, desde el primer día</h3>
              <p className="feat-p">Cada foto queda vinculada al expediente con categoría y descripción, tanto si las hace el propietario como si las haces tú en la visita. Sin buscar en el carrete del móvil.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🗂️</div>
              <h3 className="feat-h">Un expediente para cada certificación</h3>
              <p className="feat-p">Toda la documentación, los mensajes, los pagos y el estado en un solo lugar. Para ti solo o para un equipo de varios certificadores.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🧾</div>
              <h3 className="feat-h">La factura se genera sola al confirmar el pago</h3>
              <p className="feat-p">Formato legal español, con todos los datos fiscales. Lista para descargar o enviar por email. Sin errores, sin olvidarse del IVA.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CÓMO FUNCIONA ══ */}
      <section className="lp-section" id="como-funciona">
        <div className="lp-container">
          <div className="how-bg">
            <div className="sec-label">Cómo funciona</div>
            <h2 className="sec-h2">Así es una certificación <em>con Certifive</em></h2>
            <div className="steps">
              <div className="step">
                <div className="step-line" />
                <div><div className="step-num">1</div></div>
                <div className="step-body">
                  <h3 className="step-h">Recibes el encargo y creas el expediente</h3>
                  <p className="step-p">Creas la certificación en Certifive y mandas al propietario un link por WhatsApp o email para que rellene sus datos básicos. Todo en menos de dos minutos.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-line" />
                <div><div className="step-num">2</div></div>
                <div className="step-body">
                  <h3 className="step-h">Presupuesto y primer pago</h3>
                  <p className="step-p">Con los datos básicos en mano, generas el presupuesto y lo envías. El cliente lo acepta online y paga el primer tramo. Cobras antes de hacer el trabajo.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-line" />
                <div><div className="step-num">3</div></div>
                <div className="step-body">
                  <h3 className="step-h">Los datos técnicos llegan de dos maneras</h3>
                  <p className="step-p" style={{ marginBottom:16 }}>Aquí es donde Certifive cambia las reglas: tú eliges cómo se recogen los datos, según el encargo y tu criterio profesional.</p>
                  <div className="bifurcacion">
                    <div className="bif-path ca">
                      <div className="bif-label">Camino A — El propietario desde casa</div>
                      <h4 className="bif-h">Mandas el formulario guiado al propietario</h4>
                      <p className="bif-p">Él sigue las instrucciones paso a paso: qué fotos hacer, cómo hacerlas, qué datos recoger. Todo en su móvil, sin tecnicismos, con ejemplos visuales.</p>
                      <div className="bif-note">Decides tú —como técnico responsable— si son suficientes para certificar o si necesitas completarlos con una visita. Certifive no toma esa decisión. Tú sí.</div>
                    </div>
                    <div className="bif-path cb">
                      <div className="bif-label">Camino B — Tú con la tablet en la visita</div>
                      <h4 className="bif-h">Cuando la visita sí hace falta, nada se pierde</h4>
                      <p className="bif-p">Abres Certifive en tu tablet. La app te guía por cada sección: fachadas, ventanas, instalaciones, fotos. Todo queda guardado en la nube al instante.</p>
                      <div className="bif-note">Sin papeles ni fotos sueltas en el móvil. Al llegar a la oficina, los datos ya están esperándote.</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="step">
                <div className="step-line" />
                <div><div className="step-num">4</div></div>
                <div className="step-body">
                  <h3 className="step-h">Exportas los datos para CE3X</h3>
                  <p className="step-p">Certifive te da los datos ordenados y etiquetados con la nomenclatura de CE3X. Copias los valores, calculas la calificación y generas el certificado oficial. Sin buscar nada en papeles ni notas dispersas.</p>
                </div>
              </div>
              <div className="step">
                <div><div className="step-num">5</div></div>
                <div className="step-body">
                  <h3 className="step-h">Cobras el segundo tramo y la factura se genera sola</h3>
                  <p className="step-p">El cliente paga el segundo tramo. La factura legal española se genera automáticamente. El expediente queda cerrado y archivado con toda la documentación.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ LO QUE NO SOMOS ══ */}
      <section className="lp-section nosomos-bg">
        <div className="lp-container">
          <div className="sec-label">Transparencia</div>
          <h2 className="sec-h2">Lo que Certifive no hace<br/><em>(y por qué es importante que lo sepas)</em></h2>
          <p className="sec-sub">Si buscas un software que prometa hacer todo automáticamente, no somos lo tuyo. Si buscas uno que te ahorre horas reales en cada certificación sin mentirte, sigue leyendo.</p>
          <div className="nosomos-grid">
            <div>
              <div className="nosomos-col-h no">❌ Lo que no hacemos</div>
              {[
                { t:"No generamos el certificado de eficiencia energética oficial.", s:"El certificado oficial lo genera CE3X u otro programa reconocido. Eso no va a cambiar porque así lo exige la normativa española." },
                { t:"No rellenamos CE3X automáticamente (todavía).", s:"CE3X no tiene API pública. Exportamos los datos en un formato que hace el volcado manual mucho más rápido." },
                { t:"No decidimos si un inmueble necesita visita o no.", s:"Esa es una decisión técnica y profesional del certificador habilitado. Lo que hacemos es darte mejores datos antes de decidir." },
              ].map((item, i) => (
                <div className="nosomos-item" key={i}>
                  <span className="nosomos-icon">❌</span>
                  <div><span className="nosomos-strong">{item.t}</span><span className="nosomos-small">{item.s}</span></div>
                </div>
              ))}
            </div>
            <div>
              <div className="nosomos-col-h si">✅ Lo que sí hacemos</div>
              {[
                { t:"Organizamos todo el proceso alrededor de CE3X.", s:"Para que el momento de abrir CE3X sea la parte fácil del trabajo, no la más pesada." },
                { t:"Guiamos al propietario para que los datos lleguen antes que tú.", s:"Con instrucciones en lenguaje normal, ejemplos visuales y un formulario desde cualquier móvil." },
                { t:"Gestionamos presupuestos, cobros en tramos y facturas legales.", s:"Para que te concentres en el trabajo técnico y no en el administrativo." },
                { t:"Centralizamos expedientes, fotos y documentos.", s:"Todo en un solo lugar. Para ti o para un equipo de varios certificadores." },
              ].map((item, i) => (
                <div className="nosomos-item" key={i}>
                  <span className="nosomos-icon">✅</span>
                  <div><span className="nosomos-strong">{item.t}</span><span className="nosomos-small">{item.s}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRECIOS ══ */}
      <section className="lp-section" id="precios">
        <div className="lp-container">
          <div className="sec-intro pricing-header">
            <div className="sec-label">Precios</div>
            <h2 className="sec-h2">Elige el plan que se adapta a tu volumen</h2>
            <p className="sec-sub" style={{ margin:"0 auto" }}>Sin permanencia. Sin letra pequeña. Cancela cuando quieras.</p>
          </div>

          {/* Toggle */}
          <div className="toggle-wrap">
            <span className={`toggle-lbl${!isAnnual ? " on" : ""}`}>Mensual</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={isAnnual} onChange={e => setIsAnnual(e.target.checked)} />
              <div className="toggle-track" />
              <div className="toggle-thumb" style={{ transform: isAnnual ? "translateX(20px)" : "translateX(0)" }} />
            </label>
            <span className={`toggle-lbl${isAnnual ? " on" : ""}`}>Anual</span>
            <span className="toggle-badge">2 meses gratis</span>
          </div>

          {/* Cards */}
          <div className="pricing-grid">
            {/* BÁSICO */}
            <div className="pricing-card">
              <div className="plan-name">Básico</div>
              <div className="plan-price">
                <span className="plan-amount">{P("basic")}</span>
                <span className="plan-unit">€/mes</span>
              </div>
              <div className="plan-annual">{Ann("basic")}</div>
              <div className="plan-desc">Para técnicos que empiezan o con poco volumen de certificaciones.</div>
              <div className="plan-feats">
                {["Hasta 10 certificaciones/mes","Expedientes y clientes","Formulario guiado para propietarios","Presupuestos digitales","Facturas automáticas","Exportación de datos para CE3X"].map((f,i) => (
                  <div className="plan-feat" key={i}><span className="feat-check">✓</span>{f}</div>
                ))}
              </div>
              <button className="btn-plan btn-plan-teal" onClick={() => navigate("/register?plan=basic")}>Empezar gratis 14 días</button>
            </div>

            {/* PROFESIONAL */}
            <div className="pricing-card featured">
              <div className="feat-badge">★ Más popular</div>
              <div className="plan-name">Profesional</div>
              <div className="plan-price">
                <span className="plan-amount">{P("pro")}</span>
                <span className="plan-unit">€/mes</span>
              </div>
              <div className="plan-annual">{Ann("pro")}</div>
              <div className="plan-desc">Para técnicos activos con flujo continuo de encargos.</div>
              <div className="plan-feats">
                {["Hasta 50 certificaciones/mes","Todo lo del plan Básico","WhatsApp integrado","Cobros en tramos + firma digital","Recordatorios automáticos","Estadísticas e informes de actividad"].map((f,i) => (
                  <div className="plan-feat" key={i}><span className="feat-check">✓</span>{f}</div>
                ))}
              </div>
              <button className="btn-plan btn-plan-white" onClick={() => navigate("/register?plan=pro")}>Empezar gratis 14 días</button>
            </div>

            {/* EMPRESA */}
            <div className="pricing-card">
              <div className="plan-name">Empresa</div>
              <div className="plan-price">
                <span className="plan-amount">{P("empresa")}</span>
                <span className="plan-unit">€/mes</span>
              </div>
              <div className="plan-annual">{Ann("empresa")}</div>
              <div className="plan-desc">Para estudios técnicos con equipo y alto volumen de trabajo.</div>
              <div className="plan-feats">
                {["Certificaciones ilimitadas","Hasta 5 técnicos en el mismo panel","Todo lo del plan Profesional","Acceso API para integraciones","Funciones de IA (próximamente)","Soporte prioritario"].map((f,i) => (
                  <div className="plan-feat" key={i}><span className="feat-check">✓</span>{f}</div>
                ))}
              </div>
              <button className="btn-plan btn-plan-outline" onClick={() => navigate("/contact?plan=empresa")}>Hablar con nosotros</button>
            </div>
          </div>

          {/* PAY-PER-USE */}
          <div className="ppu-card">
            <div>
              <div className="ppu-lbl">¿Certificas de forma esporádica?</div>
              <div className="ppu-price">3€ por certificación</div>
              <div className="ppu-desc">Pay-per-use · Sin suscripción · Pagas solo cuando trabajas</div>
            </div>
            <div className="ppu-feats">
              <div className="ppu-feat"><span className="ppu-chk">✓</span>Sin cuota mensual</div>
              <div className="ppu-feat"><span className="ppu-chk">✓</span>Acceso completo por certificación</div>
              <div className="ppu-feat"><span className="ppu-chk">✓</span>Paga solo cuando certifiques</div>
            </div>
            <button className="btn-ppu" onClick={() => navigate("/register?plan=ppu")}>
              Ver cómo funciona
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          <p className="pricing-note">
            💬 ¿Eres inmobiliaria, promotora o gran empresa?&nbsp;
            <a onClick={() => navigate("/contact")}>Cuéntanos tu caso y diseñamos una propuesta a medida →</a>
          </p>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="lp-section-sm">
        <div className="lp-container">
          <div className="cta-wrap">
            <div className="sec-label">Empieza hoy</div>
            <h2 className="cta-h2">Pruébalo 14 días gratis.<br/>Sin tarjeta. Sin compromisos.</h2>
            <p className="cta-sub">Si después de 14 días no te ha ahorrado tiempo real en tu trabajo, te devolvemos el tiempo que perdiste configurándolo. Palabra.</p>
            <div className="cta-actions">
              <button className="btn-cta" onClick={() => navigate("/register")}>
                Crear mi cuenta gratis
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8H12.5M8.5 4L13 8L8.5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <p className="cta-fine">Técnico certificador habilitado · Sin permanencia · Cancela cuando quieras</p>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="footer-logo-row">
              <div className="footer-logo-mark">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 13L8 3L13 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.2 9.5H10.8" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="footer-logo-text">CERTIFIVE</span>
            </div>
            <p className="footer-tagline">La plataforma de gestión para técnicos certificadores energéticos.</p>
            <a href="mailto:hola@certifive.es" className="footer-email">hola@certifive.es</a>
          </div>
          <div>
            <div className="footer-col-h">Producto</div>
            <ul className="footer-links">
              <li><a onClick={scrollTo("funcionalidades")}>Funcionalidades</a></li>
              <li><a onClick={scrollTo("como-funciona")}>Cómo funciona</a></li>
              <li><a onClick={scrollTo("precios")}>Precios</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-h">Legal</div>
            <ul className="footer-links">
              <li><a onClick={() => navigate("/aviso-legal")}>Aviso legal</a></li>
              <li><a onClick={() => navigate("/privacidad")}>Política de privacidad</a></li>
              <li><a onClick={() => navigate("/cookies")}>Cookies</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-h">Empresa</div>
            <ul className="footer-links">
              <li><a onClick={() => navigate("/contact")}>Contacto</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2026 Certifive. Todos los derechos reservados.</p>
          <p className="footer-disclaimer">Certifive es una herramienta de gestión. El certificado de eficiencia energética oficial debe generarse con un Documento Reconocido por el Ministerio (CE3X, HULC, CYPETHERM u otro) y registrarse en el organismo competente de la Comunidad Autónoma correspondiente.</p>
        </div>
      </footer>
    </div>
  );
}
