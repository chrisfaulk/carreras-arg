BEGIN;

INSERT INTO "user" (id, username, email, display_name, updated_at) VALUES
  (uuidv7(), 'rls_a', 'rls_a@example.com', 'RLS A', now()),
  (uuidv7(), 'rls_b', 'rls_b@example.com', 'RLS B', now());

INSERT INTO university (id, name, updated_at) VALUES (uuidv7(), 'RLS Uni', now());
INSERT INTO career (id, university_id, name, updated_at)
  SELECT uuidv7(), id, 'RLS Career', now() FROM university WHERE name = 'RLS Uni';
INSERT INTO study_plan (id, career_id, year, updated_at)
  SELECT uuidv7(), id, 2026, now() FROM career WHERE name = 'RLS Career';
INSERT INTO subject (id, study_plan_id, name, updated_at)
  SELECT uuidv7(), id, 'RLS Subject', now() FROM study_plan WHERE year = 2026;

SELECT set_config('app.user_id', (SELECT id::text FROM "user" WHERE username = 'rls_a'), true);
INSERT INTO user_study_plan_enrollment (id, user_id, study_plan_id, updated_at)
  SELECT uuidv7(), u.id, p.id, now() FROM "user" u, study_plan p
  WHERE u.username = 'rls_a' AND p.year = 2026;
INSERT INTO subject_attempt (id, study_plan_enrollment_id, subject_id, status, updated_at)
  SELECT uuidv7(), e.id, s.id, 'IN_PROGRESS', now()
  FROM user_study_plan_enrollment e, subject s;
INSERT INTO evaluation_instance (id, subject_attempt_id, type, sort_order, updated_at)
  SELECT uuidv7(), a.id, 'PARTIAL', 1, now() FROM subject_attempt a;
INSERT INTO evaluation_retake (id, evaluation_instance_id, grade)
  SELECT uuidv7(), i.id, 8 FROM evaluation_instance i;
INSERT INTO final_exam (id, subject_attempt_id, grade, updated_at)
  SELECT uuidv7(), a.id, 7, now() FROM subject_attempt a;
INSERT INTO refresh_token (id, user_id, token_hash, family_id, expires_at)
  SELECT uuidv7(), id, 'hash', uuidv7(), now() + interval '7 days'
  FROM "user" WHERE username = 'rls_a';

SELECT set_config('app.user_id', (SELECT id::text FROM "user" WHERE username = 'rls_b'), true);
INSERT INTO user_study_plan_enrollment (id, user_id, study_plan_id, updated_at)
  SELECT uuidv7(), u.id, p.id, now() FROM "user" u, study_plan p
  WHERE u.username = 'rls_b' AND p.year = 2026;
INSERT INTO subject_attempt (id, study_plan_enrollment_id, subject_id, status, updated_at)
  SELECT uuidv7(), e.id, s.id, 'IN_PROGRESS', now()
  FROM user_study_plan_enrollment e, "user" u, subject s
  WHERE e.user_id = u.id AND u.username = 'rls_b';
INSERT INTO refresh_token (id, user_id, token_hash, family_id, expires_at)
  SELECT uuidv7(), id, 'hash', uuidv7(), now() + interval '7 days'
  FROM "user" WHERE username = 'rls_b';

SELECT set_config('app.user_id', (SELECT id::text FROM "user" WHERE username = 'rls_a'), true);
SELECT 'a_enrollment' AS check, count(*) AS n FROM user_study_plan_enrollment
UNION ALL SELECT 'a_attempt', count(*) FROM subject_attempt
UNION ALL SELECT 'a_instance', count(*) FROM evaluation_instance
UNION ALL SELECT 'a_retake', count(*) FROM evaluation_retake
UNION ALL SELECT 'a_final', count(*) FROM final_exam
UNION ALL SELECT 'a_refresh', count(*) FROM refresh_token;

SELECT set_config('app.user_id', (SELECT id::text FROM "user" WHERE username = 'rls_b'), true);
SELECT 'b_enrollment' AS check, count(*) AS n FROM user_study_plan_enrollment
UNION ALL SELECT 'b_attempt', count(*) FROM subject_attempt
UNION ALL SELECT 'b_refresh', count(*) FROM refresh_token;

ROLLBACK;
