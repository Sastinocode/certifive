# Design Tokens — Certifive

Define estos tokens como variables CSS (o el equivalente en tu sistema de design tokens: tailwind.config, theme.ts, etc.) **sin renombrar nada que ya exista**. Si un token ya existe con otro nombre, mapea el nuevo valor sobre el existente; no dupliques.

## Colores

```css
:root {
  /* Marca */
  --green:       #1FA94B;   /* Primary verde Certifive */
  --green-dark:  #178A3C;   /* Estados hover y oscurecidos */
  --green-light: #e8f6ec;   /* Backgrounds suaves, badges */
  --green-50:    #f3faf5;   /* Background secundario */

  /* Acentos */
  --lime:        #84CC16;
  --orange:      #F59E0B;

  /* Neutros */
  --ink:         #0F172A;   /* Texto principal */
  --ink-700:     #1E293B;   /* Texto secundario fuerte */
  --slate-600:   #475569;
  --slate-500:   #64748B;   /* Texto secundario */
  --slate-400:   #94A3B8;
  --slate-300:   #CBD5E1;
  --slate-200:   #E5E7EB;   /* Bordes */
  --slate-100:   #F1F5F9;
  --slate-50:    #F8FAFC;   /* Backgrounds alternativos */
  --white:       #FFFFFF;
}
```

## Radios

```css
--r:    8px;      /* Botones, inputs */
--r-lg: 14px;     /* Cards */
--r-xl: 20px;     /* Bloques showcase */
```

## Sombras

```css
--shadow-soft: 0 4px 24px rgba(15,23,42,0.06);
--shadow-card: 0 1px 2px rgba(15,23,42,0.04), 0 12px 32px rgba(15,23,42,0.06);
--shadow-btn-primary: 0 1px 2px rgba(31,169,75,0.2), 0 4px 12px rgba(31,169,75,0.18);
--shadow-btn-primary-hover: 0 1px 2px rgba(31,169,75,0.3), 0 6px 18px rgba(31,169,75,0.25);
```

## Tipografía

- **Familia:** `Inter, -apple-system, BlinkMacSystemFont, sans-serif`
- **Pesos cargados:** 300, 400, 500, 600, 700, 800, 900
- **Smoothing:** `-webkit-font-smoothing: antialiased;`

### Escala

| Uso | Tamaño | Peso | Letter-spacing | Line-height |
|---|---|---|---|---|
| Hero h1 | 60px | 800 | -0.035em | 1.05 |
| Section title (h2) | 44px | 800 | -0.03em | 1.1 |
| Hero sub | 19px | 400 | — | 1.65 |
| Section sub | 18px | 400 | — | 1.65 |
| Card title | 17px | 700 | -0.01em | 1.3 |
| Body | 15-16px | 400 | — | 1.6 |
| Eyebrow | 13px | 600 | 0.08em uppercase | 1 |
| Stat number | 36px | 800 | -0.03em | 1 |
| Footer body | 14px | 400 | — | 1.65 |

## Layout

```css
--max-w: 1240px;     /* Container principal */
/* Padding container: 32px lateral */
/* Padding section: 110px vertical */
```

## Botones

### Primary
- Background `var(--green)`, color blanco
- Padding `12px 24px` (default), `16px 32px` (large), `10px 20px` (small)
- Border-radius `var(--r)`
- Font 15px / weight 600
- Hover: `var(--green-dark)` + sombra más fuerte
- Active: `transform: scale(0.98)`

### Ghost
- Background blanco, color `var(--ink)`
- Border `1.5px solid var(--slate-200)`
- Hover: border y color a `var(--green)`

## Animaciones / transiciones

- Hover de cards: `transition: transform .2s, box-shadow .2s, border-color .2s`
- Reveal on scroll: `opacity 0 → 1` + `translateY(24px → 0)` con `cubic-bezier(.16,1,.3,1)` y duración `0.8s`
- Pulse del badge dot: keyframes con `box-shadow` expandiéndose cada 2s
- Parallax: `requestAnimationFrame` + `translate3d(0, scrollY * speed, 0)`

## Accesibilidad

```css
@media (prefers-reduced-motion: reduce) {
  .parallax-layer { transform: none !important; }
  /* También: desactivar reveal-on-scroll y dejar todo visible */
}
```
