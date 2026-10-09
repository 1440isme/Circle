import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { FriendshipStatus } from '@prisma/client';
import {
  FriendItem,
  FriendRequestItem,
  FriendSearchResult,
  FriendRelationshipStatus,
} from '@circle/types';
import { Locale, locales } from '@circle/shared';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Retrieves all accepted friends of the current user
   */
  async getFriends(userId: string): Promise<FriendItem[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: FriendshipStatus.ACCEPTED,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return friendships.map((f) => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      return {
        id: friend.id,
        friendshipId: f.id,
        email: friend.email,
        displayName:
          friend.profile?.displayName ||
          friend.email.split('@')[0] ||
          friend.email,
        avatarUrl: friend.profile?.avatarUrl ?? null,
        bio: friend.profile?.bio ?? null,
        since: f.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Retrieves received pending friend requests
   */
  async getReceivedRequests(userId: string): Promise<FriendRequestItem[]> {
    const requests = await this.prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      userId: r.sender.id,
      email: r.sender.email,
      displayName:
        r.sender.profile?.displayName ||
        r.sender.email.split('@')[0] ||
        r.sender.email,
      avatarUrl: r.sender.profile?.avatarUrl ?? null,
      bio: r.sender.profile?.bio ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Retrieves sent pending friend requests
   */
  async getSentRequests(userId: string): Promise<FriendRequestItem[]> {
    const requests = await this.prisma.friendship.findMany({
      where: {
        senderId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      userId: r.receiver.id,
      email: r.receiver.email,
      displayName:
        r.receiver.profile?.displayName ||
        r.receiver.email.split('@')[0] ||
        r.receiver.email,
      avatarUrl: r.receiver.profile?.avatarUrl ?? null,
      bio: r.receiver.profile?.bio ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Searches users by email or display name and returns relationship status relative to userId
   */
  async searchUsers(userId: string, rawQuery?: string): Promise<FriendSearchResult[]> {
    const query = rawQuery?.trim();

    // 1. Find candidate users (filtered by query if provided, or suggested platform users if empty)
    const matchedUsers = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        deletedAt: null,
        ...(query
          ? {
              OR: [
                { email: { contains: query, mode: 'insensitive' } },
                { profile: { displayName: { contains: query, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    if (matchedUsers.length === 0) {
      return [];
    }

    const matchedUserIds = matchedUsers.map((u) => u.id);

    // 2. Fetch all existing friendships with matched users
    const existingFriendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: matchedUserIds } },
          { senderId: { in: matchedUserIds }, receiverId: userId },
        ],
      },
    });

    const friendshipMap = new Map<string, typeof existingFriendships[0]>();
    for (const f of existingFriendships) {
      const otherId = f.senderId === userId ? f.receiverId : f.senderId;
      friendshipMap.set(otherId, f);
    }

    // 3. Map with relationship status
    return matchedUsers.map((u) => {
      const f = friendshipMap.get(u.id);
      let relationship: FriendRelationshipStatus = 'NONE';
      let friendshipId: string | null = null;

      if (f) {
        friendshipId = f.id;
        if (f.status === FriendshipStatus.ACCEPTED) {
          relationship = 'FRIEND';
        } else if (f.status === FriendshipStatus.PENDING) {
          relationship = f.senderId === userId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
        } else if (f.status === FriendshipStatus.BLOCKED) {
          relationship = 'BLOCKED';
        }
      }

      return {
        id: u.id,
        email: u.email,
        displayName: u.profile?.displayName || u.email.split('@')[0] || u.email,
        avatarUrl: u.profile?.avatarUrl ?? null,
        bio: u.profile?.bio ?? null,
        relationship,
        friendshipId,
      };
    });
  }

  /**
   * Sends a friend request to targetUserId
   */
  async sendFriendRequest(
    userId: string,
    targetUserId: string,
    locale: Locale = 'vi',
  ) {
    const dict = locales[locale] || locales.vi;

    if (userId === targetUserId) {
      throw new BadRequestException(dict.friend.cannotFriendSelf);
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      include: { profile: true },
    });

    if (!targetUser) {
      throw new NotFoundException(dict.friend.userNotFound);
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException(dict.friend.alreadyFriendsError);
      }

      if (existing.status === FriendshipStatus.PENDING) {
        if (existing.senderId === userId) {
          throw new ConflictException(dict.friend.requestAlreadySentError);
        } else {
          // The target user already sent a friend request -> Auto-accept!
          const accepted = await this.prisma.friendship.update({
            where: { id: existing.id },
            data: { status: FriendshipStatus.ACCEPTED },
          });

          // Notify sender
          const currentUser = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
          });
          const currentName =
            currentUser?.profile?.displayName ||
            currentUser?.email.split('@')[0] ||
            'Thành viên';

          await this.prisma.notification.create({
            data: {
              userId: targetUserId,
              title: dict.friend.acceptSuccess,
              content: `${currentName} đã chấp nhận lời mời kết bạn của bạn.`,
              type: 'FRIEND_ACCEPTED',
            },
          });

          this.chatGateway.emitToUser(targetUserId, 'friend:request_accepted', {
            friendshipId: accepted.id,
            friend: {
              id: userId,
              displayName: currentName,
              avatarUrl: currentUser?.profile?.avatarUrl ?? null,
              email: currentUser?.email,
            },
          });

          return { friendship: accepted, message: dict.friend.acceptSuccess };
        }
      }

      if (existing.status === FriendshipStatus.REJECTED) {
        // Reactivate request to pending
        const renewed = await this.prisma.friendship.update({
          where: { id: existing.id },
          data: {
            senderId: userId,
            receiverId: targetUserId,
            status: FriendshipStatus.PENDING,
          },
        });

        await this.createRequestNotificationAndEmit(userId, targetUserId, renewed.id);
        return { friendship: renewed, message: dict.friend.sendSuccess };
      }
    }

    // Create fresh friendship request
    const created = await this.prisma.friendship.create({
      data: {
        senderId: userId,
        receiverId: targetUserId,
        status: FriendshipStatus.PENDING,
      },
    });

    await this.createRequestNotificationAndEmit(userId, targetUserId, created.id);
    return { friendship: created, message: dict.friend.sendSuccess };
  }

  /**
   * Accepts a received friend request
   */
  async acceptFriendRequest(
    userId: string,
    friendshipId: string,
    locale: Locale = 'vi',
  ) {
    const dict = locales[locale] || locales.vi;

    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (
      !friendship ||
      friendship.receiverId !== userId ||
      friendship.status !== FriendshipStatus.PENDING
    ) {
      throw new NotFoundException(dict.friend.requestNotFound);
    }

    const updated = await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.ACCEPTED },
    });

    // Notify original sender
    const receiver = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const receiverName =
      receiver?.profile?.displayName ||
      receiver?.email.split('@')[0] ||
      'Thành viên';

    await this.prisma.notification.create({
      data: {
        userId: updated.senderId,
        title: dict.friend.acceptSuccess,
        content: `${receiverName} đã chấp nhận lời mời kết bạn của bạn.`,
        type: 'FRIEND_ACCEPTED',
      },
    });

    this.chatGateway.emitToUser(updated.senderId, 'friend:request_accepted', {
      friendshipId,
      friend: {
        id: userId,
        displayName: receiverName,
        avatarUrl: receiver?.profile?.avatarUrl ?? null,
        email: receiver?.email,
      },
    });

    return {
      success: true,
      friendship: updated,
      message: dict.friend.acceptSuccess,
    };
  }

  /**
   * Rejects a received friend request
   */
  async rejectFriendRequest(
    userId: string,
    friendshipId: string,
    locale: Locale = 'vi',
  ) {
    const dict = locales[locale] || locales.vi;

    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (
      !friendship ||
      friendship.receiverId !== userId ||
      friendship.status !== FriendshipStatus.PENDING
    ) {
      throw new NotFoundException(dict.friend.requestNotFound);
    }

    // Delete record so request can be cleanly resent in the future
    await this.prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return {
      success: true,
      message: dict.friend.rejectSuccess,
    };
  }

  /**
   * Cancels a sent pending friend request
   */
  async cancelFriendRequest(
    userId: string,
    friendshipId: string,
    locale: Locale = 'vi',
  ) {
    const dict = locales[locale] || locales.vi;

    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (
      !friendship ||
      friendship.senderId !== userId ||
      friendship.status !== FriendshipStatus.PENDING
    ) {
      throw new NotFoundException(dict.friend.requestNotFound);
    }

    await this.prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return {
      success: true,
      message: dict.friend.cancelSuccess,
    };
  }

  /**
   * Unfriends an existing friend
   */
  async unfriend(
    userId: string,
    friendId: string,
    locale: Locale = 'vi',
  ) {
    const dict = locales[locale] || locales.vi;

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
        status: FriendshipStatus.ACCEPTED,
      },
    });

    if (!friendship) {
      throw new NotFoundException(dict.friend.requestNotFound);
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    // Notify friend via socket
    this.chatGateway.emitToUser(friendId, 'friend:removed', {
      friendId: userId,
    });

    return {
      success: true,
      message: dict.friend.unfriendSuccess,
    };
  }

  /**
   * Private helper to send in-app notification & realtime socket event for friend request
   */
  private async createRequestNotificationAndEmit(
    senderId: string,
    targetUserId: string,
    friendshipId: string,
  ) {
    try {
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        include: { profile: true },
      });
      const senderName =
        sender?.profile?.displayName ||
        sender?.email.split('@')[0] ||
        'Thành viên';

      await this.prisma.notification.create({
        data: {
          userId: targetUserId,
          title: 'Lời mời kết bạn mới',
          content: `${senderName} đã gửi cho bạn lời mời kết bạn.`,
          type: 'FRIEND_REQUEST',
        },
      });

      this.chatGateway.emitToUser(targetUserId, 'friend:request_received', {
        friendshipId,
        sender: {
          id: senderId,
          displayName: senderName,
          avatarUrl: sender?.profile?.avatarUrl ?? null,
          email: sender?.email,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to dispatch friend request notification: ${err.message}`);
    }
  }
}
