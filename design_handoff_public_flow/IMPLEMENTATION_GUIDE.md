# Guía de implementación para Claude Code — Flujo público CERTIFIVE

> Objetivo: recrear, en el codebase real (React + Tailwind, `client/src/`), las 8 pantallas
> públicas que están prototipadas en `design_handoff_public_flow/public/`.
> Esta guía es el **plan de trabajo**. El detalle visual exacto está en `README.md`.
> Las **capturas** de referencia están en `screenshots/` (1–8).

---

## 0. Antes de escribir una línea de código

Lee, en este orden:
1. `design_handoff_public_flow/README.md` — sistema de diseño + spec de cada pantalla.
2. Los 8 HTML de `design_handoff_public_flow/public/` — el marcado y las clases reales.
3. Tu propio codebase, para no reinventar:
   - `client/src/index.css` y `tailwind.config.ts` — tokens y utilidades existentes.
   - `client/src/components/ui/` — componentes ya disponibles (button, card, badge…).
   - `client/src/components/Layout.tsx` — shell/estructura común.
   - El router (busca `react-router`, `wouter`, `@tanstack/router` o Next) para saber cómo se declaran rutas.

**Regla de oro:** los HTML son la *fuente de verdad visual*, pero el *código* debe usar TUS
componentes y convenciones. No pegues el HTML ni dependas del CDN de Tailwind ni de
`certifive-public.css` en producción — se traducen a tu sistema.

---

## 1. Tokens (hazlo primero, una sola vez)

En `tailwind.config.ts`, extiende el theme con la paleta de marca (valores exactos en README §Colores):

```ts
// theme.extend.colors
primary:   { DEFAULT: 'hsl(142 69% 36%)', dark: 'hsl(142 69% 31%)', soft: 'hsl(142 60% 97%)' },
ink:       '#0f1f2e',
muted:     '#5e6772',
line:      '#e4e6ea',      // borde
'line-soft':'#eef0f3',     // separadores
canvas:    '#fafbfc',      // fondo de página
```

- Fuente: **Inter** (400/500/600/700/800). Si no está, añádela (Google Fonts o `@fontsource/inter`).
- Radios: input 12px · choice 14px · card 24px (`rounded-3xl`) · pill/botón full.
- Verifica que existan los chips de calificación energética A–G (colores en README).

**Criterio de aceptación:** una página de prueba que use `bg-primary text-ink` se ve verde correcto.

---

## 2. Componentes base (segundo — bloquean todo lo demás)

Crea en `client/src/components/ui/` (reutiliza los que ya existan, no dupliques):

| Componente | Equivale a (CSS prototipo) | Notas |
|---|---|---|
| `Button` variant `primary`/`ghost` | `.btn-primary` / `.btn-ghost` | píldora, alto 52px, icono + texto, hover sube 1px |
| `Field` / `Input` / `Select` / `Textarea` | `.fi` + `.label` + `.hint` | focus = borde primary + anillo `0 0 0 4px primary/12%` |
| `ChoiceCard` (+ prop `vertical`) | `.choice` / `.choice-v` | **`vertical` OBLIGATORIO en grids de 3 columnas** (evita solape texto/radio) |
| `ChoiceChip` | `.choice-sm` | chip compacto solo dot+texto |
| `Checkbox` | `.check` | 18px, check SVG al marcar |
| `Pill` variant `green`/`amber`/`slate` | `.pill-*` | badges de estado |
| `Stepper` (props: pasos, índice actual) | `.stepper` | estados done(check)/active(anillo)/pending |
| `SummaryRow` | `.sum-row` / `.line-item` | clave izq · valor der · separador soft |
| `EnergyRating` (prop letra A–G) | `.erating` | chip de color |
| `RevealOnMount` o util `reveal` | `.reveal` | **solo `transform` translateY, NUNCA opacity→0** |

**⚠️ Animación `reveal`:** anima solo desplazamiento (`translateY(14px)→0`, 0.6s ease-out-expo),
respetando `prefers-reduced-motion`. NO bajes opacity a 0 en contenido real: si la animación
no corre, el contenido debe seguir visible. (Este bug ya se corrigió en el prototipo.)

**Selección (ChoiceCard/Chip):** son radios de selección única por grupo → estado controlado
(`useState` con el valor elegido), no manipulación de clases.

**Criterio de aceptación:** un Storybook/página sandbox muestra todos estos componentes y se
ven idénticos a las capturas.

---

## 3. Layout compartido

Crea/usa un layout para las páginas públicas con:
- **Header** sticky: logo (usa el logo real del proyecto, no la "C" placeholder) + nav + sello "Conexión segura".
- **Footer**: logo pequeño + datos fiscales + enlaces legales.
- Contenedores: `max-w-3xl` (formularios), `max-w-4xl` (presupuesto/pago/seguimiento), `max-w-6xl` (header/footer/pricing); padding `px-5 sm:px-8`.

---

## 4. Pantallas (una a una, en este orden)

Implementa, revisa contra la captura, y pasa a la siguiente. No las hagas todas de golpe.

| # | Ruta sugerida | Componente | Captura | Spec |
|---|---|---|---|---|
| 1 | `/precios` | `Pricing` | `screenshots/8-pricing.png` | README §1 |
| 2 | `/solicitud` | `PublicCEEForm` | `screenshots/1-PublicCEEForm.png` | README §2 |
| 3 | `/solicitud/tecnico` | `FormularioTecnicoPublico` | `screenshots/2-…png` | README §3 |
| 4 | `/presupuesto` | `PublicPresupuesto` | `screenshots/3-…png` | README §4 |
| 5 | `/pago` | `PublicPayment` | `screenshots/4-…png` | README §5 |
| 6 | `/pago/confirmacion` | `PublicConfirmacion` | `screenshots/5-…png` | README §6 |
| 7 | `/pedido/:id` | `PublicSeguimiento` | `screenshots/6-…png` | README §7 |
| 8 | `/pago/rechazado` | `PublicPagoRechazado` | `screenshots/7-…png` | README §8 |

(Ajusta las rutas a tu convención real.)

### Navegación / flujo
```
/precios → /solicitud → /solicitud/tecnico → /presupuesto → /pago
   /pago  →  éxito → /pago/confirmacion → /pedido/:id
   /pago  →  rechazo → /pago/rechazado → (reintento) /pago
```
Sustituye los `<a href>` de los prototipos por los enlaces/navegación de tu router.

---

## 5. Estado y datos (cablear al backend)

Los prototipos muestran datos de ejemplo. Conecta a tu API:

- **Solicitud (lead):** contacto (nombre, email, teléfono) + inmueble (tipo, m², ubicación, finalidad).
- **Datos técnicos:** año, superficie útil, planta, situación, orientación, instalaciones (calefacción/ACS/refrigeración/ventanas), mejoras, documentos, notas.
- **Presupuesto:** nº, fecha, líneas incluidas, desglose (subtotal, tasa CCAA, IVA 21%, descuento, total), validez, calificación estimada.
- **Pago:** método, resultado (ok/rechazado + código), datos de facturación. Integra tu pasarela real (Stripe u otra) — el prototipo solo simula con `window.location`.
- **Pedido/seguimiento:** estado (lead → presupuesto → pagado → visita → redacción → registrado → PDF listo), timeline con timestamps, fecha de visita, técnico, URL del PDF (descargable solo al finalizar).

Modela un único objeto `Order`/`Pedido` que alimente confirmación y seguimiento.

---

## 6. Checklist de revisión por pantalla

- [ ] Coincide con la captura (spacing, tipografía, colores, radios).
- [ ] Usa componentes del sistema, no HTML/CSS del prototipo ni CDN.
- [ ] Responsive: el grid `1fr_rail` colapsa a una columna en móvil; los grids de 3 choices usan variante vertical.
- [ ] Estados interactivos: selección de tarjetas, focus de inputs, hover de botones, acordeón FAQ, mostrar/ocultar campos de tarjeta por método.
- [ ] `reveal` solo transform (nada se queda invisible). `prefers-reduced-motion` respetado.
- [ ] Datos vienen de props/API, no hardcodeados.
- [ ] Logo real e iconos de tu librería (no SVG inline ni "C").
- [ ] Navegación con el router real.

---

## 7. Orden recomendado de trabajo (resumen)

1. Tokens en Tailwind ✦
2. Componentes base + sandbox de verificación ✦
3. Layout público (header/footer)
4. Pantalla 1 (precios) → revisar → 2 → 3 → … → 8
5. Cablear datos reales y la pasarela de pago
6. Pasada de responsive + accesibilidad (focus visible, labels, contraste)

> Empieza SIEMPRE por 1 y 2. Si intentas las pantallas antes de tener tokens y componentes,
> acabarás repitiendo estilos y divergiendo del diseño.
