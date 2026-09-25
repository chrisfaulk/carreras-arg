# Pages

> Inventario de rutas y composición por page. `ui-ux.md` define tokens y principios; este doc define qué lleva cada page. Fase 1 es solo API: estas pages se construyen en Fase 3 (SEO/legal/a11y) y Fase 2 (dashboard). Inspiración: SF Interface (números/densidad), Medium (layout editorial), Linear (buttons, tabs, badges).

## Reglas globales por page

- RSC por defecto; island `"use client"` + TanStack Query solo para forms/mutations optimistas con rollback. Sin `useEffect`.
- Navegación solo con `<Link>` (prefetch activo). `loading.tsx` por segmento (skeleton de la estructura, nunca spinner). Shell (header/nav/footer) en primer frame.
- Estados obligatorios: skeleton, empty con CTA, error inline + toast. Botones verbo+objeto. Landmarks `<main>/<nav>/<header>`, `label` + `aria-describedby`.
- SEO por page según `seo.md` (title, meta 140-160, OG, canonical). Públicas en `sitemap.ts`; `/dashboard/*` con `disallow`.

## Públicas (catálogo)

| Ruta | Composición | Responsive | Fuente |
|------|-------------|------------|--------|
| `/` landing | Hero (Medium: titular + sub + CTA buscar) + grilla universidades + footer legal | 1 col móvil, 3 col desktop | Medium hero, SF números |
| `/universities` | Search `q` + lista paginada (RSC, `?q=&page&limit`) + skeleton filas | Lista full-width, paginador sticky bottom en móvil | Linear list + tabs |
| `/universities/:id` | Header universidad + tabs (Carreras) + lista careers `?universityId=` | Tabs scroll horizontal móvil | Linear tabs |
| `/careers/:id` | Header carrera + lista planes `?careerId=` (año, electivas requeridas) | Igual anterior | Linear tabs |
| `/plans/:id` | Header plan + search materias + tabla materias con badge estado (requiere login para estado personal; anónimo ve catálogo) + empty "Sin materias" | Tabla → cards en móvil | SF tabla densa, Linear badges |

## Auth (islands client, no indexar)

| Ruta | Composición |
|------|-------------|
| `/register` | Form (email, username, display_name, password, checkbox privacidad no pre-tildado + links legal) → toast + redirect `/login`. Errores inline por campo. |
| `/login` | Form email+password + link `/forgot` + botón Google (`/api/auth/google`). |
| `/verify?token` | RSC: llama `GET /auth/verify`, muestra éxito/error con CTA a login. |
| `/forgot` → `/reset?token` | Forms mínimos, respuesta siempre `ok` (sin oráculo). |

## Privadas (`/dashboard/*`, `robots disallow`)

| Ruta | Composición |
|------|-------------|
| `/dashboard` | Cards mis planes (progreso %, promedio) + CTA "Registrar plan" → `/universities`. Empty: "No registraste ningún plan". |
| `/dashboard/enrollments/:id` | Tabs por estado (Cursables/En final/Cursando/Aprobadas) + badges + banner `insufficientCorrelatives` (toast, no bloqueante). Datos de `GET /enrollments/:id/cursables` y `GET /study-plans/:id/subjects?status=`. |
| `/dashboard/attempts/:id` | Detalle cursada: instancias + retakes + final + botón "Cerrar cursada" (Fase 2). |
| `/dashboard/profile` | Form `display_name`, toggle `is_public` (`PUT /users/me`), export JSON, zona peligrosa borrado soft. |

## Admin (guard `is_admin`, misma grilla que catálogo público + acciones)

- `/admin/universities`, `/admin/careers`, `/admin/plans`, `/admin/subjects`: tabla + search + paginación + diálogos crear/editar (`POST`/`PUT`) + delete con confirmación (muestra `409` si tiene hijos). Correlativas: picker de materia + select `PREVIOUS|CONCURRENT` + validación anti-ciclo (error `422 CYCLIC_CORRELATIVE`).
- Reutilizan `features/catalog` y `components/ui` (Linear buttons/tabs/badges); sin UI paralela.

## Referencias

- Principios: [ui-ux.md](./ui-ux.md). Endpoints: [api.md](./api.md). SEO: [seo.md](./seo.md). Roadmap: [roadmap.md](./roadmap.md).
