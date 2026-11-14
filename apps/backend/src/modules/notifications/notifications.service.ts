import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { PushNotificationService } from './push-notification.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { NotificationType } from '@circle/types';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  content: string;
  type: NotificationType | string;
  targetType?: string;
  targetId?: string;
  deepLink?: string;
  metadata?: Record<string, any>;
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
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: input.userId,
          title: input.title,
          content: input.content,
          type: input.type,
          targetType: input.targetType || null,
          targetId: input.targetId || null,
          deepLink: input.deepLink || null,
          metadata: input.metadata ? (input.metadata as any) : undefined,
          isRead: false,
        },
      });

      const unreadCount = await this.prisma.notification.count({
        where: { userId: input.userId, isRead: false },
      });

      // 1. Realtime In-App Socket sync
      if (this.chatGateway) {
        this.chatGateway.sendNotificationToUser(input.userId, {
          notification,
          unreadCount,
        });
      }

      // 2. Mobile Push Notification dispatch
      await this.pushService.sendToUser(input.userId, {
        title: input.title,
        body: input.content,
        type: input.type,
        targetType: input.targetType,
        targetId: input.targetId,
        deepLink: input.deepLink,
        metadata: input.metadata,
        badge: unreadCount,
      });

      return notification;
    } catch (err: any) {
      this.logger.error(`Failed to create notification for user ${input.userId}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Cursor-based paginated notification list with filters
   */
  async getNotifications(userId: string, query: QueryNotificationsDto) {
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
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
      orderBy: { createdAt: 'desc' },
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
