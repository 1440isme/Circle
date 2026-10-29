-- AlterTable
ALTER TABLE "GroupPoll" ADD COLUMN     "createdById" TEXT;

-- CreateIndex
CREATE INDEX "GroupPoll_createdById_idx" ON "GroupPoll"("createdById");

-- CreateIndex
CREATE INDEX "LiveLocationShare_memberId_idx" ON "LiveLocationShare"("memberId");

-- CreateIndex
CREATE INDEX "SheetCell_lastEditedById_idx" ON "SheetCell"("lastEditedById");

-- AddForeignKey
ALTER TABLE "GroupPoll" ADD CONSTRAINT "GroupPoll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "CircleMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
