-- AlterTable
ALTER TABLE "DecisionWheel" ADD COLUMN     "confettiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "initialOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "soundEnabled" BOOLEAN NOT NULL DEFAULT true;
