import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface PushMessagePayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send push notification to all active devices of a user
   */
  async sendToUser(
    userId: string,
    payload: {
      title: string;
      body: string;
      type: string;
      targetType?: string | null;
      targetId?: string | null;
      deepLink?: string | null;
      metadata?: Record<string, any> | null;
      badge?: number;
    },
  ): Promise<void> {
    try {
      // 1. Fetch all active device tokens for user
      const devices = await this.prisma.deviceToken.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
      });

      if (!devices.length) {
        return;
      }

      // 2. Prepare payload with NOT-08 Privacy Safeguard
      // For chat messages or confidential content, lock screen content should remain generalized
      let safeTitle = payload.title;
      let safeBody = payload.body;

      if (payload.type === 'CHAT_MESSAGE') {
        safeTitle = 'CIRCLE';
        const isEn = payload.metadata?.locale === 'en';
        const circleName = payload.metadata?.circleName || (isEn ? 'Circle' : 'Vòng tròn');
        safeBody = isEn
          ? `You have a new message in ${circleName}`
          : `Bạn có tin nhắn mới trong ${circleName}`;
      }

      const messages: PushMessagePayload[] = devices.map((d) => ({
        to: d.token,
        title: safeTitle,
        body: safeBody,
        sound: 'default',
        badge: payload.badge,
        data: {
          type: payload.type,
          targetType: payload.targetType,
          targetId: payload.targetId,
          deepLink: payload.deepLink,
          ...payload.metadata,
        },
      }));

      // 3. Send batch to Expo Push API
      await this.sendExpoBatch(messages, devices);
    } catch (err: any) {
      this.logger.error(`Error dispatching push to user ${userId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Dispatch batch of push messages to Expo with retry & token cleanup (NOT-09)
   */
  private async sendExpoBatch(
    messages: PushMessagePayload[],
    devices: { id: string; token: string }[],
  ): Promise<void> {
    const maxRetries = 2;
    let attempt = 0;
    let success = false;

    while (attempt <= maxRetries && !success) {
      attempt++;
      try {
        const response = await fetch(this.expoPushUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(messages),
        });

        if (!response.ok) {
          throw new Error(`Expo Push API HTTP status: ${response.status}`);
        }

        const result = (await response.json()) as {
          data?: Array<{
            status: 'ok' | 'error';
            message?: string;
            details?: { error?: string };
          }>;
        };

        if (Array.isArray(result.data)) {
          // Process receipt tickets & clean up dead tokens
          for (let i = 0; i < result.data.length; i++) {
            const ticket = result.data[i];
            const device = devices[i];

            if (ticket && device && ticket.status === 'error') {
              this.logger.warn(
                `Push ticket error for device token [${device.token.slice(0, 15)}...]: ${ticket.message || ''} (${ticket.details?.error || ''})`,
              );

              // If token is invalid or unregistered, mark INVALID (NOT-09)
              if (
                ticket.details?.error === 'DeviceNotRegistered' ||
                ticket.details?.error === 'InvalidCredentials'
              ) {
                await this.prisma.deviceToken.updateMany({
                  where: { token: device.token },
                  data: { status: 'INVALID' },
                });
                this.logger.log(`Marked dead device token ${device.id} as INVALID`);
              }
            }
          }
        }

        success = true;
      } catch (err: any) {
        this.logger.warn(`Expo push attempt ${attempt} failed: ${err.message}`);
        if (attempt <= maxRetries) {
          // Exponential backoff wait
          await new Promise((res) => setTimeout(res, attempt * 500));
        } else {
          this.logger.error(`All ${maxRetries + 1} push dispatch attempts exhausted.`);
        }
      }
    }
  }
}
