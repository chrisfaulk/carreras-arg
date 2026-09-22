# Política y consentimiento de cookies

> Vigencia: 2026-09-22. Version 1.0.

## 1. Que se usa

Solo cookies necesarias para mantener sesión. No hay cookies de analytics, publicidad, tracking ni grabación de sesión.

| Cookie | Duración | Flags | Finalidad |
|--------|----------|-------|-----------|
| `access` | 15 min | `httpOnly, Secure, SameSite=Strict` | JWT de acceso |
| `refresh` | 7 dias | `httpOnly, Secure, SameSite=Strict` | renovación de sesión |

Ver `auth.md:16` para flujo completo. No accesibles via JavaScript (mitiga XSS). Protegidas contra CSRF por `SameSite=Strict` y check de `Origin`.

## 2. Qué no se usa

- No analytics con cookies (GA4, Mixpanel, etc. no instalados).
- No contenido embebido de terceros con cookies (YouTube, Maps, etc. no embebidos).
- No grabación de sesión (Hotjar, Clarity, FullStory, LogRocket prohibidos). Ver `standards.md`.
- No fuentes remotas: tipograficas self-hosted, sin request a `fonts.googleapis.com`. Ver `architecture.md`.

Si en el futuro se agrega analytics, sera solo con solución sin cookies y sin grabación (Plausible/Umami/Vercel Analytics) y se actualizara esta política antes de desplegar.

## 3. Consentimiento

Las cookies listadas son tecnicamente necesarias para autenticación. No requieren consentimiento opt-in segun ePrivacy, pero requieren información (esta pagina).

- Banner informativo al primer ingreso: explica que solo hay cookies necesarias, con boton "Entendido" que cierra el aviso. No bloquea el uso. No hay opción "rechazar necesarias" porque sin ellas no hay login.
- Preferencia `dismissed` guardada en `localStorage`, no en cookie.
- Podes borrar cookies desde tu navegador; al hacerlo se cierra la sesión.

## 4. Terceros embebidos

Ninguno en MVP. Política para contribuciones:

- No agregar iframes/scripts de terceros que seteen cookies sin actualizar esta política y sin revision en PR.
- CSP por defecto bloquea `script-src` de terceros no allowlistados.

## 5. Contacto

Dudas: via GitHub Issues/email del repositorio (ver `legal/privacy.md`).

## Changelog

- 1.0 (2026-09-22): version inicial, solo cookies necesarias.
