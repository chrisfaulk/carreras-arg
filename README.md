# Carreras ARG

Portal centralizado para estudiantes de universidades argentinas: te anotas a planes de estudio y el sistema calcula automáticamente qué materias podes cursar segun correlativas, sin revisar PDFs cada cuatrimestre.

> **Estado:** en construcción (ver [.docs/roadmap.md](./.docs/roadmap.md)). Open source, contribuciones bienvenidas.

## Cómo luce terminado

- **Landing y catálogo público** (university hacia career hacia study_plan hacia subject) con búsqueda `nombre%`, paginación y SEO completo (OG, sitemap, 404 custom).
- **Dashboard del estudiante:** materias en 5 estados visibles (`Aprobada 4 > Cursando 3 > En final 2 > Cursable 1 > No disponible 0`, el visible es el máximo entre intentos no anulados), disponibilidad computada al leer (sin cascada con escrituras), banner "correlativas insuficientes" si abandonas una simultanea, cierre explícito de cursada con promedio y redondeo mitad-arriba, promedios x2 (con y sin aplazos) y porcentaje de avance por plan.
- **Cursada rica pero opcional:** template 2 parciales y N recuperatorios (manda la mejor nota), tipos `Parcial, TP, Entregable, Otros`, notas 1-10, `min_regularize` y `min_promote` por attempt, finales (incluido libre con `is_external_exam`; bloqueado si hay cursada en progreso) y cuatrimestre y ano. Podes solo cambiar estado si queres.
- **Perfil público o privado** (`username` y `display_name`) y borrado soft 30 días y export JSON (Ley 25.326).
- **UI minimalista SF y Medium y Linear**, responsive first, skeletons, empty states con CTA, toasts, a11y, `hugeicons`.

## Stack

**NestJS (TS) y Next.js 14 App Router (TS) y Prisma y PostgreSQL** con monorepo `pnpm` y `Turborepo`. API solo `PUT` para mutar (prohibido `PATCH`). Ver [.docs/architecture.md](./.docs/architecture.md).

## Quickstart (cuando exista código)

```bash
pnpm install
cp .env.example .env        # completar DATABASE_URL, JWT_SECRET, GOOGLE_*, RESEND_API_KEY, ADMIN_SEED_EMAIL, ALLOWLIST_IPS
pnpm db:migrate
pnpm dev
```

## Docs

| Doc | Que es |
|-----|--------|
| [.docs/README.md](./.docs/README.md) | Indice de toda la docs |
| [.docs/specification.md](./.docs/specification.md) | Reglas de negocio |
| [.docs/architecture.md](./.docs/architecture.md) | Stack y modulos DDD |
| [.docs/database.md](./.docs/database.md) | Tablas, ERD, indices |
| [.docs/api.md](./.docs/api.md) | Contratos REST (solo PUT) |
| [.docs/auth.md](./.docs/auth.md) | Auth y sesiones |
| [.docs/privacy.md](./.docs/privacy.md) | Privacidad y borrado |
| [.docs/legal/privacy.md](./.docs/legal/privacy.md) | Política de privacidad (Ley 25.326) |
| [.docs/legal/terms.md](./.docs/legal/terms.md) | Términos y condiciones |
| [.docs/legal/cookies.md](./.docs/legal/cookies.md) | Política de cookies (solo sesión) |
| [.docs/standards.md](./.docs/standards.md) | Cómo contribuir |
| [.docs/roadmap.md](./.docs/roadmap.md) | Fases y checkpoints |
| [.docs/ui-ux.md](./.docs/ui-ux.md) | Design system y UX |
| [.docs/pages.md](./.docs/pages.md) | Inventario de rutas y composición por page |
| [.docs/seo.md](./.docs/seo.md) | Checklist SEO |

## Contribuir

1. Lee [.docs/standards.md](./.docs/standards.md) (Oxlint, ESLint y Prettier, commits `type(module): msg`, sin comentarios, DTO projections, prohibido `PATCH`).
2. Elige un checkpoint de [.docs/roadmap.md](./.docs/roadmap.md).
3. PR chico, un checkpoint por PR. Tests caja negra solo para logica critica (agregado, disponibilidad, cierre, promedios).

## Licencia

MIT. código público, sin exponer secretos. Todo en env vars (ver [.docs/architecture.md](./.docs/architecture.md)). Ver `LICENSE` y [.docs/legal/terms.md](./.docs/legal/terms.md) sección 7 para contribuciones y contenido de terceros.

## Roadmap

MVP hacia Hardening hacia v2 (grupos, opiniones, archivos async). Detalle granular en [.docs/roadmap.md](./.docs/roadmap.md).
