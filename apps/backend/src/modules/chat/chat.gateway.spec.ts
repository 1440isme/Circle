import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '../../database/prisma.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  const mockPrisma = {
    circleMember: {
      findMany: jest.fn(),
    },
    channel: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((_key: string, defaultVal?: string) => defaultVal || 'mock-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should reject client when token is missing', async () => {
      const mockSocket: any = {
        id: 'sock_1',
        handshake: { auth: {}, headers: {} },
        disconnect: jest.fn(),
        join: jest.fn(),
        data: {},
      };

      await gateway.handleConnection(mockSocket);
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should authenticate client, join user and circle rooms, and track presence', async () => {
      const mockSocket: any = {
        id: 'sock_2',
        handshake: { auth: { token: 'valid-jwt-token' } },
        disconnect: jest.fn(),
        join: jest.fn(),
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
        data: {},
      };

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user_1', email: 'test@circle.vn' });
      mockPrisma.circleMember.findMany.mockResolvedValue([{ circleId: 'circle_1' }, { circleId: 'circle_2' }]);

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('user:user_1');
      expect(mockSocket.join).toHaveBeenCalledWith('circle:circle_1');
      expect(mockSocket.join).toHaveBeenCalledWith('circle:circle_2');
      expect(gateway.isUserOnline('user_1')).toBe(true);
    });
  });

  describe('handleGetCircleOnline', () => {
    it('should return list of online user IDs in a circle', async () => {
      const mockSocket: any = {
        id: 'sock_3',
        data: { userId: 'user_1' },
      };

      mockPrisma.circleMember.findMany.mockResolvedValue([
        { userId: 'user_1' },
        { userId: 'user_2' },
        { userId: 'user_3' },
      ]);

      const res = await gateway.handleGetCircleOnline(mockSocket, { circleId: 'circle_1' });
      expect(res.success).toBe(true);
      expect(res.circleId).toBe('circle_1');
      expect(Array.isArray(res.onlineUserIds)).toBe(true);
    });

    it('should reject when requester is not a member of the circle', async () => {
      const mockSocket: any = {
        id: 'sock_stranger',
        data: { userId: 'stranger_99' },
      };

      mockPrisma.circleMember.findMany.mockResolvedValue([
        { userId: 'user_1' },
        { userId: 'user_2' },
      ]);

      const res = await gateway.handleGetCircleOnline(mockSocket, { circleId: 'circle_1' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('Forbidden');
    });
  });

  describe('handleTyping', () => {
    it('should broadcast user typing status to channel room with userName', () => {
      const mockTo = { emit: jest.fn() };
      const mockSocket: any = {
        id: 'sock_4',
        data: { userId: 'user_1', user: { email: 'test@circle.vn' } },
        to: jest.fn().mockReturnValue(mockTo),
      };

      gateway.handleTyping(mockSocket, { channelId: 'chan_1', isTyping: true, userName: 'Công Bình' });

      expect(mockSocket.to).toHaveBeenCalledWith('channel:chan_1');
      expect(mockTo.emit).toHaveBeenCalledWith('chat:user-typing', {
        channelId: 'chan_1',
        userId: 'user_1',
        userName: 'Công Bình',
        isTyping: true,
      });
    });
  });
});
