# Términos y condiciones

> Vigencia: 2026-09-25. Version 1.1.

## 1. Objeto

Carreras ARG es un portal open source para estudiantes de universidades argentinas que permite registrar los planes que se cursan y calcular materias cursables segun correlativas. Ver `specification.md`.

## 2. Aceptación

Al registrarte aceptas estos Términos y la política de privacidad (`legal/privacy.md`) y la política de cookies (`legal/cookies.md`). La aceptación queda registrada en `user.accepted_privacy_at`. Sin aceptación no se crea la cuenta.

## 3. Cuentas y roles

- `user`: gestiona su perfil, enrollments y progreso.
- `admin`: ademas gestiona catálogo (`university`, `career`, `study_plan`, `subject`, correlativas). Ver `specification.md:2`.
- Sos responsable de custodiar tu contrasena. No compartas credenciales.
- Edad minima: 16 anos (13 en Argentina con autorización de tutor).

## 4. Uso aceptable

No esta permitido: vulnerar seguridad, scraping abusivo, spam, suplantación, cargar contenido ilegal o que infrinja derechos de terceros.

## 5. Contenido y catálogo

- El catálogo (universidades, carreras, planes, materias, correlativas) es mantenido por `admin` y colaboradores. Puede contener errores. Se corrige via contribuciones.
- Planes y nombres de materias son hechos academicos. Descripciones, logos o PDFs de terceros conservan su copyright. Ver sección 7.

## 6. Veracidad

No se publican resenas falsas, testimonios inventados ni afirmaciones no verificables sobre universidades o resultados academicos. Todo dato mostrado proviene de `database.md` o aportes con fuente. Ver `standards.md`.

## 7. Propiedad intelectual y contenido de terceros

- Código: licencia MIT (ver `README.md` y `LICENSE`). Salvo indicación contraria, toda contribución se licencia MIT.
- Contenido aportado por usuarios: al contribuir declaras tener derechos para hacerlo. Otorgas licencia MIT para su distribución dentro del proyecto.
- Contenido de terceros (logos, textos oficiales de planes): se usa de forma descriptiva. Si sos titular y querés baja o atribución, contacta via GitHub Issues/email del repositorio (ver `legal/privacy.md`). Retiro en 10 dias hábiles.
- Procedimiento DMCA/takedown: reporte vía GitHub Issue con URL, prueba de titularidad y alcance solicitado.

## 8. Gratuidad

Servicio gratuito. No hay pagos ni suscripciones. Si en el futuro se habilitan pagos, se publicará política de reembolsos antes de cobrar. No existe política de reembolsos aplicable hoy.

## 9. Disponibilidad y responsabilidad

Proyecto comunitario sin SLA. Se ofrece "tal cual". No se garantiza disponibilidad ininterrumpida ni exactitud absoluta de correlativas. No hay responsabilidad por decisiones academicas tomadas en base a la plataforma. Ver `specification.md:5` para reglas de cálculo.

## 10. Terminación

Podes borrar tu cuenta via `DELETE /users/me` (ver `legal/privacy.md`). El proyecto puede suspender cuentas que violen estos Términos.

## 11. Ley aplicable

Leyes de la República Argentina. Jurisdicción: tribunales ordinarios del domicilio del usuario o CABA a elección del consumidor.

## Changelog

- 1.0 (2026-09-22): version inicial.
- 1.1 (2026-09-25): objeto sin publicidad engañosa: registrar planes que se cursan, no inscripción.
