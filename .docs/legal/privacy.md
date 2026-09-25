# Política de privacidad

> Vigencia: 2026-09-25. Version 1.2. Historial de cambios al final.

## 1. Responsable

Carreras ARG es un proyecto open source sin fines de lucro. Responsable del tratamiento: mantenedores del repositorio.

- Contacto: via GitHub Issues del repositorio y email publicado en el perfil del repositorio.
- Repositorio: URL publica del proyecto en GitHub (ver `README.md`).

No existe domicilio comercial. Para ejercer derechos, alcanza con contacto por GitHub o email.

## 2. Datos que se tratan

Solo datos minimos necesarios para seguimiento academico:

| Dato | Origen | Obligatorio |
|------|--------|-------------|
| `email` | registro | si |
| `username` (unico) | registro | si |
| `display_name` | registro | si |
| `password_hash` | registro (nullable si OAuth) | condicional |
| `google_sub` | Google OAuth | condicional |
| `is_public`, `is_email_verified`, `accepted_privacy_at` | sistema | si |
| `user_study_plan_enrollment`, `subject_attempt`, `evaluation_instance`, `final_exam` | uso del sistema | si |

No se solicita DNI, legajo, domicilio, telefono ni datos de pago. `display_name` es lo unico visible a terceros si el perfil es público. `email` y `username` nunca se exponen a otros usuarios.

## 3. Finalidad y base legal

- Finalidad: permitir al usuario anotarse a planes de estudio y calcular materias cursables segun correlativas, promedios y avance.
- Base legal: consentimiento (Ley 25.326 art. 5). Se registra en `user.accepted_privacy_at` al aceptar Términos y esta política en el registro. Sin aceptación no se crea la cuenta.
- Edad: servicio dirigido a mayores de 16 anos (13 en Argentina). Si sos menor, requieres autorización de tutor. No se verifica identidad mas alla del email.

## 4. Conservación y retención

- Cuenta activa: mientras el usuario mantenga la cuenta.
- Borrado: `DELETE /users/me` hace soft delete (`user.deleted_at = now()`), anonimiza `created_by`/`updated_by`, revoca `refresh_token` y bloquea login. Enrollments, attempts, evaluaciones y finales se conservan 30 días y luego se eliminan con hard delete diario. Ver `privacy.md` de implementación y `database.md`.
- Export: `GET /users/me/export` entrega JSON con enrollments y attempts.
- Logs: nunca contienen PII ni `password_hash`/`token_hash`.

## 5. Destinatarios y transferencias

- Hosting: Vercel (frontend), Render/Railway (backend), Neon/Supabase (PostgreSQL), Resend (email transaccional). Ver `architecture.md`.
- No se vende ni cede datos a terceros.
- No se usa analytics con tracking ni grabación de sesión. Ver `legal/cookies.md`.
- Fuentes tipograficas self-hosted, sin request a `fonts.googleapis.com`. Ver `architecture.md` y `standards.md`.

## 6. Derechos ARCO (Ley 25.326)

Acceso, rectificación, actualización y supresión via:

- `PUT /users/me` (rectificación)
- `GET /users/me/export` (acceso)
- `DELETE /users/me` (supresion)

Reclamos ante Agencia de Acceso a la Información Publica (AAIP) si corresponde.

## 7. Seguridad

- Passwords con BCrypt, nunca en texto plano ni logs.
- Sesiones `access JWT 15m` + `refresh 7d` en cookies `httpOnly, Secure, SameSite=Strict`. Ver `auth.md`.
- Validación de entrada en trust boundaries, CORS whitelist, Helmet, `LIMIT` en queries.
- Row Level Security (RLS) en PostgreSQL como defensa en profundidad. Ver `database.md`.

## 8. Cambios

Cambios se publican con nueva fecha de vigencia y entrada en changelog. Cambios sustanciales se notifican via release notes del repositorio.

## Changelog

- 1.0 (2026-09-22): version inicial.
- 1.1 (2026-09-23): corrige endpoint de perfil a `PUT /users/me`.
- 1.2 (2026-09-25): aclara borrado: soft delete conserva datos 30 días, luego hard delete.
