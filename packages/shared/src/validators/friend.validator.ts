import { z } from 'zod';
import { locales, Locale } from '../locales';

/**
 * Creates localized Friend Zod validation schemas based on active client locale.
 * Strictly guarantees zero hardcoded language strings.
 */
export function createFriendSchemas(locale: Locale = 'vi') {
  const dict = locales[locale] || locales.vi;
  const v = dict.validation;

  const sendFriendRequestSchema = z.object({
    targetUserId: z
      .string()
      .min(1, v.friendTargetRequired),
  });

  const searchFriendSchema = z.object({
    q: z.string().trim().optional().default(''),
  });

  return {
    sendFriendRequestSchema,
    searchFriendSchema,
  };
}

export type SendFriendRequestInput = z.infer<
  ReturnType<typeof createFriendSchemas>['sendFriendRequestSchema']
>;
