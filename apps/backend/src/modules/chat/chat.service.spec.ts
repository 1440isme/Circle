import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from './chat.gateway';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ChannelType, MemberRole, MessageType } from '@prisma/client';

describe('ChatService — Module 4 Realtime Group Messaging', () => {
  let service: ChatService;

  const mockGateway = {
    broadcastNewMessage: jest.fn(),
    broadcastReaction: jest.fn(),
    broadcastPinMessage: jest.fn(),
    broadcastUnpinMessage: jest.fn(),
    broadcastMessageUpdated: jest.fn(),
    broadcastMessageRecalled: jest.fn(),
  };

  const mockPrisma = {
    circleMember: {
      findUnique: jest.fn(),
    },
    channel: {
      findUnique: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reaction: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    pinnedRecord: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockMember = {
    id: 'member-1',
    circleId: 'circle-1',
    userId: 'user-1',
    role: MemberRole.MEMBER,
    nickname: 'Binh Truong',
    joinedAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
    user: {
      id: 'user-1',
      email: 'binh@circle.com',
      isActivated: true,
      globalRole: 'USER',
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-09-01T00:00:00Z'),
      profile: {
        id: 'prof-1',
        userId: 'user-1',
        displayName: 'Trương Công Bình',
        avatarUrl: 'https://avatar.com/1.png',
        bio: 'Coding enthusiast',
        dateOfBirth: null,
        updatedAt: new Date('2026-09-01T00:00:00Z'),
      },
    },
  };

  const mockChannel = {
    id: 'channel-1',
    circleId: 'circle-1',
    name: 'general',
    type: ChannelType.TEXT,
    topic: 'General discussion',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  describe('ensureCircleMembership', () => {
    it('TC-CHAT-001: should return member when user is part of the circle', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);

      const result = await service.ensureCircleMembership('user-1', 'circle-1', 'vi');
      expect(result.id).toBe('member-1');
      expect(mockPrisma.circleMember.findUnique).toHaveBeenCalledWith({
        where: { circleId_userId: { circleId: 'circle-1', userId: 'user-1' } },
        include: { user: { include: { profile: true } } },
      });
    });

    it('TC-CHAT-002: should throw ForbiddenException when user is NOT in the circle', async () => {
      mockPrisma.circleMember.findUnique.mockResolvedValue(null);

      await expect(
        service.ensureCircleMembership('user-outsider', 'circle-1', 'vi'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendMessage', () => {
    it('TC-CHAT-003: should throw NotFoundException if channel does not exist', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', 'invalid-channel', { content: 'Hello' }, 'vi'),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-CHAT-004: should throw ForbiddenException if user is not in the circle', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(mockChannel);
      mockPrisma.circleMember.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage('user-outsider', 'channel-1', { content: 'Hello' }, 'vi'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('TC-CHAT-005: should throw BadRequestException if replyToId does not exist in channel', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(mockChannel);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.message.findFirst.mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', 'channel-1', { content: 'Hello', replyToId: 'non-existing' }, 'vi'),
      ).rejects.toThrow(BadRequestException);
    });

    it('TC-CHAT-006: should create text message and broadcast via gateway', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(mockChannel);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);

      const createdRaw = {
        id: 'msg-1',
        channelId: 'channel-1',
        memberId: 'member-1',
        type: MessageType.TEXT,
        content: 'Xin chào cả nhóm!',
        fileUrl: null,
        fileName: null,
        fileSize: null,
        audioDuration: null,
        replyToId: null,
        sentAt: new Date('2026-09-29T10:00:00Z'),
        updatedAt: new Date('2026-09-29T10:00:00Z'),
        sender: mockMember,
        replyTo: null,
        reactions: [],
        pinnedRecord: null,
      };

      mockPrisma.message.create.mockResolvedValue(createdRaw);

      const res = await service.sendMessage('user-1', 'channel-1', { content: 'Xin chào cả nhóm!' }, 'vi');

      expect(res.success).toBe(true);
      expect(res.data.id).toBe('msg-1');
      expect(res.data.content).toBe('Xin chào cả nhóm!');
      expect(mockGateway.broadcastNewMessage).toHaveBeenCalledWith('channel-1', expect.objectContaining({ id: 'msg-1' }));
    });

    it('TC-CHAT-007: should create file attachment message (UC11)', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(mockChannel);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);

      const createdRaw = {
        id: 'msg-2',
        channelId: 'channel-1',
        memberId: 'member-1',
        type: MessageType.FILE,
        content: null,
        fileUrl: 'https://r2.circle.com/attachments/doc.pdf',
        fileName: 'doc.pdf',
        fileSize: 1024000,
        audioDuration: null,
        replyToId: null,
        sentAt: new Date(),
        updatedAt: new Date(),
        sender: mockMember,
        replyTo: null,
        reactions: [],
        pinnedRecord: null,
      };

      mockPrisma.message.create.mockResolvedValue(createdRaw);

      const res = await service.sendMessage('user-1', 'channel-1', {
        type: 'FILE',
        fileUrl: 'https://r2.circle.com/attachments/doc.pdf',
        fileName: 'doc.pdf',
        fileSize: 1024000,
      }, 'vi');

      expect(res.success).toBe(true);
      expect(res.data.type).toBe('FILE');
      expect(res.data.fileUrl).toBe('https://r2.circle.com/attachments/doc.pdf');
    });
  });

  describe('getChannelMessages', () => {
    it('TC-CHAT-008: should fetch paginated messages and return chronological order', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(mockChannel);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);

      const msgA = {
        id: 'msg-1',
        channelId: 'channel-1',
        memberId: 'member-1',
        type: MessageType.TEXT,
        content: 'Tin nhắn 1',
        sentAt: new Date('2026-09-29T10:00:00Z'),
        updatedAt: new Date('2026-09-29T10:00:00Z'),
        sender: mockMember,
        reactions: [],
      };

      const msgB = {
        id: 'msg-2',
        channelId: 'channel-1',
        memberId: 'member-1',
        type: MessageType.TEXT,
        content: 'Tin nhắn 2',
        sentAt: new Date('2026-09-29T10:05:00Z'),
        updatedAt: new Date('2026-09-29T10:05:00Z'),
        sender: mockMember,
        reactions: [],
      };

      // Raw returns desc: [msgB, msgA]
      mockPrisma.message.findMany.mockResolvedValue([msgB, msgA]);

      const res = await service.getChannelMessages('user-1', 'channel-1', { limit: 10 }, 'vi');

      expect(res.success).toBe(true);
      expect(res.data.messages).toHaveLength(2);
      // Reversed to chronological asc: msg-1 then msg-2
      expect(res.data.messages[0]!.id).toBe('msg-1');
      expect(res.data.messages[1]!.id).toBe('msg-2');
      expect(res.data.hasMore).toBe(false);
    });
  });

  describe('reactToMessage', () => {
    it('TC-CHAT-009: should add emoji reaction when not previously reacted', async () => {
      const targetMsg = {
        id: 'msg-1',
        channelId: 'channel-1',
        deletedAt: null,
        channel: mockChannel,
      };

      mockPrisma.message.findUnique.mockResolvedValue(targetMsg);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.reaction.findFirst.mockResolvedValue(null);
      mockPrisma.reaction.create.mockResolvedValue({ id: 'r-1', messageId: 'msg-1', memberId: 'member-1', emoji: '❤️' });
      mockPrisma.reaction.findMany.mockResolvedValue([{ id: 'r-1', messageId: 'msg-1', memberId: 'member-1', emoji: '❤️' }]);

      const res = await service.reactToMessage('user-1', 'msg-1', { emoji: '❤️' }, 'vi');

      expect(res.success).toBe(true);
      expect(res.data.action).toBe('added');
      expect(res.data.reactionCounts['❤️']).toBe(1);
      expect(mockGateway.broadcastReaction).toHaveBeenCalledWith('channel-1', expect.objectContaining({ action: 'added', emoji: '❤️' }));
    });

    it('TC-CHAT-010: should toggle remove reaction when already reacted', async () => {
      const targetMsg = {
        id: 'msg-1',
        channelId: 'channel-1',
        deletedAt: null,
        channel: mockChannel,
      };

      mockPrisma.message.findUnique.mockResolvedValue(targetMsg);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.reaction.findFirst.mockResolvedValue({ id: 'r-1', messageId: 'msg-1', memberId: 'member-1', emoji: '❤️' });
      mockPrisma.reaction.delete.mockResolvedValue({ id: 'r-1' });
      mockPrisma.reaction.findMany.mockResolvedValue([]);

      const res = await service.reactToMessage('user-1', 'msg-1', { emoji: '❤️' }, 'vi');

      expect(res.success).toBe(true);
      expect(res.data.action).toBe('removed');
      expect(mockGateway.broadcastReaction).toHaveBeenCalledWith('channel-1', expect.objectContaining({ action: 'removed', emoji: '❤️' }));
    });
  });

  describe('pinMessage & unpinMessage (UC13)', () => {
    it('TC-CHAT-011: should pin message and broadcast event', async () => {
      const targetMsg = {
        id: 'msg-1',
        channelId: 'channel-1',
        deletedAt: null,
        channel: mockChannel,
        pinnedRecord: null,
      };

      mockPrisma.message.findUnique.mockResolvedValue(targetMsg);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.pinnedRecord.create.mockResolvedValue({
        id: 'pin-1',
        circleId: 'circle-1',
        messageId: 'msg-1',
        pinnedAt: new Date(),
      });

      const res = await service.pinMessage('user-1', 'msg-1', 'vi');

      expect(res.success).toBe(true);
      expect(mockGateway.broadcastPinMessage).toHaveBeenCalledWith('channel-1', expect.objectContaining({ messageId: 'msg-1' }));
    });

    it('TC-CHAT-012: should throw BadRequestException if message already pinned', async () => {
      const targetMsg = {
        id: 'msg-1',
        channelId: 'channel-1',
        deletedAt: null,
        channel: mockChannel,
        pinnedRecord: { id: 'pin-1' },
      };

      mockPrisma.message.findUnique.mockResolvedValue(targetMsg);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);

      await expect(service.pinMessage('user-1', 'msg-1', 'vi')).rejects.toThrow(BadRequestException);
    });

    it('TC-CHAT-013: should unpin message successfully', async () => {
      const targetMsg = {
        id: 'msg-1',
        channelId: 'channel-1',
        deletedAt: null,
        channel: mockChannel,
        pinnedRecord: { id: 'pin-1' },
      };

      mockPrisma.message.findUnique.mockResolvedValue(targetMsg);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.pinnedRecord.delete.mockResolvedValue({ id: 'pin-1' });

      const res = await service.unpinMessage('user-1', 'msg-1', 'vi');

      expect(res.success).toBe(true);
      expect(mockGateway.broadcastUnpinMessage).toHaveBeenCalledWith('channel-1', { messageId: 'msg-1' });
    });
  });

  describe('getPinnedMessages', () => {
    it('TC-CHAT-014: should return all pinned messages in channel', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(mockChannel);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);

      mockPrisma.pinnedRecord.findMany.mockResolvedValue([
        {
          id: 'pin-1',
          circleId: 'circle-1',
          messageId: 'msg-1',
          pinnedAt: new Date(),
          message: {
            id: 'msg-1',
            channelId: 'channel-1',
            memberId: 'member-1',
            type: MessageType.TEXT,
            content: 'Nội quy phòng chat',
            sentAt: new Date(),
            updatedAt: new Date(),
            sender: mockMember,
            reactions: [],
            pinnedRecord: { id: 'pin-1' },
          },
        },
      ]);

      const res = await service.getPinnedMessages('user-1', 'channel-1', 'vi');

      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data[0]!.content).toBe('Nội quy phòng chat');
      expect(res.data[0]!.isPinned).toBe(true);
    });
  });

  describe('editMessage (CHT-09)', () => {
    it('TC-CHAT-015: should allow original author to edit their message', async () => {
      const mockMsg = {
        id: 'msg-1',
        channelId: 'channel-1',
        memberId: 'member-1',
        type: MessageType.TEXT,
        content: 'Original content',
        sentAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        channel: mockChannel,
        sender: mockMember,
      };

      mockPrisma.message.findUnique.mockResolvedValue(mockMsg);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.message.update.mockResolvedValue({
        ...mockMsg,
        content: 'Updated content',
        updatedAt: new Date(),
        sender: mockMember,
      });

      const res = await service.editMessage('user-1', 'msg-1', { content: 'Updated content' }, 'vi');

      expect(res.success).toBe(true);
      expect(res.data.content).toBe('Updated content');
      expect(mockGateway.broadcastMessageUpdated).toHaveBeenCalledWith('channel-1', expect.anything());
    });

    it('TC-CHAT-016: should forbid non-author from editing message', async () => {
      const mockMsg = {
        id: 'msg-1',
        channelId: 'channel-1',
        memberId: 'member-other',
        type: MessageType.TEXT,
        content: 'Original content',
        sentAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        channel: mockChannel,
        sender: { ...mockMember, id: 'member-other' },
      };

      mockPrisma.message.findUnique.mockResolvedValue(mockMsg);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);

      await expect(
        service.editMessage('user-1', 'msg-1', { content: 'Hacked content' }, 'vi'),
      ).rejects.toThrow();
    });
  });

  describe('recallMessage (CHT-10)', () => {
    it('TC-CHAT-017: should allow author to recall their message and clear content', async () => {
      const mockMsg = {
        id: 'msg-1',
        channelId: 'channel-1',
        memberId: 'member-1',
        type: MessageType.TEXT,
        content: 'Sensitive info',
        sentAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        channel: mockChannel,
        sender: mockMember,
        pinnedRecord: null,
      };

      mockPrisma.message.findUnique.mockResolvedValue(mockMsg);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.message.update.mockResolvedValue({
        ...mockMsg,
        content: null,
        fileUrl: null,
        deletedAt: new Date(),
        sender: mockMember,
      });

      const res = await service.recallMessage('user-1', 'msg-1', 'vi');

      expect(res.success).toBe(true);
      expect(res.data.content).toBeNull();
      expect(res.data.deletedAt).toBeTruthy();
      expect(mockGateway.broadcastMessageRecalled).toHaveBeenCalledWith('channel-1', 'msg-1', expect.anything());
    });

    it('TC-CHAT-018: should allow circle OWNER to recall member message', async () => {
      const ownerMember = { ...mockMember, id: 'member-owner', role: 'OWNER' };
      const otherMsg = {
        id: 'msg-2',
        channelId: 'channel-1',
        memberId: 'member-other',
        type: MessageType.TEXT,
        content: 'Bad content',
        sentAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        channel: mockChannel,
        sender: { ...mockMember, id: 'member-other' },
        pinnedRecord: null,
      };

      mockPrisma.message.findUnique.mockResolvedValue(otherMsg);
      mockPrisma.circleMember.findUnique.mockResolvedValue(ownerMember);
      mockPrisma.message.update.mockResolvedValue({
        ...otherMsg,
        content: null,
        deletedAt: new Date(),
        sender: { ...mockMember, id: 'member-other' },
      });

      const res = await service.recallMessage('user-owner', 'msg-2', 'vi');

      expect(res.success).toBe(true);
      expect(res.data.deletedAt).toBeTruthy();
    });
  });

  describe('searchMessages (CHT-17)', () => {
    it('TC-CHAT-019: should search messages containing query in channel', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(mockChannel);
      mockPrisma.circleMember.findUnique.mockResolvedValue(mockMember);

      mockPrisma.message.findMany.mockResolvedValue([
        {
          id: 'msg-search-1',
          channelId: 'channel-1',
          memberId: 'member-1',
          type: MessageType.TEXT,
          content: 'Họp nhóm đồ án lúc 8h',
          sentAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          sender: mockMember,
        },
      ]);

      const res = await service.searchMessages('user-1', 'channel-1', { q: 'đồ án' }, 'vi');

      expect(res.success).toBe(true);
      expect(res.data.messages).toHaveLength(1);
      expect(res.data.messages[0]!.content).toContain('đồ án');
    });
  });
});
