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

  const createCircleSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, v.circleNameRequired)
      .min(2, v.circleNameMinLength)
      .max(50, v.circleNameMaxLength),
    handle: z
      .string()
      .trim()
      .min(1, v.circleHandleRequired)
      .min(3, v.circleHandleMinLength)
      .max(30, v.circleHandleMaxLength)
      .toLowerCase()
      .regex(handleRegex, v.circleHandleInvalid),
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
    isPrivate: z.boolean().default(false),
  });

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

  return {
    createCircleSchema,
    updateCircleSchema,
  };
}

// Default export schemas (default to Vietnamese locale for backward compatibility)
const defaultSchemas = createCircleSchemas('vi');

export const createCircleSchema = defaultSchemas.createCircleSchema;
export const updateCircleSchema = defaultSchemas.updateCircleSchema;

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
