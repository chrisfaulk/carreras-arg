ALTER TABLE user_study_plan_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_plan_enrollment FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_isolation ON user_study_plan_enrollment FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

ALTER TABLE subject_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_attempt FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_isolation ON subject_attempt FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_study_plan_enrollment e
    WHERE e.id = subject_attempt.study_plan_enrollment_id
      AND e.user_id = current_setting('app.user_id', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_study_plan_enrollment e
    WHERE e.id = subject_attempt.study_plan_enrollment_id
      AND e.user_id = current_setting('app.user_id', true)::uuid
  ));

ALTER TABLE evaluation_instance ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_instance FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_isolation ON evaluation_instance FOR ALL
  USING (EXISTS (
    SELECT 1 FROM subject_attempt a
    JOIN user_study_plan_enrollment e ON e.id = a.study_plan_enrollment_id
    WHERE a.id = evaluation_instance.subject_attempt_id
      AND e.user_id = current_setting('app.user_id', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM subject_attempt a
    JOIN user_study_plan_enrollment e ON e.id = a.study_plan_enrollment_id
    WHERE a.id = evaluation_instance.subject_attempt_id
      AND e.user_id = current_setting('app.user_id', true)::uuid
  ));

ALTER TABLE evaluation_retake ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_retake FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_isolation ON evaluation_retake FOR ALL
  USING (EXISTS (
    SELECT 1 FROM evaluation_instance i
    JOIN subject_attempt a ON a.id = i.subject_attempt_id
    JOIN user_study_plan_enrollment e ON e.id = a.study_plan_enrollment_id
    WHERE i.id = evaluation_retake.evaluation_instance_id
      AND e.user_id = current_setting('app.user_id', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM evaluation_instance i
    JOIN subject_attempt a ON a.id = i.subject_attempt_id
    JOIN user_study_plan_enrollment e ON e.id = a.study_plan_enrollment_id
    WHERE i.id = evaluation_retake.evaluation_instance_id
      AND e.user_id = current_setting('app.user_id', true)::uuid
  ));

ALTER TABLE final_exam ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_exam FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_isolation ON final_exam FOR ALL
  USING (EXISTS (
    SELECT 1 FROM subject_attempt a
    JOIN user_study_plan_enrollment e ON e.id = a.study_plan_enrollment_id
    WHERE a.id = final_exam.subject_attempt_id
      AND e.user_id = current_setting('app.user_id', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM subject_attempt a
    JOIN user_study_plan_enrollment e ON e.id = a.study_plan_enrollment_id
    WHERE a.id = final_exam.subject_attempt_id
      AND e.user_id = current_setting('app.user_id', true)::uuid
  ));

ALTER TABLE refresh_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_token FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_isolation ON refresh_token FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);
