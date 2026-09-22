# UI y UX

## Design system

- **Biblioteca:** `hugeicons` (unica).
- **Tokens consistentes, minima dispersion:** sin valores hardcodeados. `spacing`, `font-size`, `radius`, `color` via CSS vars y Tailwind config central. Tipografia y espaciado con escala cerrada.
- **Estilo:** minimalista, elegante, moderno. **SF Interface** (https://numbers.sfinterface.com/) y **Medium** para layout y grandes rasgos; **Linear** para componentes pequenos (buttons, tabs, badges). Ver [architecture.md](./architecture.md).

## UX

- Errores **inline** en campos y **toast** para todo lo relevante (preferir toast sobre banners). Mensajes claros, sin exponer PII o stack.
- **Optimistic UI** en mutations (TanStack Query island) con rollback en error.
- **Responsive first**, disposicion consistente entre paginas.
- **Skeletons** de carga consistentes con la estructura de la pagina (no spinners genericos).
- **Empty states** claros con CTA para enmendar (ej. "No tenés materias cursables, aprobá X").
- **A11y (WCAG 2.1 AA, verificable):** `aria-labels`, foco visible (`:focus-visible` con outline), contraste mínimo 4.5:1 texto / 3:1 gráfico, navegación completa por teclado (Tab, Shift+Tab, Enter, Escape), `alt` obligatorio en toda `img`, landmarks semanticos (`<main>`, `<nav>`, `<header>`), textos de botón verbo+objeto ("Guardar cambios" no "Aceptar"), formulario con `label` asociado y mensajes de error vinculados via `aria-describedby`. Validación con `axe-core` o Lighthouse a11y 100 en CI (ver `roadmap.md` Fase 2.2).
- Consistencia: misma grilla, mismos tokens, mismos patrones de error, toast y skeleton en todo el app.
- **Legal y cookies:** banner informativo no bloqueante para cookies necesarias (ver `legal/cookies.md`), footer global con links a `/legal/privacy`, `/legal/terms`, `/legal/cookies` y contacto GitHub/email.

## Frontend

`bulletproof-react` en Next: `app/`, `features/*`, `components/ui`, `lib/api`. RSC por defecto, islands client solo para interactividad. Ver [architecture.md](./architecture.md) y [standards.md](./standards.md).

## Referencias

- SEO: [seo.md](./seo.md)
- API errores: [api.md](./api.md)
