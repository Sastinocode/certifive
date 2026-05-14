# Handoff — Certifive · Refresco visual de la landing

## ⚠️ INSTRUCCIÓN PRINCIPAL (LÉEME PRIMERO)

> **NO MODIFIQUES NINGÚN COPY/TEXTO EXISTENTE** del sitio actual.
> Aplica exclusivamente los cambios **visuales, de estilo y de comportamiento** descritos en este handoff.
> Si un componente actual tiene un texto distinto al de la referencia HTML, **conserva el texto del sitio actual**.
> La referencia HTML sirve como guía de **diseño**, no de **contenido**.

---

## Qué hay en este paquete

```
design_handoff_certifive/
├── README.md                    ← Este archivo
├── PROMPT.md                    ← Prompt listo para pegar a Claude Code
├── VISUAL_CHANGES.md            ← Spec detallada de cada cambio visual
├── DESIGN_TOKENS.md             ← Variables CSS (colores, radios, sombras)
├── reference/
│   ├── index.html               ← Referencia visual completa (HTML autocontenida)
│   └── tweaks-panel.jsx         ← Componente del panel de tweaks (opcional)
└── assets/                      ← Imágenes a usar tal cual
    ├── logo-horizontal.png
    ├── logo-mark.png
    ├── hero-dashboard.png
    ├── flujo.png
    ├── multiplica.png
    └── pilares-demo.png
```

---

## Cómo usarlo con Claude Code

1. Coloca esta carpeta `design_handoff_certifive/` en la raíz del repositorio de Certifive.
2. Abre Claude Code en el repo.
3. Pega el contenido de `PROMPT.md` como primer mensaje.
4. Claude Code leerá `VISUAL_CHANGES.md`, `DESIGN_TOKENS.md` y `reference/index.html` para aplicar los cambios manteniendo intacto el copy actual.

---

## Fidelidad

**Alta fidelidad.** Los valores de color, tipografía, radios y animaciones del HTML de referencia son finales. Replícalos al pixel en el stack existente del proyecto (React/Vue/Astro/etc.), usando los patrones y librerías ya presentes en el repo.

---

## Cambios incluidos en esta entrega

1. **Paleta nueva** — verde Certifive (#1FA94B) como color primario, acentos lima (#84CC16) y ámbar (#F59E0B).
2. **Logo real** integrado en navbar y footer (imágenes provistas en `assets/`).
3. **Visuales decorativos parallax** — capas de blobs difuminados, anillos y patrones de puntos que se mueven a distintas velocidades al hacer scroll. Posicionados detrás del contenido, con `pointer-events: none`. Respetan `prefers-reduced-motion`.
4. **Detalles sutiles en tarjetas**:
   - Tarjetas de proceso: número gigante contorneado de marca de agua + línea de acento verde superior en hover.
   - Tarjetas de testimonios: comilla decorativa serif gigante en esquina superior derecha + radial verde sutil.
   - Stats: subrayado verde animado en hover.
5. **Animación reveal-on-scroll** suave con IntersectionObserver.
6. **Navbar fijo** con shadow al hacer scroll, dropdown carets que rotan en hover.
7. **FAQ acordeón** interactivo.
8. **Footer oscuro** con franja superior de gradiente verde→lima→ámbar.

---

## Qué NO toca este handoff

- Textos de headings, subheadings, CTAs, descripciones de funcionalidades, testimonios reales, etc. — todo eso se mantiene tal cual está en el sitio actual.
- Estructura de routing, autenticación, formularios funcionales, integraciones backend.
- Datos reales o cargados dinámicamente.

---

## Assets

Todas las imágenes en `assets/` están listas para usar. Súbelas a la carpeta de assets/public del proyecto y referencia los nuevos paths en los componentes correspondientes.

| Archivo | Uso |
|---|---|
| `logo-horizontal.png` | Navbar y footer |
| `logo-mark.png` | Favicon, opengraph, marca pequeña |
| `hero-dashboard.png` | Visual lateral del hero |
| `flujo.png` | Sección "Plataforma todo-en-uno" |
| `multiplica.png` | Sección "Multiplica ×5" |
| `pilares-demo.png` | Banner pilares + demo |

---

## Contacto / siguiente paso

Si Claude Code encuentra ambigüedad (p. ej., un componente del repo no aparece en la referencia), debe preguntar antes de inventar. **Nunca eliminar contenido existente** que no esté explícitamente cubierto por este handoff.
