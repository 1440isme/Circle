import { BadRequestException, Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, Logger } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { PushNotificationService } from './push-notification.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { NotificationType, UpdateCircleNotificationSettingsInput } from '@circle/types';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  content: string;
  type: NotificationType | string;
  targetType?: string;
  targetId?: string;
  deepLink?: string;
  metadata?: Record<string, any>;
  sendPush?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway?: ChatGateway,
  ) {}

  /**
   * Create an in-app notification, sync realtime socket and dispatch mobile push
   */
  async createNotification(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: this.buildNotificationData(input),
    });
    await this.publishNotification(notification, input.sendPush);
    return notification;
  }

  buildNotificationData(input: CreateNotificationInput): Prisma.NotificationUncheckedCreateInput {
    return {
      userId: input.userId,
      title: input.title,
      content: input.content,
      type: input.type,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      deepLink: input.deepLink ?? null,
      metadata: input.metadata as Prisma.InputJsonObject | undefined,
      isRead: false,
    };
  }

  async publishNotification(notification: Notification, sendPush = true): Promise<void> {
    try {
      const { id, userId, title, content, type, targetType, targetId, deepLink } = notification;
      const unreadCount = await this.prisma.notification.count({ where: { userId, isRead: false } });
      this.chatGateway?.sendNotificationToUser(userId, { notification, unreadCount });
      if (sendPush) {
        void this.pushService.sendToUser(userId, {
          title, body: content, type, targetType, targetId, deepLink,
          metadata: notification.metadata as Record<string, unknown> | null,
          notificationId: id,
          badge: unreadCount,
        });
      }
    } catch (error) {
      this.logger.warn(`Could not publish notification ${notification.id}; the inbox entry was saved`);
    }
  }

  async getCircleSettings(userId: string, circleId: string) {
    const member = await this.prisma.circleMember.findFirst({
      where: { circleId, userId, circle: { deletedAt: null } },
      select: { notificationLevel: true, mutedUntil: true },
    });
    if (!member) throw new NotFoundException('Circle membership not found');
    return member;
  }

  async updateCircleSettings(userId: string, circleId: string, input: UpdateCircleNotificationSettingsInput) {
    await this.getCircleSettings(userId, circleId);
    const durations = { '15m': 15, '1h': 60, '8h': 480, '24h': 1440 };
    const level = input?.notificationLevel;
    const mute = input?.mute;
    if (level === undefined && mute === undefined) throw new BadRequestException('Missing notification settings');
    if (level !== undefined && !['ALL', 'MENTIONS', 'NONE'].includes(level)) {
      throw new BadRequestException('Invalid notification level');
    }
    if (mute !== undefined && mute !== null && mute !== 'forever' && !Object.hasOwn(durations, mute)) {
      throw new BadRequestException('Invalid mute duration');
    }

    return this.prisma.circleMember.update({
      where: { circleId_userId: { circleId, userId } },
      data: {
        notificationLevel: level,
        mutedUntil: mute === undefined ? undefined : mute === null ? null :
          mute === 'forever' ? new Date('9999-12-31T00:00:00.000Z') :
          new Date(Date.now() + durations[mute] * 60_000),
      },
      select: { notificationLevel: true, mutedUntil: true },
    });
  }

  /**
   * Cursor-based paginated notification list with filters
   */
  async getNotifications(userId: string, query: QueryNotificationsDto) {
    const requestedLimit = Number(query.limit);
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;
    const where: any = { userId };

    if (query.type) {
      where.type = query.type;
    }
    const isUnreadOnly = query.unreadOnly === true || String(query.unreadOnly) === 'true';
    if (isUnreadOnly) {
      where.isRead = false;
    }

    const findArgs: any = {
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    };

    if (query.cursor) {
      findArgs.cursor = { id: query.cursor };
      findArgs.skip = 1;
    }

    const items = await this.prisma.notification.findMany(findArgs);
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const lastItem = data[data.length - 1];
    const nextCursor = hasMore && lastItem ? lastItem.id : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get accurate unread count from server
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(userId: string, id: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    if (notif.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    if (!notif.isRead) {
      const updated = await this.prisma.notification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });

      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });

      if (this.chatGateway) {
        this.chatGateway.sendUnreadCountToUser(userId, unreadCount);
      }

      return updated;
    }

    return notif;
  }

  /**
   * Mark all notifications of user as read
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    if (this.chatGateway) {
      this.chatGateway.sendUnreadCountToUser(userId, 0);
    }

    return { updatedCount: result.count };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, id: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    if (notif.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    if (!notif.isRead) {
      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });
      if (this.chatGateway) {
        this.chatGateway.sendUnreadCountToUser(userId, unreadCount);
      }
    }

    return { success: true };
  }

  /**
   * Register or refresh device push token (upsert per deviceId)
   */
  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    // Invalidate any other user's active token on this same physical device (NOT-09)
    await this.prisma.deviceToken.updateMany({
      where: {
        deviceId: dto.deviceId,
        userId: { not: userId },
        status: 'ACTIVE',
      },
      data: {
        status: 'INVALID',
      },
    });

    const device = await this.prisma.deviceToken.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId: dto.deviceId,
        },
      },
      update: {
        token: dto.token,
        platform: dto.platform,
        status: 'ACTIVE',
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        deviceId: dto.deviceId,
        token: dto.token,
        platform: dto.platform,
        status: 'ACTIVE',
        lastSeenAt: new Date(),
      },
    });

    return device;
  }

  /**
   * Revoke device token upon logout
   */
  async revokeDeviceToken(userId: string, deviceId: string) {
    await this.prisma.deviceToken.updateMany({
      where: {
        userId,
        deviceId,
      },
      data: {
        status: 'INVALID',
      },
    });

    return { success: true };
  }
}
