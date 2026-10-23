-- AlterTable
ALTER TABLE "AnonymousPost" ADD COLUMN     "cardTheme" TEXT DEFAULT 'sunset';

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "DecisionWheel" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "lastResult" TEXT,
ADD COLUMN     "lastSpunAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "caption" TEXT,
ADD COLUMN     "uploaderId" TEXT;

-- AlterTable
ALTER TABLE "SharedAlbum" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT;

-- CreateIndex
CREATE INDEX "CalendarEvent_createdById_idx" ON "CalendarEvent"("createdById");

-- CreateIndex
CREATE INDEX "DecisionWheel_createdById_idx" ON "DecisionWheel"("createdById");

-- CreateIndex
CREATE INDEX "Photo_uploaderId_idx" ON "Photo"("uploaderId");

-- CreateIndex
CREATE INDEX "SharedAlbum_createdById_idx" ON "SharedAlbum"("createdById");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "CircleMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedAlbum" ADD CONSTRAINT "SharedAlbum_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "CircleMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionWheel" ADD CONSTRAINT "DecisionWheel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "CircleMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
