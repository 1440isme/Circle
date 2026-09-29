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

  return {
    createCircleSchema,
    updateCircleSchema,
    joinCircleSchema,
  };
}

// Default export schemas (default to Vietnamese locale for backward compatibility)
const defaultSchemas = createCircleSchemas('vi');

export const createCircleSchema = defaultSchemas.createCircleSchema;
export const updateCircleSchema = defaultSchemas.updateCircleSchema;
export const joinCircleSchema = defaultSchemas.joinCircleSchema;

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
export type JoinCircleInput = z.infer<typeof joinCircleSchema>;
