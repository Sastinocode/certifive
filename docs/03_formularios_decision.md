# CERTIFIVE — Decisión sobre los 3 formularios de certificación

> Análisis realizado: 2026-07-07 (tarea A5, TASKS_SONNET5.md)

## Resumen

Existen 3 componentes con nombre parecido que podrían parecer duplicados:

| Archivo | Ruta(s) | Audiencia | Estado |
|---|---|---|---|
| `enhanced-certification-form.tsx` | `/certificados/nuevo`, `/formulario-cee` | Certificador autenticado | ✅ Funcional — **canónico** |
| `certification-wizard.tsx` | `/certificacion/:id?` | Certificador autenticado | ✅ Funcional, más simple |
| `certification-form.tsx` | `/certificacion-cliente/:uniqueLink` | Cliente final (público, sin login) | ⚠️ **Roto** — endpoint backend inexistente |

**Decisión: NO se borra ninguno.** Los 3 tienen rutas activas registradas en `App.tsx` con audiencias declaradas distintas (certificador vs. cliente final), por lo que no son duplicados funcionales en sentido estricto según el criterio de la tarea A5. Se documenta la situación real de cada uno abajo, incluyendo un hallazgo importante que requiere decisión de negocio (no solo de código).

---

## 1. `enhanced-certification-form.tsx` — canónico para el certificador

- 991 líneas. `react-hook-form` + `zod` para validación, wizard de 6 pasos (Propiedad, Titular, Estructura, Ventanas, Instalaciones, Fotografías), autocompletado por referencia catastral (`GET /api/catastro/lookup`, existe y funciona), subida de fotos con `PhotoUpload`, animaciones con Framer Motion.
- Envía `POST /api/certifications` (endpoint real, cubierto por tests en `server/tests/api.test.ts`).
- Enrutado en dos paths con el mismo componente: `/certificados/nuevo` y `/formulario-cee` (ambos protegidos por `isAuthenticated`).
- **Es la implementación más completa y la que se debe seguir usando/extendiendo** para el flujo interno de creación de certificaciones.

## 2. `certification-wizard.tsx` — alternativa interna más simple

- 209 líneas. Wizard de 3 pasos (Datos Generales, Detalles de Vivienda, Instalaciones) delegados a subcomponentes (`GeneralDataForm`, `HousingDetailsForm`, `InstallationsForm`).
- También envía `POST /api/certifications` (mismo endpoint real que el formulario enhanced).
- Enrutado en `/certificacion/:id?`. El parámetro `:id` sugiere soporte de edición, pero el componente **no carga datos existentes** (no hay `useQuery` por `id`) — si se navega con un id, solo cambia el título a "Editar Certificación" sin precargar el formulario. Esto es una limitación funcional preexistente, no se ha tocado (fuera de alcance de A5: no se cambia lógica de negocio).
- Es funcionalmente redundante con el formulario enhanced (mismo endpoint, mismo objetivo: crear una certificación), pero con menos campos y sin autocompletado catastral. Tiene su propia ruta activa (`/certificacion/:id?`), así que no se borra en esta tarea; se dejará constancia para una futura consolidación cuando se aborde específicamente el flujo de edición de certificaciones.

## 3. `certification-form.tsx` — formulario público roto (⚠️ hallazgo)

- 676 líneas. Formulario de 4 pasos pensado para que el **cliente final** (sin cuenta) complete los datos de su propiedad a través de un enlace único: `/certificacion-cliente/:uniqueLink`.
- Hace `GET`/`POST` contra `/api/public/certification-form/:uniqueLink`.
- **Ese endpoint no existe en el backend.** Se ha revisado todo `server/` (`grep -rn "certification-form" server/`) y no hay ninguna ruta registrada con ese path. Es decir: si un cliente real abriera ese enlace hoy, el formulario cargaría en estado de error permanente.
- El flujo público real y funcional para que el cliente complete datos técnicos ya existe y está implementado con tokens reales en `server/routes/public-forms.ts`: `GET/POST /api/formulario-cee/:token` (ruta `/formulario-cee/:token` → `CEEFormWrapper`), además de `/api/solicitud/:token` y `/api/presupuesto/:token`.
- **Conclusión:** `certification-form.tsx` parece código legado de una versión anterior del flujo público, reemplazada por el sistema de tokens (`solicitud` → `presupuesto` → `formulario-cee`). No se borra en esta tarea porque:
  1. A5 pide analizar los 3 formularios de *certificación para el certificador/cliente*, no auditar todo el flujo público.
  2. Borrar una ruta pública activa sin confirmación explícita es un cambio de superficie (aunque esté rota) que conviene decidir junto con Sebas, no de forma unilateral.
- **Recomendación para una tarea futura:** decidir con Sebas si `/certificacion-cliente/:uniqueLink` y el componente `certification-form.tsx` se eliminan (junto con la función que genera ese `uniqueLink`, si existe) o si se reconecta a un endpoint real. Mientras tanto, no se debe promocionar ni enlazar esa URL desde ningún flujo activo.

### Hallazgo relacionado (fuera de alcance de A5, mismo patrón)

`client/src/pages/public-quote.tsx` (ruta `/cotizacion/:uniqueLink`) tiene el mismo problema: llama a `/api/public/quotes/:uniqueLink` y `/api/public/quotes/:uniqueLink/payment`, ninguno existe en el backend (`grep -rn "public/quotes" server/` → sin resultados). El flujo real de presupuesto ya funciona vía `/api/presupuesto/:token`. Se deja anotado aquí porque comparte el mismo patrón de "página legada con endpoint fantasma", pero no forma parte de los 3 archivos que A5 pedía analizar — no se ha tocado su lógica, solo se corrigieron tipos en A4.

---

## Acciones tomadas en esta tarea

- Ninguna eliminación de archivos ni cambios de router: los 3 formularios de certificación siguen enrutados como estaban.
- No se tocó lógica de negocio en ninguno de los 3 archivos.
- Se documentó el hallazgo de los endpoints públicos inexistentes para que quede registrado y no se pierda en próximas sesiones.
