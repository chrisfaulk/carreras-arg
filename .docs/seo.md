# SEO y meta

Checklist obligatorio en cada pagina (ver [ui-ux.md](./ui-ux.md) y [architecture.md](./architecture.md)):

- [ ] **Title separado por page** (`<title>` unico, ej. "Materias cursables - Carreras ARG").
- [ ] **Meta descripciones** unicas por page (140-160 chars).
- [ ] **OG images** (`og:image`, `og:title`, `og:description`, `twitter:card`) por page.
- [ ] **Semantic HTML** (`<main>`, `<nav>`, `<header>`, `<section>`, headings jerarquicos).
- [ ] **Tags canonicos** (`<link rel="canonical" href="...">`).
- [ ] **`robots.txt`** y **`llm.txt`** en `/public`.
- [ ] **`sitemap.xml`** generado (Next `app/sitemap.ts`, incluye rutas estaticas `/`, `/legal/*` y dinamicas `career` y `plan` publicos con `lastModified` desde `updated_at`).
- [ ] **Pagina 404 custom** (`app/not-found.tsx`).

Implementación: Next Metadata API (`export const metadata`), `app/robots.ts` (allow `/`, disallow `/dashboard`, `/api`), `app/sitemap.ts`, `public/llm.txt`. Sitemap dinámico: queries `select id, updated_at` con `LIMIT` para carreras/planes publicos. Ver `database.md`.

Referencias: [standards.md](./standards.md) (sin hardcode, tokens), [roadmap.md](./roadmap.md) Fase 3.2, [legal/privacy.md](./legal/privacy.md).
