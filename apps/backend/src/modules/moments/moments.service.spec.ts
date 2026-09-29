import { Test, TestingModule } from '@nestjs/testing';
import { MomentsService } from './moments.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MomentsService', () => {
  let service: MomentsService;

  const mockPrisma = {
    circleMember: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    moment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    momentReaction: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MomentsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<MomentsService>(MomentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BadRequestException if circleIds is empty', async () => {
      await expect(
        service.create('user-1', { photoUrl: 'https://img.com/1.jpg', circleIds: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not a member of any of the selected circles', async () => {
      mockPrisma.circleMember.findMany.mockResolvedValue([{ circleId: 'circle-1' }]);

      await expect(
        service.create('user-1', {
          photoUrl: 'https://img.com/1.jpg',
          circleIds: ['circle-1', 'circle-2'],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create moment and return formatted entity when user is a member of all selected circles', async () => {
      mockPrisma.circleMember.findMany.mockResolvedValue([
        { circleId: 'circle-1' },
        { circleId: 'circle-2' },
      ]);

      const mockCreated = {
        id: 'moment-1',
        authorId: 'user-1',
        photoUrl: 'https://img.com/1.jpg',
        caption: 'Hello moments',
        capturedAt: new Date('2026-09-29T10:00:00Z'),
        createdAt: new Date('2026-09-29T10:00:00Z'),
        updatedAt: new Date('2026-09-29T10:00:00Z'),
        author: {
          id: 'user-1',
          email: 'user1@example.com',
          profile: { displayName: 'User One', avatarUrl: null },
        },
        visibilities: [
          {
            id: 'vis-1',
            momentId: 'moment-1',
            circleId: 'circle-1',
            createdAt: new Date('2026-09-29T10:00:00Z'),
            circle: { id: 'circle-1', name: 'Circle 1', avatarUrl: null },
          },
        ],
        reactions: [],
      };

      mockPrisma.moment.create.mockResolvedValue(mockCreated);

      const res = await service.create('user-1', {
        photoUrl: 'https://img.com/1.jpg',
        caption: 'Hello moments',
        circleIds: ['circle-1', 'circle-2'],
      });

      expect(res.id).toBe('moment-1');
      expect(res.authorId).toBe('user-1');
      expect(res.caption).toBe('Hello moments');
      expect(res.visibilities).toHaveLength(1);
      expect(mockPrisma.moment.create).toHaveBeenCalledWith({
        data: {
          authorId: 'user-1',
          photoUrl: 'https://img.com/1.jpg',
          caption: 'Hello moments',
          visibilities: {
            create: [{ circleId: 'circle-1' }, { circleId: 'circle-2' }],
          },
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getFeed', () => {
    it('should return empty array if user belongs to no circles', async () => {
      mockPrisma.circleMember.findMany.mockResolvedValue([]);

      const feed = await service.getFeed('user-1');
      expect(feed).toEqual([]);
      expect(mockPrisma.moment.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and return transformed moments with reactions for user circles', async () => {
      mockPrisma.circleMember.findMany.mockResolvedValue([{ circleId: 'circle-1' }]);

      mockPrisma.moment.findMany.mockResolvedValue([
        {
          id: 'moment-1',
          authorId: 'user-2',
          photoUrl: 'https://img.com/2.jpg',
          caption: 'Feed moment',
          capturedAt: new Date('2026-09-29T11:00:00Z'),
          createdAt: new Date('2026-09-29T11:00:00Z'),
          author: {
            id: 'user-2',
            email: 'user2@example.com',
            profile: { displayName: 'User Two', avatarUrl: null },
          },
          visibilities: [
            {
              id: 'vis-1',
              momentId: 'moment-1',
              circleId: 'circle-1',
              createdAt: new Date(),
              circle: { id: 'circle-1', name: 'Family', avatarUrl: null },
            },
          ],
          reactions: [
            { id: 'r-1', momentId: 'moment-1', userId: 'user-1', emoji: '❤️', createdAt: new Date() },
            { id: 'r-2', momentId: 'moment-1', userId: 'user-3', emoji: '❤️', createdAt: new Date() },
            { id: 'r-3', momentId: 'moment-1', userId: 'user-4', emoji: '🔥', createdAt: new Date() },
          ],
        },
      ]);

      const feed = await service.getFeed('user-1');
      expect(feed).toHaveLength(1);
      expect(feed[0]!.reactionCounts).toEqual({ '❤️': 2, '🔥': 1 });
      expect(feed[0]!.userReaction).toBe('❤️');
    });
  });

  describe('getByCircle', () => {
    it('should throw ForbiddenException if user is not a member of circle', async () => {
      mockPrisma.circleMember.findFirst.mockResolvedValue(null);

      await expect(service.getByCircle('user-1', 'circle-99')).rejects.toThrow(ForbiddenException);
    });

    it('should return moments visible to specific circle', async () => {
      mockPrisma.circleMember.findFirst.mockResolvedValue({ id: 'member-1' });
      mockPrisma.moment.findMany.mockResolvedValue([
        {
          id: 'moment-1',
          authorId: 'user-1',
          photoUrl: 'https://img.com/1.jpg',
          capturedAt: new Date(),
          createdAt: new Date(),
          visibilities: [],
          reactions: [],
        },
      ]);

      const res = await service.getByCircle('user-1', 'circle-1');
      expect(res).toHaveLength(1);
      expect(res[0]!.id).toBe('moment-1');
    });
  });

  describe('react', () => {
    it('should throw NotFoundException if moment not found or deleted', async () => {
      mockPrisma.moment.findUnique.mockResolvedValue(null);

      await expect(service.react('user-1', 'm-none', '❤️')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user cannot view the moment', async () => {
      mockPrisma.moment.findUnique.mockResolvedValue({
        id: 'm-1',
        authorId: 'user-author',
        deletedAt: null,
        visibilities: [{ circleId: 'circle-1' }],
      });
      mockPrisma.circleMember.findFirst.mockResolvedValue(null);

      await expect(service.react('user-outsider', 'm-1', '❤️')).rejects.toThrow(ForbiddenException);
    });

    it('should add reaction if not exists', async () => {
      mockPrisma.moment.findUnique.mockResolvedValue({
        id: 'm-1',
        authorId: 'user-author',
        deletedAt: null,
        visibilities: [{ circleId: 'circle-1' }],
      });
      mockPrisma.circleMember.findFirst.mockResolvedValue({ id: 'mem-1' });
      mockPrisma.momentReaction.findUnique.mockResolvedValue(null);
      mockPrisma.momentReaction.create.mockResolvedValue({ id: 'r-new' });

      const res = await service.react('user-1', 'm-1', '❤️');
      expect(res).toEqual({ reacted: true, emoji: '❤️' });
      expect(mockPrisma.momentReaction.create).toHaveBeenCalledWith({
        data: { momentId: 'm-1', userId: 'user-1', emoji: '❤️' },
      });
    });

    it('should toggle off existing reaction', async () => {
      mockPrisma.moment.findUnique.mockResolvedValue({
        id: 'm-1',
        authorId: 'user-author',
        deletedAt: null,
        visibilities: [{ circleId: 'circle-1' }],
      });
      mockPrisma.circleMember.findFirst.mockResolvedValue({ id: 'mem-1' });
      mockPrisma.momentReaction.findUnique.mockResolvedValue({ id: 'r-existing' });

      const res = await service.react('user-1', 'm-1', '❤️');
      expect(res).toEqual({ reacted: false, emoji: '❤️' });
      expect(mockPrisma.momentReaction.delete).toHaveBeenCalledWith({
        where: { id: 'r-existing' },
      });
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if moment does not exist', async () => {
      mockPrisma.moment.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'm-none')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not author', async () => {
      mockPrisma.moment.findUnique.mockResolvedValue({
        id: 'm-1',
        authorId: 'user-2',
        deletedAt: null,
      });

      await expect(service.delete('user-1', 'm-1')).rejects.toThrow(ForbiddenException);
    });

    it('should soft delete moment when author calls delete', async () => {
      mockPrisma.moment.findUnique.mockResolvedValue({
        id: 'm-1',
        authorId: 'user-1',
        deletedAt: null,
      });
      mockPrisma.moment.update.mockResolvedValue({ id: 'm-1' });

      const res = await service.delete('user-1', 'm-1');
      expect(res).toEqual({ success: true });
      expect(mockPrisma.moment.update).toHaveBeenCalledWith({
        where: { id: 'm-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
