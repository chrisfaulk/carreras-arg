-- CreateEnum
CREATE TYPE "public"."CorrelativeType" AS ENUM ('PREVIOUS', 'CONCURRENT');

-- CreateEnum
CREATE TYPE "public"."AttemptStatus" AS ENUM ('IN_PROGRESS', 'PENDING_FINAL', 'PASSED');

-- CreateEnum
CREATE TYPE "public"."Term" AS ENUM ('FIRST', 'SECOND');

-- CreateEnum
CREATE TYPE "public"."InstanceType" AS ENUM ('PARTIAL', 'PRACTICAL_WORK', 'DELIVERABLE', 'OTHER');

-- CreateTable
CREATE TABLE "public"."university" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "university_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."career" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "university_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_plan" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "career_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "required_electives" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "study_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subject" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "study_plan_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_elective" BOOLEAN NOT NULL DEFAULT false,
    "requires_final" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subject_correlative" (
    "id" BIGSERIAL NOT NULL,
    "subject_id" UUID NOT NULL,
    "correlative_subject_id" UUID NOT NULL,
    "type" "public"."CorrelativeType" NOT NULL,

    CONSTRAINT "subject_correlative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_sub" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "accepted_privacy_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_study_plan_enrollment" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "study_plan_id" UUID NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_study_plan_enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subject_attempt" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "study_plan_enrollment_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "status" "public"."AttemptStatus" NOT NULL,
    "final_grade" INTEGER,
    "term_year" INTEGER,
    "term" "public"."Term",
    "annulled_at" TIMESTAMPTZ,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subject_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evaluation_instance" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "subject_attempt_id" UUID NOT NULL,
    "type" "public"."InstanceType" NOT NULL,
    "custom_type_name" TEXT,
    "grade" INTEGER,
    "exam_date" DATE,
    "min_regularize" INTEGER NOT NULL DEFAULT 4,
    "min_promote" INTEGER NOT NULL DEFAULT 7,
    "sort_order" INTEGER NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "evaluation_instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evaluation_retake" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "evaluation_instance_id" UUID NOT NULL,
    "grade" INTEGER NOT NULL,
    "exam_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_retake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."final_exam" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "subject_attempt_id" UUID NOT NULL,
    "grade" INTEGER,
    "exam_date" DATE,
    "is_external_exam" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "final_exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_token" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_log" (
    "id" BIGSERIAL NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "diff_json" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "university_name_key" ON "public"."university"("name");

-- CreateIndex
CREATE UNIQUE INDEX "career_university_id_name_key" ON "public"."career"("university_id", "name");

-- CreateIndex
CREATE INDEX "study_plan_year_idx" ON "public"."study_plan"("year");

-- CreateIndex
CREATE UNIQUE INDEX "study_plan_career_id_year_key" ON "public"."study_plan"("career_id", "year");

-- CreateIndex
CREATE INDEX "subject_name_idx" ON "public"."subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_study_plan_id_name_key" ON "public"."subject"("study_plan_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_correlative_subject_id_correlative_subject_id_key" ON "public"."subject_correlative"("subject_id", "correlative_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "public"."user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_google_sub_key" ON "public"."user"("google_sub");

-- CreateIndex
CREATE INDEX "user_deleted_at_idx" ON "public"."user"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_study_plan_enrollment_user_id_study_plan_id_key" ON "public"."user_study_plan_enrollment"("user_id", "study_plan_id");

-- CreateIndex
CREATE INDEX "subject_attempt_study_plan_enrollment_id_subject_id_idx" ON "public"."subject_attempt"("study_plan_enrollment_id", "subject_id");

-- CreateIndex
CREATE INDEX "subject_attempt_status_idx" ON "public"."subject_attempt"("status");

-- CreateIndex
CREATE INDEX "subject_attempt_annulled_at_idx" ON "public"."subject_attempt"("annulled_at");

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_idx" ON "public"."audit_log"("entity", "entity_id");

-- AddForeignKey
ALTER TABLE "public"."career" ADD CONSTRAINT "career_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "public"."university"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_plan" ADD CONSTRAINT "study_plan_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "public"."career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject" ADD CONSTRAINT "subject_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "public"."study_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject_correlative" ADD CONSTRAINT "subject_correlative_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject_correlative" ADD CONSTRAINT "subject_correlative_correlative_subject_id_fkey" FOREIGN KEY ("correlative_subject_id") REFERENCES "public"."subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_study_plan_enrollment" ADD CONSTRAINT "user_study_plan_enrollment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_study_plan_enrollment" ADD CONSTRAINT "user_study_plan_enrollment_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "public"."study_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject_attempt" ADD CONSTRAINT "subject_attempt_study_plan_enrollment_id_fkey" FOREIGN KEY ("study_plan_enrollment_id") REFERENCES "public"."user_study_plan_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject_attempt" ADD CONSTRAINT "subject_attempt_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluation_instance" ADD CONSTRAINT "evaluation_instance_subject_attempt_id_fkey" FOREIGN KEY ("subject_attempt_id") REFERENCES "public"."subject_attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluation_retake" ADD CONSTRAINT "evaluation_retake_evaluation_instance_id_fkey" FOREIGN KEY ("evaluation_instance_id") REFERENCES "public"."evaluation_instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."final_exam" ADD CONSTRAINT "final_exam_subject_attempt_id_fkey" FOREIGN KEY ("subject_attempt_id") REFERENCES "public"."subject_attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
