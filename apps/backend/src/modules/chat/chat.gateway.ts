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

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

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
      client.data.user = payload;
      client.data.userId = payload.sub;

      client.join(`user:${payload.sub}`);
      this.logger.debug(`Socket connected: ${client.id} (user: ${payload.sub})`);
    } catch (err: any) {
      this.logger.debug(`Socket authentication failed for ${client.id}: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);
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
}
