# Roadmap

> Un checkpoint es un commit `type(module): msg`. Orden por dependencias.

## Fase 0: Scaffolding

| # | Objetivo | Done | Commit |
|---|----------|------|--------|
| 0.1 | Monorepo `pnpm` y `Turborepo`, `/backend` Nest y `/frontend` Next App Router, `/docs` | `pnpm build` ok | `chore(repo): scaffold monorepo` |
| 0.2 | Prisma schema y migraciones iniciales (`user`, `university` y otros) y `.env.example` | `prisma migrate` ok | `chore(db): init schema` |
| 0.3 | Lint y format `ESLint` y `Prettier`, Husky, CI GitHub Actions | CI verde | `chore(tooling): lint+ci` |
| 0.4 | Design tokens y `hugeicons` y layout base (SF y Medium y Linear) | Tokens sin hardcode | `feat(ui): design tokens` |

## Fase 1: MVP (todo lo no marcado "despues")

| # | Objetivo | Done | Commit |
|---|----------|------|--------|
| 1.1 | Auth email y password y Google OAuth, verify, `Resend`, cookies httpOnly | Login y verify e2e | `feat(identity): auth + oauth` |
| 1.2 | `forgot` y `reset` y `POST /auth/password` (OAuth agrega password) | Reset e2e | `feat(identity): password reset` |
| 1.3 | CRUD `catalog` admin (university, career, study_plan, subject, correlatives) | Admin e2e | `feat(catalog): crud + correlatives` |
| 1.4 | `user_study_plan_enrollment` (multi plan, N carreras) | Enroll e2e | `feat(enrollment): enroll plan` |
| 1.5 | `subject_attempt` maquina estados (sección 5.1 spec) y tests caja negra | Tests verdes | `feat(tracking): state machine` |
| 1.6 | Cálculo `AVAILABLE` hacia `NOT_AVAILABLE` sincrónico en cascada y aviso UI si se abandona simultánea | 90/10 perf ok | `feat(tracking): availability engine` |
| 1.7 | Listados paginados `ILIKE nombre%` (career, plan, subject, cursables) | `limit` y `total` ok | `feat(tracking): paginated cursables` |
| 1.8 | Evaluaciones: template 2 parciales y N retakes y `final_exam(is_external_exam)` | CRUD eval ok | `feat(evaluation): instances+retakes+finals` |
| 1.9 | Promedios x2 y porcentaje de avance y toggle `is_public` | Calculo testeado | `feat(tracking): averages + visibility` |
| 1.10 | `privacy.md` y borrado y export y `created_by/at` | Borrado e2e | `feat(privacy): delete+export` |
| 1.11 | SEO base (meta, canonical, robots, sitemap dinamico, 404, OG) | Lighthouse ok | `feat(seo): base` |
| 1.12 | Legal `/legal/*` (privacy, terms, cookies), fuentes self-hosted, banner cookies necesarias, RLS hardening temprano | Legal ok, RLS tests verdes | `feat(legal): privacy terms cookies + RLS` |
| 1.13 | A11y WCAG 2.1 AA (alt, contraste 4.5:1, teclado, axe) | Lighthouse a11y 100 | `feat(a11y): wcag` |

## Fase 2: Hardening

| # | Objetivo | Done |
|---|----------|------|
| 2.1 | Bucket4j rate y Cloudflare `AR` whitelist (`ALLOWLIST_IPS`) | Ban no AR ok |
| 2.2 | `audit_log` catálogo y skeletons, empty states, toasts y aria consistentes | Audit y a11y ok |
| 2.3 | Tests e2e correlativas y deploy Vercel y Render y Neon | Preview deploy |
| 2.4 | CSP estricta y verificación sin grabación sesión (auditoria terceros) | CSP ok |

## Fase 3: v2 (post MVP cercano)

| # | Objetivo | Notas |
|---|----------|-------|
| 3.1 | Grupos de cursada entre usuarios | Requiere permisos |
| 3.2 | Opiniones de materias y archivos de apuntes | Async `outbox` y `S3 presigned`, jobs no bloquean request |
| 3.3 | Equivalencias automaticas entre planes | Hoy manuales |
| 3.4 | Importación CSV catálogo en UI | Hoy solo DB directa |

## Fuera de roadmap

Notificaciones, ranking o social. Descartado (ver [specification.md](./specification.md) sección 3.3).
