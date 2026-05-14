# Visual Changes — Spec detallada

> Recordatorio: aplica solo cambios visuales/estructurales. **No reescribas copy del sitio actual.**

---

## 1. Paleta y branding

- Migrar todo el primary actual al verde Certifive `#1FA94B`.
- Logo: usar `assets/logo-horizontal.png` en navbar (alto 36px) y en footer (alto 32px, filtro `brightness(0) invert(1)` para que sea blanco sobre fondo oscuro).
- Tipografía base: Inter (cargada desde Google Fonts) con los pesos 300–900.

---

## 2. Navbar

- Fijo arriba, fondo `rgba(255,255,255,0.92)` con `backdrop-filter: blur(14px)`.
- Altura 72px. Logo a la izquierda, links centrados, CTAs a la derecha.
- Al hacer scroll > 8px: añadir clase `.scrolled` que aplica `border-bottom: 1px solid var(--slate-200)` y `box-shadow`.
- Links con carets SVG que rotan 180° en hover del item.

---

## 3. Hero

- Grid 1fr / 1.05fr. Texto a la izquierda (max-width 580px), imagen del dashboard a la derecha.
- **Badge** verde pastel con punto pulsante (animación `pulse` 2s infinite).
- **H1** 60px, weight 800, letter-spacing -0.035em. La frase "certificación energética" en `var(--green)`.
- **Subhead** con `<strong>Multiplica ×5 tu productividad e ingresos.</strong>` (mantener wording que haya en el repo si difiere; sólo aplica el estilo).
- 2 CTAs lado a lado: primary "Solicita una demo" + ghost "Ver cómo funciona".
- Línea de trust con 3 checks: `14 días gratis`, `Sin permanencia`, `Soporte en español` (si el repo ya tiene su copy, mantenerlo y aplicarles este estilo).
- Imagen del dashboard con `filter: drop-shadow(0 24px 48px rgba(15,23,42,0.10))`.

---

## 4. Stats strip

- 4 columnas separadas por divisores verticales `border-right: 1px solid var(--slate-200)`.
- Número en `var(--green)` 36px weight 800.
- En hover de cada `.stat`: aparece subrayado verde de 24px que crece a 40px (vía `::before` con transición de width + opacity).

---

## 5. Secciones showcase (Flujo, Multiplica, Pilares+Demo)

Cada una es una sección con `eyebrow + titulo + sub + imagen full-width`.

- **Eyebrow**: pill verde claro con texto en mayúsculas, padding `4px 14px`, radius 999px.
- **Section title** 44px weight 800, parte de la frase en `var(--green)`.
- **Imagen** con `border-radius: var(--r-xl)`. Tres opciones según contexto: bordered (con border + shadow), o sin borde (solo radius).

Alternar fondo `white` ↔ `var(--slate-50)` entre secciones.

---

## 6. Proceso (4 pasos)

- Grid de 4 columnas con línea horizontal punteada de fondo conectándolos (`::before` del grid, `border-top: 1.5px dashed var(--slate-300)`, `top: 28px`, `left/right: 8%`).
- Cada `.step` es una card blanca con border, radius 14px, padding `32px 24px 28px`, texto centrado.
- **Step number**: círculo de 56px con gradiente verde `linear-gradient(135deg, #1FA94B, #178A3C)`, sombra suave en verde.
- **Detalle sutil 1**: pseudo `::before` con el número grande (`data-num="1"`, "2", "3", "4") como marca de agua contorneada:
  ```css
  .step::before {
    content: attr(data-num);
    position: absolute;
    bottom: -38px;
    right: -10px;
    font-size: 160px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.06em;
    color: transparent;
    -webkit-text-stroke: 1.5px rgba(31,169,75,0.08);
    pointer-events: none;
  }
  .step:hover::before { -webkit-text-stroke-color: rgba(31,169,75,0.18); }
  ```
- **Detalle sutil 2**: línea de gradiente verde superior que aparece en hover:
  ```css
  .step::after {
    content: '';
    position: absolute;
    top: 0; left: 24px; right: 24px;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--green), transparent);
    opacity: 0;
    transition: opacity .25s;
  }
  .step:hover::after { opacity: 1; }
  ```
- Hover de la card: `translateY(-4px)` + shadow + border tinta verde.
- `overflow: hidden` en la card para clipear la marca de agua.

---

## 7. Testimonios (3 cards)

- Grid 3 columnas, gap 24px.
- Card blanca, border, radius 14px, padding 32px.
- **Stars** en `var(--green)`, 16px.
- **Texto** envuelto entre comillas tipográficas verdes vía `::before` / `::after` del `.testi-text`.
- **Author**: avatar 44px circular con gradiente verde, nombre + rol.
- **Detalle sutil 1**: comilla decorativa gigante serif en la esquina sup. derecha:
  ```css
  .testi::before {
    content: '"';
    position: absolute;
    top: -30px;
    right: 14px;
    font-family: Georgia, serif;
    font-size: 160px;
    font-weight: 700;
    color: rgba(31,169,75,0.07);
    pointer-events: none;
  }
  .testi:hover::before { color: rgba(31,169,75,0.14); }
  ```
- **Detalle sutil 2**: radial gradient en la esquina superior derecha:
  ```css
  .testi::after {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 80px; height: 80px;
    background: radial-gradient(circle at top right, rgba(31,169,75,0.06), transparent 70%);
    pointer-events: none;
  }
  ```
- Asegurar `position: relative; overflow: hidden;` en `.testi` y `z-index: 1` en hijos (stars, text, author) para que queden sobre los pseudos.

---

## 8. FAQ

- Lista de items separados por `border-bottom: 1px solid var(--slate-200)`.
- Cada item: pregunta + toggle circular (verde claro de fondo). En estado abierto, el toggle rota 45°, cambia a fondo verde sólido con `+` blanco.
- Respuesta animada con `max-height` transición de 0 a 200px.
- Click en el `.faq-item` toggle de clase `.open`.

---

## 9. Footer

- Background `var(--ink)` (#0F172A), color `rgba(255,255,255,0.65)`.
- Franja superior decorativa de 4px de alto con gradiente: verde → lima → ámbar.
- Grid 1.4fr / 1fr / 1fr / 1fr / 1fr (brand + 4 columnas de links).
- Logo Certifive en blanco (filter invert). Tagline en gris claro.
- 3 iconos sociales en cuadritos 36px, fondo `rgba(255,255,255,0.08)`, hover → fondo verde.
- Bottom: copyright + 4 links legales separados por gaps.

---

## 10. Parallax decor (capas ambientales)

15 elementos posicionados absolutamente en `<body>` (o en un wrapper top-level), todos con:
- `position: absolute; pointer-events: none; z-index: 0; will-change: transform;`
- Atributo `data-speed` (de -0.35 a 0.6) para controlar la velocidad parallax.
- Atributo opcional `data-rotate` para rotación leve.

Tipos:
- **Blobs**: 200–420px, `border-radius: 50%`, `filter: blur(60px)`, gradiente radial con verde / lima / esmeralda / ámbar al 14–28% de opacidad central.
- **Rings**: 140–220px, `border: 1.2px dashed rgba(31,169,75,0.25)` (variante sólida al 12%).
- **Grid dots**: 120×100 o 160×160, fondo `radial-gradient(circle, rgba(31,169,75,0.32) 1.4px, transparent 1.4px)` con `background-size: 16px 16px`.
- **Floaters**: cuadritos 14–26px con gradiente verde→lima, opacidad 12–18%, rotación inicial 20°.

Script (vanilla JS) para mover en scroll:

```js
const layers = Array.from(document.querySelectorAll('.parallax-layer')).map(el => ({
  el,
  speed: parseFloat(el.dataset.speed || '0.2'),
  rotate: parseFloat(el.dataset.rotate || '0'),
}));
let scrollY = window.scrollY;
let ticking = false;
function update() {
  for (const l of layers) {
    const y = scrollY * l.speed;
    const r = scrollY * l.rotate * 0.02;
    l.el.style.transform = `translate3d(0, ${y}px, 0)` + (r ? ` rotate(${r}deg)` : '');
  }
  ticking = false;
}
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  if (!ticking) { requestAnimationFrame(update); ticking = true; }
}, { passive: true });
update();
```

Asegurar `overflow-x: hidden` en `body` para evitar scroll horizontal por las capas que salen del viewport.

Si el framework usa SSR/Astro/Next, encapsular el listener en un useEffect / onMounted equivalente y limpiar en unmount.

---

## 11. Reveal on scroll

Toda sección o item con clase `.reveal` aparece con fade + slide-up cuando entra en viewport.

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
```

```css
.reveal { opacity: 0; transform: translateY(24px); }
.reveal.visible {
  transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1);
  opacity: 1;
  transform: translateY(0);
}
.reveal.d1.visible { transition-delay: .08s; }
.reveal.d2.visible { transition-delay: .16s; }
.reveal.d3.visible { transition-delay: .24s; }
```

---

## 12. Reducción de movimiento

```css
@media (prefers-reduced-motion: reduce) {
  .parallax-layer { transform: none !important; }
  .reveal { opacity: 1; transform: none; }
  .reveal.visible { transition: none; }
}
```

---

## Verificación final

Antes de cerrar la tarea:
- [ ] El copy de cada componente real coincide con el del sitio actual (no con la referencia).
- [ ] Las imágenes de `assets/` están integradas y se muestran correctamente.
- [ ] No hay scroll horizontal en ningún viewport.
- [ ] El parallax es perceptible pero sutil; no compite con el contenido.
- [ ] Las tarjetas de proceso muestran el número de marca de agua y la línea superior solo en hover.
- [ ] Las tarjetas de testimonio muestran la comilla decorativa y el radial.
- [ ] `prefers-reduced-motion` desactiva las animaciones.
- [ ] El footer tiene la franja superior con gradiente verde → lima → ámbar.
