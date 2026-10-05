import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from './chat.gateway';
import {
  SendMessageInput,
  ReactMessageInput,
  MessagePaginationInput,
  Locale,
  locales,
} from '@circle/shared';
import { MessageType } from '@prisma/client';
import { ApiResponse, MessageEntity, CursorPaginatedMessages, MessageReaderEntity } from '@circle/types';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Helper to ensure user is an active member of the Circle
   */
  async ensureCircleMembership(userId: string, circleId: string, locale: Locale) {
    const t = locales[locale] || locales.vi;
    const member = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId,
          userId,
        },
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!member) {
      throw new ForbiddenException(t.chat.notCircleMember);
    }

    return member;
  }

  /**
   * Format Prisma Message to standard MessageEntity
   */
  private formatMessage(msg: any, currentMemberId?: string): MessageEntity {
    const reactionCounts: Record<string, number> = {};
    const userReactions: string[] = [];

    if (msg.reactions && Array.isArray(msg.reactions)) {
      for (const r of msg.reactions) {
        reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
        if (currentMemberId && r.memberId === currentMemberId) {
          if (!userReactions.includes(r.emoji)) {
            userReactions.push(r.emoji);
          }
        }
      }
    }

    return {
      id: msg.id,
      channelId: msg.channelId,
      memberId: msg.memberId,
      type: msg.type,
      content: msg.content,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      audioDuration: msg.audioDuration,
      replyToId: msg.replyToId,
      sentAt: msg.sentAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      sender: msg.sender
        ? {
            id: msg.sender.id,
            circleId: msg.sender.circleId,
            userId: msg.sender.userId,
            role: msg.sender.role,
            nickname: msg.sender.nickname,
            joinedAt: msg.sender.joinedAt.toISOString(),
            updatedAt: msg.sender.updatedAt.toISOString(),
            user: msg.sender.user
              ? {
                  id: msg.sender.user.id,
                  email: msg.sender.user.email,
                  isActivated: msg.sender.user.isActivated,
                  globalRole: msg.sender.user.globalRole,
                  createdAt: msg.sender.user.createdAt.toISOString(),
                  updatedAt: msg.sender.user.updatedAt.toISOString(),
                  profile: msg.sender.user.profile
                    ? {
                        id: msg.sender.user.profile.id,
                        userId: msg.sender.user.profile.userId,
                        displayName: msg.sender.user.profile.displayName,
                        avatarUrl: msg.sender.user.profile.avatarUrl,
                        bio: msg.sender.user.profile.bio,
                        dateOfBirth: msg.sender.user.profile.dateOfBirth?.toISOString() || null,
                        updatedAt: msg.sender.user.profile.updatedAt.toISOString(),
                      }
                    : null,
                }
              : undefined,
          }
        : undefined,
      replyTo: msg.replyTo
        ? {
            id: msg.replyTo.id,
            content: msg.replyTo.content,
            type: msg.replyTo.type,
            sender: msg.replyTo.sender
              ? {
                  id: msg.replyTo.sender.id,
                  nickname: msg.replyTo.sender.nickname,
                  user: msg.replyTo.sender.user
                    ? {
                        id: msg.replyTo.sender.user.id,
                        profile: msg.replyTo.sender.user.profile
                          ? {
                              displayName: msg.replyTo.sender.user.profile.displayName,
                              avatarUrl: msg.replyTo.sender.user.profile.avatarUrl,
                            }
                          : null,
                      }
                    : undefined,
                }
              : undefined,
          }
        : null,
      reactions: msg.reactions?.map((r: any) => ({
        id: r.id,
        messageId: r.messageId,
        memberId: r.memberId,
        emoji: r.emoji,
        createdAt: r.createdAt.toISOString(),
      })),
      reactionCounts,
      userReactions,
      isPinned: !!msg.pinnedRecord,
      readers: msg.receipts?.map((r: any) => ({
        userId: r.userId,
        displayName: r.user?.profile?.displayName || r.user?.email?.split('@')[0] || 'Member',
        avatarUrl: r.user?.profile?.avatarUrl || null,
        readAt: r.readAt instanceof Date ? r.readAt.toISOString() : new Date(r.readAt).toISOString(),
      })) || [],
      receipts: msg.receipts?.map((r: any) => ({
        id: r.id,
        messageId: r.messageId,
        userId: r.userId,
        readAt: r.readAt instanceof Date ? r.readAt.toISOString() : new Date(r.readAt).toISOString(),
      })) || [],
    };
  }

  /**
   * GET /api/v1/channels/:channelId/messages — Cursor-based message pagination
   */
  async getChannelMessages(
    userId: string,
    channelId: string,
    pagination: MessagePaginationInput,
    locale: Locale = 'vi',
  ): Promise<ApiResponse<CursorPaginatedMessages>> {
    const t = locales[locale] || locales.vi;
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(t.chat.channelNotFound);
    }

    const member = await this.ensureCircleMembership(userId, channel.circleId, locale);

    const limit = Math.min(Number(pagination.limit) || 30, 100);
    const cursor = pagination.cursor;
    const direction = pagination.direction || 'before';

    let rawMessages: any[];

    if (cursor) {
      if (direction === 'after') {
        rawMessages = await this.prisma.message.findMany({
          where: { channelId, deletedAt: null },
          take: limit + 1,
          skip: 1,
          cursor: { id: cursor },
          orderBy: { sentAt: 'asc' },
          include: {
            sender: { include: { user: { include: { profile: true } } } },
            replyTo: { include: { sender: { include: { user: { include: { profile: true } } } } } },
            reactions: { include: { member: { include: { user: { include: { profile: true } } } } } },
            pinnedRecord: true,
            receipts: { include: { user: { include: { profile: true } } } },
          },
        });
      } else {
        rawMessages = await this.prisma.message.findMany({
          where: { channelId, deletedAt: null },
          take: limit + 1,
          skip: 1,
          cursor: { id: cursor },
          orderBy: { sentAt: 'desc' },
          include: {
            sender: { include: { user: { include: { profile: true } } } },
            replyTo: { include: { sender: { include: { user: { include: { profile: true } } } } } },
            reactions: { include: { member: { include: { user: { include: { profile: true } } } } } },
            pinnedRecord: true,
            receipts: { include: { user: { include: { profile: true } } } },
          },
        });
      }
    } else {
      rawMessages = await this.prisma.message.findMany({
        where: { channelId, deletedAt: null },
        take: limit + 1,
        orderBy: { sentAt: 'desc' },
        include: {
          sender: { include: { user: { include: { profile: true } } } },
          replyTo: { include: { sender: { include: { user: { include: { profile: true } } } } } },
          reactions: { include: { member: { include: { user: { include: { profile: true } } } } } },
          pinnedRecord: true,
          receipts: { include: { user: { include: { profile: true } } } },
        },
      });
    }

    const hasMore = rawMessages.length > limit;
    if (hasMore) {
      rawMessages.pop();
    }

    const nextCursor = hasMore && rawMessages.length > 0
      ? rawMessages[rawMessages.length - 1].id
      : null;

    // For natural reading order top-to-bottom, ensure chronological asc order
    if (direction === 'before') {
      rawMessages.reverse();
    }

    const messages = rawMessages.map((m) => this.formatMessage(m, member.id));

    return {
      success: true,
      statusCode: 200,
      data: {
        messages,
        nextCursor,
        hasMore,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/channels/:channelId/messages — Send a new message
   */
  async sendMessage(
    userId: string,
    channelId: string,
    dto: SendMessageInput,
    locale: Locale = 'vi',
  ): Promise<ApiResponse<MessageEntity>> {
    const t = locales[locale] || locales.vi;
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(t.chat.channelNotFound);
    }

    const member = await this.ensureCircleMembership(userId, channel.circleId, locale);

    if (dto.replyToId) {
      const replyTarget = await this.prisma.message.findFirst({
        where: { id: dto.replyToId, channelId },
      });
      if (!replyTarget) {
        throw new BadRequestException(t.chat.replyNotFound);
      }
    }

    const rawMessage = await this.prisma.message.create({
      data: {
        channelId,
        memberId: member.id,
        type: (dto.type as MessageType) || MessageType.TEXT,
        content: dto.content?.trim() || null,
        fileUrl: dto.fileUrl?.trim() || null,
        fileName: dto.fileName?.trim() || null,
        fileSize: dto.fileSize || null,
        audioDuration: dto.audioDuration || null,
        replyToId: dto.replyToId?.trim() || null,
      },
      include: {
        sender: { include: { user: { include: { profile: true } } } },
        replyTo: { include: { sender: { include: { user: { include: { profile: true } } } } } },
        reactions: { include: { member: { include: { user: { include: { profile: true } } } } } },
        pinnedRecord: true,
        receipts: { include: { user: { include: { profile: true } } } },
      },
    });

    const formatted = this.formatMessage(rawMessage, member.id);

    // Broadcast realtime event to all clients in the channel
    this.chatGateway.broadcastNewMessage(channelId, formatted);

    return {
      success: true,
      statusCode: 201,
      message: t.chat.sendMessageSuccess,
      data: formatted,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/messages/:messageId/reactions — Toggle emoji reaction
   */
  async reactToMessage(
    userId: string,
    messageId: string,
    dto: ReactMessageInput,
    locale: Locale = 'vi',
  ): Promise<ApiResponse<{ messageId: string; emoji: string; action: 'added' | 'removed'; reactionCounts: Record<string, number>; userReactions: string[] }>> {
    const t = locales[locale] || locales.vi;
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: true },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException(t.chat.messageNotFound);
    }

    const member = await this.ensureCircleMembership(userId, message.channel.circleId, locale);

    const existingReaction = await this.prisma.reaction.findFirst({
      where: {
        messageId,
        memberId: member.id,
        emoji: dto.emoji,
      },
    });

    let action: 'added' | 'removed';

    if (existingReaction) {
      await this.prisma.reaction.delete({
        where: { id: existingReaction.id },
      });
      action = 'removed';
    } else {
      await this.prisma.reaction.create({
        data: {
          messageId,
          memberId: member.id,
          emoji: dto.emoji,
        },
      });
      action = 'added';
    }

    const allReactions = await this.prisma.reaction.findMany({
      where: { messageId },
    });

    const reactionCounts: Record<string, number> = {};
    const userReactions: string[] = [];

    for (const r of allReactions) {
      reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
      if (r.memberId === member.id && !userReactions.includes(r.emoji)) {
        userReactions.push(r.emoji);
      }
    }

    // Broadcast to room
    this.chatGateway.broadcastReaction(message.channelId, {
      messageId,
      emoji: dto.emoji,
      memberId: member.id,
      action,
      reactionCounts,
    });

    return {
      success: true,
      statusCode: 200,
      message: t.chat.reactionUpdated,
      data: {
        messageId,
        emoji: dto.emoji,
        action,
        reactionCounts,
        userReactions,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/messages/:messageId/pin — Pin a message (UC13)
   */
  async pinMessage(
    userId: string,
    messageId: string,
    locale: Locale = 'vi',
  ): Promise<ApiResponse<{ messageId: string; pinnedAt: string }>> {
    const t = locales[locale] || locales.vi;
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: true, pinnedRecord: true },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException(t.chat.messageNotFound);
    }

    await this.ensureCircleMembership(userId, message.channel.circleId, locale);

    if (message.pinnedRecord) {
      throw new BadRequestException(t.chat.alreadyPinned);
    }

    const record = await this.prisma.pinnedRecord.create({
      data: {
        circleId: message.channel.circleId,
        messageId,
      },
    });

    this.chatGateway.broadcastPinMessage(message.channelId, {
      messageId,
      pinnedAt: record.pinnedAt.toISOString(),
    });

    return {
      success: true,
      statusCode: 200,
      message: t.chat.pinSuccess,
      data: {
        messageId,
        pinnedAt: record.pinnedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/v1/messages/:messageId/pin — Unpin a message (UC13)
   */
  async unpinMessage(
    userId: string,
    messageId: string,
    locale: Locale = 'vi',
  ): Promise<ApiResponse<{ messageId: string }>> {
    const t = locales[locale] || locales.vi;
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: true, pinnedRecord: true },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException(t.chat.messageNotFound);
    }

    await this.ensureCircleMembership(userId, message.channel.circleId, locale);

    if (!message.pinnedRecord) {
      throw new BadRequestException(t.chat.notPinned);
    }

    await this.prisma.pinnedRecord.delete({
      where: { messageId },
    });

    this.chatGateway.broadcastUnpinMessage(message.channelId, {
      messageId,
    });

    return {
      success: true,
      statusCode: 200,
      message: t.chat.unpinSuccess,
      data: { messageId },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/channels/:channelId/pins — Get all pinned messages in a channel
   */
  async getPinnedMessages(
    userId: string,
    channelId: string,
    locale: Locale = 'vi',
  ): Promise<ApiResponse<MessageEntity[]>> {
    const t = locales[locale] || locales.vi;
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(t.chat.channelNotFound);
    }

    const member = await this.ensureCircleMembership(userId, channel.circleId, locale);

    const pinnedRecords = await this.prisma.pinnedRecord.findMany({
      where: {
        circleId: channel.circleId,
        message: {
          channelId,
          deletedAt: null,
        },
      },
      orderBy: { pinnedAt: 'desc' },
      include: {
        message: {
          include: {
            sender: { include: { user: { include: { profile: true } } } },
            replyTo: { include: { sender: { include: { user: { include: { profile: true } } } } } },
            reactions: { include: { member: { include: { user: { include: { profile: true } } } } } },
            pinnedRecord: true,
          },
        },
      },
    });

    const messages = pinnedRecords.map((pr) => this.formatMessage(pr.message, member.id));

    return {
      success: true,
      statusCode: 200,
      data: messages,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/messages/:messageId/read — Mark message as read
   */
  async markMessageAsRead(
    userId: string,
    messageId: string,
    locale: Locale = 'vi',
  ): Promise<ApiResponse<MessageReaderEntity>> {
    const t = locales[locale] || locales.vi;
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            circle: true,
          },
        },
      },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException(t.chat.messageNotFound);
    }

    await this.ensureCircleMembership(userId, message.channel.circleId, locale);

    const receipt = await this.prisma.messageReceipt.upsert({
      where: {
        messageId_userId: { messageId, userId },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId,
        readAt: new Date(),
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    const reader: MessageReaderEntity = {
      userId,
      displayName: receipt.user?.profile?.displayName || receipt.user?.email?.split('@')[0] || 'Member',
      avatarUrl: receipt.user?.profile?.avatarUrl || null,
      readAt: receipt.readAt.toISOString(),
    };

    // Broadcast to channel room
    this.chatGateway.broadcastMessageRead(message.channelId, messageId, reader);

    return {
      success: true,
      statusCode: 200,
      data: reader,
      timestamp: new Date().toISOString(),
    };
  }
}
