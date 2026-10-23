import { Test, TestingModule } from '@nestjs/testing';
import { CircleToolsService } from './circle-tools.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('CircleToolsService', () => {
  let service: CircleToolsService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      circleMember: {
        findUnique: jest.fn(),
      },
      sharedAlbum: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      photo: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      decisionWheel: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      anonymousPost: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      calendarEvent: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((callback: any) => callback(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircleToolsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CircleToolsService>(CircleToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Membership verification', () => {
    it('should throw ForbiddenException if user is not a member of circle', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(null);

      await expect(service.getMemberOrThrow('circle-1', 'user-outsider')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return member record if user belongs to circle', async () => {
      const member = { id: 'mem-1', circleId: 'circle-1', userId: 'user-1', role: 'MEMBER' };
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);

      const result = await service.getMemberOrThrow('circle-1', 'user-1');
      expect(result).toEqual(member);
    });
  });

  describe('Shared Album (UC14)', () => {
    const member = { id: 'mem-1', circleId: 'circle-1', userId: 'user-1', role: 'MEMBER' };
    const owner = { id: 'mem-owner', circleId: 'circle-1', userId: 'user-owner', role: 'OWNER' };

    it('should list albums in circle', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      const mockAlbums = [{ id: 'album-1', albumTitle: 'Kỷ niệm hè', photos: [] }];
      mockPrisma.sharedAlbum.findMany.mockResolvedValue(mockAlbums);

      const result = await service.getAlbums('circle-1', 'user-1');
      expect(result).toEqual(mockAlbums);
    });

    it('should get album by id with photos', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      const mockAlbum = { id: 'album-1', albumTitle: 'Kỷ niệm hè', photos: [] };
      mockPrisma.sharedAlbum.findFirst.mockResolvedValue(mockAlbum);

      const result = await service.getAlbumById('circle-1', 'album-1', 'user-1');
      expect(result).toEqual(mockAlbum);
    });

    it('should throw NotFoundException if album does not exist', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.sharedAlbum.findFirst.mockResolvedValue(null);

      await expect(service.getAlbumById('circle-1', 'album-none', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create a shared album', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.sharedAlbum.create.mockResolvedValue({
        id: 'album-1',
        albumTitle: 'Đà Lạt Trip',
        createdById: 'mem-1',
      });

      const result = await service.createAlbum('circle-1', 'user-1', {
        albumTitle: '  Đà Lạt Trip  ',
        description: 'Chuyến đi đáng nhớ',
      });

      expect(result.id).toBe('album-1');
      expect(mockPrisma.sharedAlbum.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            albumTitle: 'Đà Lạt Trip',
            createdById: 'mem-1',
          }),
        }),
      );
    });

    it('should delete album if requester is creator', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.sharedAlbum.findFirst.mockResolvedValue({
        id: 'album-1',
        circleId: 'circle-1',
        createdById: 'mem-1',
      });
      mockPrisma.sharedAlbum.delete.mockResolvedValue({ id: 'album-1' });

      const res = await service.deleteAlbum('circle-1', 'album-1', 'user-1');
      expect(res).toEqual({ success: true });
    });

    it('should forbid non-creator member from deleting album', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.sharedAlbum.findFirst.mockResolvedValue({
        id: 'album-1',
        circleId: 'circle-1',
        createdById: 'mem-other',
      });

      await expect(service.deleteAlbum('circle-1', 'album-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should add photos to album', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.sharedAlbum.findFirst.mockResolvedValue({ id: 'album-1', circleId: 'circle-1' });
      mockPrisma.photo.create.mockResolvedValue({ id: 'p-1', fileUrl: 'https://r2.test/img1.jpg' });
      mockPrisma.sharedAlbum.update.mockResolvedValue({ id: 'album-1' });

      const res = await service.addPhotos('circle-1', 'album-1', 'user-1', {
        photos: [{ fileUrl: 'https://r2.test/img1.jpg', caption: 'Ảnh chụp' }],
      });

      expect(res).toHaveLength(1);
    });

    it('should allow photo uploader or circle owner to delete photo', async () => {
      // 1. Uploader deletes
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.photo.findUnique.mockResolvedValue({
        id: 'p-1',
        uploaderId: 'mem-1',
        sharedAlbum: { circleId: 'circle-1' },
      });
      mockPrisma.photo.delete.mockResolvedValue({ id: 'p-1' });

      const res1 = await service.deletePhoto('circle-1', 'p-1', 'user-1');
      expect(res1).toEqual({ success: true });

      // 2. Circle Owner deletes photo uploaded by someone else
      mockPrisma.circleMember.findUnique.mockResolvedValue(owner);
      mockPrisma.photo.findUnique.mockResolvedValue({
        id: 'p-2',
        uploaderId: 'mem-other',
        sharedAlbum: { circleId: 'circle-1' },
      });
      const res2 = await service.deletePhoto('circle-1', 'p-2', 'user-owner');
      expect(res2).toEqual({ success: true });
    });
  });

  describe('Decision Wheel (UC16)', () => {
    const member = { id: 'mem-1', circleId: 'circle-1', userId: 'user-1', role: 'MEMBER' };

    it('should create wheel with options', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.decisionWheel.create.mockResolvedValue({
        id: 'wheel-1',
        title: 'Trưa nay ăn gì?',
        options: [{ id: 'opt-1', optionLabel: 'Phở' }, { id: 'opt-2', optionLabel: 'Cơm tấm' }],
      });

      const res = await service.createWheel('circle-1', 'user-1', {
        title: 'Trưa nay ăn gì?',
        options: [{ optionLabel: 'Phở' }, { optionLabel: 'Cơm tấm' }],
      });

      expect(res.id).toBe('wheel-1');
    });

    it('should throw BadRequestException if fewer than 2 options provided', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);

      await expect(
        service.createWheel('circle-1', 'user-1', {
          title: 'Đi đâu?',
          options: [{ optionLabel: 'Đà Nẵng' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should spin wheel and return fair selected option', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.decisionWheel.findFirst.mockResolvedValue({
        id: 'wheel-1',
        circleId: 'circle-1',
        options: [
          { id: 'opt-1', optionLabel: 'Trà sữa' },
          { id: 'opt-2', optionLabel: 'Cà phê' },
        ],
      });
      mockPrisma.decisionWheel.update.mockResolvedValue({ id: 'wheel-1' });

      const result = await service.spinWheel('circle-1', 'wheel-1', 'user-1');
      expect(result.wheelId).toBe('wheel-1');
      expect(['Trà sữa', 'Cà phê']).toContain(result.selectedOption.optionLabel);
    });
  });

  describe('Anonymous Post / Words Unsaid (UC21)', () => {
    const member = { id: 'mem-1', circleId: 'circle-1', userId: 'user-1', role: 'MEMBER' };
    const owner = { id: 'mem-owner', circleId: 'circle-1', userId: 'user-owner', role: 'OWNER' };

    it('should create anonymous post with zero user ID stored', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.anonymousPost.create.mockResolvedValue({
        id: 'post-1',
        circleId: 'circle-1',
        content: 'Cảm ơn mọi người vì một tuần tuyệt vời!',
        cardTheme: 'sunset',
        postedAt: new Date(),
      });

      const post = await service.createAnonymousPost('circle-1', 'user-1', {
        content: 'Cảm ơn mọi người vì một tuần tuyệt vời!',
        cardTheme: 'sunset',
      });

      expect(post.id).toBe('post-1');
      // Verifies NO userId or authorId was passed to create data!
      expect(mockPrisma.anonymousPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            circleId: 'circle-1',
            content: 'Cảm ơn mọi người vì một tuần tuyệt vời!',
            cardTheme: 'sunset',
          },
        }),
      );
    });

    it('should return posts without author information', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      const sample = [
        { id: 'post-1', circleId: 'circle-1', content: 'Confession', cardTheme: 'ocean', postedAt: new Date() },
      ];
      mockPrisma.anonymousPost.findMany.mockResolvedValue(sample);

      const posts = await service.getAnonymousPosts('circle-1', 'user-1');
      expect(posts[0]).not.toHaveProperty('author');
      expect(posts[0]).not.toHaveProperty('authorId');
      expect(posts[0]).not.toHaveProperty('createdById');
    });

    it('should allow only Circle OWNER to delete inappropriate anonymous post', async () => {
      // 1. Regular member tries to delete -> Forbidden
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      await expect(service.deleteAnonymousPost('circle-1', 'post-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );

      // 2. Owner deletes -> Success
      mockPrisma.circleMember.findUnique.mockResolvedValue(owner);
      mockPrisma.anonymousPost.findFirst.mockResolvedValue({ id: 'post-1', circleId: 'circle-1' });
      mockPrisma.anonymousPost.delete.mockResolvedValue({ id: 'post-1' });

      const res = await service.deleteAnonymousPost('circle-1', 'post-1', 'user-owner');
      expect(res).toEqual({ success: true });
    });
  });

  describe('Group Calendar & Reminders (UC17)', () => {
    const member = { id: 'mem-1', circleId: 'circle-1', userId: 'user-1', role: 'MEMBER' };

    it('should create calendar event with location and time', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.calendarEvent.create.mockResolvedValue({
        id: 'event-1',
        eventTitle: 'Họp đồ án tốt nghiệp',
        location: 'Phòng B204',
        startTime: new Date('2026-10-25T08:00:00Z'),
      });

      const res = await service.createCalendarEvent('circle-1', 'user-1', {
        eventTitle: 'Họp đồ án tốt nghiệp',
        location: 'Phòng B204',
        startTime: '2026-10-25T08:00:00Z',
      });

      expect(res.id).toBe('event-1');
    });

    it('should list calendar events in circle', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      const events = [{ id: 'event-1', eventTitle: 'Họp nhóm' }];
      mockPrisma.calendarEvent.findMany.mockResolvedValue(events);

      const res = await service.getCalendarEvents('circle-1', 'user-1');
      expect(res).toEqual(events);
    });

    it('should delete event if user is creator', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.calendarEvent.findFirst.mockResolvedValue({
        id: 'event-1',
        circleId: 'circle-1',
        createdById: 'mem-1',
      });
      mockPrisma.calendarEvent.delete.mockResolvedValue({ id: 'event-1' });

      const res = await service.deleteCalendarEvent('circle-1', 'event-1', 'user-1');
      expect(res).toEqual({ success: true });
    });
  });
});
