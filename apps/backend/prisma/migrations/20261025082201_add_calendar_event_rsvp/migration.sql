-- CreateEnum
CREATE TYPE "EventRsvpStatus" AS ENUM ('YES', 'NO', 'MAYBE');

-- CreateTable
CREATE TABLE "CalendarEventRsvp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EventRsvpStatus" NOT NULL DEFAULT 'YES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEventRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEventRsvp_eventId_status_idx" ON "CalendarEventRsvp"("eventId", "status");

-- CreateIndex
CREATE INDEX "CalendarEventRsvp_userId_idx" ON "CalendarEventRsvp"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventRsvp_eventId_userId_key" ON "CalendarEventRsvp"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "CalendarEventRsvp" ADD CONSTRAINT "CalendarEventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventRsvp" ADD CONSTRAINT "CalendarEventRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
