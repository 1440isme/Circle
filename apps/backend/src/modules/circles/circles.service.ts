import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole, ChannelType, FriendshipStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCircleInput,
  UpdateCircleInput,
  JoinCircleInput,
  CreateInviteInput,
  CreateJoinRequestInput,
  ReviewJoinRequestInput,
  Locale,
  locales,
} from '@circle/shared';
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
          maxMembers: input.maxMembers ?? null,
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
        maxMembers: circle.maxMembers,
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

    if (!membership || membership.role !== MemberRole.OWNER) {
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
        ...(input.maxMembers !== undefined && { maxMembers: input.maxMembers }),
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
   * Joins a Circle using an invite code (supports custom invites with expiry & max uses, and default circle inviteCode)
   */
  async joinByInviteCode(userId: string, input: JoinCircleInput, locale: Locale = 'vi') {
    const t = locales[locale] || locales.vi;
    const cleanCode = input.inviteCode.trim().toUpperCase();

    // 1. Check custom invite code first
    const customInvite = await this.prisma.circleInvite.findUnique({
      where: { code: cleanCode },
      include: {
        circle: {
          include: {
            members: { where: { userId } },
            _count: { select: { members: true } },
          },
        },
      },
    });

    if (customInvite && customInvite.circle && customInvite.circle.deletedAt === null) {
      if (customInvite.expiresAt && new Date() > customInvite.expiresAt) {
        throw new BadRequestException(t.circle.inviteCodeExpired);
      }
      if (customInvite.maxUses !== null && customInvite.useCount >= customInvite.maxUses) {
        throw new BadRequestException(t.circle.inviteCodeMaxUsesReached);
      }
      if (customInvite.circle.members && customInvite.circle.members.length > 0) {
        throw new ConflictException(t.circle.alreadyMember);
      }
      if (
        customInvite.circle.maxMembers !== null &&
        customInvite.circle._count.members >= customInvite.circle.maxMembers
      ) {
        throw new BadRequestException(t.circle.circleFull);
      }

      const circle = customInvite.circle;

      // If the Circle is Private, do NOT instantly join; send a pending join request
      if (circle.isPrivate) {
        const existingRequest = await this.prisma.circleJoinRequest.findUnique({
          where: { circleId_userId: { circleId: circle.id, userId } },
        });

        if (existingRequest && existingRequest.status === 'PENDING') {
          throw new ConflictException(t.circle.joinRequestAlreadyPending);
        }

        if (existingRequest) {
          await this.prisma.circleJoinRequest.update({
            where: { id: existingRequest.id },
            data: {
              status: 'PENDING',
              message: 'Yêu cầu tham gia qua mã mời',
            },
          });
        } else {
          await this.prisma.circleJoinRequest.create({
            data: {
              circleId: circle.id,
              userId,
              status: 'PENDING',
              message: 'Yêu cầu tham gia qua mã mời',
            },
          });
        }

        return {
          success: true,
          statusCode: 202,
          message: t.circle.joinRequestSent,
          data: {
            id: circle.id,
            name: circle.name,
            handle: circle.handle,
            avatarUrl: circle.avatarUrl,
            coverUrl: circle.coverUrl,
            description: circle.description,
            inviteCode: customInvite.code,
            isPrivate: circle.isPrivate,
            createdAt: circle.createdAt,
            updatedAt: circle.updatedAt,
            isPending: true,
          },
        };
      }

      // Public circle: instant join
      await this.prisma.$transaction([
        this.prisma.circleMember.create({
          data: {
            circleId: customInvite.circleId,
            userId,
            role: MemberRole.MEMBER,
          },
        }),
        this.prisma.circleInvite.update({
          where: { id: customInvite.id },
          data: { useCount: { increment: 1 } },
        }),
      ]);

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

    // 2. Check standard Circle inviteCode
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

    if (circle.maxMembers !== null && circle._count.members >= circle.maxMembers) {
      throw new BadRequestException(t.circle.circleFull);
    }

    // If the Circle is Private, do NOT instantly join; send a pending join request
    if (circle.isPrivate) {
      const existingRequest = await this.prisma.circleJoinRequest.findUnique({
        where: { circleId_userId: { circleId: circle.id, userId } },
      });

      if (existingRequest && existingRequest.status === 'PENDING') {
        throw new ConflictException(t.circle.joinRequestAlreadyPending);
      }

      if (existingRequest) {
        await this.prisma.circleJoinRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: 'PENDING',
            message: 'Yêu cầu tham gia qua mã mời',
          },
        });
      } else {
        await this.prisma.circleJoinRequest.create({
          data: {
            circleId: circle.id,
            userId,
            status: 'PENDING',
            message: 'Yêu cầu tham gia qua mã mời',
          },
        });
      }

      return {
        success: true,
        statusCode: 202,
        message: t.circle.joinRequestSent,
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
          isPending: true,
        },
      };
    }

    // Public circle: instant join
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

  /**
   * Generates a new custom invite code with optional expiry and usage limits (OWNER only)
   */
  async createCustomInviteCode(
    circleId: string,
    userId: string,
    input: CreateInviteInput,
    locale: Locale = 'vi',
  ) {
    const t = locales[locale] || locales.vi;

    const member = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: { circleId, userId },
      },
    });

    if (!member || member.role !== MemberRole.OWNER) {
      throw new ForbiddenException(t.circle.updateForbidden);
    }

    let code = '';
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existingInvite = await this.prisma.circleInvite.findUnique({
        where: { code: candidate },
        select: { id: true },
      });
      const existingCircle = await this.prisma.circle.findUnique({
        where: { inviteCode: candidate },
        select: { id: true },
      });
      if (!existingInvite && !existingCircle) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      code = crypto.randomBytes(6).toString('hex').toUpperCase();
    }

    const expiresAt =
      input.expiresInDays && input.expiresInDays > 0
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    const invite = await this.prisma.circleInvite.create({
      data: {
        circleId,
        code,
        createdById: member.id,
        expiresAt,
        maxUses: input.maxUses || null,
      },
    });

    return {
      success: true,
      statusCode: 201,
      message: t.circle.inviteCodeCreatedSuccess,
      data: invite,
    };
  }

  /**
   * Retrieves all active custom invite codes for a Circle (OWNER only)
   */
  async getCustomInvites(circleId: string, userId: string, locale: Locale = 'vi') {
    const t = locales[locale] || locales.vi;

    const member = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: { circleId, userId },
      },
    });

    if (!member || member.role !== MemberRole.OWNER) {
      throw new ForbiddenException(t.circle.updateForbidden);
    }

    const invites = await this.prisma.circleInvite.findMany({
      where: { circleId },
      include: {
        createdBy: {
          include: {
            user: {
              select: { id: true, email: true, profile: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      statusCode: 200,
      data: invites,
    };
  }

  /**
   * Adds new members to an existing Circle (Caller must be member of circle)
   */
  async addMembers(
    circleId: string,
    userId: string,
    memberIds: string[],
    locale: Locale = 'vi',
  ) {
    const t = locales[locale] || locales.vi;

    const caller = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });
    if (!caller) {
      throw new ForbiddenException(t.circle.privateForbidden);
    }

    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!circle || circle.deletedAt !== null) {
      throw new NotFoundException(t.circle.notFound);
    }

    // Filter out users already in circle
    const existingMembers = await this.prisma.circleMember.findMany({
      where: { circleId, userId: { in: memberIds } },
      select: { userId: true },
    });
    const existingUserIds = new Set(existingMembers.map((m) => m.userId));
    const newMemberIds = Array.from(new Set(memberIds)).filter((id) => !existingUserIds.has(id));

    if (newMemberIds.length === 0) {
      return {
        success: true,
        statusCode: 200,
        message: t.circle.addMembersSuccess,
        data: [],
      };
    }

    // Check capacity
    if (circle.maxMembers !== null) {
      const projectedCount = circle._count.members + newMemberIds.length;
      if (projectedCount > circle.maxMembers) {
        throw new BadRequestException(t.circle.circleFull);
      }
    }

    // Create members
    await this.prisma.$transaction(
      newMemberIds.map((targetUserId) =>
        this.prisma.circleMember.create({
          data: {
            circleId,
            userId: targetUserId,
            role: MemberRole.MEMBER,
          },
        }),
      ),
    );

    return {
      success: true,
      statusCode: 200,
      message: t.circle.addMembersSuccess,
      data: newMemberIds,
    };
  }

  /**
   * Retrieves all members of a Circle
   */
  async getMembers(circleId: string, userId: string, locale: Locale = 'vi') {
    const t = locales[locale] || locales.vi;

    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
      select: { id: true, isPrivate: true, deletedAt: true },
    });

    if (!circle || circle.deletedAt !== null) {
      throw new NotFoundException(t.circle.notFound);
    }

    if (circle.isPrivate) {
      const membership = await this.prisma.circleMember.findUnique({
        where: { circleId_userId: { circleId, userId } },
      });
      if (!membership) {
        throw new ForbiddenException(t.circle.privateForbidden);
      }
    }

    const members = await this.prisma.circleMember.findMany({
      where: { circleId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    return {
      success: true,
      statusCode: 200,
      data: members.map((m) => ({
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
    };
  }

  /**
   * Removes a member from Circle (OWNER only, cannot remove self or another owner)
   */
  async removeMember(
    circleId: string,
    userId: string,
    targetMemberId: string,
    locale: Locale = 'vi',
  ) {
    const t = locales[locale] || locales.vi;

    const caller = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!caller || caller.role !== MemberRole.OWNER) {
      throw new ForbiddenException(t.circle.updateForbidden);
    }

    const target = await this.prisma.circleMember.findUnique({
      where: { id: targetMemberId },
    });

    if (!target || target.circleId !== circleId) {
      throw new NotFoundException(t.circle.notFound);
    }

    // Cannot remove owner
    if (target.role === MemberRole.OWNER) {
      throw new ForbiddenException(t.circle.updateForbidden);
    }

    // Cannot remove self via kick (use leave instead)
    if (target.id === caller.id) {
      throw new ForbiddenException(t.circle.updateForbidden);
    }

    await this.prisma.circleMember.delete({
      where: { id: targetMemberId },
    });

    return {
      success: true,
      statusCode: 200,
      message: t.circle.updateSuccess,
    };
  }

  /**
   * Updates a member's nickname in the Circle (Caller must be in Circle)
   */
  async updateMemberNickname(
    circleId: string,
    userId: string,
    targetMemberId: string,
    nickname?: string | null,
    locale: Locale = 'vi',
  ) {
    const t = locales[locale] || locales.vi;

    const caller = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!caller) {
      throw new ForbiddenException(t.circle.privateForbidden);
    }

    const target = await this.prisma.circleMember.findUnique({
      where: { id: targetMemberId },
    });

    if (!target || target.circleId !== circleId) {
      throw new NotFoundException(t.circle.notFound);
    }

    const cleanNickname = nickname?.trim() || null;

    const updated = await this.prisma.circleMember.update({
      where: { id: targetMemberId },
      data: { nickname: cleanNickname },
      include: {
        user: { select: { id: true, email: true, profile: true } },
      },
    });

    return {
      success: true,
      statusCode: 200,
      message: t.circle.nicknameUpdated,
      data: {
        id: updated.id,
        userId: updated.userId,
        role: updated.role,
        nickname: updated.nickname,
        joinedAt: updated.joinedAt,
        user: updated.user,
      },
    };
  }

  /**
   * Leaves a Circle (Owner must transfer ownership if other members exist)
   */
  async leaveCircle(circleId: string, userId: string, locale: Locale = 'vi') {
    const t = locales[locale] || locales.vi;

    const caller = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!caller) {
      throw new NotFoundException(t.circle.notFound);
    }

    if (caller.role === MemberRole.OWNER) {
      const memberCount = await this.prisma.circleMember.count({
        where: { circleId },
      });
      if (memberCount > 1) {
        throw new ForbiddenException(t.circle.ownerCannotLeaveMustTransfer);
      }
    }

    await this.prisma.circleMember.delete({
      where: { id: caller.id },
    });

    return {
      success: true,
      statusCode: 200,
      message: t.circle.updateSuccess,
    };
  }

  /**
   * Transfers ownership to another member (OWNER only, demoting old owner to MEMBER)
   */
  async transferOwnership(
    circleId: string,
    userId: string,
    newOwnerMemberId: string,
    locale: Locale = 'vi',
  ) {
    const t = locales[locale] || locales.vi;

    const caller = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!caller || caller.role !== MemberRole.OWNER) {
      throw new ForbiddenException(t.circle.updateForbidden);
    }

    const target = await this.prisma.circleMember.findUnique({
      where: { id: newOwnerMemberId },
    });

    if (!target || target.circleId !== circleId || target.id === caller.id) {
      throw new NotFoundException(t.circle.notFound);
    }

    await this.prisma.$transaction([
      this.prisma.circleMember.update({
        where: { id: caller.id },
        data: { role: MemberRole.MEMBER },
      }),
      this.prisma.circleMember.update({
        where: { id: target.id },
        data: { role: MemberRole.OWNER },
      }),
    ]);

    return {
      success: true,
      statusCode: 200,
      message: t.circle.updateSuccess,
    };
  }

  /**
   * Submits a request to join a private Circle
   */
  async requestToJoin(
    circleId: string,
    userId: string,
    input: CreateJoinRequestInput,
    locale: Locale = 'vi',
  ) {
    const t = locales[locale] || locales.vi;

    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        members: { where: { userId } },
      },
    });

    if (!circle || circle.deletedAt !== null) {
      throw new NotFoundException(t.circle.notFound);
    }

    if (circle.members && circle.members.length > 0) {
      throw new ConflictException(t.circle.joinRequestAlreadyMember);
    }

    const currentMemberCount = await this.prisma.circleMember.count({ where: { circleId } });
    if (circle.maxMembers !== null && currentMemberCount >= circle.maxMembers) {
      throw new BadRequestException(t.circle.circleFull);
    }

    const existingRequest = await this.prisma.circleJoinRequest.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (existingRequest && existingRequest.status === 'PENDING') {
      throw new ConflictException(t.circle.joinRequestAlreadyPending);
    }

    if (existingRequest) {
      await this.prisma.circleJoinRequest.update({
        where: { id: existingRequest.id },
        data: {
          status: 'PENDING',
          message: input.message?.trim() || null,
        },
      });
    } else {
      await this.prisma.circleJoinRequest.create({
        data: {
          circleId,
          userId,
          message: input.message?.trim() || null,
          status: 'PENDING',
        },
      });
    }

    return {
      success: true,
      statusCode: 201,
      message: t.circle.joinRequestSent,
    };
  }

  /**
   * Retrieves all pending join requests for a Circle (OWNER only)
   */
  async getJoinRequests(circleId: string, userId: string, locale: Locale = 'vi') {
    const t = locales[locale] || locales.vi;

    const caller = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!caller || caller.role !== MemberRole.OWNER) {
      throw new ForbiddenException(t.circle.updateForbidden);
    }

    const requests = await this.prisma.circleJoinRequest.findMany({
      where: { circleId, status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      statusCode: 200,
      data: requests,
    };
  }

  /**
   * Reviews (Approve/Reject) a join request (OWNER only)
   */
  async reviewJoinRequest(
    circleId: string,
    userId: string,
    requestId: string,
    input: ReviewJoinRequestInput,
    locale: Locale = 'vi',
  ) {
    const t = locales[locale] || locales.vi;

    const caller = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!caller || caller.role !== MemberRole.OWNER) {
      throw new ForbiddenException(t.circle.updateForbidden);
    }

    const request = await this.prisma.circleJoinRequest.findFirst({
      where: { id: requestId, circleId, status: 'PENDING' },
    });

    if (!request) {
      throw new NotFoundException(t.circle.notFound);
    }

    if (input.status === 'APPROVED') {
      const circleData = await this.prisma.circle.findUnique({
        where: { id: circleId },
        select: { maxMembers: true },
      });
      const currentMemberCount = await this.prisma.circleMember.count({ where: { circleId } });
      if (circleData?.maxMembers !== null && circleData?.maxMembers !== undefined && currentMemberCount >= circleData.maxMembers) {
        throw new BadRequestException(t.circle.circleFull);
      }

      await this.prisma.$transaction([
        this.prisma.circleMember.upsert({
          where: { circleId_userId: { circleId, userId: request.userId } },
          update: { role: MemberRole.MEMBER },
          create: { circleId, userId: request.userId, role: MemberRole.MEMBER },
        }),
        this.prisma.circleJoinRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        }),
      ]);

      return {
        success: true,
        statusCode: 200,
        message: t.circle.joinRequestApproved,
      };
    } else {
      await this.prisma.circleJoinRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });

      return {
        success: true,
        statusCode: 200,
        message: t.circle.joinRequestRejected,
      };
    }
  }
}
