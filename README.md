# Carreras ARG

Portal centralizado para estudiantes de universidades argentinas: te anotas a carreras y planes de estudio y el sistema calcula automáticamente qué materias podes cursar segun correlativas, sin revisar PDFs cada cuatrimestre.

> **Estado:** en construcción (ver [docs/roadmap.md](./docs/roadmap.md)). Open source, contribuciones bienvenidas.

## Cómo luce terminado

- **Landing y catálogo público** (university hacia career hacia study_plan hacia subject) con búsqueda `nombre%`, paginación y SEO completo (OG, sitemap, 404 custom).
- **Dashboard del estudiante:** materias en 5 estados (`No disponible hacia Cursable hacia Cursando, En final, Aprobada` con transiciones validadas y cascada automatica), banner "correlativas insuficientes" si abandonas una simultanea, promedios x2 (con y sin aplazos) y porcentaje de avance por plan.
- **Cursada rica pero opcional:** template 2 parciales y N recuperatorios, tipos `Parcial, TP, Entregable, Otros`, notas 1-10, `min_regularize` y `min_promote`, finales (incluido libre con `is_external_exam` para `En final hacia Aprobada`) y cuatrimestre y ano. Podes solo cambiar estado si queres.
- **Perfil público o privado** (`username` y `display_name`) y borrado y export (Ley 25.326).
- **UI minimalista SF y Medium y Linear**, responsive first, skeletons, empty states con CTA, toasts, a11y, `hugeicons`.

## Stack

**NestJS (TS) y Next.js 14 App Router (TS) y Prisma y PostgreSQL** con monorepo `pnpm` y `Turborepo`. Ver [docs/architecture.md](./docs/architecture.md).

## Quickstart (cuando exista código)

```bash
pnpm install
cp .env.example .env        # completar DATABASE_URL, JWT_SECRET, GOOGLE_*, RESEND_API_KEY
pnpm db:migrate
pnpm dev
```

## Docs

| Doc | Que es |
|-----|--------|
| [docs/README.md](./docs/README.md) | Indice de toda la docs |
| [docs/specification.md](./docs/specification.md) | Reglas de negocio |
| [docs/architecture.md](./docs/architecture.md) | Stack y modulos DDD |
| [docs/database.md](./docs/database.md) | Tablas, ERD, indices |
| [docs/auth.md](./docs/auth.md) | Auth y sesiones |
| [docs/privacy.md](./docs/privacy.md) | Privacidad y borrado |
| [docs/legal/privacy.md](./docs/legal/privacy.md) | Política de privacidad (Ley 25.326) |
| [docs/legal/terms.md](./docs/legal/terms.md) | Términos y condiciones |
| [docs/legal/cookies.md](./docs/legal/cookies.md) | Política de cookies (solo sesión) |
| [docs/standards.md](./docs/standards.md) | Cómo contribuir |
| [docs/roadmap.md](./docs/roadmap.md) | Fases y checkpoints |
| [docs/ui-ux.md](./docs/ui-ux.md) | Design system y UX |
| [docs/seo.md](./docs/seo.md) | Checklist SEO |

## Contribuir

1. Lee [docs/standards.md](./docs/standards.md) (ESLint y Prettier, commits `type(module): msg`, sin comentarios, DTO projections).
2. Elige un checkpoint de [docs/roadmap.md](./docs/roadmap.md).
3. PR chico, un checkpoint por PR. Tests caja negra solo para logica critica (correlativas y promedios).

## Licencia

MIT. código público, sin exponer secretos. Todo en env vars (ver [docs/architecture.md](./docs/architecture.md)). Ver `LICENSE` y [docs/legal/terms.md](./docs/legal/terms.md) sección 7 para contribuciones y contenido de terceros.

## Roadmap

MVP hacia Hardening hacia v2 (grupos, opiniones, archivos async). Detalle granular en [docs/roadmap.md](./docs/roadmap.md).
