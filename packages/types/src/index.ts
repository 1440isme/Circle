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

// =============================================================================
// DOMAIN ENTITIES
// =============================================================================

export interface UserProfileEntity {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
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
  coverUrl?: string | null;
  description?: string | null;
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
}

export interface MomentEntity {
  id: string;
  circleId: string;
  memberId: string;
  caption?: string | null;
  capturedAt: string;
  createdAt: string;
  photoUrl?: string | null;
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

