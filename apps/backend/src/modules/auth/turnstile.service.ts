import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly secretKey: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    // Default test secret key provided by Cloudflare: 1x0000000000000000000000000000000AA (always passes)
    this.secretKey =
      this.configService.get<string>('TURNSTILE_SECRET_KEY') ||
      '1x0000000000000000000000000000000AA';

    const rawEnabled = this.configService.get<string>('TURNSTILE_ENABLED');
    this.enabled = rawEnabled === 'true' || rawEnabled === '1';
  }

  /**
   * Check whether Turnstile verification is actively enforced.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Validate a Cloudflare Turnstile token via Cloudflare siteverify endpoint.
   * Reference: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
   */
  async validateToken(token?: string, remoteIp?: string): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }

    if (!token) {
      this.logger.warn('Turnstile verification failed: Token is missing');
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      if (remoteIp) {
        formData.append('remoteip', remoteIp);
      }

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!res.ok) {
        this.logger.error(`Turnstile HTTP error: ${res.status} ${res.statusText}`);
        return false;
      }

      const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
      if (!data.success) {
        this.logger.warn(`Turnstile validation rejected: ${JSON.stringify(data['error-codes'])}`);
        return false;
      }

      return true;
    } catch (err: any) {
      this.logger.error(`Turnstile request failed: ${err?.message || err}`);
      return false;
    }
  }
}
