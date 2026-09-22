# API

> REST clasico, sin versionado. Convenciones; endpoints detallados se definen por flujo con paginación, filtros y búsqueda.

## Convenciones generales

- Base: `/api/*` (Next rewrites a Nest).
- Auth: cookies `httpOnly` `access` y `refresh`. Ver [auth.md](./auth.md).
- IDs publicas: `UUIDv7` en path (`/subject/:id`). Ver [database.md](./database.md).
- Paginación: `?page=1&limit=20` (default 20, max 50). Respuesta `{ data: [], meta: { page, limit, total } }`.
- Filtros y búsqueda: `?q=nombre` (`ILIKE nombre%` con `B-Tree`), `?status=AVAILABLE`, `?studyPlanId=...`, segun recurso. Se define por endpoint al implementar.
- Errores: `{ error: { code, message } }` sin exponer PII o stack. Ver [ui-ux.md](./ui-ux.md) para mensajes.
- DTOs en ingles, projections directo desde DB (`select`), no entidades. Ver [standards.md](./standards.md).
- Headers: `Content-Security-Policy` sin terceros por defecto (ver `standards.md` y `legal/cookies.md`), `Helmet`, CORS whitelist.

## Recursos (placeholder, se detallan por flujo)

- `auth`: `POST /auth/register, /login, /refresh, /logout, /forgot, /reset, GET /auth/verify, POST /auth/password`
- `catalog` (admin): `university, career, study_plan, subject, subject_correlative`
- `enrollment`: `POST /enrollment` (user hacia study_plan), `GET /enrollment/me`
- `tracking`: `GET /subject?cursable=true`, `PATCH /subject-attempt/:id/status`, promedios y avance
- `evaluation`: `evaluation_instance, retake, final_exam` anidados a `subject_attempt`

## Referencias

- Tablas: [database.md](./database.md)
- Auth: [auth.md](./auth.md)
- Roadmap (orden de implementación): [roadmap.md](./roadmap.md)
