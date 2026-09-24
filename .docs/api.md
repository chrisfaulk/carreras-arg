# API

> REST clasico, sin versionado. Solo `GET`, `POST`, `PUT`, `DELETE`. Prohibido `PATCH` en todo el repo (lo verifica `pnpm lint`).

## Convenciones generales

- Base: `/api/*` (Next rewrites a Nest).
- Auth: cookies `httpOnly` `access` y `refresh`. Ver [auth.md](./auth.md).
- IDs publicas: `UUIDv7` en path (`/subjects/:id`). Ver [database.md](./database.md).
- Paginación: `?page=1&limit=20` (default 20, max 50). Respuesta `{ data: [], meta: { page, limit, total } }`.
- Filtros y búsqueda: `?q=nombre` (`ILIKE nombre%` con `B-Tree`), `?status=AVAILABLE|NOT_AVAILABLE|IN_PROGRESS|PENDING_FINAL|PASSED`, `?studyPlanId=...`, segun recurso.
- Mutaciones idempotentes: `PUT` repetido con el mismo cuerpo devuelve `200` sin efecto (no-op), salvo creación con `POST`.
- Errores: `{ error: { code, message } }` sin exponer PII o stack. Códigos usados: `401 UNAUTHENTICATED`, `403 FORBIDDEN` (incluye `AdminOnly`), `404 NOT_FOUND` (sin oráculo: un recurso ajeno responde `404`, nunca `403` diferencial salvo admin), `409 CONFLICT` (`DUPLICATE`, `INVALID_VISIBLE_STATE`, `FINAL_BLOCKED_BY_IN_PROGRESS`, `FINAL_NOT_ALLOWED`, `DELETE_BLOCKED_BY_CHILDREN`), `422 UNPROCESSABLE` (`INVALID_TRANSITION`, `INCOMPLETE_INSTANCES`). Ver [ui-ux.md](./ui-ux.md) para mensajes.
- DTOs en ingles, projections directo desde DB (`select`), no entidades. Validación con zod en trust boundaries. Ver [standards.md](./standards.md).
- Headers: `Content-Security-Policy` sin terceros por defecto (ver `standards.md` y `legal/cookies.md`), `Helmet`, CORS whitelist.

## Recursos

- `auth`: `POST /auth/register, /login, /refresh, /logout, /forgot, /reset, GET /auth/verify?token, POST /auth/password`. Ver [auth.md](./auth.md).
- `users`: `PUT /users/me` (editar `display_name`, `is_public`), `GET /users/me/export` (JSON con enrollments y attempts), `DELETE /users/me` (soft delete, ver [privacy.md](./privacy.md)).
- `catalog` (admin para escritura, público para lectura): `GET /universities?q=&page&limit`, `POST /universities`, `PUT /universities/:id`, `DELETE /universities/:id`; igual para `/careers?universityId=`, `/study-plans?careerId=`, `/subjects?studyPlanId=&q=&status=`; correlativas `GET /subjects/:id/correlatives`, `POST /subjects/:id/correlatives { correlativeSubjectId, type }`, `DELETE /subjects/:id/correlatives/:correlativeId`. Escritura exige `is_admin` y escribe `audit_log` en la misma transacción. `DELETE` con hijos devuelve `409`.
- `enrollment`: `POST /enrollments { studyPlanId }`, `GET /enrollments/me`, `GET /enrollments/:id/averages` (`{ average, averageWithFailures, progress }`, ver [specification.md](./specification.md) sección 6).
- `tracking`: `POST /enrollments/:enrollmentId/attempts { subjectId }` (solo si visible `AVAILABLE` o `PENDING_FINAL`, sino `409`), `PUT /attempts/:id { status, finalGrade?, termYear?, term? }` (máquina `IN_PROGRESS <-> PENDING_FINAL <-> PASSED`, idempotente), `PUT /attempts/:id/close` (cierre explícito con promedio, redondeo y anulación de siblings `PENDING_FINAL`), `GET /study-plans/:id/subjects?status=&q=&page&limit` (estado visible agregado + `insufficientCorrelatives`), `GET /enrollments/:id/cursables?q=&page&limit`.
- `evaluation` (anidados a `subject_attempt`, con ownership via enrollment y lock de enrollment): instancias `GET/POST /attempts/:id/instances`, `PUT /instances/:id`, `DELETE /instances/:id`; retakes `POST /instances/:id/retakes`, `DELETE /retakes/:id`; finales `POST /attempts/:id/final-exams { grade?, examDate?, isExternalExam? }`, `PUT /final-exams/:id`. Crear o editar `final_exam` con sibling `IN_PROGRESS` no anulado devuelve `409 FINAL_BLOCKED_BY_IN_PROGRESS`.

## Referencias

- Tablas: [database.md](./database.md)
- Auth: [auth.md](./auth.md)
- Dominio: [specification.md](./specification.md)
- Roadmap (orden de implementación): [roadmap.md](./roadmap.md)
