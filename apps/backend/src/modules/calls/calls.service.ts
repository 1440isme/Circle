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
  ): Promise<{ success: boolean; callSessionId: string; isCallEnded: boolean }> {
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
    if (remainingActive === 0) {
      await this.prisma.callSession.update({
        where: { id: callSessionId },
        data: {
          status: CallStatus.ENDED,
          endedAt: new Date(),
        },
      });
      isCallEnded = true;
    }

    return {
      success: true,
      callSessionId,
      isCallEnded,
    };
  }

  /**
   * Ends an ongoing call session completely.
   */
  async endCall(
    userId: string,
    callSessionId: string,
  ): Promise<{ success: boolean; callSessionId: string; endedAt: string }> {
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

    await this.prisma.callSession.update({
      where: { id: callSessionId },
      data: {
        status: CallStatus.ENDED,
        endedAt,
      },
    });

    return {
      success: true,
      callSessionId,
      endedAt: endedAt.toISOString(),
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
