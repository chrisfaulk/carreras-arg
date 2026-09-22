# Especificación

> Fuente de verdad funcional. Para decisiones técnicas ver [architecture.md](./architecture.md), [database.md](./database.md) y [auth.md](./auth.md).

## 1. Contexto

En universidades argentinas no existe una herramienta oficial que permita al alumnado llevar un seguimiento centralizado de materias aprobadas, cursadas, en final y candidatas a cursar. Cada cuatrimestre el estudiante revisa manualmente correlativas y planes.

**Carreras ARG** es un portal centralizado donde el usuario se anota a carreras y planes de estudio y el sistema calcula automáticamente qué materias puede cursar en función de correlativas, exponiendo cinco estados por materia: `Aprobada`, `Cursando`, `En final`, `Cursable`, `No disponible`.

Público inicial: estudiantes argentinos (calendario cuatrimestral).

## 2. Roles

| Rol | Alcance |
|-----|---------|
| `user` | Todas las operaciones de estudiante y gestión de su perfil y progreso |
| `admin` | Todo lo de `user` y gestión de catálogo (`university`, `career`, `study_plan`, `subject` y correlativas) |

Ver [auth.md](./auth.md) para permisos.

## 3. Requisitos funcionales

### 3.1 Usuario

- Autenticación: registro, login, logout, verificación de email, restablecer contraseña, editar perfil (ver [auth.md](./auth.md)).
- Anotarse a planes de estudio (relación `user` hacia `study_plan`; carrera y universidad se derivan del plan, no se anota a carrera suelta).
- Listar carreras disponibles (paginado, filtrado, búsqueda `ILIKE nombre%`).
- Listar planes de estudio de una carrera.
- Listar materias de un plan (con estado computado por usuario).
- Registrar cursada de una materia (ver sección 5).
- Listar materias cursables (derivadas de correlativas).
- Consultar promedios y avance (ver sección 6).

### 3.2 Administrador

- Todo lo de usuario.
- Gestionar universidades, carreras, planes de estudio y materias (CRUD). Carga masiva por DB directa en MVP; importación CSV queda fuera de MVP.

### 3.3 Fuera de alcance MVP

Notificaciones, funciones sociales o ranking, compartir progreso mas alla del toggle público o privado, importación CSV en UI, grupos de cursada, opiniones o archivos de apuntes (previsto v2 async, ver [roadmap.md](./roadmap.md)).

## 4. Entidades del dominio (resumen, no esquema final)

Ver esquema exacto en [database.md](./database.md).

- **University**: `name` unico.
- **Career**: `name` único dentro de `university` (`UQ university_id, name`). Tiene N `study_plan`.
- **StudyPlan**: `year` y `career_id` (`UQ career_id, year`). Define `required_electives` para título.
- **Subject**: `name` único dentro de `study_plan` (`UQ study_plan_id, name`). Pertenece a un solo plan (duplicación intencional entre planes para desacoplar). Campos: `is_elective`, `requires_final`.
- **SubjectCorrelative**: relación `subject_id` hacia `correlative_subject_id` con `type: PREVIOUS | CONCURRENT`. Lógica exclusivamente `AND` (todas deben cumplirse).
- **UserStudyPlanEnrollment**: `user_id` y `study_plan_id` (`UQ`). Un usuario puede estar en N planes, incluso dos planes de la misma carrera.
- **SubjectAttempt**: histórico de cursadas por enrollment y materia (N intentos permitidos). Ver sección 5. Requiere enrollment previo, no existe cursada sin anotación al plan.

## 5. Reglas de negocio: cursada y estados

### 5.1 Estados

Cinco estados: `NOT_AVAILABLE` (No disponible), `AVAILABLE` (Cursable), `IN_PROGRESS` (Cursando), `PENDING_FINAL` (En final), `PASSED` (Aprobada).

Maquina de estados acordada:

```
NOT_AVAILABLE -> AVAILABLE          (automático, al cumplirse correlativas)
AVAILABLE -> NOT_AVAILABLE          (automático, si alguna correlativa deja de cumplir)
AVAILABLE <-> IN_PROGRESS <-> PENDING_FINAL <-> PASSED   (transiciones libres entre estos cuatro)
```

Inválidas: cualquier transición manual hacia `NOT_AVAILABLE`, `NOT_AVAILABLE` hacia `PASSED`, `IN_PROGRESS` o `PENDING_FINAL` directo, `PASSED` hacia `NOT_AVAILABLE`.

Si una correlativa simultánea se abandona despues de haber habilitado una materia posterior, la materia posterior se mantiene pero la UI muestra aviso "correlativas insuficientes".

### 5.2 Calculo de disponibilidad

- `AVAILABLE` si y solo si: todas las `PREVIOUS` están en `PASSED` o `PENDING_FINAL` y todas las `CONCURRENT` están en `PASSED`, `PENDING_FINAL` o `IN_PROGRESS`.
- Recálculo sincrónico en cada transición de estado (MVP). El pasaje `AVAILABLE` hacia `NOT_AVAILABLE` es automático y en cascada.

### 5.3 Evaluación y finales

- Template por defecto al crear `IN_PROGRESS`: 2 instancias `PARTIAL` (parciales). Cada instancia admite N `retakes` (recuperatorios).
- Tipos de `evaluation_instance`: `PARTIAL | PRACTICAL_WORK | DELIVERABLE | OTHER` (custom name si `OTHER`). Campos por instancia: `grade 1-10 nullable`, `exam_date nullable`, `min_regularize default 4`, `min_promote default 7`, `sort_order`. Todo opcional: el usuario puede sólo cambiar estado o solo cargar `final_grade`.
- `final_exam`: `grade`, `exam_date`, `is_external_exam` (rendir en condición de libre). Si `is_external_exam` es true permite transiciones `PENDING_FINAL -> PASSED` y `AVAILABLE -> PASSED` (examen libre). Si `requires_final` es false, `PASSED` no exige final.
- Cada intento puede registrar `term_year`, `term (FIRST|SECOND)` (calendario argentino standard) y fechas exactas de examenes.

### 5.4 Electivas

`subject.is_elective = true` con sus propias correlativas. El requisito de titulo es `study_plan.required_electives` (ej. 3). Solo se valida para porcentaje de avance y titulo, no bloquea cursadas individuales.

## 6. Promedios y avance

- Dos promedios separados por `study_plan`: `average` (solo `PASSED` con nota final) y `average_with_failures` (incluye intentos reprobados con nota). Calculo simple no ponderado en MVP.
- Porcentaje de avance: `PASSED / total subjects` por plan; electivas cuentan segun `required_electives`.

## 7. Privacidad y visibilidad

- Datos minimos: `email` y `username (UQ)` y `display_name` (libre).
- Toggle `is_public` por usuario (público o privado). Ver [privacy.md](./privacy.md).
- Auditoria minima `created_by/at, updated_by/at`.
- Legal: textos versionados en `legal/privacy.md`, `legal/terms.md`, `legal/cookies.md` (paginas `/legal/*`). Registro exige aceptación con `accepted_privacy_at`. Ver `auth.md` y `legal/cookies.md`.

## 8. Referencias

- Tablas y relaciones: [database.md](./database.md)
- Autenticación y sesiones: [auth.md](./auth.md)
- Estándares y testing: [standards.md](./standards.md)
- Roadmap granular: [roadmap.md](./roadmap.md)
