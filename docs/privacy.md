# Privacidad

## Datos minimos

Solo `email` y `username (UQ)` y `display_name` libre. No se pide DNI o legajo. Ver [database.md](./database.md) tabla `user`. `display_name` es lo público; `username` y `email` nunca se exponen a otros usuarios.

## Visibilidad

Toggle `user.is_public` (público o privado) por usuario, editable por `PUT /users/me`. Si es `false`, solo owner y `admin` ven progreso. Listados publicos filtran por `is_public=true`.

## Base legal (Ley 25.326)

- Finalidad: seguimiento academico personal.
- Base: consentimiento registrado en `user.accepted_privacy_at` (timestamp al registrarse). El registro exige checkbox "Acepto Privacidad y Términos" con links a `legal/privacy.md` y `legal/terms.md` (ver `auth.md` y `legal/cookies.md`). Sin aceptación no se crea cuenta. No hay checkbox pre-tildado.
- Derechos ARCO: acceso, rectificación, supresión via `GET /users/me/export`, `PUT /users/me` y `DELETE /users/me`.
- Texto legal versionado en `legal/privacy.md`, `legal/terms.md`, `legal/cookies.md` (paginas publicas `/legal/*`).

## Borrado y retención

- `DELETE /users/me` hace soft delete (`user.deleted_at = now()`), anonimiza `created_by` y revoca todos los `refresh_token`. El usuario deja de poder loguearse y su progreso deja de ser visible.
- A los 30 días un cron diario (`@Cron`, sin worker externo) hace hard delete del usuario, sus enrollments, attempts, evaluaciones y finales.
- Export: `GET /users/me/export` (JSON con enrollments y attempts con evaluaciones y finales).
- Logs nunca contienen PII; auditoria solo `created_by/at, updated_by/at` más `audit_log` de catálogo.

## Auditoria

`created_by/at, updated_by/at` en todas las tablas de dominio y `audit_log` para catálogo (quien creo o edito `university`, `career`, `study_plan`, `subject`, `subject_correlative`). Ver [database.md](./database.md).

## Buenas prácticas obligatorias

CORS whitelist, Helmet headers, `Content-Security-Policy` sin terceros, `SELECT` con `LIMIT`, no exponer `password_hash`, `google_sub` o `token_hash`, validación de entrada en trust boundaries con zod, ownership `enrollment.user_id = req.user.id` más RLS (ver [database.md](./database.md)), env vars para todo secreto. Fuentes self-hosted (ver `architecture.md`), sin analytics con grabación de sesión (ver `legal/cookies.md` y `standards.md`).

## Páginas legales

El texto publicable esta en `legal/privacy.md`, `legal/terms.md`, `legal/cookies.md`. Este archivo es nota técnica de implementación.
