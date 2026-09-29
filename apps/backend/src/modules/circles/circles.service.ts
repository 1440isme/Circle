import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole, ChannelType, FriendshipStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateCircleInput, UpdateCircleInput, JoinCircleInput, Locale, locales } from '@circle/shared';
import { SelectableFriendItem } from '@circle/types';

@Injectable()
export class CirclesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a collision-resistant 8-character uppercase invite code
   */
  private async generateUniqueInviteCode(): Promise<string> {
    for (let attempts = 0; attempts < 5; attempts++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.prisma.circle.findUnique({
        where: { inviteCode: code },
        select: { id: true },
      });
      if (!existing) {
        return code;
      }
    }
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  /**
   * Generates an automatic, clean, URL-friendly unique handle based on Circle name
   */
  private async generateUniqueHandle(baseName: string): Promise<string> {
    const rawSlug = baseName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const baseSlug = (rawSlug.length >= 2 ? rawSlug : 'circle').slice(0, 20).replace(/-+$/, '');

    for (let attempts = 0; attempts < 5; attempts++) {
      const suffix = crypto.randomBytes(2).toString('hex'); // 4 hex chars e.g. 4a8b
      const candidate = `${baseSlug}-${suffix}`;
      const existing = await this.prisma.circle.findUnique({
        where: { handle: candidate },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
    }

    return `${baseSlug}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Creates a new Circle with an OWNER role for creator, initial members if any, and a default #general channel
   */
  async create(userId: string, input: CreateCircleInput, locale: Locale = 'vi') {
    const t = locales[locale] || locales.vi;

    // Resolve unique initial member IDs (excluding creator to prevent duplicate assignment)
    const uniqueMemberIds = Array.from(
      new Set(
        (input.memberIds || []).filter((id): id is string => typeof id === 'string' && id !== userId),
      ),
    );

    // 1. Resolve Circle Name:
    // If name is provided, use it. Otherwise, if friends are selected, concatenate their display names.
    let circleName = input.name?.trim() || '';
    if (!circleName) {
      if (uniqueMemberIds.length > 0) {
        const involvedUsers = await this.prisma.user.findMany({
          where: { id: { in: [userId, ...uniqueMemberIds] } },
          include: { profile: true },
        });

        // Current user first, followed by other selected members
        const sortedUsers = [
          ...involvedUsers.filter((u) => u.id === userId),
          ...involvedUsers.filter((u) => u.id !== userId),
        ];

        const names = sortedUsers.map(
          (u) => u.profile?.displayName || u.email.split('@')[0],
        );
        circleName = names.join(', ').slice(0, 50);
      } else {
        circleName = `Circle ${crypto.randomBytes(2).toString('hex')}`;
      }
    }

    // 2. Resolve Handle:
    // If handle is provided, validate uniqueness. If not, auto-generate a unique URL-friendly handle.
    let normalizedHandle = input.handle?.toLowerCase().trim() || '';
    if (normalizedHandle) {
      const existingCircle = await this.prisma.circle.findUnique({
        where: { handle: normalizedHandle },
        select: { id: true },
      });
      if (existingCircle) {
        throw new ConflictException(t.circle.handleTakenError);
      }
    } else {
      normalizedHandle = await this.generateUniqueHandle(circleName);
    }

    const inviteCode = await this.generateUniqueInviteCode();

    // Perform atomic creation of Circle, CircleMembers, and #general Channel
    const newCircle = await this.prisma.$transaction(async (tx) => {
      const circle = await tx.circle.create({
        data: {
          name: circleName,
          handle: normalizedHandle,
          description: input.description?.trim() || null,
          avatarUrl: input.avatarUrl || null,
          coverUrl: input.coverUrl || null,
          isPrivate: input.isPrivate ?? false,
          inviteCode,
        },
      });

      // Assign creator as OWNER
      await tx.circleMember.create({
        data: {
          circleId: circle.id,
          userId,
          role: MemberRole.OWNER,
        },
      });

      // Assign selected friends as MEMBERs
      for (const friendId of uniqueMemberIds) {
        await tx.circleMember.create({
          data: {
            circleId: circle.id,
            userId: friendId,
            role: MemberRole.MEMBER,
          },
        });
      }

      // Create default general text channel
      const defaultChannel = await tx.channel.create({
        data: {
          circleId: circle.id,
          name: 'general',
          type: ChannelType.TEXT,
          topic: t.circle.generalChannelTopic || 'General discussion channel',
        },
      });

      return {
        ...circle,
        channels: [defaultChannel],
      };
    });

    return {
      success: true,
      statusCode: 201,
      message: t.circle.createSuccess,
      data: {
        ...newCircle,
        role: MemberRole.OWNER,
        memberCount: 1 + uniqueMemberIds.length,
      },
    };
  }

  /**
   * Retrieves list of selectable friends for quick Circle creation
   */
  async getSelectableFriends(userId: string): Promise<SelectableFriendItem[]> {
    // Look up accepted friendships
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: FriendshipStatus.ACCEPTED,
      },
      include: {
        sender: { include: { profile: true } },
        receiver: { include: { profile: true } },
      },
    });

    if (friendships.length > 0) {
      return friendships.map((f) => {
        const friend = f.senderId === userId ? f.receiver : f.sender;
        return {
          id: friend.id,
          email: friend.email,
          displayName: friend.profile?.displayName || friend.email.split('@')[0] || friend.email,
          avatarUrl: friend.profile?.avatarUrl || null,
        };
      });
    }

    // Fallback: If no accepted friends exist yet, query other active users in the system
    // so that the user is never blocked when testing friend selection
    const platformUsers = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        deletedAt: null,
      },
      include: { profile: true },
      take: 20,
    });

    return platformUsers.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.profile?.displayName || u.email.split('@')[0] || u.email,
      avatarUrl: u.profile?.avatarUrl || null,
    }));
  }

  /**
   * Retrieves all Circles that the current user belongs to
   */
  async findUserCircles(userId: string, _locale: Locale = 'vi') {
    const circles = await this.prisma.circle.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          where: { userId },
          select: {
            role: true,
            nickname: true,
            joinedAt: true,
          },
        },
        channels: {
          select: {
            id: true,
            name: true,
            type: true,
            topic: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const data = circles.map((circle) => ({
      id: circle.id,
      name: circle.name,
      handle: circle.handle,
      avatarUrl: circle.avatarUrl,
      coverUrl: circle.coverUrl,
      description: circle.description,
      inviteCode: circle.inviteCode,
      isPrivate: circle.isPrivate,
      createdAt: circle.createdAt,
      updatedAt: circle.updatedAt,
      role: circle.members[0]?.role || MemberRole.MEMBER,
      nickname: circle.members[0]?.nickname || null,
      memberCount: circle._count.members,
      channels: circle.channels,
    }));

    return {
      success: true,
      statusCode: 200,
      data,
    };
  }

  /**
   * Retrieves Circle details by ID or Handle
   */
  async findByIdOrHandle(idOrHandle: string, userId: string, locale: Locale = 'vi') {
    const t = locales[locale] || locales.vi;
    const circle = await this.prisma.circle.findFirst({
      where: {
        OR: [{ id: idOrHandle }, { handle: idOrHandle.toLowerCase().trim() }],
        deletedAt: null,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
        channels: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!circle) {
      throw new NotFoundException(t.circle.notFound);
    }

    const currentMember = circle.members.find((m) => m.userId === userId);

    // If private circle, check membership
    if (circle.isPrivate && !currentMember) {
      throw new ForbiddenException(t.circle.privateForbidden);
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        id: circle.id,
        name: circle.name,
        handle: circle.handle,
        avatarUrl: circle.avatarUrl,
        coverUrl: circle.coverUrl,
        description: circle.description,
        inviteCode: circle.inviteCode,
        isPrivate: circle.isPrivate,
        createdAt: circle.createdAt,
        updatedAt: circle.updatedAt,
        role: currentMember?.role,
        memberCount: circle._count.members,
        channels: circle.channels,
        members: circle.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          nickname: m.nickname,
          joinedAt: m.joinedAt,
          user: {
            id: m.user.id,
            email: m.user.email,
            profile: m.user.profile,
          },
        })),
      },
    };
  }

  /**
   * Updates Circle metadata (Requires OWNER or ADMIN role)
   */
  async update(circleId: string, userId: string, input: UpdateCircleInput, locale: Locale = 'vi') {
    const t = locales[locale] || locales.vi;
    const membership = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId,
          userId,
        },
      },
    });

    if (!membership || (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN)) {
      throw new ForbiddenException(t.circle.updateForbidden);
    }

    const updatedCircle = await this.prisma.circle.update({
      where: { id: circleId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() || null }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl || null }),
        ...(input.coverUrl !== undefined && { coverUrl: input.coverUrl || null }),
        ...(input.isPrivate !== undefined && { isPrivate: input.isPrivate }),
      },
    });

    return {
      success: true,
      statusCode: 200,
      message: t.circle.updateSuccess,
      data: updatedCircle,
    };
  }

  /**
   * Joins a Circle using an invite code
   */
  async joinByInviteCode(userId: string, input: JoinCircleInput, locale: Locale = 'vi') {
    const t = locales[locale] || locales.vi;
    const cleanCode = input.inviteCode.trim().toUpperCase();

    const circle = await this.prisma.circle.findUnique({
      where: {
        inviteCode: cleanCode,
      },
      include: {
        members: {
          where: { userId },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!circle || circle.deletedAt !== null) {
      throw new NotFoundException(t.circle.inviteCodeNotFound);
    }

    if (circle.members && circle.members.length > 0) {
      throw new ConflictException(t.circle.alreadyMember);
    }

    await this.prisma.circleMember.create({
      data: {
        circleId: circle.id,
        userId,
        role: MemberRole.MEMBER,
      },
    });

    return {
      success: true,
      statusCode: 200,
      message: t.circle.joinSuccess,
      data: {
        id: circle.id,
        name: circle.name,
        handle: circle.handle,
        avatarUrl: circle.avatarUrl,
        coverUrl: circle.coverUrl,
        description: circle.description,
        inviteCode: circle.inviteCode,
        isPrivate: circle.isPrivate,
        createdAt: circle.createdAt,
        updatedAt: circle.updatedAt,
        role: MemberRole.MEMBER,
        memberCount: circle._count.members + 1,
      },
    };
  }
}
