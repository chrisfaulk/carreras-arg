# Arquitectura

## Stack

| Capa | Elección | Notas |
|------|----------|-------|
| Backend | **NestJS (TS)** | DDD por modulos, free tier liviano |
| Frontend | **Next.js 14+ (TS, App Router)** | RSC por defecto, Server Actions, responsive web only |
| DB | **PostgreSQL + Prisma** | Prisma para DTO projections |
| Infra | **Vercel (Next) + Render/Railway (Nest) + Neon/Supabase (PG) + Resend** | Free tier, sin Redis, LB o CDN en MVP |
| Monorepo | `pnpm workspaces + Turborepo` | `/backend`, `/frontend`, `/docs` con scripts y lint compartidos |

Escala esperada MVP: menos de 1k usuarios y menos de 10k `subject_attempt`, con patron 90 por ciento lectura y 10 por ciento escritura.

## Estructura monorepo

```
/backend  -> NestJS, Prisma schema, tests de dominio
/frontend -> Next.js, bulletproof-react
/docs     -> esta carpeta
```

## Modulos DDD (Nest)

`identity` (user, auth), `catalog` (university, career, study_plan, subject, correlatives), `enrollment` (user_study_plan_enrollment), `tracking` (subject_attempt, disponibilidad, promedios, cierre), `evaluation` (evaluation_instance, retake, final_exam), `shared` (kernel, read models).

Servicios con responsabilidad única: `AvailabilityReader` (vista computada `AVAILABLE`/`NOT_AVAILABLE` + flag `insufficientCorrelatives`), `AttemptCloser` (promedio, redondeo mitad-arriba, transición y anulación de siblings), `AverageCalculator` (promedios x2 y avance). Validadores puros sin I/O para máquina de estados y fórmulas, testeables caja negra.

Reglas:

- Cada modulo expone solo `api/` (interfaces publicas); `internal/` es privado.
- Comunicación cross module por IDs y `ReadModel` (projections), no JOINs Prisma cross module. Sin broker en MVP.
- Relaciones explicitas en DB (FKs), implicitas en código (IDs).
- Toda mutación de cursada o evaluación corre en una transacción Prisma que primero hace `SELECT FOR UPDATE` sobre `user_study_plan_enrollment`. Serializa escrituras concurrentes del mismo plan y evita races en creación, cierre, anulación y finales. Timeout corto con `409`/`503` ante contención.
- Disponibilidad y agregados siempre sincrónicos en request (MVP); solo el hard-delete de usuarios usa cron diario (`@Cron`, sin worker externo). Outbox y S3 presigned para archivos y opiniones en v2.
- API solo `PUT` para mutaciones (`POST` solo crear, `PUT` para actualizar/transicionar, `DELETE` para borrar). Prohibido `PATCH` en todo el repo; lo verifica `pnpm lint` en CI.

## Frontend: bulletproof-react con RSC

- `app/` rutas, `features/*` (catalog, tracking y otros), `components/ui` (Linear: buttons, tabs, badges), `lib/api`, `app/legal/*` (paginas `privacy`, `terms`, `cookies` desde `docs/legal/*`).
- **RSC por defecto** para listados y detalles (paginación, filtros y búsqueda `ILIKE nombre%`); islands `"use client"` y TanStack Query solo para forms y mutations optimistas (con rollback en error). Sin `useEffect` ni `useLayoutEffect`.
- Design tokens sin hardcode, estilo SF Interface y Medium para layout y Linear para detalle. Ver [ui-ux.md](./ui-ux.md).
- **Fuentes self-hosted:** tipografias via `next/font/local` con `woff2` en `public/fonts` o `next/font` con self-host. Prohibido `@import` o `<link>` a `fonts.googleapis.com` / `fonts.gstatic.com` (expone IP). Ver `standards.md` y `legal/cookies.md`.
- **Terceros:** sin analytics con cookies ni grabación de sesión en MVP. Si se agrega analytics, solo Plausible/Umami/Vercel Analytics (sin cookies). Ver `legal/cookies.md`. CSP bloquea `script-src` no allowlistado.

## IDs y secretos

- IDs publicas en URLs: `UUIDv7`. Tablas solo relación internas: `BIGINT`. Ver [database.md](./database.md).
- Todo secreto en env vars (`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_API_URL`, `ADMIN_SEED_EMAIL`, `ALLOWLIST_IPS`). Validación al boot con zod. `.env.example` y `.env` gitignored. Nunca exponer API keys, URLs o IPs privadas ni logs con PII.

## Decisiones y no decisiones

- Sin Redis, LB, CDN o workers en MVP. Rate limiting en memoria (`@nestjs/throttler`); pasar a Redis cuando haya mas de una instancia. Optimizaciones baratas si (ej. 2 queries en vez de 3). Agregar cache u outbox hacia broker cuando metricas lo pidan.
- Sin versionado API (`/api/*`). REST clasico solo con `GET/POST/PUT/DELETE`.
- Read models: projections DTO directo desde DB, no entidades completas. Ver [standards.md](./standards.md).

## Referencias

- Dominio: [specification.md](./specification.md)
- Tablas: [database.md](./database.md)
- API: [api.md](./api.md)
- Auth y privacidad: [auth.md](./auth.md), [privacy.md](./privacy.md), [legal/privacy.md](./legal/privacy.md), [legal/cookies.md](./legal/cookies.md)
