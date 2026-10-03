import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  const mockConfig: Record<string, string> = {
    CLOUDFLARE_R2_ACCOUNT_ID: 'test-account-id',
    CLOUDFLARE_R2_ACCESS_KEY_ID: 'test-access-key-id',
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'test-secret-access-key-very-secure',
    CLOUDFLARE_R2_BUCKET_NAME: 'circle-test-bucket',
    CLOUDFLARE_R2_PUBLIC_DOMAIN: 'https://media.circle.test',
    API_URL: 'http://localhost:4000',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: string) => mockConfig[key] ?? defaultVal),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateKey', () => {
    it('should generate a sanitized, partitioned key with user ID and date prefix', () => {
      const key = service.generateKey('moments', 'my photo (1).jpg', 'user_123456');
      expect(key).toMatch(/^moments\/\d{4}-\d{2}\/user_123_[a-f0-9]+_my_photo__1_.jpg$/);
    });

    it('should sanitize unsafe path traversal characters', () => {
      const key = service.generateKey('attachments', '../../../etc/passwd.png');
      expect(key).not.toContain('..');
      expect(key).toMatch(/^attachments\/\d{4}-\d{2}\/[a-f0-9]+_.*etc_passwd\.png$/);
    });
  });

  describe('createR2PresignedPutUrl', () => {
    it('should generate a valid AWS SigV4 signed PUT URL for Cloudflare R2', () => {
      const key = 'moments/2026-10/test.jpg';
      const url = service.createR2PresignedPutUrl(key, 'image/jpeg', 3600);

      expect(url).toContain('https://test-account-id.r2.cloudflarestorage.com/circle-test-bucket/moments/2026-10/test.jpg');
      expect(url).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
      expect(url).toContain('X-Amz-Credential=test-access-key-id');
      expect(url).toContain('X-Amz-Signature=');
      expect(url).toContain('X-Amz-SignedHeaders=host');
    });
  });

  describe('getPublicUrl', () => {
    it('should use CLOUDFLARE_R2_PUBLIC_DOMAIN when configured', () => {
      const url = service.getPublicUrl('avatars/user1.png');
      expect(url).toBe('https://media.circle.test/avatars/user1.png');
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should return a presigned PUT contract for authenticated user', async () => {
      const res = await service.getPresignedUploadUrl('user_abc', {
        folder: 'moments',
        fileName: 'camera_capture.jpg',
        contentType: 'image/jpeg',
      });

      expect(res.method).toBe('PUT');
      expect(res.uploadUrl).toContain('X-Amz-Signature=');
      expect(res.publicUrl).toContain('https://media.circle.test/moments/');
      expect(res.headers?.['Content-Type']).toBe('image/jpeg');
      expect(res.expiresInSeconds).toBe(3600);
    });
  });

  describe('Direct Upload & Local Buffer Store', () => {
    it('should save and retrieve local binary buffers', async () => {
      const buffer = Buffer.from('mock image binary data');
      const res = await service.saveDirectUpload(
        'user_abc',
        'attachments',
        'doc.pdf',
        'application/pdf',
        buffer,
      );

      expect(res.publicUrl).toBeDefined();
      expect(res.fileSize).toBe(buffer.length);

      const retrieved = service.getLocalBuffer(res.key);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.buffer.toString()).toBe('mock image binary data');
      expect(retrieved?.contentType).toBe('application/pdf');
    });
  });
});
