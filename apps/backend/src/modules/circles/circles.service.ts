import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole, ChannelType } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateCircleInput, UpdateCircleInput } from '@circle/shared';

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
   * Creates a new Circle with an OWNER role for creator and a default #general channel
   */
  async create(userId: string, input: CreateCircleInput) {
    const normalizedHandle = input.handle.toLowerCase().trim();

    // Check if handle is already reserved / used
    const existingCircle = await this.prisma.circle.findUnique({
      where: { handle: normalizedHandle },
      select: { id: true },
    });

    if (existingCircle) {
      throw new ConflictException('Handle này đã được sử dụng. Vui lòng chọn handle khác.');
    }

    const inviteCode = await this.generateUniqueInviteCode();

    // Perform atomic creation of Circle, Owner CircleMember, and #general Channel
    const newCircle = await this.prisma.$transaction(async (tx) => {
      const circle = await tx.circle.create({
        data: {
          name: input.name.trim(),
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

      // Create default general text channel
      const defaultChannel = await tx.channel.create({
        data: {
          circleId: circle.id,
          name: 'general',
          type: ChannelType.TEXT,
          topic: 'Kênh thảo luận chung',
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
      message: 'Khởi tạo Circle thành công',
      data: {
        ...newCircle,
        role: MemberRole.OWNER,
        memberCount: 1,
      },
    };
  }

  /**
   * Retrieves all Circles that the current user belongs to
   */
  async findUserCircles(userId: string) {
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
  async findByIdOrHandle(idOrHandle: string, userId: string) {
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
      throw new NotFoundException('Không tìm thấy Circle');
    }

    const currentMember = circle.members.find((m) => m.userId === userId);

    // If private circle, check membership
    if (circle.isPrivate && !currentMember) {
      throw new ForbiddenException('Bạn không có quyền truy cập Circle riêng tư này');
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
  async update(circleId: string, userId: string, input: UpdateCircleInput) {
    const membership = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId,
          userId,
        },
      },
    });

    if (!membership || (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN)) {
      throw new ForbiddenException('Chỉ Owner hoặc Admin mới có quyền cập nhật thông tin Circle');
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
      message: 'Cập nhật thông tin Circle thành công',
      data: updatedCircle,
    };
  }
}
