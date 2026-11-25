-- Match the notification schema for databases created from the migration history.
ALTER TABLE "Notification"
    ADD COLUMN IF NOT EXISTS "targetType" TEXT,
    ADD COLUMN IF NOT EXISTS "targetId" TEXT,
    ADD COLUMN IF NOT EXISTS "deepLink" TEXT,
    ADD COLUMN IF NOT EXISTS "metadata" JSONB,
    ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

UPDATE "Notification" SET "type" = 'SYSTEM' WHERE "type" IS NULL;
ALTER TABLE "Notification"
    ALTER COLUMN "type" SET DEFAULT 'SYSTEM',
    ALTER COLUMN "type" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_type_idx" ON "Notification"("userId", "type");

ALTER TABLE "CircleMember"
    ADD COLUMN IF NOT EXISTS "notificationLevel" TEXT NOT NULL DEFAULT 'ALL',
    ADD COLUMN IF NOT EXISTS "mutedUntil" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'ANDROID',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeviceToken_userId_deviceId_key" ON "DeviceToken"("userId", "deviceId");
CREATE INDEX IF NOT EXISTS "DeviceToken_userId_status_idx" ON "DeviceToken"("userId", "status");
CREATE INDEX IF NOT EXISTS "DeviceToken_token_idx" ON "DeviceToken"("token");
CREATE INDEX IF NOT EXISTS "CalendarEvent_reminderTime_idx" ON "CalendarEvent"("reminderTime");
