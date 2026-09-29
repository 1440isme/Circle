import { z } from 'zod';
import { locales, Locale } from '../locales';

export const handleRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Creates localized Circle Zod validation schemas based on the active client locale.
 * Strictly guarantees zero hardcoded language strings.
 */
export function createCircleSchemas(locale: Locale = 'vi') {
  const dict = locales[locale] || locales.vi;
  const v = dict.validation;

  const createCircleSchema = z
    .object({
      name: z
        .string()
        .trim()
        .max(50, v.circleNameMaxLength)
        .optional()
        .or(z.literal('')),
      handle: z
        .string()
        .trim()
        .min(3, v.circleHandleMinLength)
        .max(30, v.circleHandleMaxLength)
        .toLowerCase()
        .regex(handleRegex, v.circleHandleInvalid)
        .optional()
        .or(z.literal('')),
      memberIds: z.array(z.string()).optional(),
      description: z
        .string()
        .trim()
        .max(255, v.circleDescMaxLength)
        .optional()
        .or(z.literal('')),
      avatarUrl: z
        .string()
        .url(v.circleAvatarInvalid)
        .optional()
        .or(z.literal('')),
      coverUrl: z
        .string()
        .url(v.circleCoverInvalid)
        .optional()
        .or(z.literal('')),
      isPrivate: z.boolean().optional(),
      maxMembers: z.number().int().min(2).max(1000).optional().nullable(),
    })
    .refine(
      (data) => {
        if (data.name && data.name.trim().length > 0) {
          return data.name.trim().length >= 2;
        }
        return Array.isArray(data.memberIds) && data.memberIds.length > 0;
      },
      {
        message: v.circleNameMinLength,
        path: ['name'],
      },
    )
    .refine(
      (data) => {
        const hasName = Boolean(data.name && data.name.trim().length >= 2);
        const hasFriends = Boolean(Array.isArray(data.memberIds) && data.memberIds.length > 0);
        return hasName || hasFriends;
      },
      {
        message: v.circleNameOrFriendsRequired,
        path: ['name'],
      },
    );

  const updateCircleSchema = z.object({
    name: z
      .string()
      .trim()
      .min(2, v.circleNameMinLength)
      .max(50, v.circleNameMaxLength)
      .optional(),
    description: z
      .string()
      .trim()
      .max(255, v.circleDescMaxLength)
      .optional()
      .or(z.literal('')),
    avatarUrl: z
      .string()
      .url(v.circleAvatarInvalid)
      .optional()
      .or(z.literal('')),
    coverUrl: z
      .string()
      .url(v.circleCoverInvalid)
      .optional()
      .or(z.literal('')),
    isPrivate: z.boolean().optional(),
    maxMembers: z.number().int().min(2).max(1000).optional().nullable(),
  });

  const joinCircleSchema = z.object({
    inviteCode: z
      .string()
      .trim()
      .min(1, v.circleInviteCodeRequired)
      .min(6, v.circleInviteCodeMinLength)
      .max(16, v.circleInviteCodeMaxLength)
      .regex(/^[A-Za-z0-9]+$/, v.circleInviteCodeInvalid)
      .toUpperCase(),
  });

  const createInviteSchema = z.object({
    expiresInDays: z
      .number()
      .int()
      .min(1, v.circleInviteExpiryMin)
      .max(365, v.circleInviteExpiryMax)
      .optional()
      .nullable(),
    maxUses: z
      .number()
      .int()
      .min(1, v.circleInviteMaxUsesMin)
      .max(1000, v.circleInviteMaxUsesMax)
      .optional()
      .nullable(),
  });

  const createJoinRequestSchema = z.object({
    message: z
      .string()
      .trim()
      .max(500, v.circleJoinRequestMessageMaxLength)
      .optional()
      .or(z.literal('')),
  });

  const reviewJoinRequestSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
      message: v.circleJoinRequestStatusRequired,
    }),
  });

  const transferOwnershipSchema = z.object({
    newOwnerMemberId: z.string().trim().min(1, v.circleNewOwnerRequired),
  });

  return {
    createCircleSchema,
    updateCircleSchema,
    joinCircleSchema,
    createInviteSchema,
    createJoinRequestSchema,
    reviewJoinRequestSchema,
    transferOwnershipSchema,
    updateNicknameSchema: z.object({
      nickname: z
        .string()
        .trim()
        .max(50, v.circleNicknameMaxLength)
        .optional()
        .nullable(),
    }),
    addMembersSchema: z.object({
      memberIds: z.array(z.string().min(1)).min(1, v.circleNameOrFriendsRequired),
    }),
  };
}

// Default export schemas (default to Vietnamese locale for backward compatibility)
const defaultSchemas = createCircleSchemas('vi');

export const createCircleSchema = defaultSchemas.createCircleSchema;
export const updateCircleSchema = defaultSchemas.updateCircleSchema;
export const joinCircleSchema = defaultSchemas.joinCircleSchema;
export const createInviteSchema = defaultSchemas.createInviteSchema;
export const createJoinRequestSchema = defaultSchemas.createJoinRequestSchema;
export const reviewJoinRequestSchema = defaultSchemas.reviewJoinRequestSchema;
export const transferOwnershipSchema = defaultSchemas.transferOwnershipSchema;
export const updateNicknameSchema = defaultSchemas.updateNicknameSchema;
export const addMembersSchema = defaultSchemas.addMembersSchema;

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
export type JoinCircleInput = z.infer<typeof joinCircleSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type CreateJoinRequestInput = z.infer<typeof createJoinRequestSchema>;
export type ReviewJoinRequestInput = z.infer<typeof reviewJoinRequestSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
export type UpdateNicknameInput = z.infer<typeof updateNicknameSchema>;
export type AddMembersInput = z.infer<typeof addMembersSchema>;
