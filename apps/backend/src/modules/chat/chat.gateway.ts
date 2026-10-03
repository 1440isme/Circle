import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // In-memory presence map: userId -> Set of active socket IDs
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle user socket connection & presence activation
   */
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization?.startsWith('Bearer ')
          ? client.handshake.headers.authorization.slice(7)
          : client.handshake.headers?.authorization);

      if (!token) {
        this.logger.debug(`Socket connection rejected (missing token): ${client.id}`);
        client.disconnect();
        return;
      }

      const secret =
        this.configService.get<string>('JWT_ACCESS_SECRET') ||
        'default-access-secret-32-chars-minimum-key';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      const userId = payload.sub;

      client.data.user = payload;
      client.data.userId = userId;

      // Join personal room
      client.join(`user:${userId}`);

      // Track active socket in presence map
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join all circle rooms user is a member of & notify circles
      const memberships = await this.prisma.circleMember.findMany({
        where: { userId },
        select: { circleId: true },
      });

      for (const m of memberships) {
        client.join(`circle:${m.circleId}`);
        // Broadcast presence change to circle room
        client.to(`circle:${m.circleId}`).emit('presence:user-status', {
          userId,
          status: 'ONLINE',
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.debug(
        `Socket connected: ${client.id} (user: ${userId}, circles: ${memberships.length})`,
      );
    } catch (err: any) {
      this.logger.debug(`Socket authentication failed for ${client.id}: ${err.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle socket disconnect & presence deactivation
   */
  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      const socketSet = this.userSockets.get(userId)!;
      socketSet.delete(client.id);

      if (socketSet.size === 0) {
        this.userSockets.delete(userId);

        // Fetch user circles to broadcast offline status
        try {
          const memberships = await this.prisma.circleMember.findMany({
            where: { userId },
            select: { circleId: true },
          });

          for (const m of memberships) {
            this.server?.to(`circle:${m.circleId}`).emit('presence:user-status', {
              userId,
              status: 'OFFLINE',
              timestamp: new Date().toISOString(),
            });
          }
        } catch (err: any) {
          this.logger.error(`Presence broadcast error on disconnect: ${err.message}`);
        }
      }
    }
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  /**
   * Subscribe to circle presence queries: returns list of online user IDs in the circle
   */
  @SubscribeMessage('presence:get-circle-online')
  async handleGetCircleOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { circleId: string },
  ) {
    if (!data?.circleId) return { success: false, error: 'circleId required' };
    const userId = client.data.userId;
    if (!userId) return { success: false, error: 'Unauthorized' };

    // Find all members of circle
    const members = await this.prisma.circleMember.findMany({
      where: { circleId: data.circleId },
      select: { userId: true },
    });

    // Verify requester is a member of this circle
    const isMember = members.some((m) => m.userId === userId);
    if (!isMember) {
      return { success: false, error: 'Forbidden: You are not a member of this circle' };
    }

    const onlineUserIds = members
      .map((m) => m.userId)
      .filter((uid) => this.userSockets.has(uid) && this.userSockets.get(uid)!.size > 0);

    return {
      success: true,
      circleId: data.circleId,
      onlineUserIds,
    };
  }

  @SubscribeMessage('chat:join-channel')
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!data?.channelId) return { success: false, error: 'Channel ID required' };
    const userId = client.data.userId;
    if (!userId) return { success: false, error: 'Unauthorized' };

    const channel = await this.prisma.channel.findUnique({
      where: { id: data.channelId },
      include: {
        circle: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (channel && channel.circle.members.length > 0) {
      client.join(`channel:${data.channelId}`);
      this.logger.debug(`User ${userId} joined room channel:${data.channelId}`);
      return { success: true, channelId: data.channelId };
    }

    return { success: false, error: 'Not a member of this circle' };
  }

  @SubscribeMessage('chat:leave-channel')
  handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    if (data?.channelId) {
      client.leave(`channel:${data.channelId}`);
      this.logger.debug(`User ${client.data.userId || client.id} left room channel:${data.channelId}`);
      return { success: true, channelId: data.channelId };
    }
    return { success: false, error: 'Channel ID required' };
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!data?.channelId || !userId) return;

    client.to(`channel:${data.channelId}`).emit('chat:user-typing', {
      channelId: data.channelId,
      userId,
      isTyping: !!data.isTyping,
    });
  }

  broadcastNewMessage(channelId: string, message: any) {
    if (this.server) {
      this.server.to(`channel:${channelId}`).emit('chat:message', message);
    }
  }

  broadcastReaction(channelId: string, payload: any) {
    if (this.server) {
      this.server.to(`channel:${channelId}`).emit('chat:reaction', payload);
    }
  }

  broadcastPinMessage(channelId: string, payload: any) {
    if (this.server) {
      this.server.to(`channel:${channelId}`).emit('chat:pin', payload);
    }
  }

  broadcastUnpinMessage(channelId: string, payload: any) {
    if (this.server) {
      this.server.to(`channel:${channelId}`).emit('chat:unpin', payload);
    }
  }

  /**
   * Helper to check if a user is currently online
   */
  isUserOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }
}
