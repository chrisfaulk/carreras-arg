# Especificación

> Fuente de verdad funcional. Para decisiones técnicas ver [architecture.md](./architecture.md), [database.md](./database.md) y [auth.md](./auth.md).

## 1. Contexto

En universidades argentinas no existe una herramienta oficial que permita al alumnado llevar un seguimiento centralizado de materias aprobadas, cursadas, en final y candidatas a cursar. Cada cuatrimestre el estudiante revisa manualmente correlativas y planes.

**Carreras ARG** es un portal centralizado donde el usuario se anota a planes de estudio y el sistema calcula automáticamente qué materias puede cursar en función de correlativas, exponiendo cinco estados por materia: `Aprobada`, `Cursando`, `En final`, `Cursable`, `No disponible`.

Público inicial: estudiantes argentinos (calendario cuatrimestral).

## 2. Roles

| Rol | Alcance | Implementación |
|-----|---------|----------------|
| `user` | Todas las operaciones de estudiante y gestión de su perfil y progreso | Toda cuenta creada |
| `admin` | Todo lo de `user` y gestión de catálogo (`university`, `career`, `study_plan`, `subject` y correlativas) | `user.is_admin = true`. Guard `AdminOnly`: `401` si no autenticado, `403` si no admin. Todo cambio de catálogo escribe `audit_log` en la misma transacción |

La primera cuenta admin se crea por seed con `ADMIN_SEED_EMAIL` solo si la tabla `user` está vacía. Ver [auth.md](./auth.md) y [database.md](./database.md).

## 3. Requisitos funcionales

### 3.1 Usuario

- Autenticación: registro, login, logout, verificación de email, restablecer contraseña, editar perfil (ver [auth.md](./auth.md)).
- Anotarse a planes de estudio (relación `user` hacia `study_plan`; carrera y universidad se derivan del plan, no se anota a carrera suelta).
- Listar carreras disponibles (paginado, filtrado, búsqueda `ILIKE nombre%`).
- Listar planes de estudio de una carrera.
- Listar materias de un plan (con estado visible computado por usuario, ver sección 5.1).
- Registrar cursada de una materia (ver sección 5).
- Listar materias cursables (derivadas de correlativas).
- Consultar promedios y avance (ver sección 6).

### 3.2 Administrador

- Todo lo de usuario.
- Gestionar universidades, carreras, planes de estudio y materias (CRUD) y correlativas. Carga masiva por DB directa en MVP; importación CSV queda fuera de MVP.
- Borrado de catálogo protegido: `DELETE` de `subject` o `study_plan` con attempts o enrollments asociados devuelve `409`; solo se permite `PUT`. `DELETE` de `university` o `career` solo si no tiene hijos, sino `409`.

### 3.3 Fuera de alcance MVP

Notificaciones, funciones sociales o ranking, compartir progreso mas alla del toggle público o privado, importación CSV en UI, grupos de cursada, opiniones o archivos de apuntes (previsto v2 async, ver [roadmap.md](./roadmap.md)).

## 4. Entidades del dominio (resumen, no esquema final)

Ver esquema exacto en [database.md](./database.md).

- **University**: `name` unico.
- **Career**: `name` único dentro de `university` (`UQ university_id, name`). Tiene N `study_plan`.
- **StudyPlan**: `year` y `career_id` (`UQ career_id, year`). Define `required_electives` para título.
- **Subject**: `name` único dentro de `study_plan` (`UQ study_plan_id, name`). Pertenece a un solo plan (duplicación intencional entre planes para desacoplar). Campos: `is_elective`, `requires_final`.
- **SubjectCorrelative**: relación `subject_id` hacia `correlative_subject_id` con `type: PREVIOUS | CONCURRENT`. Solo entre subjects del mismo plan. Lógica exclusivamente `AND` (todas deben cumplirse). Sin auto-referencia ni ciclos.
- **UserStudyPlanEnrollment**: `user_id` y `study_plan_id` (`UQ`). Un usuario puede estar en N planes, incluso dos planes de la misma carrera.
- **SubjectAttempt**: histórico de cursadas por enrollment y materia (N intentos permitidos). Requiere enrollment previo, no existe cursada sin anotación al plan. Persiste `IN_PROGRESS | PENDING_FINAL | PASSED | FAILED` (`FAILED` = desaprobado cerrado, solo se llega vía cierre explícito y habilita recursada). Umbrales `min_regularize` (default 4) y `min_promote` (default 7) viven en el attempt, editables solo mientras está `IN_PROGRESS`. Columna `annulled_at nullable`: un attempt anulado se conserva pero se ignora en el estado visible y en promedios.

## 5. Reglas de negocio: cursada y estados

### 5.1 Estado visible por materia (agregado)

Cinco estados visibles: `NOT_AVAILABLE` (No disponible), `AVAILABLE` (Cursable), `PENDING_FINAL` (En final), `IN_PROGRESS` (Cursando), `PASSED` (Aprobada).

Una materia puede tener N attempts (historial + recursadas). El estado visible es el máximo por prioridad entre los attempts **no anulados** (`annulled_at IS NULL`) del enrollment para ese `subject`:

| Estado | Peso |
|--------|------|
| `PASSED` | 4 |
| `IN_PROGRESS` | 3 |
| `PENDING_FINAL` | 2 |
| `AVAILABLE` | 1 |
| `NOT_AVAILABLE` | 0 |

Los attempts `FAILED` se ignoran en el agregado (cuentan solo en promedios).

`AVAILABLE` y `NOT_AVAILABLE` nunca se persisten en `subject_attempt`; se computan al leer (ver sección 5.2). Si no hay ningún attempt no anulado y las correlativas se cumplen, el visible es `AVAILABLE`; si no se cumplen, `NOT_AVAILABLE`.

Si una correlativa simultánea se abandona despues de haber habilitado una materia posterior, la materia posterior se mantiene pero la UI muestra aviso "correlativas insuficientes" (`insufficientCorrelatives: true`).

### 5.2 Calculo de disponibilidad (vista computada, sin escritura en cascada)

`AVAILABLE` si y solo si: todas las `PREVIOUS` están en `PASSED` o `PENDING_FINAL` (por agregado) y todas las `CONCURRENT` están en `PASSED`, `PENDING_FINAL` o `IN_PROGRESS` (por agregado). Los attempts anulados no cuentan.

La disponibilidad se calcula en cada lectura dentro de la misma transacción de escritura o lectura, con lock del enrollment (ver [architecture.md](./architecture.md)). No existe proceso de cascada que escriba estados: no hay writes encadenados ni deadlock por grafo.

### 5.3 Ciclo de vida del attempt

- **Creación:** `POST /enrollments/:enrollmentId/attempts { subjectId }` crea un attempt en `IN_PROGRESS`. Solo permitido si el estado visible de la materia es `AVAILABLE` o `PENDING_FINAL` (recursada para promocionar o rendir libre). Cualquier otro visible (`NOT_AVAILABLE`, `IN_PROGRESS`, `PASSED`) devuelve `409`. En la misma transacción se crea el template de evaluación (2 instancias `PARTIAL`).
- **Transición directa:** `PUT /attempts/:id { status, finalGrade?, termYear?, term? }` muta un attempt entre `IN_PROGRESS <-> PENDING_FINAL <-> PASSED`. Es idempotente: repetir el mismo `status` devuelve `200` sin efecto. Transiciones manuales hacia `AVAILABLE` o `NOT_AVAILABLE` están prohibidas (`422`).
- **Examen libre:** `AVAILABLE -> PASSED` solo existe como creación de attempt en `IN_PROGRESS` más `final_exam` con `is_external_exam = true` en la misma transacción que el pase a `PASSED`. Si `subject.requires_final = false`, se permite `IN_PROGRESS -> PASSED` directo con nota; si es `true`, se exige un `final_exam` aprobado.
- **Desaprobado / recursada:** un attempt que al cerrarse no alcanza `min_regularize` queda `FAILED` (su `final_grade` cuenta en `average_with_failures`, ver sección 6) y habilita una nueva recursada vía `POST` cuando el visible lo permite (`FAILED` no participa del estado visible: resuelve a `AVAILABLE` si las correlativas se cumplen).
- **Anulación por promoción:** cuando `PUT /attempts/:id/close` lleva un `IN_PROGRESS` a `PASSED`, todos los siblings en `PENDING_FINAL` del mismo `(enrollment, subject)` se marcan `annulled_at = now()` en la misma transacción. Su nota deja de contar en promedios y en el agregado.
- **Exclusión mutua:** no se puede crear ni editar un `final_exam` de un attempt si existe un sibling `IN_PROGRESS` no anulado para el mismo `(enrollment, subject)`. Devuelve `409 FINAL_BLOCKED_BY_IN_PROGRESS`.

### 5.4 Evaluación, cierre y finales

- Template por defecto al crear `IN_PROGRESS`: 2 instancias `PARTIAL`. Cada instancia admite N `retakes` (recuperatorios).
- Tipos de `evaluation_instance`: `PARTIAL | PRACTICAL_WORK | DELIVERABLE | OTHER` (nombre custom si `OTHER`). Campos por instancia: `grade 1-10 nullable`, `exam_date nullable`, `sort_order`. **Toda** instancia cuenta para la nota del attempt, sin distinción de tipo.
- Nota efectiva por instancia: `effective = MAX(grade, retakes.grade)`. Manda la mejor nota, no la última. Las instancias sin nota (`effective NULL`) se ignoran en el promedio pero **bloquean el cierre**: `PUT /attempts/:id/close` devuelve `422 INCOMPLETE_INSTANCES` si queda alguna. Esas instancias se pueden completar por `PUT` o eliminar por `DELETE`.
- Cierre explícito: el usuario pulsa "Cerrar cursada" → `PUT /attempts/:id/close`. El servidor calcula `avg = AVG(effective NOT NULL)`, lo redondea a entero con mitad hacia arriba (fracción `< 0.5` hacia abajo, `>= 0.5` hacia arriba) y ese entero es el `final_grade` del attempt. Los umbrales son los del attempt (`min_regularize`, `min_promote`). Decisión:
  - `avg >= min_promote` y `requires_final = false` → `PASSED`
  - `avg >= min_promote` y `requires_final = true` → `PENDING_FINAL` (el final sigue siendo obligatorio)
  - `min_regularize <= avg < min_promote` → `PENDING_FINAL`
  - `avg < min_regularize` → `FAILED` (desaprobado, habilita recursada)
- `final_exam`: `grade`, `exam_date`, `is_external_exam` (rendir libre). Pasar `PENDING_FINAL -> PASSED` por final exige un `final_exam` aprobado en el attempt.
- Cada intento puede registrar `term_year`, `term (FIRST|SECOND)` (calendario argentino standard) y fechas exactas de examenes.

### 5.5 Electivas

`subject.is_elective = true` con sus propias correlativas. El requisito de titulo es `study_plan.required_electives` (ej. 3). Solo se valida para porcentaje de avance y titulo, no bloquea cursadas individuales.

## 6. Promedios y avance

- Dos promedios separados por `enrollment` (plan). `average`: una sola nota aprobada por materia — si el attempt `PASSED` no anulado tiene un `final_exam` aprobado (`grade >= 4`), manda esa nota; si no, el `final_grade` del attempt. `average_with_failures`: todo lo de `average`, más cada `final_grade NOT NULL` de attempts `FAILED` no anulados, más cada `final_exam.grade NOT NULL < 4`. Attempts anulados (`annulled_at NOT NULL`) nunca cuentan. `NULL` siempre se ignora. Aplazo = nota `< 4`. Cálculo simple no ponderado. Electivas entran igual que obligatorias. Regla de negocio: una materia sin final obligatorio que promociona directo a `PASSED` no puede tener un `final_exam` aprobado (se rechaza con `409 FINAL_NOT_ALLOWED`).
- Porcentaje de avance por plan: `total = obligatorias + required_electives`; `ok = obligatorias PASSED + MIN(electivas PASSED, required_electives)`; `% = ok / total`.

## 7. Privacidad y visibilidad

- Datos minimos: `email` y `username (UQ)` y `display_name` (libre).
- Toggle `is_public` por usuario (público o privado). Ver [privacy.md](./privacy.md).
- Auditoria minima `created_by/at, updated_by/at` más `audit_log` para catálogo.
- Legal: textos versionados en `legal/privacy.md`, `legal/terms.md`, `legal/cookies.md` (paginas `/legal/*`). Registro exige aceptación con `accepted_privacy_at`. Ver `auth.md` y `legal/cookies.md`.

## 8. Referencias

- Tablas y relaciones: [database.md](./database.md)
- Autenticación y sesiones: [auth.md](./auth.md)
- API y contratos: [api.md](./api.md)
- Estándares y testing: [standards.md](./standards.md)
- Roadmap granular: [roadmap.md](./roadmap.md)
