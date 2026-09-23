# anti-slop vendored

- Upstream: https://github.com/dmmulroy/anti-slop
- Revision: `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b` (rama `main`, 2026-09-23)
- Alcance: solo reglas genericas (`src/rules/`, `src/shared/`, `src/vendor/`, `src/index.ts`).
  Excluidos a proposito: `src/effect/` (el repo no usa Effect) y `*.test.ts` (solo runtime).
- `src/index.ts` se conserva intacto aunque en `oxlint.config.ts` no se activen
  todas sus reglas (ver config raiz para el subconjunto vigente).
- Actualizaciones: copiar de nuevo desde upstream y preservar este archivo.
