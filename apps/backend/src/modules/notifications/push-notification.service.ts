import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';

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

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redis?: RedisService,
  ) {}

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
      notificationId?: string;
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

      if (!await this.reserveDelivery(userId)) {
        this.logger.debug(`Push skipped for ${userId}, notification ${payload.notificationId ?? 'unknown'}: rate limit or Redis unavailable`);
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
          metadata: payload.metadata,
          notificationId: payload.notificationId,
          type: payload.type,
          targetType: payload.targetType,
          targetId: payload.targetId,
          deepLink: payload.deepLink,
        },
      }));

      // 3. Send batch to Expo Push API
      await this.sendExpoBatch(messages, devices);
    } catch (err: any) {
      this.logger.error(`Error dispatching push to user ${userId}: ${err.message}`, err.stack);
    }
  }

  private async reserveDelivery(userId: string): Promise<boolean> {
    if (!this.redis) return true;
    const client = this.redis.getClient();
    if (client?.status !== 'ready') return false;
    const window = Math.floor(Date.now() / 3_600_000);
    try {
      const count = await client.eval(
        'local n = redis.call("INCR", KEYS[1]); if n == 1 then redis.call("EXPIRE", KEYS[1], 3600) end; return n',
        1,
        `notifications:push:${userId}:${window}`,
      );
      return Number(count) <= 20;
    } catch {
      return false;
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
          signal: AbortSignal.timeout(8_000),
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

            if (!ticket || !device) continue;
            if (ticket.status === 'ok') {
              this.logger.debug(`Expo accepted push for device ${device.id}`);
              continue;
            }

            this.logger.warn(`Expo rejected push for device ${device.id}: ${ticket.details?.error ?? 'unknown'}`);
            if (ticket.details?.error === 'DeviceNotRegistered') {
              await this.prisma.deviceToken.updateMany({
                where: { token: device.token },
                data: { status: 'INVALID' },
              });
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
