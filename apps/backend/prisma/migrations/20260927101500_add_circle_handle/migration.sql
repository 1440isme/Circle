-- AlterTable
ALTER TABLE "Circle" ADD COLUMN "handle" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Circle_handle_key" ON "Circle"("handle");

-- CreateIndex
CREATE INDEX "Circle_handle_idx" ON "Circle"("handle");
