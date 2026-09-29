/*
  Warnings:

  - You are about to drop the column `circleId` on the `Moment` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `Moment` table. All the data in the column will be lost.
  - You are about to drop the column `momentId` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `momentId` on the `Reaction` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `Moment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photoUrl` to the `Moment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Moment` table without a default value. This is not possible if the table is not empty.
  - Made the column `messageId` on table `Reaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Moment" DROP CONSTRAINT "Moment_circleId_fkey";

-- DropForeignKey
ALTER TABLE "Moment" DROP CONSTRAINT "Moment_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_momentId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_momentId_fkey";

-- DropIndex
DROP INDEX "Moment_circleId_capturedAt_idx";

-- DropIndex
DROP INDEX "Photo_momentId_key";

-- DropIndex
DROP INDEX "Reaction_momentId_idx";

-- AlterTable
ALTER TABLE "Moment" DROP COLUMN "circleId",
DROP COLUMN "memberId",
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "photoUrl" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "momentId";

-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "momentId",
ALTER COLUMN "messageId" SET NOT NULL;

-- CreateTable
CREATE TABLE "MomentVisibility" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MomentVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MomentReaction" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MomentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MomentVisibility_circleId_idx" ON "MomentVisibility"("circleId");

-- CreateIndex
CREATE INDEX "MomentVisibility_momentId_idx" ON "MomentVisibility"("momentId");

-- CreateIndex
CREATE UNIQUE INDEX "MomentVisibility_momentId_circleId_key" ON "MomentVisibility"("momentId", "circleId");

-- CreateIndex
CREATE INDEX "MomentReaction_momentId_idx" ON "MomentReaction"("momentId");

-- CreateIndex
CREATE INDEX "MomentReaction_userId_idx" ON "MomentReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MomentReaction_momentId_userId_emoji_key" ON "MomentReaction"("momentId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "Moment_authorId_createdAt_idx" ON "Moment"("authorId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentVisibility" ADD CONSTRAINT "MomentVisibility_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentVisibility" ADD CONSTRAINT "MomentVisibility_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentReaction" ADD CONSTRAINT "MomentReaction_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentReaction" ADD CONSTRAINT "MomentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
