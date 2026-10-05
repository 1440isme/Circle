import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TurnstileService } from './turnstile.service';

describe('TurnstileService', () => {
  let service: TurnstileService;

  const createServiceWithConfig = async (enabled: string, secretKey = 'mock-secret') => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnstileService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'TURNSTILE_ENABLED') return enabled;
              if (key === 'TURNSTILE_SECRET_KEY') return secretKey;
              return null;
            }),
          },
        },
      ],
    }).compile();

    return module.get<TurnstileService>(TurnstileService);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('TC-TURNSTILE-001: should return true immediately when TURNSTILE_ENABLED is false', async () => {
    service = await createServiceWithConfig('false');
    expect(service.isEnabled()).toBe(false);

    const result = await service.validateToken(undefined);
    expect(result).toBe(true);
  });

  it('TC-TURNSTILE-002: should return false when enabled but token is missing', async () => {
    service = await createServiceWithConfig('true');
    expect(service.isEnabled()).toBe(true);

    const result = await service.validateToken('');
    expect(result).toBe(false);
  });

  it('TC-TURNSTILE-003: should return true when Cloudflare siteverify responds with success', async () => {
    service = await createServiceWithConfig('true');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    } as any);

    const result = await service.validateToken('valid-token', '127.0.0.1');
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('TC-TURNSTILE-004: should return false when Cloudflare siteverify returns success: false', async () => {
    service = await createServiceWithConfig('true');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: false, 'error-codes': ['invalid-input-response'] }),
    } as any);

    const result = await service.validateToken('invalid-token', '127.0.0.1');
    expect(result).toBe(false);
  });

  it('TC-TURNSTILE-005: should return false gracefully when fetch rejects', async () => {
    service = await createServiceWithConfig('true');

    global.fetch = jest.fn().mockRejectedValue(new Error('Cloudflare network unreachable'));

    const result = await service.validateToken('token-under-network-outage');
    expect(result).toBe(false);
  });
});
