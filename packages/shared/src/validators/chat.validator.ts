import { z } from 'zod';
import { locales, Locale } from '../locales';

/**
 * Creates localized Chat & Messaging Zod validation schemas based on the active client locale.
 * Strictly guarantees zero hardcoded language strings.
 */
export function createChatSchemas(locale: Locale = 'vi') {
  const dict = locales[locale] || locales.vi;
  const v = dict.validation;

  const sendMessageSchema = z
    .object({
      content: z
        .string()
        .trim()
        .max(4000, v.chatContentMaxLength)
        .optional()
        .or(z.literal('')),
      type: z.enum(['TEXT', 'FILE', 'VOICE']).optional().default('TEXT'),
      fileUrl: z
        .string()
        .trim()
        .optional()
        .or(z.literal('')),
      fileName: z.string().trim().max(255).optional().or(z.literal('')),
      fileSize: z
        .number()
        .int()
        .positive()
        .max(26214400, v.chatFileSizeExceeded)
        .optional(),
      audioDuration: z.number().int().nonnegative().optional(),
      replyToId: z.string().trim().optional().or(z.literal('')),
    })
    .refine(
      (data) => {
        const hasContent = !!(data.content && data.content.trim().length > 0);
        const hasFile = !!(data.fileUrl && data.fileUrl.trim().length > 0);
        return hasContent || hasFile;
      },
      {
        message: v.chatMessageOrFileRequired,
        path: ['content'],
      },
    );

  const reactMessageSchema = z.object({
    emoji: z
      .string()
      .trim()
      .min(1, v.chatEmojiRequired)
      .max(16, v.chatEmojiInvalid),
  });

  const messagePaginationSchema = z.object({
    cursor: z.string().trim().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(30),
    direction: z.enum(['before', 'after']).optional().default('before'),
  });

  return {
    sendMessageSchema,
    reactMessageSchema,
    messagePaginationSchema,
  };
}

export type SendMessageSchemaType = ReturnType<typeof createChatSchemas>['sendMessageSchema'];
export type ReactMessageSchemaType = ReturnType<typeof createChatSchemas>['reactMessageSchema'];
export type MessagePaginationSchemaType = ReturnType<typeof createChatSchemas>['messagePaginationSchema'];

export type SendMessageInput = z.input<SendMessageSchemaType>;
export type SendMessageOutput = z.output<SendMessageSchemaType>;
export type ReactMessageInput = z.input<ReactMessageSchemaType>;
export type MessagePaginationInput = z.input<MessagePaginationSchemaType>;
