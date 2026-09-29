-- CreateEnum
CREATE TYPE "MomentMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "Moment" ADD COLUMN     "mediaType" "MomentMediaType" NOT NULL DEFAULT 'IMAGE';
