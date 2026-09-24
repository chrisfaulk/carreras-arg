ALTER TYPE "AttemptStatus" ADD VALUE 'FAILED';

ALTER TABLE "subject_attempt" ADD COLUMN "min_regularize" INTEGER NOT NULL DEFAULT 4;

ALTER TABLE "subject_attempt" ADD COLUMN "min_promote" INTEGER NOT NULL DEFAULT 7;

ALTER TABLE "evaluation_instance" DROP COLUMN "min_regularize";

ALTER TABLE "evaluation_instance" DROP COLUMN "min_promote";
