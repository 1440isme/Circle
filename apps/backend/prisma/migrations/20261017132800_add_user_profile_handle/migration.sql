-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "handle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_handle_key" ON "UserProfile"("handle");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserProfile_handle_idx" ON "UserProfile"("handle");
