import { z } from 'zod';
import { locales, Locale } from '../locales';

/**
 * Creates localized Moment Zod validation schemas based on the active client locale.
 * Strictly guarantees zero hardcoded language strings.
 */
export function createMomentSchemas(locale: Locale = 'vi') {
  const dict = locales[locale] || locales.vi;
  const v = dict.validation;

  const createMomentSchema = z.object({
    photoUrl: z
      .string()
      .trim()
      .min(1, v.momentPhotoUrlRequired)
      .refine(
        (val) =>
          val.startsWith('data:') ||
          val.startsWith('http://') ||
          val.startsWith('https://') ||
          val.startsWith('blob:'),
        v.momentPhotoUrlInvalid,
      ),
    mediaType: z.enum(['IMAGE', 'VIDEO']).optional().default('IMAGE'),
    caption: z
      .string()
      .trim()
      .max(280, v.momentCaptionMaxLength)
      .optional()
      .or(z.literal('')),
    circleIds: z
      .array(z.string().trim())
      .min(1, v.momentCirclesRequired),
  });

  const reactMomentSchema = z.object({
    emoji: z
      .string()
      .trim()
      .min(1, v.momentEmojiInvalid)
      .max(16, v.momentEmojiInvalid),
  });

  return {
    createMomentSchema,
    reactMomentSchema,
  };
}

export type CreateMomentSchemaType = ReturnType<typeof createMomentSchemas>['createMomentSchema'];
export type ReactMomentSchemaType = ReturnType<typeof createMomentSchemas>['reactMomentSchema'];

export type CreateMomentInput = z.input<CreateMomentSchemaType>;
export type CreateMomentOutput = z.output<CreateMomentSchemaType>;
export type ReactMomentInput = z.input<ReactMomentSchemaType>;
