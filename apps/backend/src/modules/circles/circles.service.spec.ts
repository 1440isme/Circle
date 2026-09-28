import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CirclesService } from './circles.service';
import { PrismaService } from '../../database/prisma.service';
import { MemberRole, ChannelType, FriendshipStatus } from '@prisma/client';

describe('CirclesService — Unit Tests (US-CIRCLE-001)', () => {
  let service: CirclesService;

  const mockPrisma = {
    circle: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    circleMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    channel: {
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    friendship: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CirclesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CirclesService>(CirclesService);
    jest.clearAllMocks();
  });

  describe('create (US-CIRCLE-001 / TC-CIRCLE-001 & TC-CIRCLE-002)', () => {
    const userId = 'user-cuid-1';
    const createInput = {
      name: 'Nhóm Bạn Thân',
      handle: 'nhom-ban-than',
      description: 'Nhóm tụ tập cuối tuần',
      isPrivate: false,
    };

    it('TC-CIRCLE-001: should create Circle, assign creator as OWNER, and create default #general channel', async () => {
      // Handle is available
      mockPrisma.circle.findUnique.mockResolvedValueOnce(null); // handle check
      mockPrisma.circle.findUnique.mockResolvedValueOnce(null); // inviteCode check

      const createdCircle = {
        id: 'circle-1',
        name: createInput.name,
        handle: createInput.handle,
        description: createInput.description,
        avatarUrl: null,
        coverUrl: null,
        isPrivate: false,
        inviteCode: 'ABCDEF12',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const defaultChannel = {
        id: 'channel-1',
        circleId: 'circle-1',
        name: 'general',
        type: ChannelType.TEXT,
        topic: 'Kênh thảo luận chung',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          circle: {
            create: jest.fn().mockResolvedValue(createdCircle),
          },
          circleMember: {
            create: jest.fn().mockResolvedValue({
              id: 'member-1',
              circleId: 'circle-1',
              userId,
              role: MemberRole.OWNER,
            }),
          },
          channel: {
            create: jest.fn().mockResolvedValue(defaultChannel),
          },
        });
      });

      const result = await service.create(userId, createInput);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data.handle).toBe('nhom-ban-than');
      expect(result.data.role).toBe(MemberRole.OWNER);
      expect(result.data.memberCount).toBe(1);
      expect(result.data.channels).toHaveLength(1);
      expect(result.data.channels[0]!.name).toBe('general');
    });

    it('should create Circle with only name, automatically generating unique handle', async () => {
      // Candidate handle check returns null (available)
      mockPrisma.circle.findUnique.mockResolvedValueOnce(null); // auto-handle check
      mockPrisma.circle.findUnique.mockResolvedValueOnce(null); // inviteCode check

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          circle: {
            create: jest.fn().mockImplementation((args) => Promise.resolve({
              id: 'circle-auto',
              ...args.data,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
            })),
          },
          circleMember: {
            create: jest.fn().mockResolvedValue({
              id: 'member-owner',
              circleId: 'circle-auto',
              userId,
              role: MemberRole.OWNER,
            }),
          },
          channel: {
            create: jest.fn().mockResolvedValue({
              id: 'channel-1',
              circleId: 'circle-auto',
              name: 'general',
              type: ChannelType.TEXT,
            }),
          },
        });
      });

      const result = await service.create(userId, { name: 'Hội K23 ĐH SPKT' });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data.name).toBe('Hội K23 ĐH SPKT');
      expect(result.data.handle).toMatch(/^hoi-k23-dh-spkt-[a-z0-9]+$/);
    });

    it('should create Circle with memberIds, automatically generating name and adding friends', async () => {
      const friendId1 = 'friend-cuid-1';
      const friendId2 = 'friend-cuid-2';

      mockPrisma.user.findMany.mockResolvedValueOnce([
        { id: userId, email: 'owner@test.com', profile: { displayName: 'Trương Công Bình' } },
        { id: friendId1, email: 'hanh@test.com', profile: { displayName: 'Ninh Thị Mỹ Hạnh' } },
        { id: friendId2, email: 'an@test.com', profile: { displayName: 'Nguyễn Văn An' } },
      ]);

      mockPrisma.circle.findUnique.mockResolvedValueOnce(null); // candidate handle
      mockPrisma.circle.findUnique.mockResolvedValueOnce(null); // inviteCode

      const mockCircleMemberCreate = jest.fn();

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          circle: {
            create: jest.fn().mockImplementation((args) => Promise.resolve({
              id: 'circle-friends',
              ...args.data,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
            })),
          },
          circleMember: {
            create: mockCircleMemberCreate,
          },
          channel: {
            create: jest.fn().mockResolvedValue({
              id: 'channel-1',
              name: 'general',
              type: ChannelType.TEXT,
            }),
          },
        });
      });

      const result = await service.create(userId, { memberIds: [friendId1, friendId2] });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data.name).toContain('Trương Công Bình');
      expect(result.data.name).toContain('Ninh Thị Mỹ Hạnh');
      expect(result.data.memberCount).toBe(3); // Owner + 2 friends
      expect(mockCircleMemberCreate).toHaveBeenCalledTimes(3);
    });

    it('TC-CIRCLE-002: should throw ConflictException (409) if handle is already taken', async () => {
      mockPrisma.circle.findUnique.mockResolvedValueOnce({ id: 'existing-circle-id' });

      await expect(service.create(userId, createInput)).rejects.toThrow(ConflictException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getSelectableFriends', () => {
    const userId = 'user-cuid-1';

    it('should return accepted friends when available', async () => {
      mockPrisma.friendship.findMany.mockResolvedValueOnce([
        {
          id: 'f-1',
          senderId: userId,
          receiverId: 'friend-1',
          status: FriendshipStatus.ACCEPTED,
          sender: { id: userId, email: 'user@test.com', profile: null },
          receiver: { id: 'friend-1', email: 'friend1@test.com', profile: { displayName: 'Bạn Thân 1', avatarUrl: null } },
        },
      ]);

      const result = await service.getSelectableFriends(userId);

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('friend-1');
      expect(result[0]!.displayName).toBe('Bạn Thân 1');
    });

    it('should fallback to platform users when no accepted friends exist', async () => {
      mockPrisma.friendship.findMany.mockResolvedValueOnce([]);
      mockPrisma.user.findMany.mockResolvedValueOnce([
        { id: 'user-2', email: 'user2@test.com', profile: { displayName: 'User Hai', avatarUrl: null } },
      ]);

      const result = await service.getSelectableFriends(userId);

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('user-2');
      expect(result[0]!.displayName).toBe('User Hai');
    });
  });

  describe('findUserCircles (TC-CIRCLE-003)', () => {
    it('should retrieve all Circles where user is a member', async () => {
      const userId = 'user-cuid-1';
      const mockCircles = [
        {
          id: 'circle-1',
          name: 'Tech Enthusiasts',
          handle: 'tech-enthusiasts',
          avatarUrl: null,
          coverUrl: null,
          description: 'Tech talk',
          inviteCode: 'TECH1234',
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [{ role: MemberRole.OWNER, nickname: 'Leader', joinedAt: new Date() }],
          channels: [{ id: 'ch-1', name: 'general', type: ChannelType.TEXT, topic: null }],
          _count: { members: 5 },
        },
      ];

      mockPrisma.circle.findMany.mockResolvedValue(mockCircles);

      const result = await service.findUserCircles(userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.role).toBe(MemberRole.OWNER);
      expect(result.data[0]!.memberCount).toBe(5);
    });
  });

  describe('findByIdOrHandle (TC-CIRCLE-004)', () => {
    const userId = 'user-cuid-1';

    it('should return Circle details when found and user is a member', async () => {
      const mockCircle = {
        id: 'circle-1',
        name: 'Open Group',
        handle: 'open-group',
        avatarUrl: null,
        coverUrl: null,
        description: null,
        inviteCode: 'OPEN1234',
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            id: 'm-1',
            userId,
            role: MemberRole.MEMBER,
            nickname: null,
            joinedAt: new Date(),
            user: { id: userId, email: 'test@example.com', profile: null },
          },
        ],
        channels: [{ id: 'ch-1', name: 'general', type: ChannelType.TEXT }],
        _count: { members: 1 },
      };

      mockPrisma.circle.findFirst.mockResolvedValue(mockCircle);

      const result = await service.findByIdOrHandle('open-group', userId);

      expect(result.success).toBe(true);
      expect(result.data.handle).toBe('open-group');
      expect(result.data.role).toBe(MemberRole.MEMBER);
    });

    it('should throw NotFoundException if circle does not exist', async () => {
      mockPrisma.circle.findFirst.mockResolvedValue(null);

      await expect(service.findByIdOrHandle('non-existent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if circle is private and user is not a member', async () => {
      const mockPrivateCircle = {
        id: 'circle-private',
        name: 'Private Club',
        handle: 'private-club',
        isPrivate: true,
        members: [
          {
            id: 'm-2',
            userId: 'other-user',
            role: MemberRole.OWNER,
            user: { id: 'other-user', email: 'other@example.com', profile: null },
          },
        ],
        channels: [],
        _count: { members: 1 },
      };

      mockPrisma.circle.findFirst.mockResolvedValue(mockPrivateCircle);

      await expect(service.findByIdOrHandle('private-club', userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    const circleId = 'circle-1';
    const userId = 'user-1';

    it('should allow OWNER to update Circle metadata', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue({
        id: 'm-1',
        role: MemberRole.OWNER,
      });

      mockPrisma.circle.update.mockResolvedValue({
        id: circleId,
        name: 'Updated Name',
      });

      const result = await service.update(circleId, userId, { name: 'Updated Name' });
      expect(result.success).toBe(true);
      expect(mockPrisma.circle.update).toHaveBeenCalled();
    });

    it('should forbid regular MEMBER from updating Circle metadata', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue({
        id: 'm-1',
        role: MemberRole.MEMBER,
      });

      await expect(
        service.update(circleId, userId, { name: 'Hacked Name' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
