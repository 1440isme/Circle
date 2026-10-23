import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import {
  CreateSharedAlbumDto,
  UpdateSharedAlbumDto,
  AddPhotosDto,
  CreateWheelDto,
  CreateAnonymousPostDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  CreatePlanningSheetDto,
  AddSheetColumnDto,
  AddSheetRowDto,
  UpdateSheetCellDto,
  StartLiveLocationDto,
  UpdateLiveLocationDto,
  CreatePollDto,
  VotePollDto,
} from './dto/circle-tools.dto';
import { SpinWheelResult } from '@circle/types';

@Injectable()
export class CircleToolsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway?: ChatGateway,
  ) {}

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

  // ===========================================================================
  // 5. COLLABORATIVE PLANNING SHEET (UC18)
  // ===========================================================================

  async getPlanningSheets(circleId: string, userId: string) {
    await this.getMemberOrThrow(circleId, userId);

    return this.prisma.planningSheet.findMany({
      where: { circleId },
      include: {
        columns: {
          orderBy: { columnIndex: 'asc' },
        },
        rows: {
          orderBy: { rowIndex: 'asc' },
          include: {
            cells: {
              include: {
                lastEditedBy: {
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlanningSheetById(circleId: string, sheetId: string, userId: string) {
    await this.getMemberOrThrow(circleId, userId);

    const sheet = await this.prisma.planningSheet.findFirst({
      where: { id: sheetId, circleId },
      include: {
        columns: {
          orderBy: { columnIndex: 'asc' },
        },
        rows: {
          orderBy: { rowIndex: 'asc' },
          include: {
            cells: {
              include: {
                lastEditedBy: {
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
      },
    });

    if (!sheet) {
      throw new NotFoundException('Không tìm thấy bảng kế hoạch');
    }

    return sheet;
  }

  async createPlanningSheet(circleId: string, userId: string, dto: CreatePlanningSheetDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const columnTitles =
      dto.columns && dto.columns.length > 0
        ? dto.columns
        : ['Nhiệm vụ', 'Người phụ trách', 'Trạng thái', 'Hạn chót', 'Ghi chú'];
    const rowCount = dto.initialRowCount && dto.initialRowCount > 0 ? dto.initialRowCount : 3;

    const sheet = await this.prisma.$transaction(async (tx) => {
      const createdSheet = await tx.planningSheet.create({
        data: {
          circleId,
          createdById: member.id,
          title: dto.title.trim(),
        },
      });

      const createdColumns = [];
      for (let i = 0; i < columnTitles.length; i++) {
        const title = columnTitles[i] || `Cột ${i + 1}`;
        const col = await tx.sheetColumn.create({
          data: {
            sheetId: createdSheet.id,
            columnIndex: i,
            columnTitle: title,
          },
        });
        createdColumns.push(col);
      }

      for (let r = 0; r < rowCount; r++) {
        const row = await tx.sheetRow.create({
          data: {
            sheetId: createdSheet.id,
            rowIndex: r,
          },
        });

        for (const col of createdColumns) {
          await tx.sheetCell.create({
            data: {
              rowId: row.id,
              columnId: col.id,
              cellValue: '',
            },
          });
        }
      }

      return createdSheet;
    });

    const fullSheet = await this.getPlanningSheetById(circleId, sheet.id, userId);
    this.chatGateway?.broadcastSheetStructureUpdated(circleId, fullSheet);
    return fullSheet;
  }

  async addSheetColumn(circleId: string, sheetId: string, userId: string, dto: AddSheetColumnDto) {
    await this.getMemberOrThrow(circleId, userId);

    const sheet = await this.prisma.planningSheet.findFirst({
      where: { id: sheetId, circleId },
      include: {
        columns: true,
        rows: true,
      },
    });

    if (!sheet) {
      throw new NotFoundException('Không tìm thấy bảng kế hoạch');
    }

    const nextColIndex = sheet.columns.length;
    await this.prisma.$transaction(async (tx) => {
      const newCol = await tx.sheetColumn.create({
        data: {
          sheetId,
          columnIndex: nextColIndex,
          columnTitle: dto.columnTitle.trim(),
        },
      });

      for (const row of sheet.rows) {
        await tx.sheetCell.create({
          data: {
            rowId: row.id,
            columnId: newCol.id,
            cellValue: '',
          },
        });
      }
    });

    const updatedSheet = await this.getPlanningSheetById(circleId, sheetId, userId);
    this.chatGateway?.broadcastSheetStructureUpdated(circleId, updatedSheet);
    return updatedSheet;
  }

  async addSheetRow(circleId: string, sheetId: string, userId: string, dto: AddSheetRowDto) {
    await this.getMemberOrThrow(circleId, userId);

    const sheet = await this.prisma.planningSheet.findFirst({
      where: { id: sheetId, circleId },
      include: {
        columns: true,
        rows: true,
      },
    });

    if (!sheet) {
      throw new NotFoundException('Không tìm thấy bảng kế hoạch');
    }

    const nextRowIndex = sheet.rows.length;
    await this.prisma.$transaction(async (tx) => {
      const newRow = await tx.sheetRow.create({
        data: {
          sheetId,
          rowIndex: nextRowIndex,
        },
      });

      for (const col of sheet.columns) {
        await tx.sheetCell.create({
          data: {
            rowId: newRow.id,
            columnId: col.id,
            cellValue: dto.cellValues?.[col.id] || '',
          },
        });
      }
    });

    const updatedSheet = await this.getPlanningSheetById(circleId, sheetId, userId);
    this.chatGateway?.broadcastSheetStructureUpdated(circleId, updatedSheet);
    return updatedSheet;
  }

  async updateSheetCell(
    circleId: string,
    sheetId: string,
    cellId: string,
    userId: string,
    dto: UpdateSheetCellDto,
  ) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const cell = await this.prisma.sheetCell.findUnique({
      where: { id: cellId },
      include: {
        row: true,
      },
    });

    if (!cell || cell.row.sheetId !== sheetId) {
      throw new NotFoundException('Không tìm thấy ô bảng tính');
    }

    const updatedCell = await this.prisma.sheetCell.update({
      where: { id: cellId },
      data: {
        cellValue: dto.cellValue,
        lastEditedById: member.id,
      },
      include: {
        lastEditedBy: {
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

    this.chatGateway?.broadcastSheetCellUpdated(circleId, {
      circleId,
      sheetId,
      cellId,
      cellValue: dto.cellValue,
      lastEditedBy: updatedCell.lastEditedBy,
    });

    return updatedCell;
  }

  async deletePlanningSheet(circleId: string, sheetId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const sheet = await this.prisma.planningSheet.findFirst({
      where: { id: sheetId, circleId },
    });

    if (!sheet) {
      throw new NotFoundException('Không tìm thấy bảng kế hoạch');
    }

    if (sheet.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền xóa bảng kế hoạch');
    }

    await this.prisma.planningSheet.delete({
      where: { id: sheetId },
    });

    return { success: true };
  }

  // ===========================================================================
  // 6. LIVE LOCATION SHARING (UC19)
  // ===========================================================================

  async getActiveLiveLocations(circleId: string, userId: string) {
    await this.getMemberOrThrow(circleId, userId);

    const now = new Date();
    // Auto-mark expired records as inactive
    await this.prisma.liveLocationShare.updateMany({
      where: {
        circleId,
        isActive: true,
        expiresAt: { lte: now },
      },
      data: {
        isActive: false,
      },
    });

    return this.prisma.liveLocationShare.findMany({
      where: {
        circleId,
        isActive: true,
        expiresAt: { gt: now },
      },
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
      orderBy: { updatedAt: 'desc' },
    });
  }

  async startLiveLocation(circleId: string, userId: string, dto: StartLiveLocationDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const duration = [15, 30, 60].includes(dto.shareDuration) ? dto.shareDuration : 30;
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const existingShare = await this.prisma.liveLocationShare.findFirst({
      where: {
        circleId,
        memberId: member.id,
      },
      orderBy: { updatedAt: 'desc' },
    });

    let record;
    if (existingShare) {
      record = await this.prisma.liveLocationShare.update({
        where: { id: existingShare.id },
        data: {
          latitude: dto.latitude,
          longitude: dto.longitude,
          shareDuration: duration,
          expiresAt,
          isActive: true,
        },
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
      });
    } else {
      record = await this.prisma.liveLocationShare.create({
        data: {
          circleId,
          memberId: member.id,
          latitude: dto.latitude,
          longitude: dto.longitude,
          shareDuration: duration,
          expiresAt,
          isActive: true,
        },
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
      });
    }

    this.chatGateway?.broadcastLiveLocationUpdated(circleId, record);
    return record;
  }

  async updateLiveLocation(circleId: string, userId: string, dto: UpdateLiveLocationDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const now = new Date();
    const activeShare = await this.prisma.liveLocationShare.findFirst({
      where: {
        circleId,
        memberId: member.id,
        isActive: true,
        expiresAt: { gt: now },
      },
    });

    if (!activeShare) {
      throw new BadRequestException('Phiên chia sẻ vị trí không tồn tại hoặc đã hết hạn');
    }

    const updated = await this.prisma.liveLocationShare.update({
      where: { id: activeShare.id },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
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
    });

    this.chatGateway?.broadcastLiveLocationUpdated(circleId, updated);
    return updated;
  }

  async stopLiveLocation(circleId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    await this.prisma.liveLocationShare.updateMany({
      where: {
        circleId,
        memberId: member.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    this.chatGateway?.broadcastLiveLocationStopped(circleId, {
      circleId,
      memberId: member.id,
    });

    return { success: true, stopped: true };
  }

  // ===========================================================================
  // 7. GROUP POLL (UC15)
  // ===========================================================================

  async getPolls(circleId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const polls = await this.prisma.groupPoll.findMany({
      where: { circleId },
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
        options: {
          orderBy: { orderIndex: 'asc' },
          include: {
            votes: {
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
          },
        },
        votes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return polls.map((poll) => {
      const totalVotes = poll.votes.length;
      const userVote = poll.votes.find((v) => v.memberId === member.id);

      return {
        ...poll,
        totalVotes,
        userVotedOptionId: userVote?.optionId || null,
        options: poll.options.map((opt) => {
          const voteCount = opt.votes.length;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          return {
            id: opt.id,
            pollId: opt.pollId,
            optionText: opt.optionText,
            orderIndex: opt.orderIndex,
            voteCount,
            percentage,
            votes: opt.votes,
          };
        }),
      };
    });
  }

  async getPollById(circleId: string, pollId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const poll = await this.prisma.groupPoll.findFirst({
      where: { id: pollId, circleId },
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
        options: {
          orderBy: { orderIndex: 'asc' },
          include: {
            votes: {
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
          },
        },
        votes: true,
      },
    });

    if (!poll) {
      throw new NotFoundException('Không tìm thấy cuộc bình chọn');
    }

    const totalVotes = poll.votes.length;
    const userVote = poll.votes.find((v) => v.memberId === member.id);

    return {
      ...poll,
      totalVotes,
      userVotedOptionId: userVote?.optionId || null,
      options: poll.options.map((opt) => {
        const voteCount = opt.votes.length;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        return {
          id: opt.id,
          pollId: opt.pollId,
          optionText: opt.optionText,
          orderIndex: opt.orderIndex,
          voteCount,
          percentage,
          votes: opt.votes,
        };
      }),
    };
  }

  async createPoll(circleId: string, userId: string, dto: CreatePollDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const validOptions = dto.options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      throw new BadRequestException('Cuộc bình chọn cần có tối thiểu 2 phương án');
    }

    const poll = await this.prisma.$transaction(async (tx) => {
      const createdPoll = await tx.groupPoll.create({
        data: {
          circleId,
          createdById: member.id,
          question: dto.question.trim(),
          deadline: dto.deadline ? new Date(dto.deadline) : null,
          isClosed: false,
        },
      });

      for (let i = 0; i < validOptions.length; i++) {
        const optionText = validOptions[i] || `Phương án ${i + 1}`;
        await tx.pollOption.create({
          data: {
            pollId: createdPoll.id,
            optionText,
            orderIndex: i,
          },
        });
      }

      return createdPoll;
    });

    const fullPoll = await this.getPollById(circleId, poll.id, userId);
    this.chatGateway?.broadcastPollCreated(circleId, fullPoll);
    return fullPoll;
  }

  async votePoll(circleId: string, pollId: string, userId: string, dto: VotePollDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const poll = await this.prisma.groupPoll.findFirst({
      where: { id: pollId, circleId },
      include: { options: true },
    });

    if (!poll) {
      throw new NotFoundException('Không tìm thấy cuộc bình chọn');
    }

    if (poll.isClosed || (poll.deadline && new Date() > poll.deadline)) {
      throw new BadRequestException('Cuộc bình chọn này đã kết thúc hoặc quá hạn');
    }

    const optionExists = poll.options.some((o) => o.id === dto.optionId);
    if (!optionExists) {
      throw new BadRequestException('Phương án bình chọn không hợp lệ');
    }

    await this.prisma.pollVote.upsert({
      where: {
        pollId_memberId: {
          pollId,
          memberId: member.id,
        },
      },
      update: {
        optionId: dto.optionId,
        votedAt: new Date(),
      },
      create: {
        pollId,
        optionId: dto.optionId,
        memberId: member.id,
      },
    });

    const updatedPoll = await this.getPollById(circleId, pollId, userId);
    this.chatGateway?.broadcastPollVoted(circleId, updatedPoll);
    return updatedPoll;
  }

  async closePoll(circleId: string, pollId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const poll = await this.prisma.groupPoll.findFirst({
      where: { id: pollId, circleId },
    });

    if (!poll) {
      throw new NotFoundException('Không tìm thấy cuộc bình chọn');
    }

    if (poll.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền đóng cuộc bình chọn');
    }

    await this.prisma.groupPoll.update({
      where: { id: pollId },
      data: { isClosed: true },
    });

    const updatedPoll = await this.getPollById(circleId, pollId, userId);
    this.chatGateway?.broadcastPollClosed(circleId, updatedPoll);
    return updatedPoll;
  }

  async deletePoll(circleId: string, pollId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const poll = await this.prisma.groupPoll.findFirst({
      where: { id: pollId, circleId },
    });

    if (!poll) {
      throw new NotFoundException('Không tìm thấy cuộc bình chọn');
    }

    if (poll.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền xóa cuộc bình chọn');
    }

    await this.prisma.groupPoll.delete({
      where: { id: pollId },
    });

    return { success: true };
  }
}

