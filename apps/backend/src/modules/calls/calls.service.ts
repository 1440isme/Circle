import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import {
  CallType,
  CallStatus,
  IceServerConfig,
  IceServersResponse,
  InitiateCallResponse,
  CallSessionDetailEntity,
  CallParticipantEntity,
} from '@circle/types';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Retrieves STUN/TURN ICE server configurations from environment.
   */
  getIceServers(): IceServersResponse {
    const stunUrl =
      this.configService.get<string>('STUN_SERVER_URL') ||
      'stun:stun.l.google.com:19302';
    const turnUrl = this.configService.get<string>('TURN_SERVER_URL');
    const turnUsername = this.configService.get<string>('TURN_USERNAME');
    const turnCredential = this.configService.get<string>('TURN_CREDENTIAL');

    const iceServers: IceServerConfig[] = [{ urls: stunUrl }];

    if (turnUrl && turnUsername && turnCredential) {
      iceServers.push({
        urls: turnUrl,
        username: turnUsername,
        credential: turnCredential,
      });
    }

    return { iceServers };
  }

  /**
   * Initiates a new call session or joins an ongoing active call in a circle.
   */
  async initiateCall(
    userId: string,
    circleId: string,
    callType: CallType = CallType.AUDIO,
  ): Promise<InitiateCallResponse> {
    const member = await this.prisma.circleMember.findFirst({
      where: { circleId, userId },
      include: {
        circle: true,
        user: { include: { profile: true } },
      },
    });

    if (!member) {
      throw new ForbiddenException('Bạn không phải là thành viên của Vòng tròn này');
    }

    // Check if there is already an active call in this circle
    let callSession = await this.prisma.callSession.findFirst({
      where: {
        circleId,
        status: CallStatus.ACTIVE,
      },
      include: {
        circle: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
          },
        },
        participants: {
          where: { leftAt: null },
          include: {
            member: {
              include: {
                user: {
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
              },
            },
          },
        },
      },
    });

    // If no active call, create a new one
    if (!callSession) {
      callSession = await this.prisma.callSession.create({
        data: {
          circleId,
          callType,
          status: CallStatus.ACTIVE,
          startedAt: new Date(),
        },
        include: {
          circle: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatarUrl: true,
            },
          },
          participants: {
            include: {
              member: {
                include: {
                  user: {
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
                },
              },
            },
          },
        },
      });
      this.logger.log(`Created new call session ${callSession.id} in circle ${circleId}`);
    }

    // Add caller as participant if not already in session
    const existingParticipant = await this.prisma.callParticipant.findFirst({
      where: {
        callSessionId: callSession.id,
        memberId: member.id,
        leftAt: null,
      },
    });

    if (!existingParticipant) {
      await this.prisma.callParticipant.create({
        data: {
          callSessionId: callSession.id,
          memberId: member.id,
          joinedAt: new Date(),
        },
      });
    }

    // Re-fetch complete session details
    const fullSession = await this.getCallSessionDetail(callSession.id);
    const iceServers = this.getIceServers().iceServers;

    return {
      callSession: fullSession,
      iceServers,
    };
  }

  /**
   * Joins an existing active call session.
   */
  async joinCall(userId: string, callSessionId: string): Promise<CallParticipantEntity> {
    const session = await this.prisma.callSession.findUnique({
      where: { id: callSessionId },
    });

    if (!session || session.status !== CallStatus.ACTIVE) {
      throw new NotFoundException('Cuộc gọi không tồn tại hoặc đã kết thúc');
    }

    const member = await this.prisma.circleMember.findFirst({
      where: { circleId: session.circleId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Bạn không phải là thành viên của Vòng tròn này');
    }

    // Check if participant already active
    const activeParticipant = await this.prisma.callParticipant.findFirst({
      where: {
        callSessionId,
        memberId: member.id,
        leftAt: null,
      },
      include: {
        member: {
          include: {
            user: {
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
          },
        },
      },
    });

    if (activeParticipant) {
      return this.mapParticipantToEntity(activeParticipant);
    }

    // Create participant record
    const participant = await this.prisma.callParticipant.create({
      data: {
        callSessionId,
        memberId: member.id,
        joinedAt: new Date(),
      },
      include: {
        member: {
          include: {
            user: {
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
          },
        },
      },
    });

    return this.mapParticipantToEntity(participant);
  }

  /**
   * Leaves an active call session.
   */
  async leaveCall(
    userId: string,
    callSessionId: string,
  ): Promise<{
    success: boolean;
    callSessionId: string;
    circleId: string;
    isCallEnded: boolean;
    endedAt?: string;
    summaryMessage?: any;
  }> {
    const session = await this.prisma.callSession.findUnique({
      where: { id: callSessionId },
      include: {
        participants: {
          where: { leftAt: null },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Cuộc gọi không tồn tại');
    }

    if (session.status === CallStatus.ENDED) {
      return {
        success: true,
        callSessionId,
        circleId: session.circleId,
        isCallEnded: true,
        endedAt: session.endedAt?.toISOString(),
      };
    }

    const member = await this.prisma.circleMember.findFirst({
      where: { circleId: session.circleId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Bạn không thuộc Vòng tròn này');
    }

    // Mark current member leftAt
    await this.prisma.callParticipant.updateMany({
      where: {
        callSessionId,
        memberId: member.id,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    });

    // Check remaining active participants
    const remainingActive = await this.prisma.callParticipant.count({
      where: {
        callSessionId,
        leftAt: null,
      },
    });

    let isCallEnded = false;
    let endedAt: string | undefined = undefined;
    let summaryMessage: any = null;

    if (remainingActive === 0) {
      const endedDate = new Date();
      endedAt = endedDate.toISOString();
      const updateResult = await this.prisma.callSession.updateMany({
        where: {
          id: callSessionId,
          status: CallStatus.ACTIVE,
        },
        data: {
          status: CallStatus.ENDED,
          endedAt: endedDate,
        },
      });

      isCallEnded = true;

      // Only the atomic winner creates the summary message (guaranteed exactly once)
      if (updateResult.count > 0) {
        summaryMessage = await this.createCallSummaryMessage(
          session.circleId,
          callSessionId,
          session.callType,
          session.startedAt,
          endedDate,
          userId,
        );
      }
    }

    return {
      success: true,
      callSessionId,
      circleId: session.circleId,
      isCallEnded,
      endedAt,
      summaryMessage,
    };
  }

  /**
   * Automatically creates a call summary message in the primary circle text channel.
   */
  private async createCallSummaryMessage(
    circleId: string,
    callSessionId: string,
    callType: CallType | string,
    startedAt: Date,
    endedAt: Date,
    fallbackUserId?: string,
  ) {
    try {
      if (!this.prisma.channel?.findFirst || !this.prisma.circleMember?.findFirst || !this.prisma.message?.create) {
        return null;
      }

      const channel = await this.prisma.channel.findFirst({
        where: { circleId, type: 'TEXT' },
        orderBy: { createdAt: 'asc' },
      });
      if (!channel) return null;

      let member = fallbackUserId
        ? await this.prisma.circleMember.findFirst({
            where: { circleId, userId: fallbackUserId },
          })
        : null;

      if (!member) {
        member = await this.prisma.circleMember.findFirst({
          where: { circleId },
          orderBy: { role: 'asc' },
        });
      }

      if (!member) return null;

      const durationSeconds = Math.max(
        0,
        Math.round((endedAt.getTime() - new Date(startedAt).getTime()) / 1000),
      );

      const summaryPayload = {
        type: 'CALL_SUMMARY',
        callSessionId,
        callType,
        durationSeconds,
        startedAt: new Date(startedAt).toISOString(),
        endedAt: endedAt.toISOString(),
      };

      const rawMessage = await this.prisma.message.create({
        data: {
          channelId: channel.id,
          memberId: member.id,
          type: 'TEXT',
          content: `[CALL_SUMMARY]:${JSON.stringify(summaryPayload)}`,
        },
        include: {
          sender: { include: { user: { include: { profile: true } } } },
          replyTo: { include: { sender: { include: { user: { include: { profile: true } } } } } },
          reactions: { include: { member: { include: { user: { include: { profile: true } } } } } },
          pinnedRecord: true,
          receipts: { include: { user: { include: { profile: true } } } },
        },
      });

      return {
        id: rawMessage.id,
        channelId: rawMessage.channelId,
        memberId: rawMessage.memberId,
        type: rawMessage.type,
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
              role: rawMessage.sender.role,
              nickname: rawMessage.sender.nickname,
              joinedAt: rawMessage.sender.joinedAt.toISOString(),
              updatedAt: rawMessage.sender.updatedAt.toISOString(),
              user: rawMessage.sender.user
                ? {
                    id: rawMessage.sender.user.id,
                    email: rawMessage.sender.user.email,
                    isActivated: rawMessage.sender.user.isActivated,
                    globalRole: rawMessage.sender.user.globalRole,
                    createdAt: rawMessage.sender.user.createdAt.toISOString(),
                    updatedAt: rawMessage.sender.user.updatedAt.toISOString(),
                    profile: rawMessage.sender.user.profile
                      ? {
                          id: rawMessage.sender.user.profile.id,
                          userId: rawMessage.sender.user.profile.userId,
                          displayName: rawMessage.sender.user.profile.displayName,
                          avatarUrl: rawMessage.sender.user.profile.avatarUrl,
                          bio: rawMessage.sender.user.profile.bio,
                          dateOfBirth:
                            rawMessage.sender.user.profile.dateOfBirth?.toISOString() || null,
                          updatedAt: rawMessage.sender.user.profile.updatedAt.toISOString(),
                        }
                      : null,
                  }
                : undefined,
            }
          : undefined,
        reactions: [],
        reactionCounts: {},
        userReactions: [],
        isPinned: false,
      };
    } catch (err: any) {
      this.logger.error(`Error creating call summary message: ${err.message}`);
      return null;
    }
  }

  /**
   * Ends an ongoing call session completely.
   */
  async endCall(
    userId: string,
    callSessionId: string,
  ): Promise<{
    success: boolean;
    callSessionId: string;
    circleId: string;
    endedAt: string;
    summaryMessage?: any;
  }> {
    const session = await this.prisma.callSession.findUnique({
      where: { id: callSessionId },
    });

    if (!session) {
      throw new NotFoundException('Cuộc gọi không tồn tại');
    }

    const member = await this.prisma.circleMember.findFirst({
      where: { circleId: session.circleId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Bạn không có quyền kết thúc cuộc gọi này');
    }

    if (session.status === CallStatus.ENDED) {
      return {
        success: true,
        callSessionId,
        circleId: session.circleId,
        endedAt: session.endedAt?.toISOString() || new Date().toISOString(),
      };
    }

    const endedAt = new Date();

    // Mark all participants left
    await this.prisma.callParticipant.updateMany({
      where: {
        callSessionId,
        leftAt: null,
      },
      data: {
        leftAt: endedAt,
      },
    });

    const updateResult = await this.prisma.callSession.updateMany({
      where: {
        id: callSessionId,
        status: CallStatus.ACTIVE,
      },
      data: {
        status: CallStatus.ENDED,
        endedAt,
      },
    });

    let summaryMessage: any = null;
    if (updateResult.count > 0) {
      // Create call summary message exactly once
      summaryMessage = await this.createCallSummaryMessage(
        session.circleId,
        callSessionId,
        session.callType,
        session.startedAt,
        endedAt,
        userId,
      );
    }

    return {
      success: true,
      callSessionId,
      circleId: session.circleId,
      endedAt: endedAt.toISOString(),
      summaryMessage,
    };
  }

  /**
   * Retrieves active call session for a circle if currently running.
   */
  async getActiveCall(
    userId: string,
    circleId: string,
  ): Promise<CallSessionDetailEntity | null> {
    const isMember = await this.prisma.circleMember.findFirst({
      where: { circleId, userId },
    });

    if (!isMember) {
      throw new ForbiddenException('Bạn không thuộc Vòng tròn này');
    }

    const activeSession = await this.prisma.callSession.findFirst({
      where: {
        circleId,
        status: CallStatus.ACTIVE,
      },
      include: {
        circle: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
          },
        },
        participants: {
          where: { leftAt: null },
          include: {
            member: {
              include: {
                user: {
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
              },
            },
          },
        },
      },
    });

    if (!activeSession) return null;

    return this.mapSessionToDetailEntity(activeSession);
  }

  /**
   * Retrieves past call sessions history in circle (UC12).
   */
  async getCallHistory(
    userId: string,
    circleId: string,
    limit: number = 20,
  ): Promise<CallSessionDetailEntity[]> {
    const isMember = await this.prisma.circleMember.findFirst({
      where: { circleId, userId },
    });

    if (!isMember) {
      throw new ForbiddenException('Bạn không thuộc Vòng tròn này');
    }

    const sessions = await this.prisma.callSession.findMany({
      where: { circleId },
      orderBy: { startedAt: 'desc' },
      take: Math.min(limit, 50),
      include: {
        circle: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            member: {
              include: {
                user: {
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
              },
            },
          },
        },
      },
    });

    return sessions.map((s) => this.mapSessionToDetailEntity(s));
  }

  /**
   * Helper: fetches full session entity by ID.
   */
  async getCallSessionDetail(callSessionId: string): Promise<CallSessionDetailEntity> {
    const session = await this.prisma.callSession.findUnique({
      where: { id: callSessionId },
      include: {
        circle: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
          },
        },
        participants: {
          where: { leftAt: null },
          include: {
            member: {
              include: {
                user: {
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
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên cuộc gọi');
    }

    return this.mapSessionToDetailEntity(session);
  }

  private mapSessionToDetailEntity(raw: any): CallSessionDetailEntity {
    return {
      id: raw.id,
      circleId: raw.circleId,
      callType: raw.callType,
      status: raw.status,
      startedAt: raw.startedAt.toISOString(),
      endedAt: raw.endedAt ? raw.endedAt.toISOString() : null,
      circle: raw.circle
        ? {
            id: raw.circle.id,
            name: raw.circle.name,
            handle: raw.circle.handle,
            avatarUrl: raw.circle.avatarUrl,
          }
        : undefined,
      participants: (raw.participants || []).map((p: any) =>
        this.mapParticipantToEntity(p),
      ),
    };
  }

  private mapParticipantToEntity(raw: any): CallParticipantEntity {
    return {
      id: raw.id,
      callSessionId: raw.callSessionId,
      memberId: raw.memberId,
      joinedAt: raw.joinedAt.toISOString(),
      leftAt: raw.leftAt ? raw.leftAt.toISOString() : null,
      member: raw.member
        ? {
            id: raw.member.id,
            userId: raw.member.userId,
            role: raw.member.role,
            nickname: raw.member.nickname,
            user: raw.member.user
              ? {
                  id: raw.member.user.id,
                  email: raw.member.user.email,
                  profile: raw.member.user.profile
                    ? {
                        displayName: raw.member.user.profile.displayName,
                        avatarUrl: raw.member.user.profile.avatarUrl,
                      }
                    : null,
                }
              : undefined,
          }
        : undefined,
    };
  }
}
