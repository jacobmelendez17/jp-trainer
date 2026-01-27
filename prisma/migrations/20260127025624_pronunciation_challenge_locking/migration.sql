-- AlterTable
ALTER TABLE "PronunciationChallenge" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;
