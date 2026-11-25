CREATE TABLE "CalendarReminderDelivery" (
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarReminderDelivery_pkey" PRIMARY KEY ("eventId", "userId", "reminderAt")
);

CREATE INDEX "CalendarReminderDelivery_userId_idx" ON "CalendarReminderDelivery"("userId");

ALTER TABLE "CalendarReminderDelivery"
    ADD CONSTRAINT "CalendarReminderDelivery_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarReminderDelivery"
    ADD CONSTRAINT "CalendarReminderDelivery_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
