import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { NotificationType } from '@circle/types';
import { getNotificationText } from '@circle/shared';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class CalendarReminderService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(CalendarReminderService.name);
  private timer?: ReturnType<typeof setInterval>;
  private inFlight?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onApplicationBootstrap() {
    const tick = () => {
      if (!this.inFlight) {
        this.inFlight = this.sendDueReminders()
          .catch(() => this.logger.warn('Calendar reminder sweep failed'))
          .finally(() => { this.inFlight = undefined; });
      }
    };
    this.timer = setInterval(tick, 60_000);
    this.timer.unref();
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    await this.inFlight;
  }

  async sendDueReminders(now = new Date()): Promise<void> {
    const events = await this.prisma.calendarEvent.findMany({
      where: { reminderTime: { lte: now }, startTime: { gt: now }, isCancelled: false, circle: { deletedAt: null } },
      select: { id: true, reminderTime: true, rsvps: { where: { status: 'YES' }, select: { userId: true } } },
    });

    for (const event of events) {
      if (!event.reminderTime) continue;
      const reminderAt = event.reminderTime;
      const outcome = await Promise.allSettled(event.rsvps.map(({ userId }) => this.deliver(event.id, userId, reminderAt)));
      if (outcome.some((entry) => entry.status === 'rejected')) {
        this.logger.warn(`Some reminders for calendar event ${event.id} were not saved`);
      }
    }
  }

  private async deliver(eventId: string, userId: string, reminderAt: Date): Promise<void> {
    const result = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const event = await tx.calendarEvent.findFirst({
        where: {
          id: eventId,
          reminderTime: { equals: reminderAt, lte: now },
          startTime: { gt: now },
          isCancelled: false,
          rsvps: { some: { userId, status: 'YES' } },
          circle: { deletedAt: null, members: { some: { userId } } },
        },
        select: { circleId: true, startTime: true, circle: { select: { name: true } } },
      });
      if (!event) return null;

      const inserted = await tx.calendarReminderDelivery.createMany({
        data: [{ eventId, userId, reminderAt }],
        skipDuplicates: true,
      });
      if (!inserted.count) return null;

      const member = await tx.circleMember.findUnique({
        where: { circleId_userId: { circleId: event.circleId, userId } },
        select: { mutedUntil: true },
      });
      if (!member) return null;

      const metadata = { circleId: event.circleId, circleName: event.circle.name, eventStart: event.startTime.toISOString() };
      const text = getNotificationText(NotificationType.CALENDAR_REMINDER, metadata, 'vi')!;
      const notification = await tx.notification.create({
        data: this.notifications.buildNotificationData({
          ...text, userId, type: NotificationType.CALENDAR_REMINDER, targetType: 'calendar', targetId: eventId, metadata,
        }),
      });
      return { notification, sendPush: !member.mutedUntil || member.mutedUntil <= now };
    });
    if (result) await this.notifications.publishNotification(result.notification, result.sendPush);
  }
}
