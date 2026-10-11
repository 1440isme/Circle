import { z } from 'zod';
import { Locale } from '../locales';

/**
 * Creates localized WebRTC Call validation schemas.
 */
export function createCallSchemas(_locale: Locale = 'vi') {

  const initiateCallSchema = z.object({
    callType: z.enum(['AUDIO', 'VIDEO']).optional().default('AUDIO'),
  });

  const signalPayloadSchema = z.object({
    callSessionId: z.string().min(1, 'ID phiên gọi không được trống / Call session ID is required'),
    targetUserId: z.string().optional(),
    signal: z.any(),
  });

  return {
    initiateCallSchema,
    signalPayloadSchema,
  };
}

export type InitiateCallSchemaInput = z.infer<
  ReturnType<typeof createCallSchemas>['initiateCallSchema']
>;
export type SignalPayloadSchemaInput = z.infer<
  ReturnType<typeof createCallSchemas>['signalPayloadSchema']
>;
