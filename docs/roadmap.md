# Roadmap

> Un checkpoint es un commit `type(module): msg` y un PR chico. Orden por dependencias. Cada checkpoint incluye contrato API (ver [api.md](./api.md)), transacción y lock donde aplique (ver [architecture.md](./architecture.md)), test caja negra para lógica crítica y criterio de done verificable.

## Fase 0: Scaffolding

| # | Objetivo | Done | Commit |
|---|----------|------|--------|
| 0.1 | Monorepo `pnpm` y `Turborepo`, `/backend` Nest y `/frontend` Next App Router, `/docs`, `.env.example` con validación zod al boot | `pnpm build` ok ✅ | `chore(repo): scaffold monorepo` |
| 0.2 | Prisma schema completo (`user` con `is_admin/deleted_at/accepted_privacy_at`, `refresh_token` con `family_id`, `subject_attempt` con `annulled_at` y status solo `IN_PROGRESS/PENDING_FINAL/PASSED`, `audit_log`) + UQs e índices | `prisma migrate` ok ✅ | `chore(db): init schema` |
| 0.3 | RLS (`ENABLE + FORCE`, `SET LOCAL app.user_id`, catálogo público) + test 2 usuarios | RLS tests verdes | `chore(db): rls hardening` |
| 0.4 | Lint y format `ESLint` y `Prettier`, Husky, CI GitHub Actions, regla anti-`PATCH` (CI falla si hay `Patch(` o `method: 'PATCH'`) | CI verde | `chore(tooling): lint+ci` |
| 0.5 | Design tokens y `hugeicons` y layout base con footer `/legal/*` (SF y Medium y Linear) | Tokens sin hardcode | `feat(ui): design tokens` |

## Fase 1: Identidad y catálogo

| # | Objetivo | Done | Commit |
|---|----------|------|--------|
| 1.1 | `POST /auth/register` + `GET /auth/verify?token` (Resend, token 24h, `accepted_privacy_at`, checkbox no pre-tildado) | Registro y verify e2e | `feat(identity): register+verify` |
| 1.2 | `POST /auth/login/refresh/logout` (cookies httpOnly `SameSite=Strict` + check `Origin`, `access 15m`/`refresh 7d`, reuse-detection por `family_id`) + seed admin `ADMIN_SEED_EMAIL` | Login y reuse-detect testeados | `feat(identity): sessions+admin-seed` |
| 1.3 | `POST /auth/forgot/reset` (1h) + `POST /auth/password` (OAuth agrega password) + `PUT /users/me` (`display_name`, `is_public`) | Reset e2e | `feat(identity): password reset+profile` |
| 1.4 | Throttler en memoria (`login 5/min` por IP+email, `forgot 3/h`) + geo AR con `ALLOWLIST_IPS` | Ban no AR ok | `feat(identity): throttling+geo` |
| 1.5 | CRUD admin `university` (`AdminOnly` + `audit_log` en misma txn, `DELETE 409` si tiene careers) + `GET` público paginado `?q=&page&limit` | Admin e2e | `feat(catalog): university` |
| 1.6 | CRUD admin `career` (UQ `university_id+name`) | Admin e2e | `feat(catalog): career` |
| 1.7 | CRUD admin `study_plan` (`year`, `required_electives`) + `GET ?careerId=` | Admin e2e | `feat(catalog): study-plan` |
| 1.8 | CRUD admin `subject` (`is_elective`, `requires_final`, `ILIKE nombre%` + `B-Tree`) + `DELETE 409` si tiene attempts | Admin e2e | `feat(catalog): subject` |
| 1.9 | Correlativas admin (`PREVIOUS|CONCURRENT`, mismo plan, anti-auto-ref y anti-ciclo BFS) + tests caja negra | Tests verdes | `feat(catalog): correlatives` |

## Fase 2: Cursada, evaluación y promedios

| # | Objetivo | Done | Commit |
|---|----------|------|--------|
| 2.1 | `POST /enrollments` (UQ `user+plan`) + `GET /enrollments/me` | Enroll e2e | `feat(enrollment): enroll plan` |
| 2.2 | `POST /enrollments/:id/attempts` (solo si visible `AVAILABLE|PENDING_FINAL`, sino `409`; txn + `FOR UPDATE` enrollment; auto-template 2×`PARTIAL`) | Creación testeada | `feat(tracking): create attempt` |
| 2.3 | `PUT /attempts/:id` (máquina `IN_PROGRESS<->PENDING_FINAL<->PASSED`, idempotente, libre con `is_external_exam` en misma txn; `422` hacia `AVAILABLE/NOT_AVAILABLE`) + tests caja negra | Tests verdes | `feat(tracking): state machine` |
| 2.4 | `AvailabilityReader`: vista computada (pesos `PASSED 4 > IN_PROGRESS 3 > PENDING_FINAL 2 > AVAILABLE 1 > NOT_AVAILABLE 0`, ignora `annulled_at NOT NULL`, regla `PREVIOUS`/`CONCURRENT`, flag `insufficientCorrelatives`) | 90/10 perf ok | `feat(tracking): availability engine` |
| 2.5 | `PUT /attempts/:id/close` (cierre explícito: `effective=MAX`, `avg`, redondeo mitad-arriba a entero, transición, anulación de siblings `PENDING_FINAL` en misma txn, `422` si instancias incompletas) + tests (`7,7→PASSED`; `4,4+requires_final→PENDING_FINAL`; `3,3→desaprobado`) | Tests verdes | `feat(tracking): close attempt` |
| 2.6 | `GET /study-plans/:id/subjects` y `GET /enrollments/:id/cursables` paginados (`?status=&q=&page&limit`, `{data,meta}`) | `limit` y `total` ok | `feat(tracking): paginated cursables` |
| 2.7 | Instancias (`POST/PUT/DELETE /attempts/:id/instances`, todo `type` cuenta, `sort_order`, ownership + lock) | CRUD ok | `feat(evaluation): instances` |
| 2.8 | Retakes (`POST /instances/:id/retakes`, mejor-nota-manda) | CRUD ok | `feat(evaluation): retakes` |
| 2.9 | Finales (`POST/PUT /attempts/:id/final-exams`, `409 FINAL_BLOCKED_BY_IN_PROGRESS` si hay sibling `IN_PROGRESS`) | CRUD ok | `feat(evaluation): finals` |
| 2.10 | `GET /enrollments/:id/averages` (`average`, `average_with_failures` con aplazo `<4`, `progress` con `MIN(electivas, required_electives)`) + tests caja negra | Cálculo testeado | `feat(tracking): averages+progress` |

## Fase 3: Privacidad, SEO, legal y a11y

| # | Objetivo | Done | Commit |
|---|----------|------|--------|
| 3.1 | `DELETE /users/me` (soft `deleted_at`, anonimiza `created_by`, revoca refresh) + `GET /users/me/export` (JSON) + cron diario hard-delete 30d | Borrado e2e | `feat(privacy): delete+export` |
| 3.2 | SEO base (Metadata API, canonical, `robots` con `disallow /dashboard,/api`, `sitemap.ts` con `select id,updated_at LIMIT`, `not-found.tsx`, OG, `llm.txt`) | Lighthouse ok | `feat(seo): base` |
| 3.3 | Legal `/legal/*` desde `docs/legal/*`, banner cookies necesarias, fuentes self-hosted (`next/font/local`, prohibido `fonts.googleapis`) | Legal ok | `feat(legal): privacy terms cookies` |
| 3.4 | Helmet + CSP `script-src 'self'` + CORS whitelist + skeletons, empty states con CTA, toasts, optimistic UI con rollback | Audit ok | `feat(ui): feedback+security-headers` |
| 3.5 | A11y WCAG 2.1 AA (labels, foco visible, contraste 4.5:1/3:1, teclado, `alt`, landmarks, axe/Lighthouse 100) | A11y 100 | `feat(a11y): wcag` |
| 3.6 | Tests e2e correlativas + deploy Vercel y Render y Neon | Preview deploy | `chore(deploy): preview` |

## Fase 4: v2 (post MVP)

| # | Objetivo | Notas |
|---|----------|-------|
| 4.1 | Grupos de cursada entre usuarios | Requiere permisos |
| 4.2 | Opiniones de materias y archivos de apuntes | Async `outbox` y `S3 presigned`, jobs no bloquean request |
| 4.3 | Equivalencias automaticas entre planes | Hoy manuales |
| 4.4 | Importación CSV catálogo en UI | Hoy solo DB directa |

## Fuera de roadmap

Notificaciones, ranking o social. Descartado (ver [specification.md](./specification.md) sección 3.3).
