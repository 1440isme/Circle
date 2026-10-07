import { Test, TestingModule } from '@nestjs/testing';
import { CallsGateway } from './calls.gateway';
import { CallsService } from './calls.service';
import { CallType } from '@circle/types';

describe('CallsGateway', () => {
  let gateway: CallsGateway;

  const mockCallsService = {
    initiateCall: jest.fn(),
    joinCall: jest.fn(),
    leaveCall: jest.fn(),
    endCall: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallsGateway,
        { provide: CallsService, useValue: mockCallsService },
      ],
    }).compile();

    gateway = module.get<CallsGateway>(CallsGateway);
    gateway.server = mockServer as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleInitiateCall', () => {
    it('should reject when unauthenticated or circleId missing', async () => {
      const mockSocket: any = { data: {}, join: jest.fn(), to: jest.fn().mockReturnThis() };
      const res = await gateway.handleInitiateCall(mockSocket, { circleId: '' });
      expect(res.success).toBe(false);
    });

    it('should initiate call, join room, and broadcast incoming event', async () => {
      const mockSocket: any = {
        data: { userId: 'user_1', displayName: 'Bình' },
        join: jest.fn(),
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      };

      const mockResult: any = {
        callSession: {
          id: 'call_1',
          circleId: 'circle_1',
          callType: CallType.AUDIO,
          startedAt: new Date().toISOString(),
          circle: { name: 'Kteam' },
        },
        iceServers: [],
      };

      mockCallsService.initiateCall.mockResolvedValue(mockResult);

      const res = await gateway.handleInitiateCall(mockSocket, {
        circleId: 'circle_1',
        callType: CallType.AUDIO,
      });

      expect(res.success).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('call:call_1');
      expect(mockSocket.to).toHaveBeenCalledWith('circle:circle_1');
    });
  });

  describe('handleWebRtcSignal', () => {
    it('should relay signal directly to target user if specified', () => {
      const mockSocket: any = {
        data: { userId: 'user_1' },
      };

      const res = gateway.handleWebRtcSignal(mockSocket, {
        callSessionId: 'call_1',
        targetUserId: 'user_2',
        signal: { type: 'offer', sdp: 'mock-sdp' },
      });

      expect(res.success).toBe(true);
      expect(mockServer.to).toHaveBeenCalledWith('user:user_2');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'webrtc:signal',
        expect.objectContaining({
          callSessionId: 'call_1',
          senderUserId: 'user_1',
        }),
      );
    });

    it('should broadcast signal to call room if targetUserId is omitted (Mesh mode)', () => {
      const mockBroadcast = { emit: jest.fn() };
      const mockSocket: any = {
        data: { userId: 'user_1' },
        to: jest.fn().mockReturnValue(mockBroadcast),
      };

      const res = gateway.handleWebRtcSignal(mockSocket, {
        callSessionId: 'call_1',
        signal: { candidate: 'mock-ice' },
      });

      expect(res.success).toBe(true);
      expect(mockSocket.to).toHaveBeenCalledWith('call:call_1');
      expect(mockBroadcast.emit).toHaveBeenCalledWith(
        'webrtc:signal',
        expect.objectContaining({
          callSessionId: 'call_1',
          senderUserId: 'user_1',
        }),
      );
    });
  });

  describe('handleLeaveCall', () => {
    it('should remove socket from room and broadcast participant left', async () => {
      const mockBroadcast = { emit: jest.fn() };
      const mockSocket: any = {
        data: { userId: 'user_1' },
        leave: jest.fn(),
        to: jest.fn().mockReturnValue(mockBroadcast),
      };

      mockCallsService.leaveCall.mockResolvedValue({
        success: true,
        isCallEnded: false,
      });

      const res = await gateway.handleLeaveCall(mockSocket, {
        callSessionId: 'call_1',
      });

      expect(res.success).toBe(true);
      expect(mockSocket.leave).toHaveBeenCalledWith('call:call_1');
      expect(mockSocket.to).toHaveBeenCalledWith('call:call_1');
      expect(mockBroadcast.emit).toHaveBeenCalledWith(
        'call:participant-left',
        expect.objectContaining({ userId: 'user_1' }),
      );
    });
  });
});
