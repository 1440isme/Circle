/**
 * CIRCLE — Shared Types & Contracts
 * Single source of truth for DTOs, domain models, and API responses.
 */

// =============================================================================
// API CONTRACTS
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// ENUMS
// =============================================================================

export enum GlobalRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum FriendshipStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  BLOCKED = "BLOCKED",
}

export enum MemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  MEMBER = "MEMBER",
}

export enum ChannelType {
  TEXT = "TEXT",
  VOICE = "VOICE",
}

export enum MessageType {
  TEXT = "TEXT",
  FILE = "FILE",
  VOICE = "VOICE",
}

export enum CallType {
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
}

export enum CallStatus {
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
}

export enum JoinRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// =============================================================================
// AUTH CONTRACTS
// =============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUserData {
  id: string;
  email: string;
  globalRole: GlobalRole;
  profile?: UserProfileEntity | null;
}

export interface AuthResponseData {
  user: AuthUserData;
  tokens: AuthTokens;
}

export interface SessionEntity {
  id: string;
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN';
  browser: string;
  os: string;
  ipAddress: string | null;
  isCurrent: boolean;
  createdAt: string;
  expiresAt: string;
}

// =============================================================================
// DOMAIN ENTITIES
// =============================================================================

export interface UserProfileEntity {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  updatedAt: string;
}

export interface UserEntity extends BaseEntity {
  email: string;
  isActivated: boolean;
  globalRole: GlobalRole;
  profile?: UserProfileEntity | null;
}

export interface CircleEntity extends BaseEntity {
  name: string;
  handle: string;
  avatarUrl?: string | null;
  inviteCode: string;
  isPrivate: boolean;
  maxMembers?: number | null;
}

export interface CircleDetailResponse extends CircleEntity {
  role?: MemberRole;
  memberCount: number;
  channels: ChannelEntity[];
  members?: CircleMemberEntity[];
}

export interface CircleMemberEntity {
  id: string;
  circleId: string;
  userId: string;
  role: MemberRole;
  nickname?: string | null;
  joinedAt: string;
  updatedAt: string;
  user?: UserEntity;
}

export interface CircleInviteEntity extends BaseEntity {
  circleId: string;
  code: string;
  createdById: string;
  expiresAt?: string | null;
  maxUses?: number | null;
  useCount: number;
  createdBy?: CircleMemberEntity;
}

export interface CircleJoinRequestEntity extends BaseEntity {
  circleId: string;
  userId: string;
  message?: string | null;
  status: JoinRequestStatus;
  user?: UserEntity;
}

export interface ChannelEntity {
  id: string;
  circleId: string;
  name: string;
  type: ChannelType;
  topic?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReactionEntity {
  id: string;
  messageId: string;
  memberId: string;
  emoji: string;
  createdAt: string;
  member?: CircleMemberEntity;
}

export interface PinnedRecordEntity {
  id: string;
  circleId: string;
  messageId: string;
  pinnedAt: string;
}

export interface MessageEntity {
  id: string;
  channelId: string;
  memberId: string;
  type: MessageType;
  content?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  audioDuration?: number | null;
  replyToId?: string | null;
  sentAt: string;
  updatedAt: string;
  sender?: CircleMemberEntity;
  replyTo?: {
    id: string;
    content?: string | null;
    type: MessageType;
    sender?: {
      id: string;
      nickname?: string | null;
      user?: {
        id: string;
        profile?: {
          displayName: string;
          avatarUrl?: string | null;
        } | null;
      };
    };
  } | null;
  reactions?: ReactionEntity[];
  reactionCounts?: Record<string, number>;
  userReactions?: string[];
  isPinned?: boolean;
  status?: 'SENDING' | 'SENT' | 'FAILED';
  tempId?: string;
  readers?: MessageReaderEntity[];
  receipts?: MessageReceiptEntity[];
}

export interface CursorPaginatedMessages {
  messages: MessageEntity[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface MomentVisibilityEntity {
  id: string;
  momentId: string;
  circleId: string;
  createdAt: string;
  circle?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface MomentReactionEntity {
  id: string;
  momentId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export type MomentMediaType = 'IMAGE' | 'VIDEO';

export interface MomentEntity {
  id: string;
  authorId: string;
  photoUrl: string;
  mediaType: MomentMediaType;
  caption?: string | null;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    email: string;
    profile?: {
      displayName: string;
      avatarUrl?: string | null;
    } | null;
  };
  visibilities?: MomentVisibilityEntity[];
  reactions?: MomentReactionEntity[];
  reactionCounts?: Record<string, number>;
  userReaction?: string | null;
}

export interface CreateMomentInput {
  photoUrl: string;
  mediaType?: MomentMediaType;
  caption?: string;
  circleIds: string[];
}

export interface ReactMomentInput {
  emoji: string;
}

export interface ReplyMomentInput {
  message: string;
  circleId: string;
}


export interface PlanningSheetEntity {
  id: string;
  circleId: string;
  createdById: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallSessionEntity {
  id: string;
  circleId: string;
  callType: CallType;
  status: CallStatus;
  startedAt: string;
  endedAt?: string | null;
}

export interface SelectableFriendItem {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

// =============================================================================
// STORAGE & MEDIA CONTRACTS (CLOUDFLARE R2)
// =============================================================================

export type StorageFolder = 'moments' | 'avatars' | 'attachments' | 'albums';

export interface PresignedUploadRequest {
  folder: StorageFolder;
  fileName: string;
  contentType: string;
  fileSize?: number;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  method: 'PUT' | 'POST';
  headers?: Record<string, string>;
  expiresInSeconds: number;
}

export interface DirectUploadResponse {
  publicUrl: string;
  key: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

// =============================================================================
// PRESENCE & REALTIME STATUS CONTRACTS
// =============================================================================

export type UserStatus = 'ONLINE' | 'AWAY' | 'OFFLINE';

export interface UserPresenceEntity {
  userId: string;
  status: UserStatus;
  lastActiveAt: string;
}

export interface CirclePresenceSyncPayload {
  circleId: string;
  onlineUserIds: string[];
}

export interface UserPresenceChangePayload {
  userId: string;
  status: UserStatus;
  circleIds: string[];
  timestamp: string;
}

// =============================================================================
// READ RECEIPTS & MODERATION REPORT CONTRACTS
// =============================================================================

export interface MessageReaderEntity {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  readAt: string;
}

export interface MessageReceiptEntity {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
  user?: {
    id: string;
    email: string;
    profile?: {
      displayName: string;
      avatarUrl?: string | null;
    } | null;
  };
}

export enum ReportTargetType {
  CIRCLE = "CIRCLE",
  USER = "USER",
}

export enum ReportStatus {
  PENDING = "PENDING",
  REVIEWED = "REVIEWED",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

export interface CircleReportEntity {
  id: string;
  reporterId: string;
  circleId: string;
  targetUserId?: string | null;
  targetType: ReportTargetType;
  reason: string;
  details?: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportInput {
  targetType?: ReportTargetType;
  targetUserId?: string | null;
  reason: string;
  details?: string | null;
}

// =============================================================================
// 10. WEBRTC & REALTIME CALL CONTRACTS (UC12, SPIKE-RTC-001)
// =============================================================================

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface IceServersResponse {
  iceServers: IceServerConfig[];
}

export interface CallParticipantEntity {
  id: string;
  callSessionId: string;
  memberId: string;
  joinedAt: string;
  leftAt?: string | null;
  member?: {
    id: string;
    userId: string;
    role: MemberRole;
    nickname?: string | null;
    user?: {
      id: string;
      email: string;
      profile?: {
        displayName: string;
        avatarUrl?: string | null;
      } | null;
    };
  };
}

export interface CallSessionDetailEntity extends CallSessionEntity {
  circle?: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string | null;
  };
  participants: CallParticipantEntity[];
}

export interface InitiateCallInput {
  circleId: string;
  callType?: CallType;
}

export interface InitiateCallResponse {
  callSession: CallSessionDetailEntity;
  iceServers: IceServerConfig[];
}

export interface CallIncomingEventPayload {
  callSessionId: string;
  circleId: string;
  circleName: string;
  callType: CallType;
  caller: {
    userId: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  startedAt: string;
}

export interface CallParticipantJoinedPayload {
  callSessionId: string;
  circleId: string;
  participant: CallParticipantEntity;
}

export interface CallParticipantLeftPayload {
  callSessionId: string;
  circleId: string;
  userId: string;
  memberId: string;
}

export interface CallEndedPayload {
  callSessionId: string;
  circleId: string;
  endedAt: string;
  durationSeconds?: number;
}

export interface WebRtcSignalPayload {
  callSessionId: string;
  targetUserId?: string;
  senderUserId?: string;
  signal: any;
}



