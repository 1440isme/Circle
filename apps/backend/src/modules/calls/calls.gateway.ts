import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallType } from '@circle/types';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/',
})
@Injectable()
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CallsGateway.name);
  private socketCallSessions = new Map<string, Set<string>>();

  constructor(private readonly callsService: CallsService) {}

  handleConnection(client: Socket) {
    this.socketCallSessions.set(client.id, new Set());
  }

  async handleDisconnect(client: Socket) {
    const sessions = this.socketCallSessions.get(client.id);
    this.socketCallSessions.delete(client.id);
    const userId = client.data?.userId;
    if (!userId || !sessions || sessions.size === 0) return;

    for (const callSessionId of sessions) {
      try {
        const result = await this.callsService.leaveCall(userId, callSessionId);
        client.to(`call:${callSessionId}`).emit('call:participant-left', {
          callSessionId,
          userId,
        });

        if (result.isCallEnded) {
          this.broadcastCallEnded(
            result.circleId,
            callSessionId,
            result.endedAt || new Date().toISOString(),
            result.summaryMessage,
          );
        }
      } catch (err: any) {
        this.logger.debug(`Cleanup on disconnect for call ${callSessionId}: ${err.message}`);
      }
    }
  }

  /**
   * Initiates a call and broadcasts an incoming call alert to the Circle room.
   */
  @SubscribeMessage('call:initiate')
  async handleInitiateCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { circleId: string; callType?: CallType },
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.circleId) {
      return { success: false, error: 'Unauthorized or missing circleId' };
    }

    try {
      const callType = data.callType || CallType.AUDIO;
      const result = await this.callsService.initiateCall(
        userId,
        data.circleId,
        callType,
      );

      // Join socket to call room
      client.join(`call:${result.callSession.id}`);
      this.socketCallSessions.get(client.id)?.add(result.callSession.id);

      // Broadcast incoming call event to all members in the circle room
      client.to(`circle:${data.circleId}`).emit('call:incoming', {
        callSessionId: result.callSession.id,
        circleId: data.circleId,
        circleName: result.callSession.circle?.name || 'Vòng tròn',
        callType: result.callSession.callType,
        caller: {
          userId,
          displayName: client.data.displayName || 'Thành viên',
          avatarUrl: client.data.user?.avatarUrl || null,
        },
        startedAt: result.callSession.startedAt,
      });

      this.logger.debug(
        `Call initiated: session ${result.callSession.id} in circle ${data.circleId} by user ${userId}`,
      );

      return { success: true, data: result };
    } catch (err: any) {
      this.logger.error(`Error initiating call: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Broadcasts incoming call notification to all circle members.
   */
  broadcastIncomingCall(
    circleId: string,
    payload: {
      callSessionId: string;
      circleId: string;
      circleName: string;
      callType: CallType;
      caller: {
        userId: string;
        displayName: string;
        avatarUrl: string | null;
      };
      startedAt: Date | string;
    },
    excludeSocketId?: string,
  ) {
    if (!this.server) return;
    if (excludeSocketId) {
      this.server.to(`circle:${circleId}`).except(excludeSocketId).emit('call:incoming', payload);
    } else {
      this.server.to(`circle:${circleId}`).emit('call:incoming', payload);
    }
  }

  /**
   * Handles user joining an ongoing call room.
   */
  @SubscribeMessage('call:join')
  async handleJoinCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callSessionId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.callSessionId) {
      return { success: false, error: 'Unauthorized or missing callSessionId' };
    }

    try {
      const participant = await this.callsService.joinCall(
        userId,
        data.callSessionId,
      );

      // Join the socket room for this call session
      client.join(`call:${data.callSessionId}`);
      this.socketCallSessions.get(client.id)?.add(data.callSessionId);

      // Notify existing participants in the call room
      client.to(`call:${data.callSessionId}`).emit('call:participant-joined', {
        callSessionId: data.callSessionId,
        participant,
      });

      this.logger.debug(
        `User ${userId} joined call room call:${data.callSessionId}`,
      );

      return { success: true, participant };
    } catch (err: any) {
      this.logger.error(`Error joining call: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Relays WebRTC signaling payloads (SDP offer/answer, ICE candidates) between peers.
   */
  @SubscribeMessage('webrtc:signal')
  handleWebRtcSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      callSessionId: string;
      targetUserId?: string;
      signal: any;
    },
  ) {
    const senderUserId = client.data.userId;
    if (!senderUserId || !data?.callSessionId || !data?.signal) {
      return { success: false, error: 'Invalid signal payload' };
    }

    const payload = {
      callSessionId: data.callSessionId,
      senderUserId,
      signal: data.signal,
    };

    if (data.targetUserId) {
      // Direct 1-on-1 signaling targeting a specific peer
      this.server.to(`user:${data.targetUserId}`).emit('webrtc:signal', payload);
    } else {
      // Mesh broadcast to all other participants in the call room
      client.to(`call:${data.callSessionId}`).emit('webrtc:signal', payload);
    }

    return { success: true };
  }

  /**
   * Relays mesh-ready presence to peers in call room.
   */
  @SubscribeMessage('call:mesh-ready')
  handleMeshReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callSessionId: string; userId: string },
  ) {
    if (!data?.callSessionId) return { success: false };
    client.to(`call:${data.callSessionId}`).emit('call:mesh-ready', {
      callSessionId: data.callSessionId,
      userId: data.userId || client.data.userId,
    });
    return { success: true };
  }

  /**
   * Broadcasts call ended event to circle & call room, and publishes chat summary if available.
   */
  broadcastCallEnded(
    circleId: string,
    callSessionId: string,
    endedAt: string,
    summaryMessage?: any,
  ) {
    if (!this.server) return;
    const payload = { callSessionId, circleId, endedAt };
    this.server.to(`call:${callSessionId}`).emit('call:ended', payload);
    this.server.to(`circle:${circleId}`).emit('call:ended', payload);
    this.server.emit('call:ended', payload);

    if (summaryMessage && summaryMessage.channelId) {
      this.server
        .to(`channel:${summaryMessage.channelId}`)
        .emit('chat:message', summaryMessage);
    }
  }

  /**
   * Handles user leaving an ongoing call session.
   */
  @SubscribeMessage('call:leave')
  async handleLeaveCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callSessionId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.callSessionId) {
      return { success: false, error: 'Unauthorized or missing callSessionId' };
    }

    try {
      this.socketCallSessions.get(client.id)?.delete(data.callSessionId);
      const result = await this.callsService.leaveCall(
        userId,
        data.callSessionId,
      );

      // Leave call room
      client.leave(`call:${data.callSessionId}`);

      // Notify remaining peers
      client.to(`call:${data.callSessionId}`).emit('call:participant-left', {
        callSessionId: data.callSessionId,
        userId,
      });

      if (result.isCallEnded) {
        this.broadcastCallEnded(
          result.circleId,
          data.callSessionId,
          result.endedAt || new Date().toISOString(),
          result.summaryMessage,
        );
      }

      this.logger.debug(
        `User ${userId} left call session ${data.callSessionId} (ended: ${result.isCallEnded})`,
      );

      return { success: true, isCallEnded: result.isCallEnded };
    } catch (err: any) {
      this.logger.error(`Error leaving call: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Explicitly terminates a call session.
   */
  @SubscribeMessage('call:end')
  async handleEndCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callSessionId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.callSessionId) {
      return { success: false, error: 'Unauthorized or missing callSessionId' };
    }

    try {
      this.socketCallSessions.get(client.id)?.delete(data.callSessionId);
      const result = await this.callsService.endCall(
        userId,
        data.callSessionId,
      );

      this.broadcastCallEnded(
        result.circleId,
        data.callSessionId,
        result.endedAt,
        result.summaryMessage,
      );

      this.logger.debug(
        `Call session ${data.callSessionId} ended by user ${userId}`,
      );

      return { success: true };
    } catch (err: any) {
      this.logger.error(`Error ending call: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
