# Estandares

## Idioma y nombres

- Docs y respuestas: espanol. Código, tablas y columnas: ingles.
- Vars: `camelCase`. Constantes: `SCREAMING_SNAKE`. Tablas y columnas: `snake_case` en singular.
- Sin comentarios salvo `ponytail:` para atajos deliberados con techo y upgrade path (ej. `// ponytail: Bucket4j en memoria, Redis si hay mas de una instancia`).

## Formato y commits

- **ESLint y Prettier** (TS) y `Prisma format` en pre commit. `Husky` y `lint-staged`.
- Commits: `type(module): explanation`. Ejemplos: `feat(tracking): compute available subjects`, `fix(auth): rotate refresh`, `chore(db): add index`.
- Un checkpoint es un commit significativo (ver [roadmap.md](./roadmap.md)). PRs chicos.

## Arquitectura

- DDD por modulos Nest (`domain`, `application`, `infra`, `interfaces`), `api/` público vs `internal/` privado.
- Eventos y read models para cross module; nunca JOIN cross module. Ver [architecture.md](./architecture.md).
- Sin `useEffect` ni `useLayoutEffect`. RSC y Server Actions. Ver [ui-ux.md](./ui-ux.md).

## Datos y performance

- **Projections DTO directo desde DB** (`select id, name` y similares), no entidades completas. Favorece `Prisma select` o query nativa.
- Paginación, filtros y búsqueda siempre (`limit` y `offset` y `ILIKE nombre%` con `B-Tree`). Ver [database.md](./database.md).
- Todo secreto en env vars. Nunca exponer keys, URLs o IPs privadas. Validación en trust boundaries.

## Privacidad, legal y contenido

- **Fuentes self-hosted obligatorio.** Prohibido `<link>` o `@import` a `fonts.googleapis.com`/`gstatic`. Usar `next/font/local` con `woff2` en `public/fonts`. Ver `architecture.md` y `legal/cookies.md`.
- **Analytics allowlist:** en MVP sin analytics. Si se agrega, solo opciones sin cookies y sin grabación: `Plausible`, `Umami`, `Vercel Analytics`. Prohibidos: `GA4 con cookies`, `Hotjar`, `Clarity`, `FullStory`, `LogRocket` (grabación de sesión). Cualquier script de terceros requiere actualizar `legal/cookies.md` y CSP.
- **CSP:** `script-src 'self'` por defecto. Terceros solo vía allowlist en PR.
- **Veracidad:** prohibido reseñas falsas, testimonios inventados o afirmaciones no verificables sobre universidades, planes o resultados. Solo datos de `database.md` o fuentes citadas. Afirmaciones de marketing requieren evidencia en repo o se eliminan.
- **Contenido de terceros:** logos/descripciones oficiales conservan copyright. Contribuciones declaran tener derechos y se licencian MIT. Takedown via GitHub Issue/email (ver `legal/terms.md:7`).
- **Emails transaccionales:** solo verificación y reset. Sin newsletter. Sin `List-Unsubscribe` (exentos). Footer con contacto GitHub/email y link a `legal/privacy`. Ver `auth.md` y `legal/privacy.md`.
- **Reembolsos:** sin pagos no hay política. Si se habilitan pagos, se publica política antes de cobrar (ver `legal/terms.md:8`).
- **Dirección postal:** no requerida para proyecto open source sin actividad comercial. Responsable se identifica por GitHub/email (ver `legal/privacy.md:1`). Solo se agrega domicilio si hay entidad comercial.

## Testing

- Solo lógica crítica: `tracking` (estados, correlativas, cascada), `evaluation` (promedios x2).
- Tests caja negra: `given input hacia expect output`, sin acoplar a implementación. Se debe poder reescribir el dominio sin tocar tests, y que los mismos sirvan para verificar que la nueva implementación es correcta.
- Sin tests para one liners triviales.

## Accesibilidad y SEO

Ver [ui-ux.md](./ui-ux.md) y [seo.md](./seo.md).
