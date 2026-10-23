import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import {
  CreateMomentInput,
  ReplyMomentInput,
  Locale,
  locales,
} from '@circle/shared';
import { MomentEntity, MessageEntity } from '@circle/types';

@Injectable()
export class MomentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Helper to format moments with reaction aggregates and current user reaction state
   */
  private transformMoments(moments: any[], currentUserId: string): MomentEntity[] {
    return moments.map((m) => {
      const isAuthor = m.authorId === currentUserId;
      const reactionCounts: Record<string, number> = {};
      let userReaction: string | null = null;

      if (Array.isArray(m.reactions)) {
        for (const r of m.reactions) {
          if (isAuthor) {
            reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
          }
          if (r.userId === currentUserId) {
            userReaction = r.emoji;
          }
        }
      }

      return {
        id: m.id,
        authorId: m.authorId,
        photoUrl: m.photoUrl,
        mediaType: m.mediaType || 'IMAGE',
        caption: m.caption,
        locationName: m.locationName || null,
        address: m.address || null,
        latitude: m.latitude !== undefined && m.latitude !== null ? Number(m.latitude) : null,
        longitude: m.longitude !== undefined && m.longitude !== null ? Number(m.longitude) : null,
        capturedAt: m.capturedAt ? m.capturedAt.toISOString() : m.createdAt.toISOString(),
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt ? m.updatedAt.toISOString() : m.createdAt.toISOString(),
        author: m.author
          ? {
              id: m.author.id,
              email: m.author.email,
              profile: m.author.profile
                ? {
                    displayName: m.author.profile.displayName,
                    avatarUrl: m.author.profile.avatarUrl,
                  }
                : null,
            }
          : undefined,
        visibilities: Array.isArray(m.visibilities)
          ? m.visibilities.map((v: any) => ({
              id: v.id,
              momentId: v.momentId,
              circleId: v.circleId,
              createdAt: v.createdAt.toISOString(),
              circle: v.circle
                ? {
                    id: v.circle.id,
                    name: v.circle.name,
                    avatarUrl: v.circle.avatarUrl,
                  }
                : undefined,
            }))
          : [],
        reactions: isAuthor && Array.isArray(m.reactions)
          ? m.reactions.map((r: any) => ({
              id: r.id,
              momentId: r.momentId,
              userId: r.userId,
              emoji: r.emoji,
              createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : (r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()),
              user: r.user
                ? {
                    id: r.user.id,
                    displayName: r.user.profile?.displayName || 'User',
                    avatarUrl: r.user.profile?.avatarUrl,
                  }
                : undefined,
            }))
          : [],
        reactionCounts: isAuthor ? reactionCounts : {},
        userReaction,
      };
    });
  }

  /**
   * POST /api/v1/moments — Publish a new moment visible to selected circles (Circle-based Privacy)
   */
  async create(userId: string, dto: CreateMomentInput, locale: Locale = 'vi'): Promise<MomentEntity> {
    const dict = locales[locale] || locales.vi;

    if (!Array.isArray(dto.circleIds) || dto.circleIds.length === 0) {
      throw new BadRequestException(dict.validation.momentCirclesRequired);
    }

    // Verify user is a member of all selected circles
    const memberships = await this.prisma.circleMember.findMany({
      where: {
        userId,
        circleId: { in: dto.circleIds },
      },
      select: { circleId: true },
    });

    const memberCircleIds = new Set(memberships.map((m) => m.circleId));
    const unauthorizedCircles = dto.circleIds.filter((id) => !memberCircleIds.has(id));

    if (unauthorizedCircles.length > 0) {
      throw new ForbiddenException(dict.circle.privateForbidden);
    }

    // Create Moment and its MomentVisibility mappings in a single transaction
    const moment = await this.prisma.moment.create({
      data: {
        authorId: userId,
        photoUrl: dto.photoUrl.trim(),
        mediaType: (dto.mediaType as any) || 'IMAGE',
        caption: dto.caption?.trim() || null,
        locationName: dto.locationName?.trim() || null,
        address: dto.address?.trim() || null,
        latitude: dto.latitude !== undefined && dto.latitude !== null ? Number(dto.latitude) : null,
        longitude: dto.longitude !== undefined && dto.longitude !== null ? Number(dto.longitude) : null,
        visibilities: {
          create: dto.circleIds.map((circleId) => ({ circleId })),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        visibilities: {
          include: {
            circle: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        reactions: true,
      },
    });

    return this.transformMoments([moment], userId)[0]!;
  }

  /**
   * GET /api/v1/moments/feed — Get aggregated moments feed from all Circles user belongs to
   */
  async getFeed(userId: string, _locale: Locale = 'vi'): Promise<MomentEntity[]> {
    // 1. Get all circles user is currently a member of
    const memberships = await this.prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true },
    });

    const circleIds = memberships.map((m) => m.circleId);
    if (circleIds.length === 0) {
      return [];
    }

    // 2. Fetch moments visible to at least one of user's circles
    const moments = await this.prisma.moment.findMany({
      where: {
        deletedAt: null,
        visibilities: {
          some: {
            circleId: { in: circleIds },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        visibilities: {
          include: {
            circle: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        reactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.transformMoments(moments, userId);
  }

  /**
   * GET /api/v1/moments/me — Get user's personal moments archive/history (Owner moments)
   */
  async getMyMoments(userId: string): Promise<MomentEntity[]> {
    const moments = await this.prisma.moment.findMany({
      where: {
        authorId: userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        visibilities: {
          include: {
            circle: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        reactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.transformMoments(moments, userId);
  }

  /**
   * GET /api/v1/moments/circle/:circleId — Get moments shared within a specific Circle
   */
  async getByCircle(userId: string, circleId: string, locale: Locale = 'vi'): Promise<MomentEntity[]> {
    const dict = locales[locale] || locales.vi;

    // Verify user is a member of this Circle
    const member = await this.prisma.circleMember.findFirst({
      where: { userId, circleId },
      select: { id: true },
    });

    if (!member) {
      throw new ForbiddenException(dict.circle.privateForbidden);
    }

    const moments = await this.prisma.moment.findMany({
      where: {
        deletedAt: null,
        visibilities: {
          some: { circleId },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        visibilities: {
          include: {
            circle: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        reactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.transformMoments(moments, userId);
  }

  /**
   * POST /api/v1/moments/:id/react — React with emoji or toggle off existing reaction
   */
  async react(
    userId: string,
    momentId: string,
    emoji: string,
    locale: Locale = 'vi',
  ): Promise<{ reacted: boolean; emoji: string }> {
    const dict = locales[locale] || locales.vi;

    const moment = await this.prisma.moment.findUnique({
      where: { id: momentId },
      include: {
        visibilities: { select: { circleId: true } },
      },
    });

    if (!moment || moment.deletedAt) {
      throw new NotFoundException(dict.auth.userNotFound);
    }

    // Author cannot react to their own moment
    if (moment.authorId === userId) {
      throw new ForbiddenException(
        locale === 'vi'
          ? 'Người đăng bài không thể tự thả cảm xúc cho khoảnh khắc của chính mình'
          : 'Authors cannot react to their own moments',
      );
    }

    // Verify user has access to this moment (member of at least one visible circle)
    const circleIds = moment.visibilities.map((v) => v.circleId);
    const membership = await this.prisma.circleMember.findFirst({
      where: {
        userId,
        circleId: { in: circleIds },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException(dict.circle.privateForbidden);
    }

    // Check if user already has any reaction on this moment (1 reaction per user rule)
    const existingList = await this.prisma.momentReaction.findMany({
      where: {
        momentId,
        userId,
      },
    });

    if (existingList.length > 0) {
      const matchSame = existingList.find((r) => r.emoji === emoji);
      // Clean up previous reaction(s) to guarantee exactly 1 reaction per user
      await this.prisma.momentReaction.deleteMany({
        where: {
          momentId,
          userId,
        },
      });

      if (matchSame) {
        // Tapped same emoji -> toggled off
        return { reacted: false, emoji };
      } else {
        // Tapped different emoji -> switch to new emoji
        await this.prisma.momentReaction.create({
          data: {
            momentId,
            userId,
            emoji,
          },
        });
        return { reacted: true, emoji };
      }
    } else {
      await this.prisma.momentReaction.create({
        data: {
          momentId,
          userId,
          emoji,
        },
      });
      return { reacted: true, emoji };
    }
  }

  /**
   * DELETE /api/v1/moments/:id — Delete a moment (author only)
   */
  async delete(userId: string, momentId: string, locale: Locale = 'vi'): Promise<{ success: boolean }> {
    const dict = locales[locale] || locales.vi;

    const moment = await this.prisma.moment.findUnique({
      where: { id: momentId },
    });

    if (!moment || moment.deletedAt) {
      throw new NotFoundException(dict.auth.userNotFound);
    }

    if (moment.authorId !== userId) {
      throw new ForbiddenException(dict.circle.updateForbidden);
    }

    await this.prisma.moment.update({
      where: { id: momentId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  /**
   * POST /api/v1/moments/:id/reply — Reply to a Moment by sending a message with photo quote directly into the Circle's group chat
   */
  async replyMoment(
    userId: string,
    momentId: string,
    dto: ReplyMomentInput,
    locale: Locale = 'vi',
  ): Promise<MessageEntity> {
    const dict = locales[locale] || locales.vi;

    // 1. Verify Moment existence and not deleted
    const moment = await this.prisma.moment.findUnique({
      where: { id: momentId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        visibilities: {
          select: { circleId: true },
        },
      },
    });

    if (!moment || moment.deletedAt) {
      throw new NotFoundException(dict.moments.momentNotFound || dict.auth.userNotFound);
    }

    // 2. Verify Moment is shared with target Circle
    const isVisibleInCircle = moment.visibilities.some((v) => v.circleId === dto.circleId);
    if (!isVisibleInCircle) {
      throw new ForbiddenException(dict.moments.momentNotVisibleInCircle || dict.circle.privateForbidden);
    }

    // 3. Verify user is an active member of this Circle
    const member = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId: dto.circleId,
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
      throw new ForbiddenException(dict.chat.notCircleMember);
    }

    // 4. Find or create the primary text channel for this Circle
    let channel = await this.prisma.channel.findFirst({
      where: {
        circleId: dto.circleId,
        type: 'TEXT',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!channel) {
      channel = await this.prisma.channel.create({
        data: {
          circleId: dto.circleId,
          name: 'general',
          type: 'TEXT',
        },
      });
    }

    // 5. Build moment quote title and structured metadata
    const momentAuthorName =
      moment.author?.profile?.displayName || moment.author?.email?.split('@')[0] || 'User';
    const momentAuthorAvatar = moment.author?.profile?.avatarUrl || null;
    const quoteTitle = moment.caption
      ? `Khoảnh khắc: "${moment.caption}"`
      : dict.moments.quoteMomentAuthor.replace('{author}', momentAuthorName);

    const momentMetadata = JSON.stringify({
      type: 'MOMENT_REPLY',
      momentId: moment.id,
      authorName: momentAuthorName,
      authorAvatar: momentAuthorAvatar,
      caption: moment.caption || null,
      createdAt: moment.createdAt ? (typeof moment.createdAt.toISOString === 'function' ? moment.createdAt.toISOString() : String(moment.createdAt)) : new Date().toISOString(),
      fallbackTitle: quoteTitle,
    });

    // 6. Create Message in Circle's Channel
    const rawMessage = await this.prisma.message.create({
      data: {
        channelId: channel.id,
        memberId: member.id,
        type: 'FILE',
        content: dto.message.trim(),
        fileUrl: moment.photoUrl,
        fileName: momentMetadata,
        fileSize: 0,
      },
      include: {
        sender: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        reactions: {
          include: {
            member: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
        pinnedRecord: true,
      },
    });

    // 7. Format message entity
    const formattedMessage: MessageEntity = {
      id: rawMessage.id,
      channelId: rawMessage.channelId,
      memberId: rawMessage.memberId,
      type: rawMessage.type as any,
      content: rawMessage.content,
      fileUrl: rawMessage.fileUrl,
      fileName: rawMessage.fileName,
      fileSize: rawMessage.fileSize,
      audioDuration: rawMessage.audioDuration,
      replyToId: rawMessage.replyToId,
      sentAt: rawMessage.sentAt.toISOString(),
      updatedAt: rawMessage.updatedAt.toISOString(),
      sender: rawMessage.sender
        ? {
            id: rawMessage.sender.id,
            circleId: rawMessage.sender.circleId,
            userId: rawMessage.sender.userId,
            role: rawMessage.sender.role as any,
            nickname: rawMessage.sender.nickname,
            joinedAt: rawMessage.sender.joinedAt.toISOString(),
            updatedAt: rawMessage.sender.updatedAt.toISOString(),
            user: rawMessage.sender.user
              ? {
                  id: rawMessage.sender.user.id,
                  email: rawMessage.sender.user.email,
                  isActivated: rawMessage.sender.user.isActivated,
                  globalRole: rawMessage.sender.user.globalRole as any,
                  createdAt: rawMessage.sender.user.createdAt.toISOString(),
                  updatedAt: rawMessage.sender.user.updatedAt.toISOString(),
                  profile: rawMessage.sender.user.profile
                    ? {
                        id: rawMessage.sender.user.profile.id,
                        userId: rawMessage.sender.user.profile.userId,
                        displayName: rawMessage.sender.user.profile.displayName,
                        avatarUrl: rawMessage.sender.user.profile.avatarUrl,
                        bio: rawMessage.sender.user.profile.bio,
                        dateOfBirth: rawMessage.sender.user.profile.dateOfBirth?.toISOString() || null,
                        updatedAt: rawMessage.sender.user.profile.updatedAt.toISOString(),
                      }
                    : null,
                }
              : undefined,
          }
        : undefined,
      replyTo: null,
      reactions: [],
      reactionCounts: {},
      userReactions: [],
      isPinned: false,
    };

    // 8. Broadcast realtime message to all Circle members in the channel
    this.chatGateway.broadcastNewMessage(channel.id, formattedMessage);

    return formattedMessage;
  }
}
