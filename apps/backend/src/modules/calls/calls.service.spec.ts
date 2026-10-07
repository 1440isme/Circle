import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CallsService } from './calls.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CallType, CallStatus } from '@circle/types';

describe('CallsService', () => {
  let service: CallsService;

  const mockPrisma = {
    circleMember: {
      findFirst: jest.fn(),
    },
    callSession: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    callParticipant: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'STUN_SERVER_URL') return 'stun:stun.l.google.com:19302';
      if (key === 'TURN_SERVER_URL') return 'turn:turn.circle.local:3478';
      if (key === 'TURN_USERNAME') return 'circle-user';
      if (key === 'TURN_CREDENTIAL') return 'circle-pass';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CallsService>(CallsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getIceServers', () => {
    it('should return configured STUN and TURN server credentials', () => {
      const result = service.getIceServers();
      expect(result.iceServers).toHaveLength(2);
      expect(result.iceServers[0]!.urls).toBe('stun:stun.l.google.com:19302');
      expect(result.iceServers[1]!.urls).toBe('turn:turn.circle.local:3478');
      expect(result.iceServers[1]!.username).toBe('circle-user');
    });
  });

  describe('initiateCall', () => {
    it('should throw ForbiddenException if user is not member of the circle', async () => {
      mockPrisma.circleMember.findFirst.mockResolvedValue(null);

      await expect(
        service.initiateCall('user_1', 'circle_1', CallType.VIDEO),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create a new call session and add caller as participant', async () => {
      const mockMember = { id: 'mem_1', userId: 'user_1', circleId: 'circle_1' };
      mockPrisma.circleMember.findFirst.mockResolvedValue(mockMember);
      mockPrisma.callSession.findFirst.mockResolvedValueOnce(null); // No active call
      
      const createdSession = {
        id: 'call_1',
        circleId: 'circle_1',
        callType: CallType.VIDEO,
        status: CallStatus.ACTIVE,
        startedAt: new Date(),
        endedAt: null,
        circle: { id: 'circle_1', name: 'Circle One', handle: 'one', avatarUrl: null },
        participants: [],
      };
      mockPrisma.callSession.create.mockResolvedValue(createdSession);
      mockPrisma.callParticipant.findFirst.mockResolvedValue(null);
      mockPrisma.callParticipant.create.mockResolvedValue({ id: 'part_1' });
      mockPrisma.callSession.findUnique.mockResolvedValue({
        ...createdSession,
        participants: [
          {
            id: 'part_1',
            callSessionId: 'call_1',
            memberId: 'mem_1',
            joinedAt: new Date(),
            leftAt: null,
            member: { id: 'mem_1', userId: 'user_1', role: 'MEMBER' },
          },
        ],
      });

      const res = await service.initiateCall('user_1', 'circle_1', CallType.VIDEO);

      expect(res.callSession.id).toBe('call_1');
      expect(res.callSession.callType).toBe(CallType.VIDEO);
      expect(mockPrisma.callSession.create).toHaveBeenCalled();
      expect(res.iceServers).toBeDefined();
    });
  });

  describe('joinCall', () => {
    it('should throw NotFoundException if session does not exist or is ended', async () => {
      mockPrisma.callSession.findUnique.mockResolvedValue(null);

      await expect(service.joinCall('user_1', 'call_non_existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow circle member to join active call session', async () => {
      mockPrisma.callSession.findUnique.mockResolvedValue({
        id: 'call_1',
        circleId: 'circle_1',
        status: CallStatus.ACTIVE,
      });
      mockPrisma.circleMember.findFirst.mockResolvedValue({
        id: 'mem_2',
        userId: 'user_2',
        circleId: 'circle_1',
      });
      mockPrisma.callParticipant.findFirst.mockResolvedValue(null);
      mockPrisma.callParticipant.create.mockResolvedValue({
        id: 'part_2',
        callSessionId: 'call_1',
        memberId: 'mem_2',
        joinedAt: new Date(),
        leftAt: null,
        member: { id: 'mem_2', userId: 'user_2', role: 'MEMBER' },
      });

      const participant = await service.joinCall('user_2', 'call_1');
      expect(participant.id).toBe('part_2');
      expect(mockPrisma.callParticipant.create).toHaveBeenCalled();
    });
  });

  describe('leaveCall', () => {
    it('should update leftAt and mark session ENDED when last participant leaves', async () => {
      mockPrisma.callSession.findUnique.mockResolvedValue({
        id: 'call_1',
        circleId: 'circle_1',
      });
      mockPrisma.circleMember.findFirst.mockResolvedValue({
        id: 'mem_1',
        userId: 'user_1',
        circleId: 'circle_1',
      });
      mockPrisma.callParticipant.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.callParticipant.count.mockResolvedValue(0); // 0 remaining
      mockPrisma.callSession.update.mockResolvedValue({});

      const res = await service.leaveCall('user_1', 'call_1');

      expect(res.success).toBe(true);
      expect(res.isCallEnded).toBe(true);
      expect(mockPrisma.callSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: CallStatus.ENDED }),
        }),
      );
    });
  });

  describe('endCall', () => {
    it('should explicitly terminate call session and mark all participants left', async () => {
      mockPrisma.callSession.findUnique.mockResolvedValue({
        id: 'call_1',
        circleId: 'circle_1',
      });
      mockPrisma.circleMember.findFirst.mockResolvedValue({
        id: 'mem_1',
        userId: 'user_1',
        circleId: 'circle_1',
      });
      mockPrisma.callParticipant.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.callSession.update.mockResolvedValue({});

      const res = await service.endCall('user_1', 'call_1');

      expect(res.success).toBe(true);
      expect(res.endedAt).toBeDefined();
      expect(mockPrisma.callSession.update).toHaveBeenCalled();
    });
  });
});
