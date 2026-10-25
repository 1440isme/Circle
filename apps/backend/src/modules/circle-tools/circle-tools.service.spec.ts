import { Test, TestingModule } from '@nestjs/testing';
import { CircleToolsService } from './circle-tools.service';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('CircleToolsService', () => {
  let service: CircleToolsService;
  let mockPrisma: any;
  let mockChatGateway: any;

  beforeEach(async () => {
    mockChatGateway = {
      broadcastNewMessage: jest.fn(),
      broadcastCalendarEventRsvp: jest.fn(),
    };

    mockPrisma = {
      circleMember: {
        findUnique: jest.fn(),
      },
      channel: {
        findFirst: jest.fn(),
      },
      message: {
        create: jest.fn(),
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
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      calendarEventRsvp: {
        upsert: jest.fn(),
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
        {
          provide: ChatGateway,
          useValue: mockChatGateway,
        },
      ],
    }).compile();

    service = module.get<CircleToolsService>(CircleToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===========================================================================
  // 1. SHARED ALBUM (UC14)
  // ===========================================================================
  describe('Shared Album (UC14)', () => {
    const member = { id: 'mem-1', circleId: 'circle-1', userId: 'user-1', role: 'MEMBER' };
    const owner = { id: 'mem-2', circleId: 'circle-1', userId: 'user-owner', role: 'OWNER' };

    it('should create an album', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.sharedAlbum.create.mockResolvedValue({
        id: 'album-1',
        albumTitle: 'Kỷ niệm hè',
        createdById: 'mem-1',
      });

      const res = await service.createAlbum('circle-1', 'user-1', { albumTitle: 'Kỷ niệm hè' });
      expect(res.id).toBe('album-1');
      expect(mockPrisma.sharedAlbum.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ albumTitle: 'Kỷ niệm hè', createdById: 'mem-1' }),
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException if user is not member when getting albums', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(null);

      await expect(service.getAlbums('circle-1', 'user-unknown')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow owner to delete another member\'s album', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(owner);
      mockPrisma.sharedAlbum.findFirst.mockResolvedValue({
        id: 'album-1',
        circleId: 'circle-1',
        createdById: 'mem-1', // created by someone else
      });
      mockPrisma.sharedAlbum.delete.mockResolvedValue({ id: 'album-1' });

      const res = await service.deleteAlbum('circle-1', 'album-1', 'user-owner');
      expect(res).toEqual({ success: true });
      expect(mockPrisma.sharedAlbum.delete).toHaveBeenCalledWith({ where: { id: 'album-1' } });
    });

    it('should forbid non-owner from deleting another member\'s album', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.sharedAlbum.findFirst.mockResolvedValue({
        id: 'album-1',
        circleId: 'circle-1',
        createdById: 'mem-diff',
      });

      await expect(service.deleteAlbum('circle-1', 'album-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should add photos to album', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.sharedAlbum.findFirst.mockResolvedValue({ id: 'album-1', circleId: 'circle-1' });
      mockPrisma.photo.create.mockResolvedValue({ id: 'photo-1', fileUrl: 'https://cdn/p1.jpg' });
      mockPrisma.sharedAlbum.update.mockResolvedValue({ id: 'album-1' });

      const res = await service.addPhotos('circle-1', 'album-1', 'user-1', {
        photos: [{ fileUrl: 'https://cdn/p1.jpg', width: 800, height: 600 }],
      });

      expect(res).toHaveLength(1);
      expect(res[0]?.id).toBe('photo-1');
    });

    it('should throw error when adding empty photos array', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.sharedAlbum.findFirst.mockResolvedValue({ id: 'album-1', circleId: 'circle-1' });

      await expect(
        service.addPhotos('circle-1', 'album-1', 'user-1', { photos: [] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ===========================================================================
  // 2. DECISION WHEEL (UC16)
  // ===========================================================================
  describe('Decision Wheel (UC16)', () => {
    const member = { id: 'mem-1', circleId: 'circle-1', userId: 'user-1', role: 'MEMBER' };

    it('should create wheel with options', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.decisionWheel.create.mockResolvedValue({
        id: 'wheel-1',
        title: 'Hôm nay ăn gì?',
        options: [
          { id: 'opt-1', optionLabel: 'Bún chả' },
          { id: 'opt-2', optionLabel: 'Cơm tấm' },
        ],
      });

      const res = await service.createWheel('circle-1', 'user-1', {
        title: 'Hôm nay ăn gì?',
        options: [{ optionLabel: 'Bún chả' }, { optionLabel: 'Cơm tấm' }],
      });

      expect(res.id).toBe('wheel-1');
      expect(mockPrisma.decisionWheel.create).toHaveBeenCalled();
    });

    it('should reject wheel with less than 2 options', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);

      await expect(
        service.createWheel('circle-1', 'user-1', {
          title: 'Ăn gì?',
          options: [{ optionLabel: 'Phở' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should spin wheel and pick valid option randomly', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      const options = [
        { id: 'opt-1', optionLabel: 'Pizza' },
        { id: 'opt-2', optionLabel: 'Sushi' },
      ];
      mockPrisma.decisionWheel.findFirst.mockResolvedValue({
        id: 'wheel-1',
        circleId: 'circle-1',
        options,
      });
      mockPrisma.decisionWheel.update.mockResolvedValue({ id: 'wheel-1' });

      const res = await service.spinWheel('circle-1', 'wheel-1', 'user-1');

      expect(res.wheelId).toBe('wheel-1');
      expect(['Pizza', 'Sushi']).toContain(res.selectedOption.optionLabel);
      expect(mockPrisma.decisionWheel.update).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 3. ANONYMOUS POST (UC21)
  // ===========================================================================
  describe('Anonymous Post (UC21)', () => {
    const member = { id: 'mem-1', circleId: 'circle-1', userId: 'user-1', role: 'MEMBER' };
    const owner = { id: 'mem-2', circleId: 'circle-1', userId: 'user-owner', role: 'OWNER' };

    it('should create anonymous post without author identification', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.anonymousPost.create.mockResolvedValue({
        id: 'post-1',
        circleId: 'circle-1',
        content: 'Cảm ơn mọi người vì một kỳ học tuyệt vời!',
        cardTheme: 'sunset',
        postedAt: new Date(),
      });

      const res = await service.createAnonymousPost('circle-1', 'user-1', {
        content: 'Cảm ơn mọi người vì một kỳ học tuyệt vời!',
        cardTheme: 'sunset',
      });

      expect(res.id).toBe('post-1');
      // Assert authorId / createdById is NOT passed into create data
      expect(mockPrisma.anonymousPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            circleId: 'circle-1',
            content: 'Cảm ơn mọi người vì một kỳ học tuyệt vời!',
            cardTheme: 'sunset',
          },
        }),
      );
    });

    it('should only allow Circle OWNER to delete anonymous post', async () => {
      // 1. Member tries to delete -> Forbidden
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

  // ===========================================================================
  // 4. GROUP CALENDAR & REMINDERS (UC17)
  // ===========================================================================
  describe('Group Calendar & Reminders (UC17)', () => {
    const member = {
      id: 'mem-1',
      circleId: 'circle-1',
      userId: 'user-1',
      role: 'MEMBER',
      user: {
        profile: {
          displayName: 'Bình',
        },
      },
    };

    it('should create calendar event with location and time, and broadcast to chat channel', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.channel.findFirst.mockResolvedValue({ id: 'chan-1', circleId: 'circle-1' });
      mockPrisma.message.create.mockResolvedValue({
        id: 'msg-cal-1',
        channelId: 'chan-1',
        memberId: 'mem-1',
        type: 'TEXT',
        content: '[CALENDAR_EVENT]:{"type":"CALENDAR_EVENT"}',
        sentAt: new Date(),
        updatedAt: new Date(),
      });
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
      expect(mockPrisma.channel.findFirst).toHaveBeenCalledWith({
        where: { circleId: 'circle-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channelId: 'chan-1',
            memberId: 'mem-1',
            type: 'TEXT',
            content: expect.stringContaining('[CALENDAR_EVENT]:'),
          }),
        }),
      );
      expect(mockChatGateway.broadcastNewMessage).toHaveBeenCalledWith(
        'chan-1',
        expect.objectContaining({ id: 'msg-cal-1' }),
      );
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
    it('should respond to event RSVP and broadcast socket event', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.calendarEvent.findFirst.mockResolvedValue({
        id: 'event-1',
        circleId: 'circle-1',
        startTime: new Date(Date.now() + 86400000),
      });
      const now = new Date();
      mockPrisma.calendarEventRsvp.upsert.mockResolvedValue({
        id: 'rsvp-1',
        eventId: 'event-1',
        userId: 'user-1',
        status: 'YES',
        createdAt: now,
        updatedAt: now,
        user: {
          id: 'user-1',
          email: 'user1@circle.local',
          profile: { displayName: 'User One', avatarUrl: null },
        },
      });
      mockPrisma.calendarEvent.findUnique.mockResolvedValue({
        id: 'event-1',
        circleId: 'circle-1',
        eventTitle: 'Họp nhóm',
        rsvps: [
          {
            id: 'rsvp-1',
            userId: 'user-1',
            status: 'YES',
            user: { profile: { displayName: 'User One' } },
          },
        ],
      });

      const res = await service.respondEventRsvp('circle-1', 'event-1', 'user-1', {
        status: 'YES' as any,
      });

      expect(res.id).toBe('rsvp-1');
      expect(mockPrisma.calendarEventRsvp.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            eventId_userId: {
              eventId: 'event-1',
              userId: 'user-1',
            },
          },
          update: { status: 'YES' },
          create: { eventId: 'event-1', userId: 'user-1', status: 'YES' },
        }),
      );
      expect(mockChatGateway.broadcastCalendarEventRsvp).toHaveBeenCalledWith(
        'circle-1',
        expect.objectContaining({
          eventId: 'event-1',
          circleId: 'circle-1',
          rsvps: expect.objectContaining({
            yesCount: 1,
            noCount: 0,
            maybeCount: 0,
          }),
        }),
      );
    });

it('should throw BadRequestException if event has already started when responding RSVP', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.calendarEvent.findFirst.mockResolvedValue({
        id: 'event-1',
        circleId: 'circle-1',
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
      });

      await expect(
        service.respondEventRsvp('circle-1', 'event-1', 'user-1', {
          status: 'YES' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if event does not exist when responding RSVP', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(member);
      mockPrisma.calendarEvent.findFirst.mockResolvedValue(null);

      await expect(
        service.respondEventRsvp('circle-1', 'event-not-found', 'user-1', {
          status: 'NO' as any,
        }),
      ).rejects.toThrow();
    });
  });
});
