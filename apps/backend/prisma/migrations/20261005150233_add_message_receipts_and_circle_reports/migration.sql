/*
  Warnings:

  - You are about to drop the column `coverUrl` on the `Circle` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Circle` table. All the data in the column will be lost.
  - You are about to drop the column `coverUrl` on the `UserProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('CIRCLE', 'USER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "Circle" DROP COLUMN "coverUrl",
DROP COLUMN "description";

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "coverUrl";

-- CreateTable
CREATE TABLE "MessageReceipt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetType" "ReportTargetType" NOT NULL DEFAULT 'CIRCLE',
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircleReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageReceipt_messageId_idx" ON "MessageReceipt"("messageId");

-- CreateIndex
CREATE INDEX "MessageReceipt_userId_idx" ON "MessageReceipt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReceipt_messageId_userId_key" ON "MessageReceipt"("messageId", "userId");

-- CreateIndex
CREATE INDEX "CircleReport_circleId_idx" ON "CircleReport"("circleId");

-- CreateIndex
CREATE INDEX "CircleReport_reporterId_idx" ON "CircleReport"("reporterId");

-- CreateIndex
CREATE INDEX "CircleReport_targetUserId_idx" ON "CircleReport"("targetUserId");

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleReport" ADD CONSTRAINT "CircleReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleReport" ADD CONSTRAINT "CircleReport_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleReport" ADD CONSTRAINT "CircleReport_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
