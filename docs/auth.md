# Autenticación

## Metodos

- **Email y password** (BCrypt, `password_hash nullable`). Requiere verificación de email.
- **Google OAuth2** (`google_sub UQ nullable`). Salta verificación; permite agregar password luego sin perder acceso (`POST /auth/password`).

`email` y `username` unicos (`UQ`). Ver [database.md](./database.md) tabla `user`.

## Flujos

| Flujo | Endpoint | Notas |
|-------|----------|-------|
| Registro | `POST /auth/register` | Crea `is_email_verified=false`, exige `acceptedPrivacy=true` (checkbox no pre-tildado, links a `legal/privacy` y `legal/terms`), guarda `accepted_privacy_at`, envia token 24h via Resend |
| Verificación | `GET /auth/verify?token` | Activa `is_email_verified` |
| Login | `POST /auth/login` | `Set-Cookie` httpOnly y Secure y SameSite Strict `access(15m)` y `refresh(7d)` |
| Refresh | `POST /auth/refresh` | Rota refresh, revoca anterior |
| Logout | `POST /auth/logout` | Revoca refresh |
| Olvide contrasena | `POST /auth/forgot` hacia `POST /auth/reset` | Token por email, expira 1h |
| Agregar password (OAuth) | `POST /auth/password` | Autenticado via Google, setea `password_hash` |

## Sesiones

Hibrido `access JWT (15m)` y `refresh` en cookies `httpOnly` (mitiga XSS). Tabla `refresh_token` con `token_hash`, `expires_at`, `revoked_at`. CSRF protegido por `SameSite=Strict` y check de `Origin`. Cookies documentadas como necesarias en `legal/cookies.md`.

## Emails

Via `Resend`. Solo transaccionales: verificación y reset. Footer con contacto GitHub/email y links a `legal/privacy` y `legal/cookies`, sin dirección postal (ver `legal/privacy.md:1` y `standards.md`). Sin `List-Unsubscribe` por ser exentos; si se agrega newsletter se implementa unsubscribe. Ver `legal/terms.md:8` para reembolsos (no aplica hoy).

## Rate limiting y geo

- **Infra:** Cloudflare Firewall Rule `ip.geoip.country ne "AR" hacia Block` y `ALLOWLIST_IPS` env para bypass (tu IP o VPN). Ver [architecture.md](./architecture.md).
- **Código (MVP):** Bucket4j en memoria por `IP` y `email` para `login 5/min`, `forgot 3/h`. Pasar a Redis cuando haya mas de una instancia.
- Sin Cloudflare: `OncePerRequestFilter` y `MaxMind GeoLite2` (`X-Forwarded-For` hacia pais) responde `403` si no es `AR`.

## Validación

- Password minimo 8, rate limited, nunca loggeado, nunca expuesto en DTO.
- Todo secreto en env vars. Ver [architecture.md](./architecture.md).

## Referencias

- Tablas: [database.md](./database.md) (`user`, `refresh_token`)
- Privacidad y borrado: [privacy.md](./privacy.md), [legal/privacy.md](./legal/privacy.md), [legal/cookies.md](./legal/cookies.md), [legal/terms.md](./legal/terms.md)
