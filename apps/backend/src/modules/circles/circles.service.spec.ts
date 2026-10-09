import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CirclesService } from './circles.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { MemberRole, ChannelType, FriendshipStatus } from '@prisma/client';

describe('CirclesService — Unit Tests (US-CIRCLE-001 & US-CIRCLE-002)', () => {
  let service: CirclesService;

  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

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
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },
    circleInvite: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    circleJoinRequest: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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
    circleReport: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
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
        {
          provide: RedisService,
          useValue: mockRedis,
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
        avatarUrl: null,
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
      expect(result[0]!.handle).toBeNull();
    });

    it('should fallback to platform users when no accepted friends exist', async () => {
      mockPrisma.friendship.findMany.mockResolvedValueOnce([]);
      mockPrisma.user.findMany.mockResolvedValueOnce([
        { id: 'user-2', email: 'user2@test.com', profile: { displayName: 'User Hai', handle: 'user_hai', avatarUrl: null } },
      ]);

      const result = await service.getSelectableFriends(userId);

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('user-2');
      expect(result[0]!.displayName).toBe('User Hai');
      expect(result[0]!.handle).toBe('user_hai');
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

  describe('joinByInviteCode', () => {
    const userId = 'user-join-1';
    const inviteCode = '8F4B92A1';

    it('should successfully join a Circle using a valid invite code', async () => {
      mockPrisma.circle.findUnique.mockResolvedValue({
        id: 'circle-join-123',
        name: 'Nhóm Leo Núi',
        handle: 'nhom-leo-nui',
        avatarUrl: null,
        inviteCode,
        isPrivate: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [], // User is not yet a member
        _count: { members: 3 },
      });

      mockPrisma.circleMember.create.mockResolvedValue({
        id: 'member-new-1',
        circleId: 'circle-join-123',
        userId,
        role: MemberRole.MEMBER,
      });

      const result = await service.joinByInviteCode(userId, { inviteCode });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('circle-join-123');
      expect(result.data.memberCount).toBe(4);
      expect(mockPrisma.circleMember.create).toHaveBeenCalledWith({
        data: {
          circleId: 'circle-join-123',
          userId,
          role: MemberRole.MEMBER,
        },
      });
    });

    it('should throw NotFoundException when invite code does not exist', async () => {
      mockPrisma.circle.findUnique.mockResolvedValue(null);

      await expect(
        service.joinByInviteCode(userId, { inviteCode: 'NONEXIST' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user is already a member', async () => {
      mockPrisma.circle.findUnique.mockResolvedValue({
        id: 'circle-join-123',
        inviteCode,
        deletedAt: null,
        members: [{ id: 'm-existing', userId }],
        _count: { members: 2 },
      });

      await expect(
        service.joinByInviteCode(userId, { inviteCode }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a pending join request when Circle is private', async () => {
      mockPrisma.circleInvite.findUnique.mockResolvedValue(null);
      mockPrisma.circle.findUnique.mockResolvedValue({
        id: 'circle-private-123',
        name: 'Nhóm Riêng Tư',
        handle: 'nhom-rieng-tu',
        inviteCode,
        isPrivate: true,
        deletedAt: null,
        members: [],
        _count: { members: 3 },
      });
      mockPrisma.circleJoinRequest.findUnique.mockResolvedValue(null);
      mockPrisma.circleJoinRequest.create.mockResolvedValue({
        id: 'req-1',
        circleId: 'circle-private-123',
        userId,
        status: 'PENDING',
      });

      const result = await service.joinByInviteCode(userId, { inviteCode });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(202);
      expect(result.data.isPending).toBe(true);
      expect(mockPrisma.circleJoinRequest.create).toHaveBeenCalled();
      expect(mockPrisma.circleMember.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if private circle join request is already pending', async () => {
      mockPrisma.circleInvite.findUnique.mockResolvedValue(null);
      mockPrisma.circle.findUnique.mockResolvedValue({
        id: 'circle-private-123',
        inviteCode,
        isPrivate: true,
        deletedAt: null,
        members: [],
        _count: { members: 3 },
      });
      mockPrisma.circleJoinRequest.findUnique.mockResolvedValue({
        id: 'req-pending-1',
        circleId: 'circle-private-123',
        userId,
        status: 'PENDING',
      });

      await expect(
        service.joinByInviteCode(userId, { inviteCode }),
      ).rejects.toThrow(ConflictException);
    });

    it('AC-CIRCLE-002-01: should join successfully with custom invite and increment useCount', async () => {
      mockPrisma.circleInvite.findUnique.mockResolvedValue({
        id: 'invite-cuid-1',
        circleId: 'circle-join-123',
        code: 'INVITE01',
        expiresAt: new Date(Date.now() + 100000),
        maxUses: 10,
        useCount: 2,
        circle: {
          id: 'circle-join-123',
          name: 'Nhóm Custom Invite',
          handle: 'custom-invite',
          deletedAt: null,
          members: [],
          _count: { members: 2 },
        },
      });

      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.joinByInviteCode(userId, { inviteCode: 'INVITE01' });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('circle-join-123');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('AC-CIRCLE-002-01: should reject expired custom invite code', async () => {
      mockPrisma.circleInvite.findUnique.mockResolvedValue({
        id: 'invite-expired-1',
        circleId: 'circle-join-123',
        code: 'EXPIRED1',
        expiresAt: new Date(Date.now() - 100000), // Expired!
        maxUses: 10,
        useCount: 2,
        circle: {
          id: 'circle-join-123',
          deletedAt: null,
          members: [],
        },
      });

      await expect(
        service.joinByInviteCode(userId, { inviteCode: 'EXPIRED1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('AC-CIRCLE-002-01: should reject custom invite that reached max uses', async () => {
      mockPrisma.circleInvite.findUnique.mockResolvedValue({
        id: 'invite-maxed-1',
        circleId: 'circle-join-123',
        code: 'MAXEDOUT',
        expiresAt: null,
        maxUses: 5,
        useCount: 5, // Reached limit!
        circle: {
          id: 'circle-join-123',
          deletedAt: null,
          members: [],
        },
      });

      await expect(
        service.joinByInviteCode(userId, { inviteCode: 'MAXEDOUT' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createCustomInviteCode (US-CIRCLE-002)', () => {
    const circleId = 'circle-1';
    const userId = 'user-owner';

    it('should allow OWNER or ADMIN to create custom invite code with expiry & max uses', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue({
        id: 'member-owner',
        circleId,
        userId,
        role: MemberRole.OWNER,
      });

      mockPrisma.circleInvite.findUnique.mockResolvedValue(null);
      mockPrisma.circle.findUnique.mockResolvedValue(null);
      mockPrisma.circleInvite.create.mockResolvedValue({
        id: 'new-invite-id',
        circleId,
        code: 'TESTCODE',
        createdById: 'member-owner',
        expiresAt: expect.any(Date),
        maxUses: 20,
        useCount: 0,
      });

      const result = await service.createCustomInviteCode(circleId, userId, {
        expiresInDays: 7,
        maxUses: 20,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(mockPrisma.circleInvite.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is regular MEMBER', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue({
        id: 'member-reg',
        circleId,
        userId,
        role: MemberRole.MEMBER,
      });

      await expect(
        service.createCustomInviteCode(circleId, userId, { maxUses: 10 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember & leaveCircle (US-CIRCLE-002)', () => {
    const circleId = 'circle-1';
    const ownerId = 'user-owner';
    const memberId = 'member-regular';

    it('should allow OWNER to kick member', async () => {
      mockPrisma.circleMember.findUnique.mockImplementation(({ where }) => {
        if (where.circleId_userId) {
          return Promise.resolve({ id: 'member-owner', role: MemberRole.OWNER, userId: ownerId });
        }
        if (where.id === memberId) {
          return Promise.resolve({ id: memberId, circleId, role: MemberRole.MEMBER });
        }
        return Promise.resolve(null);
      });
      mockPrisma.circleMember.delete.mockResolvedValue({ id: memberId });

      const result = await service.removeMember(circleId, ownerId, memberId);
      expect(result.success).toBe(true);
      expect(mockPrisma.circleMember.delete).toHaveBeenCalledWith({ where: { id: memberId } });
    });

    it('should throw ForbiddenException if regular MEMBER tries to kick another member', async () => {
      mockPrisma.circleMember.findUnique.mockImplementation(({ where }) => {
        if (where.circleId_userId) {
          return Promise.resolve({ id: 'member-regular-1', role: MemberRole.MEMBER, userId: 'user-regular' });
        }
        if (where.id === memberId) {
          return Promise.resolve({ id: memberId, circleId, role: MemberRole.MEMBER });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.removeMember(circleId, 'user-regular', memberId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if caller tries to kick OWNER', async () => {
      mockPrisma.circleMember.findUnique.mockImplementation(({ where }) => {
        if (where.circleId_userId) {
          return Promise.resolve({ id: 'member-owner', role: MemberRole.OWNER, userId: ownerId });
        }
        if (where.id === 'member-owner-2') {
          return Promise.resolve({ id: 'member-owner-2', circleId, role: MemberRole.OWNER });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.removeMember(circleId, ownerId, 'member-owner-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('leaveCircle: should forbid OWNER from leaving if other members exist', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue({
        id: 'member-owner',
        circleId,
        userId: ownerId,
        role: MemberRole.OWNER,
      });
      mockPrisma.circleMember.count.mockResolvedValue(3);

      await expect(
        service.leaveCircle(circleId, ownerId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('leaveCircle: should allow regular MEMBER to leave', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue({
        id: 'member-regular',
        circleId,
        userId: 'user-regular',
        role: MemberRole.MEMBER,
      });
      mockPrisma.circleMember.delete.mockResolvedValue({ id: 'member-regular' });

      const result = await service.leaveCircle(circleId, 'user-regular');
      expect(result.success).toBe(true);
      expect(mockPrisma.circleMember.delete).toHaveBeenCalledWith({ where: { id: 'member-regular' } });
    });
  });

  describe('transferOwnership (US-CIRCLE-002)', () => {
    const circleId = 'circle-1';
    const ownerId = 'user-owner';
    const targetMemberId = 'member-target';

    it('should transfer OWNER role to target member and demote previous owner to MEMBER', async () => {
      mockPrisma.circleMember.findUnique.mockImplementation(({ where }) => {
        if (where.circleId_userId) {
          return Promise.resolve({ id: 'member-owner', role: MemberRole.OWNER, userId: ownerId });
        }
        if (where.id === targetMemberId) {
          return Promise.resolve({ id: targetMemberId, circleId, role: MemberRole.MEMBER });
        }
        return Promise.resolve(null);
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.transferOwnership(circleId, ownerId, targetMemberId);
      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('joinRequests (US-CIRCLE-002)', () => {
    const circleId = 'circle-private';
    const userId = 'user-requester';
    const ownerId = 'user-owner';

    it('should submit join request for private circle', async () => {
      mockPrisma.circle.findUnique.mockResolvedValue({
        id: circleId,
        isPrivate: true,
        deletedAt: null,
        members: [],
      });
      mockPrisma.circleJoinRequest.findUnique.mockResolvedValue(null);
      mockPrisma.circleJoinRequest.create.mockResolvedValue({
        id: 'req-1',
        circleId,
        userId,
        status: 'PENDING',
      });

      const result = await service.requestToJoin(circleId, userId, { message: 'Xin tham gia nhóm ạ' });
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(mockPrisma.circleJoinRequest.create).toHaveBeenCalled();
    });

    it('should allow OWNER to review and approve join request', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue({
        id: 'm-owner',
        circleId,
        userId: ownerId,
        role: MemberRole.OWNER,
      });
      mockPrisma.circleJoinRequest.findFirst.mockResolvedValue({
        id: 'req-1',
        circleId,
        userId: 'user-requester',
        status: 'PENDING',
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.reviewJoinRequest(circleId, ownerId, 'req-1', { status: 'APPROVED' });
      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should allow OWNER to reject join request', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue({
        id: 'm-owner',
        circleId,
        userId: ownerId,
        role: MemberRole.OWNER,
      });
      mockPrisma.circleJoinRequest.findFirst.mockResolvedValue({
        id: 'req-1',
        circleId,
        userId: 'user-requester',
        status: 'PENDING',
      });
      mockPrisma.circleJoinRequest.update.mockResolvedValue({
        id: 'req-1',
        status: 'REJECTED',
      });

      const result = await service.reviewJoinRequest(circleId, ownerId, 'req-1', { status: 'REJECTED' });
      expect(result.success).toBe(true);
      expect(mockPrisma.circleJoinRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { status: 'REJECTED' },
      });
    });

    it('should throw ForbiddenException if regular MEMBER tries to review join request', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue({
        id: 'm-regular',
        circleId,
        userId: 'user-regular',
        role: MemberRole.MEMBER,
      });

      await expect(
        service.reviewJoinRequest(circleId, 'user-regular', 'req-1', { status: 'APPROVED' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMemberNickname', () => {
    const circleId = 'circle-nick-1';
    const callerId = 'user-caller-1';
    const targetMemberId = 'm-target-1';

    it('should update member nickname successfully', async () => {
      mockPrisma.circleMember.findUnique
        .mockResolvedValueOnce({ id: 'm-caller', circleId, userId: callerId, role: MemberRole.MEMBER })
        .mockResolvedValueOnce({ id: targetMemberId, circleId, userId: 'user-target' });

      mockPrisma.circleMember.update.mockResolvedValue({
        id: targetMemberId,
        userId: 'user-target',
        role: MemberRole.MEMBER,
        nickname: 'Superstar',
        joinedAt: new Date(),
        user: { id: 'user-target', email: 'target@test.com', profile: { displayName: 'Real Name' } },
      });

      const result = await service.updateMemberNickname(circleId, callerId, targetMemberId, 'Superstar');
      expect(result.success).toBe(true);
      expect(result.data.nickname).toBe('Superstar');
      expect(mockPrisma.circleMember.update).toHaveBeenCalledWith({
        where: { id: targetMemberId },
        data: { nickname: 'Superstar' },
        include: { user: { select: { id: true, email: true, profile: true } } },
      });
    });

    it('should clear nickname when given empty string or null so it defaults to user name', async () => {
      mockPrisma.circleMember.findUnique
        .mockResolvedValueOnce({ id: 'm-caller', circleId, userId: callerId, role: MemberRole.OWNER })
        .mockResolvedValueOnce({ id: targetMemberId, circleId, userId: 'user-target' });

      mockPrisma.circleMember.update.mockResolvedValue({
        id: targetMemberId,
        userId: 'user-target',
        role: MemberRole.MEMBER,
        nickname: null,
        joinedAt: new Date(),
        user: { id: 'user-target', email: 'target@test.com', profile: { displayName: 'Real Name' } },
      });

      const result = await service.updateMemberNickname(circleId, callerId, targetMemberId, '   ');
      expect(result.success).toBe(true);
      expect(result.data.nickname).toBeNull();
      expect(mockPrisma.circleMember.update).toHaveBeenCalledWith({
        where: { id: targetMemberId },
        data: { nickname: null },
        include: { user: { select: { id: true, email: true, profile: true } } },
      });
    });

    it('should throw ForbiddenException if caller is not in circle', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateMemberNickname(circleId, 'outsider-id', targetMemberId, 'Nick'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if target member is not found in circle', async () => {
      mockPrisma.circleMember.findUnique
        .mockResolvedValueOnce({ id: 'm-caller', circleId, userId: callerId })
        .mockResolvedValueOnce(null);

      await expect(
        service.updateMemberNickname(circleId, callerId, 'non-existent-member', 'Nick'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMembers', () => {
    const circleId = 'circle-add-1';
    const callerId = 'user-caller-1';

    it('should add members successfully', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValueOnce({
        id: 'm-caller',
        circleId,
        userId: callerId,
        role: MemberRole.MEMBER,
      });

      mockPrisma.circle.findUnique.mockResolvedValueOnce({
        id: circleId,
        maxMembers: 10,
        deletedAt: null,
        _count: { members: 3 },
      });

      mockPrisma.circleMember.findMany.mockResolvedValueOnce([]); // no existing members
      mockPrisma.$transaction.mockResolvedValueOnce([]);

      const result = await service.addMembers(circleId, callerId, ['user-friend-1', 'user-friend-2']);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(['user-friend-1', 'user-friend-2']);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if adding members exceeds maxMembers', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValueOnce({
        id: 'm-caller',
        circleId,
        userId: callerId,
        role: MemberRole.MEMBER,
      });

      mockPrisma.circle.findUnique.mockResolvedValueOnce({
        id: circleId,
        maxMembers: 5,
        deletedAt: null,
        _count: { members: 4 },
      });

      mockPrisma.circleMember.findMany.mockResolvedValueOnce([]);

      await expect(
        service.addMembers(circleId, callerId, ['user-f1', 'user-f2']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if caller is not in circle', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addMembers(circleId, 'outsider', ['user-f1']),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteCircle (US-CIRCLE-004)', () => {
    const circleId = 'circle-del-1';
    const ownerId = 'user-owner-1';

    it('should allow OWNER to dissolve / delete circle', async () => {
      mockPrisma.circle.findUnique.mockResolvedValueOnce({
        id: circleId,
        deletedAt: null,
        members: [{ id: 'm-owner', userId: ownerId, role: MemberRole.OWNER }],
      });
      mockPrisma.circle.update.mockResolvedValueOnce({ id: circleId, deletedAt: new Date() });

      const result = await service.deleteCircle(circleId, ownerId);
      expect(result.success).toBe(true);
      expect(mockPrisma.circle.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: circleId }, data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
    });

    it('should reject non-OWNER from deleting circle', async () => {
      mockPrisma.circle.findUnique.mockResolvedValueOnce({
        id: circleId,
        deletedAt: null,
        members: [{ id: 'm-mem', userId: 'user-member-1', role: MemberRole.MEMBER }],
      });

      await expect(service.deleteCircle(circleId, 'user-member-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createReport (US-ADMIN-001)', () => {
    const circleId = 'circle-rep-1';
    const reporterId = 'user-rep-1';

    it('should allow circle member to submit a report', async () => {
      mockPrisma.circle.findUnique.mockResolvedValueOnce({
        id: circleId,
        deletedAt: null,
        members: [{ id: 'm-rep', userId: reporterId, role: MemberRole.MEMBER }],
      });
      mockPrisma.circleReport.create.mockResolvedValueOnce({
        id: 'rep-123',
        reporterId,
        circleId,
        reason: 'spam',
      });

      const result = await service.createReport(circleId, reporterId, { targetType: 'CIRCLE', reason: 'spam', details: 'Spamming links' });
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(mockPrisma.circleReport.create).toHaveBeenCalled();
    });
  });
});
