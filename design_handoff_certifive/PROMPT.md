# Prompt para Claude Code

Copia y pega este mensaje completo al iniciar la conversación con Claude Code en el repo de Certifive.

---

```
Necesito que apliques un refresco visual a la landing de Certifive.

REGLA CRÍTICA: NO MODIFIQUES NINGÚN COPY/TEXTO EXISTENTE en el código actual.
Solo cambios visuales, de estilo, animaciones y estructura HTML donde sea estrictamente necesario para el diseño. Si un componente actual tiene un texto distinto al de la referencia, conserva SIEMPRE el texto del sitio actual.

Lee los siguientes archivos en orden:

1. `design_handoff_certifive/README.md` — contexto y reglas
2. `design_handoff_certifive/DESIGN_TOKENS.md` — colores, radios, sombras, tipografías
3. `design_handoff_certifive/VISUAL_CHANGES.md` — spec detallada de cada cambio
4. `design_handoff_certifive/reference/index.html` — referencia visual al pixel

Después:

a) Identifica el stack del proyecto (framework, librería de estilos, sistema de componentes existente).
b) Lista los componentes/archivos que vas a modificar y los assets que necesitas mover desde `design_handoff_certifive/assets/` a la carpeta correspondiente del proyecto.
c) Antes de tocar nada, muéstrame ese plan y espera confirmación.
d) Aplica los cambios siguiendo los patrones existentes del repo (mismo sistema de estilos, mismas convenciones de naming).
e) Si encuentras un texto que ya existe en el sitio y es distinto al de la referencia, MANTÉN el del sitio. La referencia HTML es una guía de DISEÑO, no de COPY.
f) Si un componente del repo no aparece en la referencia, NO LO BORRES. Pregúntame qué hacer.

Cuando termines, dime exactamente qué archivos cambiaste y qué quedó pendiente.
```

---

## Tip adicional

Si quieres que Claude Code primero solo planifique sin tocar archivos, añade al final:
> _"Para esta primera ronda, solo léeme el plan y no modifiques nada todavía."_
