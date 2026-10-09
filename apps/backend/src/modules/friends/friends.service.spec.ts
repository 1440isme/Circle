import { Test, TestingModule } from '@nestjs/testing';
import { FriendsService } from './friends.service';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';

describe('FriendsService', () => {
  let service: FriendsService;

  const mockPrisma = {
    friendship: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  const mockChatGateway = {
    emitToUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  describe('getFriends', () => {
    it('should return list of accepted friends with formatted details', async () => {
      const userId = 'user-1';
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          id: 'f-1',
          senderId: 'user-1',
          receiverId: 'user-2',
          status: FriendshipStatus.ACCEPTED,
          updatedAt: new Date('2026-09-01T00:00:00.000Z'),
          sender: { id: 'user-1', email: 'me@circle.com', profile: { displayName: 'Me' } },
          receiver: { id: 'user-2', email: 'friend@circle.com', profile: { displayName: 'Friend', avatarUrl: 'avatar.jpg', bio: 'Hello' } },
        },
        {
          id: 'f-2',
          senderId: 'user-3',
          receiverId: 'user-1',
          status: FriendshipStatus.ACCEPTED,
          updatedAt: new Date('2026-09-02T00:00:00.000Z'),
          sender: { id: 'user-3', email: 'another@circle.com', profile: { displayName: 'Another' } },
          receiver: { id: 'user-1', email: 'me@circle.com', profile: { displayName: 'Me' } },
        },
      ]);

      const result = await service.getFriends(userId);

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('user-2');
      expect(result[0]!.displayName).toBe('Friend');
      expect(result[0]!.friendshipId).toBe('f-1');
      expect(result[1]!.id).toBe('user-3');
      expect(result[1]!.displayName).toBe('Another');
      expect(result[1]!.friendshipId).toBe('f-2');
    });
  });

  describe('getReceivedRequests', () => {
    it('should return received pending requests', async () => {
      const userId = 'user-1';
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          id: 'req-1',
          senderId: 'user-sender',
          receiverId: 'user-1',
          createdAt: new Date('2026-09-03T00:00:00.000Z'),
          sender: {
            id: 'user-sender',
            email: 'sender@circle.com',
            profile: { displayName: 'Sender User', avatarUrl: 'pic.png', bio: 'Bio' },
          },
        },
      ]);

      const result = await service.getReceivedRequests(userId);

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('req-1');
      expect(result[0]!.userId).toBe('user-sender');
      expect(result[0]!.displayName).toBe('Sender User');
    });
  });

  describe('getSentRequests', () => {
    it('should return sent pending requests', async () => {
      const userId = 'user-1';
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          id: 'req-2',
          senderId: 'user-1',
          receiverId: 'user-receiver',
          createdAt: new Date('2026-09-04T00:00:00.000Z'),
          receiver: {
            id: 'user-receiver',
            email: 'receiver@circle.com',
            profile: { displayName: 'Receiver User', avatarUrl: null, bio: null },
          },
        },
      ]);

      const result = await service.getSentRequests(userId);

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('req-2');
      expect(result[0]!.userId).toBe('user-receiver');
    });
  });

  describe('searchUsers', () => {
    it('should return empty array if query is empty or blank', async () => {
      const result = await service.searchUsers('user-1', '   ');
      expect(result).toEqual([]);
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should return matching users with relationship statuses', async () => {
      const userId = 'user-1';
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'u-friend',
          email: 'friend@circle.com',
          profile: { displayName: 'Best Friend', avatarUrl: null, bio: null },
        },
        {
          id: 'u-pending-sent',
          email: 'sent@circle.com',
          profile: { displayName: 'Sent Guy', avatarUrl: null, bio: null },
        },
        {
          id: 'u-stranger',
          email: 'stranger@circle.com',
          profile: { displayName: 'Stranger', avatarUrl: null, bio: null },
        },
      ]);

      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          id: 'f-friend',
          senderId: 'u-friend',
          receiverId: 'user-1',
          status: FriendshipStatus.ACCEPTED,
        },
        {
          id: 'f-pending',
          senderId: 'user-1',
          receiverId: 'u-pending-sent',
          status: FriendshipStatus.PENDING,
        },
      ]);

      const result = await service.searchUsers(userId, 'circle');

      expect(result).toHaveLength(3);
      expect(result[0]!.relationship).toBe('FRIEND');
      expect(result[0]!.friendshipId).toBe('f-friend');
      expect(result[1]!.relationship).toBe('PENDING_SENT');
      expect(result[1]!.friendshipId).toBe('f-pending');
      expect(result[2]!.relationship).toBe('NONE');
      expect(result[2]!.friendshipId).toBeNull();
    });
  });

  describe('sendFriendRequest', () => {
    it('should reject self-friending', async () => {
      await expect(service.sendFriendRequest('user-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if target user does not exist', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.sendFriendRequest('user-1', 'target-999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if already friends', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-2', email: 'u2@c.com' });
      mockPrisma.friendship.findFirst.mockResolvedValue({
        id: 'f-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.ACCEPTED,
      });

      await expect(service.sendFriendRequest('user-1', 'user-2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if request was already sent by user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-2', email: 'u2@c.com' });
      mockPrisma.friendship.findFirst.mockResolvedValue({
        id: 'f-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.PENDING,
      });

      await expect(service.sendFriendRequest('user-1', 'user-2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should auto-accept if target user had already sent a pending request', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-2', email: 'u2@c.com' });
      mockPrisma.friendship.findFirst.mockResolvedValue({
        id: 'f-1',
        senderId: 'user-2',
        receiverId: 'user-1',
        status: FriendshipStatus.PENDING,
      });
      mockPrisma.friendship.update.mockResolvedValue({
        id: 'f-1',
        senderId: 'user-2',
        receiverId: 'user-1',
        status: FriendshipStatus.ACCEPTED,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'me@c.com',
        profile: { displayName: 'Me' },
      });

      const result = await service.sendFriendRequest('user-1', 'user-2');

      expect(mockPrisma.friendship.update).toHaveBeenCalledWith({
        where: { id: 'f-1' },
        data: { status: FriendshipStatus.ACCEPTED },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockChatGateway.emitToUser).toHaveBeenCalledWith(
        'user-2',
        'friend:request_accepted',
        expect.any(Object),
      );
      expect(result.friendship.status).toBe(FriendshipStatus.ACCEPTED);
    });

    it('should create new pending request and dispatch notification & socket', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-2', email: 'u2@c.com' });
      mockPrisma.friendship.findFirst.mockResolvedValue(null);
      mockPrisma.friendship.create.mockResolvedValue({
        id: 'new-f-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.PENDING,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'me@c.com',
        profile: { displayName: 'Me' },
      });

      const result = await service.sendFriendRequest('user-1', 'user-2');

      expect(mockPrisma.friendship.create).toHaveBeenCalledWith({
        data: {
          senderId: 'user-1',
          receiverId: 'user-2',
          status: FriendshipStatus.PENDING,
        },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-2',
            type: 'FRIEND_REQUEST',
          }),
        }),
      );
      expect(mockChatGateway.emitToUser).toHaveBeenCalledWith(
        'user-2',
        'friend:request_received',
        expect.objectContaining({
          friendshipId: 'new-f-1',
        }),
      );
      expect(result.friendship.id).toBe('new-f-1');
    });
  });

  describe('acceptFriendRequest', () => {
    it('should throw NotFoundException if request not found or not receiver', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValue({
        id: 'f-1',
        senderId: 'user-1',
        receiverId: 'user-3', // Not user-2
        status: FriendshipStatus.PENDING,
      });

      await expect(service.acceptFriendRequest('user-2', 'f-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update status to ACCEPTED and notify sender', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValue({
        id: 'f-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.PENDING,
      });
      mockPrisma.friendship.update.mockResolvedValue({
        id: 'f-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.ACCEPTED,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'receiver@c.com',
        profile: { displayName: 'Receiver' },
      });

      const result = await service.acceptFriendRequest('user-2', 'f-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.friendship.update).toHaveBeenCalledWith({
        where: { id: 'f-1' },
        data: { status: FriendshipStatus.ACCEPTED },
      });
      expect(mockChatGateway.emitToUser).toHaveBeenCalledWith(
        'user-1',
        'friend:request_accepted',
        expect.any(Object),
      );
    });
  });

  describe('rejectFriendRequest', () => {
    it('should throw NotFoundException if request not found or not receiver', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValue(null);

      await expect(service.rejectFriendRequest('user-2', 'f-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete pending friendship', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValue({
        id: 'f-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.PENDING,
      });

      const result = await service.rejectFriendRequest('user-2', 'f-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.friendship.delete).toHaveBeenCalledWith({
        where: { id: 'f-1' },
      });
    });
  });

  describe('cancelFriendRequest', () => {
    it('should throw NotFoundException if not sender', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValue({
        id: 'f-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.PENDING,
      });

      await expect(service.cancelFriendRequest('user-2', 'f-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete pending friendship when cancelled by sender', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValue({
        id: 'f-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.PENDING,
      });

      const result = await service.cancelFriendRequest('user-1', 'f-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.friendship.delete).toHaveBeenCalledWith({
        where: { id: 'f-1' },
      });
    });
  });

  describe('unfriend', () => {
    it('should throw NotFoundException if friendship does not exist or not accepted', async () => {
      mockPrisma.friendship.findFirst.mockResolvedValue(null);

      await expect(service.unfriend('user-1', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete friendship and emit socket event to other user', async () => {
      mockPrisma.friendship.findFirst.mockResolvedValue({
        id: 'f-123',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.ACCEPTED,
      });

      const result = await service.unfriend('user-1', 'user-2');

      expect(result.success).toBe(true);
      expect(mockPrisma.friendship.delete).toHaveBeenCalledWith({
        where: { id: 'f-123' },
      });
      expect(mockChatGateway.emitToUser).toHaveBeenCalledWith('user-2', 'friend:removed', {
        friendId: 'user-1',
      });
    });
  });
});
