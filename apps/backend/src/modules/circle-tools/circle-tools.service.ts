import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSharedAlbumDto,
  UpdateSharedAlbumDto,
  AddPhotosDto,
  CreateWheelDto,
  CreateAnonymousPostDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
} from './dto/circle-tools.dto';
import { SpinWheelResult } from '@circle/types';

@Injectable()
export class CircleToolsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: verify that the user is an active member of the specified circle.
   */
  async getMemberOrThrow(circleId: string, userId: string) {
    const member = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: { circleId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Bạn không phải là thành viên của vòng tròn này');
    }

    return member;
  }

  // ===========================================================================
  // 1. SHARED ALBUM (UC14)
  // ===========================================================================

  async getAlbums(circleId: string, userId: string) {
    await this.getMemberOrThrow(circleId, userId);

    return this.prisma.sharedAlbum.findMany({
      where: { circleId },
      include: {
        photos: {
          take: 4,
          orderBy: { createdAt: 'desc' },
        },
        creator: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        _count: {
          select: { photos: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getAlbumById(circleId: string, albumId: string, userId: string) {
    await this.getMemberOrThrow(circleId, userId);

    const album = await this.prisma.sharedAlbum.findFirst({
      where: { id: albumId, circleId },
      include: {
        photos: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: {
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
        creator: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        _count: {
          select: { photos: true },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('Không tìm thấy album trong vòng tròn này');
    }

    return album;
  }

  async createAlbum(circleId: string, userId: string, dto: CreateSharedAlbumDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    return this.prisma.sharedAlbum.create({
      data: {
        circleId,
        albumTitle: dto.albumTitle.trim(),
        description: dto.description?.trim(),
        createdById: member.id,
      },
      include: {
        creator: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  async updateAlbum(circleId: string, albumId: string, userId: string, dto: UpdateSharedAlbumDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const album = await this.prisma.sharedAlbum.findFirst({
      where: { id: albumId, circleId },
    });

    if (!album) {
      throw new NotFoundException('Không tìm thấy album');
    }

    if (album.createdById && album.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền sửa album');
    }

    return this.prisma.sharedAlbum.update({
      where: { id: albumId },
      data: {
        albumTitle: dto.albumTitle ? dto.albumTitle.trim() : undefined,
        description: dto.description !== undefined ? dto.description.trim() : undefined,
      },
    });
  }

  async deleteAlbum(circleId: string, albumId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const album = await this.prisma.sharedAlbum.findFirst({
      where: { id: albumId, circleId },
    });

    if (!album) {
      throw new NotFoundException('Không tìm thấy album');
    }

    if (album.createdById && album.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền xóa album');
    }

    await this.prisma.sharedAlbum.delete({
      where: { id: albumId },
    });

    return { success: true };
  }

  async addPhotos(circleId: string, albumId: string, userId: string, dto: AddPhotosDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const album = await this.prisma.sharedAlbum.findFirst({
      where: { id: albumId, circleId },
    });

    if (!album) {
      throw new NotFoundException('Không tìm thấy album');
    }

    if (!dto.photos || dto.photos.length === 0) {
      throw new BadRequestException('Danh sách ảnh không được để trống');
    }

    const createdPhotos = await this.prisma.$transaction(async (tx) => {
      const records = [];
      for (const p of dto.photos) {
        const photo = await tx.photo.create({
          data: {
            sharedAlbumId: albumId,
            fileUrl: p.fileUrl,
            caption: p.caption?.trim(),
            width: p.width,
            height: p.height,
            uploaderId: member.id,
          },
          include: {
            uploader: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        });
        records.push(photo);
      }

      await tx.sharedAlbum.update({
        where: { id: albumId },
        data: { updatedAt: new Date() },
      });

      return records;
    });

    return createdPhotos;
  }

  async deletePhoto(circleId: string, photoId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        sharedAlbum: true,
      },
    });

    if (!photo || photo.sharedAlbum?.circleId !== circleId) {
      throw new NotFoundException('Không tìm thấy ảnh trong vòng tròn này');
    }

    // Rule: Uploader can delete, or Circle OWNER can delete any photo
    if (photo.uploaderId && photo.uploaderId !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tải lên hoặc chủ vòng tròn mới có quyền xóa ảnh này');
    }

    await this.prisma.photo.delete({
      where: { id: photoId },
    });

    return { success: true };
  }

  // ===========================================================================
  // 2. DECISION WHEEL (UC16)
  // ===========================================================================

  async getWheels(circleId: string, userId: string) {
    await this.getMemberOrThrow(circleId, userId);

    return this.prisma.decisionWheel.findMany({
      where: { circleId },
      include: {
        options: true,
        creator: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWheel(circleId: string, userId: string, dto: CreateWheelDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    if (!dto.options || dto.options.length < 2) {
      throw new BadRequestException('Vòng quay cần tối thiểu 2 phương án lựa chọn');
    }

    return this.prisma.decisionWheel.create({
      data: {
        circleId,
        title: dto.title.trim(),
        createdById: member.id,
        options: {
          create: dto.options.map((opt) => ({
            optionLabel: opt.optionLabel.trim(),
            color: opt.color || undefined,
          })),
        },
      },
      include: {
        options: true,
        creator: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  async spinWheel(circleId: string, wheelId: string, userId: string): Promise<SpinWheelResult> {
    await this.getMemberOrThrow(circleId, userId);

    const wheel = await this.prisma.decisionWheel.findFirst({
      where: { id: wheelId, circleId },
      include: { options: true },
    });

    if (!wheel) {
      throw new NotFoundException('Không tìm thấy vòng quay');
    }

    if (!wheel.options || wheel.options.length === 0) {
      throw new BadRequestException('Vòng quay chưa có phương án lựa chọn nào');
    }

    // Server-side unbiased pseudo-random selection
    const randomIndex = Math.floor(Math.random() * wheel.options.length);
    const selected = wheel.options[randomIndex]!;
    const now = new Date();

    await this.prisma.decisionWheel.update({
      where: { id: wheelId },
      data: {
        lastResult: selected.optionLabel,
        lastSpunAt: now,
      },
    });

    return {
      wheelId,
      selectedOption: selected,
      spunAt: now.toISOString(),
    };
  }

  async deleteWheel(circleId: string, wheelId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const wheel = await this.prisma.decisionWheel.findFirst({
      where: { id: wheelId, circleId },
    });

    if (!wheel) {
      throw new NotFoundException('Không tìm thấy vòng quay');
    }

    if (wheel.createdById && wheel.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền xóa vòng quay');
    }

    await this.prisma.decisionWheel.delete({
      where: { id: wheelId },
    });

    return { success: true };
  }

  // ===========================================================================
  // 3. ANONYMOUS POST / WORDS UNSAID (UC21)
  // ===========================================================================

  async getAnonymousPosts(circleId: string, userId: string) {
    await this.getMemberOrThrow(circleId, userId);

    // Guaranteed ZERO author identification returned to client
    return this.prisma.anonymousPost.findMany({
      where: { circleId },
      orderBy: { postedAt: 'desc' },
      select: {
        id: true,
        circleId: true,
        content: true,
        cardTheme: true,
        postedAt: true,
      },
    });
  }

  async createAnonymousPost(circleId: string, userId: string, dto: CreateAnonymousPostDto) {
    // Verify user belongs to this circle, but DO NOT store any user/member ID
    await this.getMemberOrThrow(circleId, userId);

    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('Nội dung tâm sự không được để trống');
    }

    return this.prisma.anonymousPost.create({
      data: {
        circleId,
        content: dto.content.trim(),
        cardTheme: dto.cardTheme || 'sunset',
      },
      select: {
        id: true,
        circleId: true,
        content: true,
        cardTheme: true,
        postedAt: true,
      },
    });
  }

  async deleteAnonymousPost(circleId: string, postId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    // Only Circle OWNER can moderate/delete anonymous posts
    if (member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ chủ vòng tròn mới có quyền gỡ lời nhắn ẩn danh vi phạm');
    }

    const post = await this.prisma.anonymousPost.findFirst({
      where: { id: postId, circleId },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    await this.prisma.anonymousPost.delete({
      where: { id: postId },
    });

    return { success: true };
  }

  // ===========================================================================
  // 4. GROUP CALENDAR & REMINDERS (UC17)
  // ===========================================================================

  async getCalendarEvents(circleId: string, userId: string, month?: number, year?: number) {
    await this.getMemberOrThrow(circleId, userId);

    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      dateFilter = {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    return this.prisma.calendarEvent.findMany({
      where: {
        circleId,
        ...dateFilter,
      },
      include: {
        creator: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async createCalendarEvent(circleId: string, userId: string, dto: CreateCalendarEventDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    return this.prisma.calendarEvent.create({
      data: {
        circleId,
        createdById: member.id,
        eventTitle: dto.eventTitle.trim(),
        description: dto.description?.trim(),
        location: dto.location?.trim(),
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        reminderTime: dto.reminderTime ? new Date(dto.reminderTime) : null,
      },
      include: {
        creator: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  async updateCalendarEvent(
    circleId: string,
    eventId: string,
    userId: string,
    dto: UpdateCalendarEventDto,
  ) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, circleId },
    });

    if (!event) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    if (event.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền sửa sự kiện');
    }

    return this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        eventTitle: dto.eventTitle ? dto.eventTitle.trim() : undefined,
        description: dto.description !== undefined ? dto.description.trim() : undefined,
        location: dto.location !== undefined ? dto.location.trim() : undefined,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime !== undefined ? (dto.endTime ? new Date(dto.endTime) : null) : undefined,
        reminderTime:
          dto.reminderTime !== undefined
            ? dto.reminderTime
              ? new Date(dto.reminderTime)
              : null
            : undefined,
      },
      include: {
        creator: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteCalendarEvent(circleId: string, eventId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, circleId },
    });

    if (!event) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    if (event.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền xóa sự kiện');
    }

    await this.prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    return { success: true };
  }
}
