import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { PushNotificationService } from './push-notification.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationType } from '@circle/types';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let pushService: any;
  let chatGateway: any;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    deviceToken: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockPushService = {
    sendToUser: jest.fn().mockResolvedValue(undefined),
  };

  const mockChatGateway = {
    sendNotificationToUser: jest.fn(),
    sendUnreadCountToUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PushNotificationService, useValue: mockPushService },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);
    pushService = module.get(PushNotificationService);
    chatGateway = module.get(ChatGateway);
  });

  describe('createNotification', () => {
    it('should create notification, sync via socket and dispatch push', async () => {
      const mockCreated = {
        id: 'notif-1',
        userId: 'user-1',
        title: 'Lời mời mới',
        content: 'Bạn được mời vào Circle Alpha',
        type: NotificationType.CIRCLE_INVITE,
        isRead: false,
        createdAt: new Date(),
      };

      prisma.notification.create.mockResolvedValue(mockCreated);
      prisma.notification.count.mockResolvedValue(1);

      const result = await service.createNotification({
        userId: 'user-1',
        title: 'Lời mời mới',
        content: 'Bạn được mời vào Circle Alpha',
        type: NotificationType.CIRCLE_INVITE,
        targetType: 'circle',
        targetId: 'circle-1',
        deepLink: '/circle/circle-1',
      });

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(chatGateway.sendNotificationToUser).toHaveBeenCalledWith('user-1', {
        notification: mockCreated,
        unreadCount: 1,
      });
      expect(pushService.sendToUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
        title: 'Lời mời mới',
        badge: 1,
      }));
      expect(result).toEqual(mockCreated);
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockItems = [
        { id: 'notif-1', title: 'Notif 1', isRead: false },
        { id: 'notif-2', title: 'Notif 2', isRead: true },
      ];
      prisma.notification.findMany.mockResolvedValue(mockItems);

      const result = await service.getNotifications('user-1', { limit: 10 });
      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      prisma.notification.count.mockResolvedValue(3);
      const result = await service.getUnreadCount('user-1');
      expect(result).toEqual({ unreadCount: 3 });
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark unread notification as read and emit updated count', async () => {
      const mockNotif = { id: 'notif-1', userId: 'user-1', isRead: false };
      prisma.notification.findUnique.mockResolvedValue(mockNotif);
      prisma.notification.update.mockResolvedValue({ ...mockNotif, isRead: true });
      prisma.notification.count.mockResolvedValue(0);

      const result = await service.markAsRead('user-1', 'notif-1');
      expect(result.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: expect.objectContaining({ isRead: true }),
      });
      expect(chatGateway.sendUnreadCountToUser).toHaveBeenCalledWith('user-1', 0);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read and emit count 0', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });
      const result = await service.markAllAsRead('user-1');
      expect(result).toEqual({ updatedCount: 5 });
      expect(chatGateway.sendUnreadCountToUser).toHaveBeenCalledWith('user-1', 0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification and update count if it was unread', async () => {
      const mockNotif = { id: 'notif-1', userId: 'user-1', isRead: false };
      prisma.notification.findUnique.mockResolvedValue(mockNotif);
      prisma.notification.delete.mockResolvedValue(mockNotif);
      prisma.notification.count.mockResolvedValue(0);

      const result = await service.deleteNotification('user-1', 'notif-1');
      expect(result).toEqual({ success: true });
      expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'notif-1' } });
      expect(chatGateway.sendUnreadCountToUser).toHaveBeenCalledWith('user-1', 0);
    });
  });

  describe('registerDeviceToken', () => {
    it('should upsert device token', async () => {
      const mockDevice = {
        id: 'dev-1',
        userId: 'user-1',
        deviceId: 'phone-123',
        token: 'ExponentPushToken[xyz]',
        platform: 'ANDROID',
        status: 'ACTIVE',
      };
      prisma.deviceToken.upsert.mockResolvedValue(mockDevice);

      const result = await service.registerDeviceToken('user-1', {
        deviceId: 'phone-123',
        token: 'ExponentPushToken[xyz]',
        platform: 'ANDROID',
      });

      expect(prisma.deviceToken.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId_deviceId: { userId: 'user-1', deviceId: 'phone-123' } },
      }));
      expect(result).toEqual(mockDevice);
    });
  });

  describe('revokeDeviceToken', () => {
    it('should set device token to INVALID upon logout', async () => {
      prisma.deviceToken.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.revokeDeviceToken('user-1', 'phone-123');
      expect(result).toEqual({ success: true });
      expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', deviceId: 'phone-123' },
        data: { status: 'INVALID' },
      });
    });
  });
});
