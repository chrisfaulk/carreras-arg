# Docs: Carreras ARG

## Indice

| Doc | Que contiene | Cuando leerlo |
|-----|--------------|---------------|
| [specification.md](./specification.md) | Fuente de verdad funcional: contexto, roles, estados, correlativas, promedios | Primero |
| [architecture.md](./architecture.md) | Stack, monorepo, modulos DDD, decisiones | Antes de codear |
| [database.md](./database.md) | Tablas, relaciones, ERD, indices, IDs (UUIDv7 vs BIGINT) | Al modelar y migrar |
| [api.md](./api.md) | Convenciones REST, paginación, búsqueda, DTOs | Al exponer endpoints |
| [auth.md](./auth.md) | Registro, OAuth, verificación, sesiones, rate y geo | Al implementar auth |
| [privacy.md](./privacy.md) | Datos minimos, visibilidad, Ley 25.326, borrado | Antes de guardar PII |
| [legal/privacy.md](./legal/privacy.md) | Texto legal de privacidad versionado | Antes de publicar |
| [legal/terms.md](./legal/terms.md) | Términos, IP y contenido terceros | Antes de publicar |
| [legal/cookies.md](./legal/cookies.md) | Cookies solo sesión, sin tracking | Antes de publicar |
| [standards.md](./standards.md) | Idioma, formato, commits, testing, read models | Durante todo el dev |
| [roadmap.md](./roadmap.md) | Fases granulares con criterios de done y commits | Para planificar |
| [ui-ux.md](./ui-ux.md) | Design system (SF y Medium y Linear), UX, a11y | Al construir UI |
| [pages.md](./pages.md) | Inventario de rutas y composición por page | Antes de construir UI |
| [seo.md](./seo.md) | OG, 404, sitemap, robots, canonical y otros | Antes de deploy |

## Convenciones de docs

- Español para docs y respuestas; ingles para código, tablas y columnas.
- `snake_case` en DB en singular, `camelCase` vars, `SCREAMING_SNAKE` const. Ver [standards.md](./standards.md).
- IDs publicas `UUIDv7` en URLs; tablas solo relación internas `BIGINT`. Ver [database.md](./database.md).
- Sin comentarios en código salvo `ponytail:` para atajos deliberados. Ver [standards.md](./standards.md).
- Todo secreto en env vars. Ver [architecture.md](./architecture.md).

## Orden de lectura open source

1. `specification.md` para entender el dominio.
2. `architecture.md` y `database.md` para entender las fronteras.
3. `auth.md`, `privacy.md` y `legal/*` para entender restricciones.
4. `standards.md` para entender cómo contribuir.
5. `roadmap.md` para elegir una fase o issue.

## Contribuir

Ver [standards.md](./standards.md) para formato y [roadmap.md](./roadmap.md) para que esta en MVP vs v2. PRs chicos, un checkpoint por PR, commits `type(module): msg`.
