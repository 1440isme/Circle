import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  Optional,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSharedAlbumDto,
  UpdateSharedAlbumDto,
  AddPhotosDto,
  CreateWheelDto,
  UpdateWheelDto,
  CreateWheelFolderDto,
  UpdateWheelFolderDto,
  CreateAnonymousPostDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  RespondEventRsvpDto,
  CreatePlanningSheetDto,
  AddSheetColumnDto,
  AddSheetRowDto,
  UpdateSheetCellDto,
  StartLiveLocationDto,
  UpdateLiveLocationDto,
  CreatePollDto,
  VotePollDto,
} from './dto/circle-tools.dto';
import {
  SpinWheelResult,
  CalendarEventMessagePayload,
  MessageEntity,
} from '@circle/types';
import { ChatGateway } from '../chat/chat.gateway';

export const PASTEL_WHEEL_COLORS = [
  '#FFD6A5', // Pastel Warm Apricot
  '#CAFFBF', // Pastel Mint Green
  '#9BF6FF', // Pastel Sky Cyan
  '#FFADAD', // Pastel Coral Pink
  '#BDB2FF', // Pastel Soft Lavender
  '#FDFFB6', // Pastel Cream Butter
  '#A0C4FF', // Pastel Powder Blue
  '#FFC6FF', // Pastel Light Orchid
  '#B8E0D2', // Pastel Celadon Sage
  '#FED1BA', // Pastel Peach
  '#D7E3FC', // Pastel Periwinkle
  '#FDE2E4', // Pastel Rose Blossom
];

@Injectable()
export class CircleToolsService {
  private readonly logger = new Logger(CircleToolsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
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
      include: {
        user: {
          include: {
            profile: true,
          },
        },
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

    const existingCount = await this.prisma.decisionWheel.count({
      where: { circleId },
    });
    if (existingCount >= 4) {
      throw new BadRequestException(
        'Bạn đã đạt giới hạn 4 vòng quay. Vui lòng xóa một vòng quay đã lưu để tạo vòng quay mới.',
      );
    }

    if (!dto.options || dto.options.length < 2) {
      throw new BadRequestException('Vòng quay cần tối thiểu 2 phương án lựa chọn');
    }

    const initialOptions =
      dto.initialOptions && dto.initialOptions.length > 0
        ? dto.initialOptions
        : dto.options.map((opt) => opt.optionLabel.trim());

    const title = dto.title?.trim() || `Vòng quay ${existingCount + 1}`;

    return this.prisma.decisionWheel.create({
      data: {
        circleId,
        title,
        createdById: member.id,
        soundEnabled: dto.soundEnabled ?? true,
        confettiEnabled: dto.confettiEnabled ?? true,
        initialOptions,
        options: {
          create: dto.options.map((opt, idx) => ({
            optionLabel: opt.optionLabel.trim(),
            color: opt.color || PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length],
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

  async updateWheel(
    circleId: string,
    wheelId: string,
    userId: string,
    dto: UpdateWheelDto,
  ) {
    await this.getMemberOrThrow(circleId, userId);

    const wheel = await this.prisma.decisionWheel.findFirst({
      where: { id: wheelId, circleId },
      include: { options: true },
    });

    if (!wheel) {
      throw new NotFoundException('Không tìm thấy vòng quay');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.options && Array.isArray(dto.options) && dto.options.length >= 1) {
        await tx.wheelOption.deleteMany({
          where: { wheelId },
        });
        await tx.wheelOption.createMany({
          data: dto.options.map((opt, idx) => ({
            wheelId,
            optionLabel: opt.optionLabel.trim(),
            color: opt.color || PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length],
          })),
        });
      }

      return tx.decisionWheel.update({
        where: { id: wheelId },
        data: {
          title: dto.title !== undefined ? dto.title.trim() : undefined,
          soundEnabled: dto.soundEnabled !== undefined ? dto.soundEnabled : undefined,
          confettiEnabled: dto.confettiEnabled !== undefined ? dto.confettiEnabled : undefined,
          initialOptions: dto.initialOptions !== undefined ? dto.initialOptions : undefined,
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
    });
  }

  async spinAllWheels(circleId: string, userId: string): Promise<SpinWheelResult[]> {
    const member = await this.getMemberOrThrow(circleId, userId);

    const wheels = await this.prisma.decisionWheel.findMany({
      where: { circleId },
      include: { options: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!wheels || wheels.length === 0) {
      throw new BadRequestException('Chưa có vòng quay nào');
    }

    const now = new Date();
    const results: SpinWheelResult[] = [];

    for (const wheel of wheels) {
      if (wheel.options && wheel.options.length >= 1) {
        const randomIndex = Math.floor(Math.random() * wheel.options.length);
        const selected = wheel.options[randomIndex]!;
        await this.prisma.decisionWheel.update({
          where: { id: wheel.id },
          data: {
            lastResult: selected.optionLabel,
            lastSpunAt: now,
          },
        });
        results.push({
          wheelId: wheel.id,
          selectedOption: selected,
          selectedOptionIndex: randomIndex,
          spunAt: now.toISOString(),
        });
      }
    }

    if (this.chatGateway && results.length > 0) {
      this.chatGateway.broadcastWheelSpun(circleId, {
        circleId,
        isSpinAll: true,
        results,
        spunAt: now.toISOString(),
        spunBy: {
          userId,
          displayName: member.nickname || 'Thành viên',
        },
      });
    }

    return results;
  }

  async spinWheel(circleId: string, wheelId: string, userId: string): Promise<SpinWheelResult> {
    const member = await this.getMemberOrThrow(circleId, userId);

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

    const result: SpinWheelResult = {
      wheelId,
      selectedOption: selected,
      selectedOptionIndex: randomIndex,
      spunAt: now.toISOString(),
    };

    if (this.chatGateway) {
      this.chatGateway.broadcastWheelSpun(circleId, {
        wheelId,
        circleId,
        selectedOption: selected,
        selectedOptionIndex: randomIndex,
        spunAt: now.toISOString(),
        spunBy: {
          userId,
          displayName: member.nickname || 'Thành viên',
        },
      });
    }

    return result;
  }


  async deleteAllWheels(circleId: string, userId: string, defaultTitle?: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    await this.prisma.decisionWheel.deleteMany({
      where: { circleId },
    });

    const defaultInitialOptions = ['Phở bò', 'Bún chả', 'Cơm tấm', 'Bánh mì'];
    const title = defaultTitle?.trim() || 'Vòng quay 1';

    const defaultWheel = await this.prisma.decisionWheel.create({
      data: {
        circleId,
        title,
        createdById: member.id,
        soundEnabled: true,
        confettiEnabled: true,
        initialOptions: defaultInitialOptions,
        options: {
          create: defaultInitialOptions.map((opt, idx) => ({
            optionLabel: opt,
            color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length],
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

    return { success: true, defaultWheel };
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

  async shareWheelResultsToChat(
    circleId: string,
    userId: string,
    results: { wheelTitle: string; winner: string }[],
  ) {
    const member = await this.getMemberOrThrow(circleId, userId);

    if (!results || results.length === 0) {
      throw new BadRequestException('Danh sách kết quả không được để trống');
    }

    const channel = await this.prisma.channel.findFirst({
      where: { circleId },
      orderBy: { createdAt: 'asc' },
    });

    if (!channel) {
      throw new NotFoundException('Không tìm thấy kênh trò chuyện của vòng tròn');
    }

    const senderName =
      member.user?.profile?.displayName ||
      member.user?.email?.split('@')[0] ||
      member.nickname ||
      'Thành viên';

    const resultsListText = results
      .map((r, i) => `🏆 ${r.wheelTitle || `Vòng quay ${i + 1}`}: ${r.winner}`)
      .join('\n');

    const content = `🎯 [KẾT QUẢ VÒNG QUAY MAY MẮN]\n━━━━━━━━━━━━━━━━━━━━\n${resultsListText}\n━━━━━━━━━━━━━━━━━━━━\n(Được chia sẻ bởi ${senderName})`;

    const rawMessage = await this.prisma.message.create({
      data: {
        channelId: channel.id,
        memberId: member.id,
        type: 'TEXT',
        content,
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
      sentAt: rawMessage.sentAt ? rawMessage.sentAt.toISOString() : new Date().toISOString(),
      updatedAt: rawMessage.updatedAt ? rawMessage.updatedAt.toISOString() : new Date().toISOString(),
      sender: rawMessage.sender
        ? {
            id: rawMessage.sender.id,
            circleId: rawMessage.sender.circleId,
            userId: rawMessage.sender.userId,
            role: rawMessage.sender.role as any,
            nickname: rawMessage.sender.nickname,
            joinedAt: rawMessage.sender?.joinedAt ? rawMessage.sender.joinedAt.toISOString() : new Date().toISOString(),
            updatedAt: rawMessage.sender?.updatedAt ? rawMessage.sender.updatedAt.toISOString() : new Date().toISOString(),
            user: rawMessage.sender.user
              ? {
                  id: rawMessage.sender.user.id,
                  email: rawMessage.sender.user.email,
                  isActivated: rawMessage.sender.user.isActivated,
                  globalRole: rawMessage.sender.user.globalRole as any,
                  createdAt: rawMessage.sender.user.createdAt ? rawMessage.sender.user.createdAt.toISOString() : new Date().toISOString(),
                  updatedAt: rawMessage.sender.user.updatedAt ? rawMessage.sender.user.updatedAt.toISOString() : new Date().toISOString(),
                  profile: rawMessage.sender.user.profile
                    ? {
                        id: rawMessage.sender.user.profile.id,
                        userId: rawMessage.sender.user.profile.userId,
                        displayName: rawMessage.sender.user.profile.displayName,
                        avatarUrl: rawMessage.sender.user.profile.avatarUrl,
                        bio: rawMessage.sender.user.profile.bio,
                        dateOfBirth: rawMessage.sender.user.profile.dateOfBirth?.toISOString() || null,
                        updatedAt: rawMessage.sender.user.profile.updatedAt ? rawMessage.sender.user.profile.updatedAt.toISOString() : new Date().toISOString(),
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

    this.chatGateway?.broadcastNewMessage(channel.id, formattedMessage);

    return { success: true, messageId: rawMessage.id };
  }

  // --- Wheel Folders / Presets ---
  async getWheelFolders(circleId: string, userId: string) {
    await this.getMemberOrThrow(circleId, userId);

    return this.prisma.wheelFolder.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWheelFolder(circleId: string, userId: string, dto: CreateWheelFolderDto) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('Tên thư mục không được để trống');
    }

    let snapshotData = dto.data;
    if (!snapshotData || snapshotData.length === 0) {
      const currentWheels = await this.prisma.decisionWheel.findMany({
        where: { circleId },
        include: { options: true },
        orderBy: { createdAt: 'asc' },
      });

      snapshotData = currentWheels.map((w) => ({
        id: w.id,
        title: w.title,
        options: w.options.map((o) => ({
          optionLabel: o.optionLabel,
          color: o.color ?? undefined,
        })),
        soundEnabled: w.soundEnabled,
        confettiEnabled: w.confettiEnabled,
        initialOptions: w.initialOptions,
        lastResult: w.lastResult,
        lastSpunAt: w.lastSpunAt ? w.lastSpunAt.toISOString() : null,
      }));
    }

    return this.prisma.wheelFolder.create({
      data: {
        circleId,
        createdById: member.id,
        name,
        data: snapshotData as any,
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

  async restoreWheelFolder(circleId: string, folderId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const folder = await this.prisma.wheelFolder.findFirst({
      where: { id: folderId, circleId },
    });

    if (!folder) {
      throw new NotFoundException('Không tìm thấy thư mục');
    }

    const snapshot = (folder.data as any) || [];
    if (!Array.isArray(snapshot) || snapshot.length === 0) {
      throw new BadRequestException('Thư mục này không có vòng quay nào');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.decisionWheel.deleteMany({
        where: { circleId },
      });

      for (const item of snapshot.slice(0, 4)) {
        if (item.options && Array.isArray(item.options) && item.options.length >= 1) {
          await tx.decisionWheel.create({
            data: {
              circleId,
              createdById: member.id,
              title: item.title || 'Vòng quay',
              soundEnabled: item.soundEnabled ?? true,
              confettiEnabled: item.confettiEnabled ?? true,
              initialOptions: item.initialOptions ?? item.options.map((o: any) => o.optionLabel),
              lastResult: item.lastResult ?? null,
              lastSpunAt: item.lastSpunAt ? new Date(item.lastSpunAt) : null,
              options: {
                create: item.options.map((o: any) => ({
                  optionLabel: typeof o === 'string' ? o : o.optionLabel,
                  color: typeof o === 'object' ? o.color || undefined : undefined,
                })),
              },
            },
          });
        }
      }

      return tx.decisionWheel.findMany({
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
        orderBy: { createdAt: 'asc' },
      });
    });
  }

  async updateWheelFolder(
    circleId: string,
    folderId: string,
    userId: string,
    dto: UpdateWheelFolderDto,
  ) {
    await this.getMemberOrThrow(circleId, userId);

    const folder = await this.prisma.wheelFolder.findFirst({
      where: { id: folderId, circleId },
    });

    if (!folder) {
      throw new NotFoundException('Không tìm thấy thư mục');
    }

    const updateData: any = {};
    if (dto.name !== undefined) {
      const name = dto.name?.trim();
      if (!name) {
        throw new BadRequestException('Tên thư mục không được để trống');
      }
      updateData.name = name;
    }
    if (dto.data !== undefined) {
      updateData.data = dto.data;
    }

    return this.prisma.wheelFolder.update({
      where: { id: folderId },
      data: updateData,
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

  async deleteWheelFolder(circleId: string, folderId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const folder = await this.prisma.wheelFolder.findFirst({
      where: { id: folderId, circleId },
    });

    if (!folder) {
      throw new NotFoundException('Không tìm thấy thư mục');
    }

    if (folder.createdById && folder.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền xóa thư mục');
    }

    await this.prisma.wheelFolder.delete({
      where: { id: folderId },
    });

    return { success: true };
  }


  // ===========================================================================
  // 3. ANONYMOUS POST / WORDS UNSAID (UC21)
  // ===========================================================================

  async getAnonymousPosts(circleId: string, userId: string) {
    await this.getMemberOrThrow(circleId, userId);

    // Guaranteed ZERO author identification returned to client
    const posts = await this.prisma.anonymousPost.findMany({
      where: { circleId },
      orderBy: { postedAt: 'desc' },
      select: {
        id: true,
        circleId: true,
        content: true,
        cardTheme: true,
        postedAt: true,
        reactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
    });

    return posts.map((post) => {
      const map = new Map<string, { count: number; userReacted: boolean }>();
      for (const r of post.reactions || []) {
        const cur = map.get(r.emoji) || { count: 0, userReacted: false };
        cur.count++;
        if (r.userId === userId) {
          cur.userReacted = true;
        }
        map.set(r.emoji, cur);
      }
      return {
        id: post.id,
        circleId: post.circleId,
        content: post.content,
        cardTheme: post.cardTheme,
        postedAt: post.postedAt,
        reactions: Array.from(map.entries()).map(([emoji, item]) => ({
          emoji,
          count: item.count,
          userReacted: item.userReacted,
        })),
      };
    });
  }

  async toggleAnonymousPostReaction(circleId: string, postId: string, userId: string, emoji: string) {
    await this.getMemberOrThrow(circleId, userId);

    const post = await this.prisma.anonymousPost.findFirst({
      where: { id: postId, circleId },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    if (!emoji || emoji.trim().length === 0) {
      throw new BadRequestException('Biểu cảm không hợp lệ');
    }

    const cleanEmoji = emoji.trim();

    const existing = await this.prisma.anonymousPostReaction.findUnique({
      where: {
        postId_userId_emoji: {
          postId,
          userId,
          emoji: cleanEmoji,
        },
      },
    });

    if (existing) {
      await this.prisma.anonymousPostReaction.delete({
        where: { id: existing.id },
      });
    } else {
      await this.prisma.anonymousPostReaction.create({
        data: {
          postId,
          userId,
          emoji: cleanEmoji,
        },
      });
    }

    const allReactions = await this.prisma.anonymousPostReaction.findMany({
      where: { postId },
      select: { emoji: true, userId: true },
    });

    const reactionMap = new Map<string, number>();
    for (const r of allReactions) {
      reactionMap.set(r.emoji, (reactionMap.get(r.emoji) || 0) + 1);
    }

    const reactionSummary = Array.from(reactionMap.entries()).map(([em, count]) => ({
      emoji: em,
      count,
    }));

    if (this.chatGateway) {
      this.chatGateway.broadcastAnonymousPostReaction(circleId, {
        postId,
        circleId,
        reactions: reactionSummary,
        toggledEmoji: cleanEmoji,
        action: existing ? 'REMOVED' : 'ADDED',
      });
    }

    return {
      postId,
      reactions: reactionSummary,
      userReacted: !existing,
      toggledEmoji: cleanEmoji,
    };
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

    let dateFilter: any = {};
    if (month && year) {
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      dateFilter = {
        OR: [
          // Sự kiện bắt đầu trong tháng
          {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          // Sự kiện bắt đầu trước tháng này nhưng kết thúc trong hoặc sau tháng này (kéo dài nhiều ngày)
          {
            startTime: { lte: endDate },
            endTime: { gte: startDate },
          },
          // Sự kiện có cấu hình lặp lại bắt đầu trước hoặc trong tháng
          {
            startTime: { lte: endDate },
            description: { contains: '[RECURRENCE:' },
          },
        ],
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
        rsvps: {
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

    const start = new Date(dto.startTime);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Thời gian bắt đầu không hợp lệ');
    }

    let end: Date | null = null;
    if (dto.endTime) {
      end = new Date(dto.endTime);
      if (isNaN(end.getTime())) {
        throw new BadRequestException('Thời gian kết thúc không hợp lệ');
      }
      if (end.getTime() <= start.getTime()) {
        throw new BadRequestException('Thời gian kết thúc phải lớn hơn thời gian bắt đầu');
      }
    }

    const createdEvent = await this.prisma.calendarEvent.create({
      data: {
        circleId,
        createdById: member.id,
        eventTitle: dto.eventTitle.trim(),
        description: dto.description?.trim(),
        location: dto.location?.trim(),
        startTime: start,
        endTime: end,
        reminderTime: dto.reminderTime ? new Date(dto.reminderTime) : null,
        rsvps: {
          create: {
            userId,
            status: 'YES',
          },
        },
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
        rsvps: {
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

    const broadcastAction = (dto as any)?.isRecurrenceSplit ? 'UPDATED' : 'CREATED';
    await this.broadcastCalendarEventMessage(circleId, member, createdEvent, broadcastAction);

    return createdEvent;
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

    if (dto.startTime) {
      const start = new Date(dto.startTime);
      if (isNaN(start.getTime())) {
        throw new BadRequestException('Thời gian bắt đầu không hợp lệ');
      }
    }

    const effectiveStart = dto.startTime ? new Date(dto.startTime) : event.startTime;
    const effectiveEnd =
      dto.endTime !== undefined
        ? dto.endTime
          ? new Date(dto.endTime)
          : null
        : event.endTime;

    if (effectiveEnd) {
      if (isNaN(effectiveEnd.getTime())) {
        throw new BadRequestException('Thời gian kết thúc không hợp lệ');
      }
      if (effectiveEnd.getTime() <= effectiveStart.getTime()) {
        throw new BadRequestException('Thời gian kết thúc phải lớn hơn thời gian bắt đầu');
      }
    }

    const updatedEvent = await this.prisma.calendarEvent.update({
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
        rsvps: {
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

    await this.broadcastCalendarEventMessage(circleId, member, updatedEvent, 'UPDATED');

    return updatedEvent;
  }

  async cancelCalendarEvent(circleId: string, eventId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, circleId },
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
        rsvps: {
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

    if (!event) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    if (event.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền hủy sự kiện');
    }

    if (event.isCancelled) {
      return event;
    }

    const updatedEvent = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: { isCancelled: true },
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
        rsvps: {
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

    // Broadcast cancellation announcement to circle chat
    await this.broadcastCalendarEventMessage(circleId, member, updatedEvent, 'CANCELLED');

    return updatedEvent;
  }

  async deleteCalendarEvent(circleId: string, eventId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, circleId },
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
        rsvps: {
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

    if (!event) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    if (event.createdById !== member.id && member.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ người tạo hoặc chủ vòng tròn mới có quyền xóa sự kiện');
    }

    // Broadcast cancellation announcement to circle chat before deleting
    await this.broadcastCalendarEventMessage(circleId, member, event, 'DELETED');

    await this.prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    return { success: true };
  }

  async respondEventRsvp(
    circleId: string,
    eventId: string,
    userId: string,
    dto: RespondEventRsvpDto,
  ) {
    await this.getMemberOrThrow(circleId, userId);

    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, circleId },
    });

    if (!event) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const isRecurring = Boolean(
      event.description &&
        (event.description.includes('[RECURRENCE:') ||
          event.description.includes('[Lặp lại:')),
    );
    const effectiveEnd = event.endTime
      ? new Date(event.endTime)
      : new Date(new Date(event.startTime).getTime() + 60 * 60 * 1000);

    if (!isRecurring && effectiveEnd <= new Date()) {
      throw new BadRequestException(
        'Sự kiện đã kết thúc, không thể bình chọn tham gia nữa',
      );
    }

    const rsvp = await this.prisma.calendarEventRsvp.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      update: {
        status: dto.status,
      },
      create: {
        eventId,
        userId,
        status: dto.status,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    const updatedEvent = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
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
        rsvps: {
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

    if (updatedEvent) {
      const rsvpsBreakdown = this.computeRsvpBreakdown(updatedEvent.rsvps || []);
      this.chatGateway?.broadcastCalendarEventRsvp(circleId, {
        eventId,
        circleId,
        rsvp: {
          id: rsvp.id,
          eventId: rsvp.eventId,
          userId: rsvp.userId,
          status: rsvp.status,
          createdAt: rsvp.createdAt.toISOString(),
          updatedAt: rsvp.updatedAt.toISOString(),
          user: rsvp.user
            ? {
                id: rsvp.user.id,
                email: rsvp.user.email,
                profile: rsvp.user.profile
                  ? {
                      displayName: rsvp.user.profile.displayName,
                      avatarUrl: rsvp.user.profile.avatarUrl,
                    }
                  : null,
              }
            : undefined,
        },
        rsvps: rsvpsBreakdown,
      });

      // "và chỉ cần thẻ sự kiện khi tạo hoặc nhắc thui":
      // Cập nhật số lượng vote trên thẻ gốc trong DB (giữ action: 'CREATED' để thẻ gốc vẫn là thẻ sự kiện đầy đủ),
      // đồng thời gửi 1 tin nhắn thông báo hệ thống mới (action: 'RSVP_UPDATED') vào chat
      try {
        const existingMessage = await this.prisma.message.findFirst({
          where: {
            channel: { circleId },
            content: {
              contains: `"eventId":"${eventId}"`,
            },
          },
          orderBy: { sentAt: 'desc' },
          include: {
            channel: true,
            sender: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
            reactions: true,
            pinnedRecord: true,
          },
        });

        const defaultChannel = await this.prisma.channel.findFirst({
          where: { circleId },
          orderBy: { createdAt: 'asc' },
        });
        const channel = existingMessage?.channel || defaultChannel;

        if (channel) {
          const actorName =
            rsvp.user?.profile?.displayName || rsvp.user?.email?.split('@')[0] || 'Thành viên';

          if (existingMessage && existingMessage.content) {
            let parsedContent: any = {};
            try {
              parsedContent = JSON.parse(existingMessage.content.replace('[CALENDAR_EVENT]:', ''));
            } catch {}
            parsedContent.rsvps = rsvpsBreakdown;
            // Thẻ gốc giữ action: 'CREATED' để vẫn hiển thị đầy đủ thẻ sự kiện, nhưng cập nhật latestAction
            parsedContent.action = 'CREATED';
            parsedContent.latestAction = 'RSVP_UPDATED';
            parsedContent.lastActorName = actorName;
            parsedContent.lastActorUserId = rsvp.userId;
            parsedContent.lastRsvpStatus = rsvp.status as any;

            const updatedRaw = await this.prisma.message.update({
              where: { id: existingMessage.id },
              data: {
                content: `[CALENDAR_EVENT]:${JSON.stringify(parsedContent)}`,
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
                reactions: true,
                pinnedRecord: true,
              },
            });

            this.chatGateway?.broadcastMessageUpdated(channel.id, this.mapMessageToEntity(updatedRaw));
          }

          // Tạo tin nhắn thông báo hệ thống mới (action: 'RSVP_UPDATED') gửi vào chat
          // Client sẽ chỉ hiển thị dòng thông báo hệ thống (KHÔNG CÓ THẺ SỰ KIỆN)
          const member = await this.prisma.circleMember.findUnique({
            where: { circleId_userId: { circleId, userId: rsvp.userId } },
          });
          if (member) {
            const rsvpSystemPayload: CalendarEventMessagePayload = {
              type: 'CALENDAR_EVENT',
              eventId: updatedEvent.id,
              eventTitle: updatedEvent.eventTitle,
              startTime: updatedEvent.startTime.toISOString(),
              endTime: updatedEvent.endTime ? updatedEvent.endTime.toISOString() : null,
              creatorName: (updatedEvent as any).creator?.profile?.displayName || 'Người tạo',
              lastActorName: actorName,
              lastActorUserId: rsvp.userId,
              lastRsvpStatus: rsvp.status as any,
              action: 'RSVP_UPDATED',
              latestAction: 'RSVP_UPDATED',
            };

            const rawRsvpMsg = await this.prisma.message.create({
              data: {
                channelId: channel.id,
                memberId: member.id,
                type: 'TEXT',
                content: `[CALENDAR_EVENT]:${JSON.stringify(rsvpSystemPayload)}`,
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
                reactions: true,
                pinnedRecord: true,
              },
            });

            this.chatGateway?.broadcastNewMessage(channel.id, this.mapMessageToEntity(rawRsvpMsg));
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to update calendar event message RSVP state: ${err?.message}`);
      }
    }

    return rsvp;
  }

  async getUpcomingCalendarEvents(circleId: string, userId: string, limit = 20) {
    await this.getMemberOrThrow(circleId, userId);
    const now = new Date();

    return this.prisma.calendarEvent.findMany({
      where: {
        circleId,
        isCancelled: false,
        OR: [
          { startTime: { gte: now } },
          { endTime: { gte: now } },
        ],
      },
      orderBy: { startTime: 'asc' },
      take: limit,
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
        rsvps: {
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

  async shareCalendarEventToChat(circleId: string, eventId: string, userId: string) {
    const member = await this.getMemberOrThrow(circleId, userId);

    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, circleId },
      include: {
        creator: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
        rsvps: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    await this.broadcastCalendarEventMessage(circleId, member, event, 'CREATED');
    return { success: true };
  }

  private computeRsvpBreakdown(rsvps: any[]) {
    let yesCount = 0;
    let noCount = 0;
    let maybeCount = 0;

    const userRsvps = rsvps.map((r) => {
      if (r.status === 'YES') yesCount++;
      else if (r.status === 'NO') noCount++;
      else if (r.status === 'MAYBE') maybeCount++;

      return {
        userId: r.userId,
        status: r.status,
        displayName:
          r.user?.profile?.displayName || r.user?.email?.split('@')[0] || 'Thành viên',
        avatarUrl: r.user?.profile?.avatarUrl || null,
      };
    });

    return {
      yesCount,
      noCount,
      maybeCount,
      userRsvps,
    };
  }

  private mapMessageToEntity(raw: any): MessageEntity {
    return {
      id: raw.id,
      channelId: raw.channelId,
      memberId: raw.memberId,
      type: raw.type as any,
      content: raw.content,
      fileUrl: raw.fileUrl,
      fileName: raw.fileName,
      fileSize: raw.fileSize,
      audioDuration: raw.audioDuration,
      replyToId: raw.replyToId,
      sentAt: raw.sentAt ? raw.sentAt.toISOString() : new Date().toISOString(),
      updatedAt: raw.updatedAt ? raw.updatedAt.toISOString() : new Date().toISOString(),
      sender: raw.sender
        ? {
            id: raw.sender.id,
            circleId: raw.sender.circleId,
            userId: raw.sender.userId,
            role: raw.sender.role as any,
            nickname: raw.sender.nickname,
            joinedAt: raw.sender?.joinedAt ? raw.sender.joinedAt.toISOString() : new Date().toISOString(),
            updatedAt: raw.sender?.updatedAt ? raw.sender.updatedAt.toISOString() : new Date().toISOString(),
            user: raw.sender.user
              ? {
                  id: raw.sender.user.id,
                  email: raw.sender.user.email,
                  isActivated: raw.sender.user.isActivated,
                  globalRole: raw.sender.user.globalRole as any,
                  createdAt: raw.sender.user.createdAt ? raw.sender.user.createdAt.toISOString() : new Date().toISOString(),
                  updatedAt: raw.sender.user.updatedAt ? raw.sender.user.updatedAt.toISOString() : new Date().toISOString(),
                  profile: raw.sender.user.profile
                    ? {
                        id: raw.sender.user.profile.id,
                        userId: raw.sender.user.profile.userId,
                        displayName: raw.sender.user.profile.displayName,
                        avatarUrl: raw.sender.user.profile.avatarUrl,
                        bio: raw.sender.user.profile.bio,
                        dateOfBirth: raw.sender.user.profile.dateOfBirth?.toISOString() || null,
                        updatedAt: raw.sender.user.profile.updatedAt ? raw.sender.user.profile.updatedAt.toISOString() : new Date().toISOString(),
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
  }

  /**
   * Helper: Broadcast a rich calendar event message into the circle's primary chat channel.
   * "và chỉ cần thẻ sự kiện khi tạo hoặc nhắc thui":
   * - Tạo mới (CREATED) / Nhắc hẹn (REMINDER): Gửi tin nhắn chứa thông báo hệ thống + THẺ SỰ KIỆN.
   * - Sửa / Hủy: Cập nhật thẻ gốc trong DB (giữ action: 'CREATED') và gửi tin nhắn thông báo hệ thống (KHÔNG CÓ THẺ SỰ KIỆN).
   */
  private async broadcastCalendarEventMessage(
    circleId: string,
    member: any,
    event: any,
    action: 'CREATED' | 'UPDATED' | 'CANCELLED' | 'DELETED' | 'RSVP_UPDATED' = 'CREATED',
  ) {
    try {
      let channel: any = null;
      let existingMessage: any = null;

      // Khi sửa, hủy hoặc cập nhật RSVP: Tìm kênh chat nơi thẻ sự kiện gốc được đăng
      if (action !== 'CREATED' && this.prisma.message?.findFirst) {
        existingMessage = await this.prisma.message.findFirst({
          where: {
            channel: { circleId },
            content: {
              contains: `"eventId":"${event.id}"`,
            },
          },
          orderBy: { sentAt: 'desc' },
          include: {
            channel: true,
            sender: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
            reactions: true,
            pinnedRecord: true,
          },
        });
        channel = existingMessage?.channel;
      }

      if (!channel) {
        channel = await this.prisma.channel.findFirst({
          where: { circleId },
          orderBy: { createdAt: 'asc' },
        });
      }
      if (!channel) return;

      const creatorName =
        member.user?.profile?.displayName ||
        member.user?.email?.split('@')[0] ||
        member.nickname ||
        'Thành viên';

      let rsvpsData =
        event.rsvps && event.rsvps.length > 0
          ? this.computeRsvpBreakdown(event.rsvps)
          : undefined;

      // Always guarantee creator RSVP is included from the very beginning
      if (!rsvpsData || rsvpsData.userRsvps.length === 0) {
        rsvpsData = {
          yesCount: 1,
          noCount: 0,
          maybeCount: 0,
          userRsvps: [
            {
              userId: member.userId,
              status: 'YES' as any,
              displayName: creatorName,
              avatarUrl: member.user?.profile?.avatarUrl || null,
            },
          ],
        };
      }

      const payload: CalendarEventMessagePayload = {
        type: 'CALENDAR_EVENT',
        action,
        latestAction: action,
        eventId: event.id,
        eventTitle: event.eventTitle || event.title,
        description: event.description || null,
        location: event.location || null,
        startTime: event.startTime instanceof Date ? event.startTime.toISOString() : String(event.startTime),
        endTime: event.endTime ? (event.endTime instanceof Date ? event.endTime.toISOString() : String(event.endTime)) : null,
        reminderTime: event.reminderTime ? (event.reminderTime instanceof Date ? event.reminderTime.toISOString() : String(event.reminderTime)) : null,
        isCancelled: Boolean(event.isCancelled || action === 'CANCELLED' || action === 'DELETED'),
        creatorName,
        lastActorName: creatorName,
        lastActorUserId: member.userId,
        rsvps: rsvpsData,
      };

      // "và chỉ cần thẻ sự kiện khi tạo hoặc nhắc thui":
      // Khi sửa, hủy hoặc xóa:
      // 1) Cập nhật thẻ gốc trong database (giữ action: 'CREATED' để thẻ gốc vẫn hiển thị đầy đủ thẻ, đồng thời cập nhật latestAction để header thẻ hiển thị chính xác)
      // 2) Gửi tin nhắn thông báo hệ thống mới vào kênh chat (action !== 'CREATED', chỉ hiển thị dòng text)
      if (action !== 'CREATED') {
        if (existingMessage && existingMessage.content) {
          let parsedExisting: any = {};
          try {
            parsedExisting = JSON.parse(existingMessage.content.replace('[CALENDAR_EVENT]:', ''));
          } catch {}

          const updatedCardPayload: CalendarEventMessagePayload = {
            ...parsedExisting,
            eventTitle: event.eventTitle || event.title,
            startTime: event.startTime instanceof Date ? event.startTime.toISOString() : String(event.startTime),
            endTime: event.endTime ? (event.endTime instanceof Date ? event.endTime.toISOString() : String(event.endTime)) : null,
            location: event.location || null,
            description: event.description || null,
            reminderTime: event.reminderTime ? (event.reminderTime instanceof Date ? event.reminderTime.toISOString() : String(event.reminderTime)) : null,
            isCancelled: Boolean(event.isCancelled || action === 'CANCELLED' || action === 'DELETED'),
            action,
            latestAction: action,
            lastActorName: creatorName,
            lastActorUserId: member.userId,
          };

          const updatedRaw = await this.prisma.message.update({
            where: { id: existingMessage.id },
            data: {
              content: `[CALENDAR_EVENT]:${JSON.stringify(updatedCardPayload)}`,
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
              reactions: true,
              pinnedRecord: true,
            },
          });

          this.chatGateway?.broadcastMessageUpdated(channel.id, this.mapMessageToEntity(updatedRaw));
        }

        // Tạo tin nhắn thông báo hệ thống mới (action: 'UPDATED' hoặc 'CANCELLED')
        // Client sẽ chỉ hiển thị dòng thông báo hệ thống (KHÔNG CÓ THẺ SỰ KIỆN)
        const rawSystemMessage = await this.prisma.message.create({
          data: {
            channelId: channel.id,
            memberId: member.id,
            type: 'TEXT',
            content: `[CALENDAR_EVENT]:${JSON.stringify(payload)}`,
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
            reactions: true,
            pinnedRecord: true,
          },
        });

        this.chatGateway?.broadcastNewMessage(channel.id, this.mapMessageToEntity(rawSystemMessage));
        return;
      }

      const rawMessage = await this.prisma.message.create({
        data: {
          channelId: channel.id,
          memberId: member.id,
          type: 'TEXT',
          content: `[CALENDAR_EVENT]:${JSON.stringify(payload)}`,
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
          reactions: true,
          pinnedRecord: true,
        },
      });

      this.chatGateway?.broadcastNewMessage(channel.id, this.mapMessageToEntity(rawMessage));
    } catch (err) {
      console.error('Failed to broadcast calendar event message to channel:', err);
    }
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

