# Base de datos

> Esquema en `snake_case`. Código en `camelCase`. Constantes `SCREAMING_SNAKE`. IDs publicas `UUIDv7` en URLs; internas `BIGINT`. Nombres de tablas y clases en singular.

## Convenciones

- Prisma schema en ingles, tablas `snake_case` y en singular.
- `created_by/at`, `updated_by/at` en todas las tablas de dominio.
- PKs publicas: `UUIDv7` (`uuid` nativo PG). Tablas solo relación internas (`subject_correlative`) pueden ser `BIGINT GENERATED ALWAYS AS IDENTITY`.
- FKs explicitas en DB; en código solo IDs (desacople). Cross module via read models, no JOIN Prisma.
- búsqueda: `ILIKE 'nombre%'` (prefix) con `B-Tree` en `name`. Se evita `%nombre%` para no forzar seq scan. `pg_trgm` solo si se necesita luego.

## ERD

```mermaid
erDiagram
    university ||--o{ career : has
    career ||--o{ study_plan : has
    study_plan ||--o{ subject : has
    user ||--o{ user_study_plan_enrollment : enrolls
    study_plan ||--o{ user_study_plan_enrollment : has
    subject ||--o{ subject_correlative : subject
    subject ||--o{ subject_correlative : correlative
    user_study_plan_enrollment ||--o{ subject_attempt : groups
    subject ||--o{ subject_attempt : attempted
    subject_attempt ||--o{ evaluation_instance : has
    evaluation_instance ||--o{ evaluation_retake : has
    subject_attempt ||--o{ final_exam : has

    university {
        uuid id PK
        text name UK
        timestamptz created_at
    }
    career {
        uuid id PK
        uuid university_id FK
        text name
    }
    study_plan {
        uuid id PK
        uuid career_id FK
        int year
        int required_electives
    }
    subject {
        uuid id PK
        uuid study_plan_id FK
        text name
        boolean is_elective
        boolean requires_final
    }
    subject_correlative {
        bigint id PK
        uuid subject_id FK
        uuid correlative_subject_id FK
        enum type
    }
    user {
        uuid id PK
        text username UK
        text email UK
        text display_name
        text password_hash
        text google_sub UK
        boolean is_public
        boolean is_email_verified
    }
    user_study_plan_enrollment {
        uuid id PK
        uuid user_id FK
        uuid study_plan_id FK
    }
    subject_attempt {
        uuid id PK
        uuid study_plan_enrollment_id FK
        uuid subject_id FK
        enum status
        int final_grade
        int term_year
        enum term
    }
    evaluation_instance {
        uuid id PK
        uuid subject_attempt_id FK
        enum type
        text custom_type_name
        int grade
        date exam_date
        int min_regularize
        int min_promote
        int sort_order
    }
    evaluation_retake {
        uuid id PK
        uuid evaluation_instance_id FK
        int grade
        date exam_date
    }
    final_exam {
        uuid id PK
        uuid subject_attempt_id FK
        int grade
        date exam_date
        boolean is_external_exam
    }
```

## Restricciones

| Entidad | Restricción |
|---------|-------------|
| `university` | `name` es unico |
| `career` | `(university_id, name)` es unico |
| `study_plan` | `(career_id, year)` es unico |
| `subject` | `(study_plan_id, name)` es unico |
| `subject_correlative` | `(subject_id, correlative_subject_id)` es unico |
| `user` | `username` es unico |
| `user` | `email` es unico |
| `user` | `google_sub` es unico cuando no es `NULL` |
| `user_study_plan_enrollment` | `(user_id, study_plan_id)` es unico |

### Campos nullable

* `user.password_hash`
* `user.google_sub`
* `subject_attempt.final_grade`
* `subject_attempt.term_year`
* `subject_attempt.term`
* `evaluation_instance.custom_type_name`
* `evaluation_instance.grade`
* `evaluation_instance.exam_date`
* `evaluation_retake.exam_date`
* `final_exam.grade`
* `final_exam.exam_date`

`subject_attempt.study_plan_enrollment_id` es NOT NULL. No existe cursada sin enrollment (YAGNI para `active` boolean). El `user_id` se deriva via `user_study_plan_enrollment.user_id` en read models.

## Detalle por tabla

### `user`
`id UUIDv7 PK`, `username UQ`, `email UQ`, `display_name`, `password_hash nullable` (nullable por OAuth), `google_sub UQ nullable`, `is_public bool default false`, `is_email_verified bool`, `accepted_privacy_at nullable`, `created_by/at`, `updated_by/at`.

### `university`
`id UUIDv7 PK`, `name UQ`.

### `career`
`id UUIDv7 PK`, `university_id FK`, `name`, `UQ(university_id, name)`.

### `study_plan`
`id UUIDv7 PK`, `career_id FK`, `year int`, `required_electives int default 0`, `UQ(career_id, year)`. Indice `B-Tree(year)`.

### `subject`
`id UUIDv7 PK`, `study_plan_id FK`, `name`, `is_elective bool`, `requires_final bool`, `UQ(study_plan_id, name)`, `B-Tree(name)` para `ILIKE nombre%`.

### `subject_correlative`
`id BIGINT PK`, `subject_id FK` hacia `subject`, `correlative_subject_id FK` hacia `subject`, `type ENUM('PREVIOUS','CONCURRENT')`, `UQ(subject_id, correlative_subject_id)`. Solo `AND` (ver [specification.md](./specification.md) sección 5.2).

### `user_study_plan_enrollment`
`id UUIDv7 PK`, `user_id FK`, `study_plan_id FK`, `UQ(user_id, study_plan_id)`.

### `subject_attempt`
Historico N intentos por enrollment y subject. `id UUIDv7 PK`, `study_plan_enrollment_id FK NOT NULL`, `subject_id FK`, `status ENUM('NOT_AVAILABLE','AVAILABLE','IN_PROGRESS','PENDING_FINAL','PASSED')`, `final_grade 1-10 nullable`, `term_year nullable`, `term ENUM('FIRST','SECOND') nullable`, `created_by/at`, `updated_by/at`. Indice `B-Tree(study_plan_enrollment_id, subject_id)`, `B-Tree(status)`. El `user_id` se obtiene via JOIN a `user_study_plan_enrollment` en read models.

### `evaluation_instance`
`id UUIDv7 PK`, `subject_attempt_id FK`, `type ENUM('PARTIAL','PRACTICAL_WORK','DELIVERABLE','OTHER')`, `custom_type_name nullable` (si `OTHER`), `grade 1-10 nullable`, `exam_date nullable`, `min_regularize default 4`, `min_promote default 7`, `sort_order`.

### `evaluation_retake`
`id UUIDv7 PK`, `evaluation_instance_id FK`, `grade 1-10`, `exam_date nullable`, `created_at`.

### `final_exam`
`id UUIDv7 PK`, `subject_attempt_id FK`, `grade nullable`, `exam_date nullable`, `is_external_exam bool default false` (rendir en condición de libre, habilita `AVAILABLE->PASSED` y `PENDING_FINAL->PASSED`).

### `refresh_token` (ver [auth.md](./auth.md))
`id UUIDv7 PK`, `user_id FK`, `token_hash`, `expires_at`, `revoked_at nullable`.

## Read models

Projections DTO directo desde DB (`select id, name, status` y similares), no entidades completas. Ejemplo: `AvailableSubjectReadModel` cruza `subject` y `subject_correlative` y `subject_attempt` via query nativa o Prisma `findMany select`. Para `subject_attempt` el `user_id` se proyecta con JOIN a `user_study_plan_enrollment`.

## Row Level Security (RLS) — hardening temprano

RLS como defensa en profundidad, no reemplaza filtros en app.

- Tablas con RLS: `user_study_plan_enrollment`, `subject_attempt`, `evaluation_instance`, `evaluation_retake`, `final_exam`, `refresh_token`. catálogo (`university`, `career`, `study_plan`, `subject`, `subject_correlative`) es público (RLS no aplica).
- Política: `USING (user_id = current_setting('app.user_id', true)::uuid)` o via `study_plan_enrollment.user_id` con JOIN. `FOR ALL` con `WITH CHECK` igual a `USING`.
- Implementacion con Prisma (single role): middleware Nest por request autenticado ejecuta `SET LOCAL app.user_id = '<uuid>'` antes de cualquier query en la transacción. Requests no autenticados no setean (ven solo catálogo público). `FORCE RLS` en tablas protegidas.
- Migración: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY; CREATE POLICY ...; ALTER TABLE ... FORCE ROW LEVEL SECURITY;`. Tests con 2 usuarios: `SET LOCAL` como A no debe leer rows de B.
- `ponytail: SET LOCAL por request, sin pooling por role. Si aparece PgBouncer transaction pooling con SET LOCAL, mover a RLS por vista o check en app.`

## Migraciones

Prisma Migrate. Un archivo por cambio. Nunca editar migración aplicada. RLS se agrega en migración dedicada post tablas base.
