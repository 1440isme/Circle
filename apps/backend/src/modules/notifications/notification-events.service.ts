import { Injectable, Logger } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { NotificationType } from '@circle/types';
import { getNotificationText } from '@circle/shared';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';

interface CircleNotification {
  circleId: string;
  actorId: string;
  type: NotificationType;
  targetId: string;
  channelId?: string;
  eventStart?: string;
  message?: string;
  userIds?: readonly string[];
  ownerOnly?: boolean;
  membershipAt?: Date;
}

function normalizeMentionName(name?: string | null) {
  return name?.trim().normalize('NFC').toLowerCase() ?? '';
}

function extractMentions(message: string, candidates: string[]) {
  const names = [...new Set(candidates.filter(Boolean))].sort((a, b) => b.length - a.length);
  const alternatives = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}_@])@(${alternatives})(?![\\p{L}\\p{N}_])`, 'gu');
  return new Set([...message.normalize('NFC').toLowerCase().matchAll(pattern)].map((match) => match[1]));
}

@Injectable()
export class NotificationEventsService {
  private readonly logger = new Logger(NotificationEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async notifyMoment(actorId: string, momentId: string, circleIds: readonly string[]): Promise<void> {
    const notified = new Set<string>();
    for (const circleId of new Set(circleIds)) {
      await this.notifyCircle({ circleId, actorId, targetId: momentId, type: NotificationType.MOMENT_NEW }, notified);
    }
  }

  async notifyCircle(event: CircleNotification, notified?: Set<string>): Promise<void> {
    try {
      const circle = await this.prisma.circle.findFirst({
        where: { id: event.circleId, deletedAt: null },
        select: {
          name: true,
          members: {
            where: {
              userId: { not: event.actorId, ...(event.userIds && { in: [...new Set(event.userIds)] }) },
              ...(event.ownerOnly && { role: MemberRole.OWNER }),
              ...(event.membershipAt && { joinedAt: { lte: event.membershipAt } }),
            },
            select: {
              userId: true,
              nickname: true,
              notificationLevel: true,
              mutedUntil: true,
              user: { select: { email: true, profile: { select: { displayName: true, handle: true } } } },
            },
          },
        },
      });
      if (!circle) return;

      const isChat = event.type === NotificationType.CHAT_MESSAGE;
      const now = new Date();
      const everybody = ['all', 'mọi người'];
      const recipients = circle.members.map((member) => ({
        member,
        names: [member.nickname, member.user.profile?.displayName, member.user.profile?.handle, member.user.email.split('@')[0]]
          .map(normalizeMentionName),
      }));
      const mentions = isChat && event.message?.includes('@')
        ? extractMentions(event.message, [...everybody, ...recipients.flatMap(({ names }) => names)])
        : new Set<string>();
      const mentionsEveryone = everybody.some((name) => mentions.has(name));
      const results = await Promise.allSettled(recipients.map(({ member, names }) => {
        if (notified?.has(member.userId) || (isChat && member.notificationLevel === 'NONE')) return;
        const mention = mentionsEveryone || names.some((name) => mentions.has(name));
        if (isChat && member.notificationLevel === 'MENTIONS' && !mention) return;
        const metadata = {
          circleId: event.circleId,
          circleName: circle.name,
          ...(event.channelId && { channelId: event.channelId }),
          ...(event.eventStart && { eventStart: event.eventStart }),
          mention,
        };
        const { title, content } = getNotificationText(event.type, metadata, 'vi')!;
        notified?.add(member.userId);
        return this.notifications.createNotification({
          userId: member.userId,
          type: event.type,
          title,
          content,
          targetType: isChat ? 'message' : event.type.startsWith('POLL_') ? 'poll' :
            event.type.startsWith('CALENDAR_') ? 'calendar' : event.type === NotificationType.MOMENT_NEW ? 'moment' :
            event.type === NotificationType.CALL_MISSED ? 'call' : 'circle',
          targetId: event.targetId,
          metadata,
          sendPush: !member.mutedUntil || member.mutedUntil <= now,
        });
      }));
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed) this.logger.warn(`${event.type} ${event.targetId}: ${failed} in-app notifications failed`);
    } catch (error) {
      this.logger.error(`Could not dispatch ${event.type} ${event.targetId}`, error instanceof Error ? error.stack : undefined);
    }
  }
}
