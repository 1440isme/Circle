import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  PresignedUploadRequest,
  PresignedUploadResponse,
  DirectUploadResponse,
} from '@circle/types';
import { Locale, locales } from '@circle/shared';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  private readonly accountId: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly bucketName: string;
  private readonly publicDomain: string;
  private readonly apiUrl: string;
  private readonly isR2Configured: boolean;

  // Local in-memory buffer store for dev/test mode when R2 is not configured
  private readonly localBufferStore = new Map<
    string,
    { buffer: Buffer; contentType: string; createdAt: Date }
  >();

  constructor(private readonly configService: ConfigService) {
    this.accountId = this.configService.get<string>('CLOUDFLARE_R2_ACCOUNT_ID', '');
    this.accessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID', '');
    this.secretAccessKey = this.configService.get<string>(
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
      '',
    );
    this.bucketName = this.configService.get<string>(
      'CLOUDFLARE_R2_BUCKET_NAME',
      'circle-media-dev',
    );
    this.publicDomain = this.configService.get<string>(
      'CLOUDFLARE_R2_PUBLIC_DOMAIN',
      '',
    );
    this.apiUrl = this.configService.get<string>('API_URL', 'http://localhost:4000');

    this.isR2Configured = Boolean(
      this.accountId &&
        this.accessKeyId &&
        this.secretAccessKey &&
        this.accountId !== 'your-r2-account-id' &&
        this.accessKeyId !== 'your-r2-access-key-id',
    );

    if (this.isR2Configured) {
      this.logger.log(`Cloudflare R2 Storage initialized (Bucket: ${this.bucketName})`);
      if (!this.publicDomain) {
        this.logger.warn(
          'CLOUDFLARE_R2_PUBLIC_DOMAIN is not set. Note that Cloudflare R2 direct S3 endpoints require authorization and do not support anonymous public reads via <img> tags. Please configure a public r2.dev URL or custom domain in production.',
        );
      }
    } else {
      this.logger.log(
        'Cloudflare R2 not configured. Operating in Local Media Fallback mode.',
      );
    }
  }

  /**
   * Sanitizes and builds a unique storage key:
   * e.g. moments/2026-10/cm1234_abc123_photo.jpg
   */
  generateKey(folder: string, originalFileName: string, userId?: string): string {
    const cleanName = originalFileName
      .replace(/\.\./g, '_')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .slice(0, 100);
    const datePrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
    const randomHex = crypto.randomBytes(8).toString('hex');
    const userPrefix = userId ? `${userId.slice(0, 8)}_` : '';

    return `${folder}/${datePrefix}/${userPrefix}${randomHex}_${cleanName}`;
  }

  /**
   * AWS Signature Version 4 HMAC-SHA256 Presigned PUT URL generator for Cloudflare R2
   */
  createR2PresignedPutUrl(
    key: string,
    _contentType: string,
    expiresInSeconds: number = 3600,
  ): string {
    const region = 'auto';
    const service = 's3';
    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
    const dateStamp = amzDate.slice(0, 8); // YYYYMMDD

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

    // Query parameters for SigV4 presigned URL
    const queryParams: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': expiresInSeconds.toString(),
      'X-Amz-SignedHeaders': 'host',
    };

    // Canonical URI & Query
    const canonicalUri = `/${this.bucketName}/${key.split('/').map(encodeURIComponent).join('/')}`;
    const canonicalQueryString = Object.keys(queryParams)
      .sort()
      .map(
        (k) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k] || '')}`,
      )
      .join('&');

    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = 'host';
    const payloadHash = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = [
      'PUT',
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    // Calculate signature keys
    const kDate = crypto
      .createHmac('sha256', `AWS4${this.secretAccessKey}`)
      .update(dateStamp)
      .digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto
      .createHmac('sha256', kService)
      .update('aws4_request')
      .digest();
    const signature = crypto
      .createHmac('sha256', kSigning)
      .update(stringToSign)
      .digest('hex');

    return `${endpoint}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  }

  /**
   * Constructs the public CDN URL for a stored asset
   */
  getPublicUrl(key: string): string {
    if (this.isR2Configured) {
      if (this.publicDomain) {
        const base = this.publicDomain.replace(/\/+$/, '');
        return `${base}/${key}`;
      }
      return `https://${this.bucketName}.${this.accountId}.r2.cloudflarestorage.com/${key}`;
    }
    // Local development fallback endpoint
    return `${this.apiUrl}/api/v1/storage/raw/${encodeURIComponent(key)}`;
  }

  /**
   * Generates a presigned URL or direct upload contract for clients
   */
  async getPresignedUploadUrl(
    userId: string,
    dto: PresignedUploadRequest,
    locale: Locale = 'vi',
  ): Promise<PresignedUploadResponse> {
    const t = locales[locale] || locales.vi;

    if (!dto.fileName || !dto.contentType) {
      throw new BadRequestException(t.storage.invalidFileType);
    }

    const key = this.generateKey(dto.folder, dto.fileName, userId);
    const expiresInSeconds = 3600; // 1 hour
    const publicUrl = this.getPublicUrl(key);

    if (this.isR2Configured) {
      try {
        const uploadUrl = this.createR2PresignedPutUrl(
          key,
          dto.contentType,
          expiresInSeconds,
        );

        return {
          uploadUrl,
          publicUrl,
          key,
          method: 'PUT',
          headers: {
            'Content-Type': dto.contentType,
          },
          expiresInSeconds,
        };
      } catch (err: any) {
        this.logger.error(`Presigned URL generation failed: ${err.message}`, err.stack);
        throw new InternalServerErrorException(t.storage.presignedUrlError);
      }
    }

    // Local / Dev fallback mode
    return {
      uploadUrl: `${this.apiUrl}/api/v1/storage/upload`,
      publicUrl,
      key,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      expiresInSeconds,
    };
  }

  /**
   * Stores a binary buffer (Direct Upload or Fallback)
   */
  async saveDirectUpload(
    userId: string,
    folder: string,
    fileName: string,
    contentType: string,
    buffer: Buffer,
  ): Promise<DirectUploadResponse> {
    const key = this.generateKey(folder, fileName, userId);
    this.localBufferStore.set(key, {
      buffer,
      contentType,
      createdAt: new Date(),
    });

    // Also persist to disk so images survive restarts
    try {
      const diskPath = path.join(process.cwd(), 'uploads', key);
      const dir = path.dirname(diskPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(diskPath, buffer);
    } catch (err: any) {
      this.logger.warn(`Could not persist upload to disk: ${err.message}`);
    }

    const publicUrl = this.getPublicUrl(key);

    return {
      publicUrl,
      key,
      fileName,
      fileSize: buffer.length,
      contentType,
    };
  }

  /**
   * Retrieves a stored buffer for the local raw media endpoint
   */
  getLocalBuffer(key: string): { buffer: Buffer; contentType: string } | null {
    const fromMem = this.localBufferStore.get(key);
    if (fromMem) return fromMem;

    // Check disk storage
    try {
      const diskPath = path.join(process.cwd(), 'uploads', key);
      if (fs.existsSync(diskPath)) {
        const buffer = fs.readFileSync(diskPath);
        const ext = path.extname(key).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.mp4') contentType = 'video/mp4';

        const item = { buffer, contentType };
        this.localBufferStore.set(key, { ...item, createdAt: new Date() });
        return item;
      }
    } catch (err: any) {
      this.logger.warn(`Could not read disk file: ${err.message}`);
    }

    return null;
  }
}
