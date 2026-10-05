import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { MailService } from '../mail/mail.service';
import { GlobalRole } from '@circle/types';

describe('AuthService — Full Test Suite (TC-AUTH-001 to TC-AUTH-006)', () => {
  let service: AuthService;
  let prisma: any;
  let redis: any;
  let mailService: any;
  let jwtService: any;
  let configService: any;

  const mockUser = {
    id: 'user-cuid-1',
    email: 'test@example.com',
    passwordHash: '$2b$12$e8Yk23Kx56Qz.mockHashedPasswordCost12',
    isActivated: true,
    globalRole: GlobalRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    profile: {
      id: 'profile-cuid-1',
      userId: 'user-cuid-1',
      displayName: 'Test User',
      avatarUrl: null,
      bio: null,
      dateOfBirth: null,
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      userProfile: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
    };

    mailService = {
      sendOtpVerification: jest.fn().mockResolvedValue(true),
      sendPasswordResetOtp: jest.fn().mockResolvedValue(true),
    };

    jwtService = {
      signAsync: jest.fn((_payload, options) => {
        if (options?.secret?.includes('refresh')) {
          return Promise.resolve('mock-refresh-token');
        }
        return Promise.resolve('mock-access-token');
      }),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_ACCESS_SECRET: 'test-jwt-access-secret-32-chars-key',
          JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-32-chars-key',
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: MailService, useValue: mailService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('US-AUTH-001 & US-AUTH-004: User Registration (TC-AUTH-001)', () => {
    it('should register a new user as unactivated, generate OTP, store in Redis, and send email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...mockUser, isActivated: false });

      const dto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        displayName: 'Test User',
      };

      const result = await service.register(dto, 'Mozilla/5.0', '127.0.0.1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('otp:verify:test@example.com'),
        expect.any(String),
        300,
      );
      expect(mailService.sendOtpVerification).toHaveBeenCalled();
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toBeNull();
    });

    it('should throw 409 Conflict if email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const dto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        displayName: 'Test User',
      };

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should hash passwords with salt rounds = 12', async () => {
      const plainPassword = 'SuperSecretPassword!';
      const hash = await service.hashPassword(plainPassword);

      expect(hash).toBeDefined();
      expect(hash.startsWith('$2b$12$') || hash.startsWith('$2a$12$')).toBe(true);

      const isValid = await service.comparePassword(plainPassword, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('US-AUTH-002: Dual-Token Login & Token Rotation (TC-AUTH-002)', () => {
    it('should login user with valid credentials and return Dual-token pair', async () => {
      const plainPassword = 'SecurePassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActivated: true,
        passwordHash: hashedPassword,
      });
      prisma.refreshToken.create.mockResolvedValue({ id: 'token-1' });

      const result = await service.login({
        email: 'test@example.com',
        password: plainPassword,
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.tokens.refreshToken).toBe('mock-refresh-token');
    });

    it('should throw 401 Unauthorized if account is not activated', async () => {
      const plainPassword = 'SecurePassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActivated: false,
        passwordHash: hashedPassword,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: plainPassword,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw 401 Unauthorized on invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should rotate refresh token and revoke old token on successful refresh', async () => {
      const rawToken = 'valid-refresh-token';
      const tokenHash = service.hashToken(rawToken);

      jwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        email: mockUser.email,
        globalRole: mockUser.globalRole,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'old-token-id',
        userId: mockUser.id,
        tokenHash,
        isRevoked: false,
        expiresAt: futureDate,
      });

      prisma.refreshToken.update.mockResolvedValue({ id: 'old-token-id', isRevoked: true });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({ id: 'new-token-id' });

      const result = await service.refreshTokens({ refreshToken: rawToken });

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'old-token-id' },
        data: { isRevoked: true },
      });
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.tokens.refreshToken).toBe('mock-refresh-token');
    });

    it('should detect token reuse and revoke ALL sessions for the user', async () => {
      const reusedToken = 'reused-refresh-token';
      const tokenHash = service.hashToken(reusedToken);

      jwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        email: mockUser.email,
        globalRole: mockUser.globalRole,
      });

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'compromised-token-id',
        userId: mockUser.id,
        tokenHash,
        isRevoked: true,
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(
        service.refreshTokens({ refreshToken: reusedToken }),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        data: { isRevoked: true },
      });
    });
  });

  describe('US-AUTH-004: OTP Verification & Password Recovery (TC-AUTH-003 to TC-AUTH-006)', () => {
    it('TC-AUTH-003: should verify OTP, activate user, and return tokens', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActivated: false });
      redis.get.mockImplementation((key: string) => {
        if (key.includes('otp:verify:')) return Promise.resolve('123456');
        return Promise.resolve(null);
      });
      prisma.user.update.mockResolvedValue({ ...mockUser, isActivated: true });
      prisma.refreshToken.create.mockResolvedValue({ id: 'token-1' });

      const result = await service.verifyOtp({
        email: 'test@example.com',
        otp: '123456',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { isActivated: true },
        include: { profile: true },
      });
      expect(redis.del).toHaveBeenCalledWith('otp:verify:test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
    });

    it('TC-AUTH-003: should throw 400 on incorrect OTP and increment attempt counter', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActivated: false });
      redis.get.mockImplementation((key: string) => {
        if (key.includes('otp:verify:')) return Promise.resolve('123456');
        return Promise.resolve('1');
      });

      await expect(
        service.verifyOtp({
          email: 'test@example.com',
          otp: '999999',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(redis.incr).toHaveBeenCalled();
    });

    it('TC-AUTH-004: should resend OTP if cooldown is not active', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActivated: false });
      redis.get.mockResolvedValue(null); // No cooldown

      const result = await service.resendOtp({ email: 'test@example.com' });

      expect(redis.set).toHaveBeenCalledWith(
        'otp:cooldown:VERIFICATION:test@example.com',
        '1',
        60,
      );
      expect(mailService.sendOtpVerification).toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });

    it('TC-AUTH-004: should reject resend if cooldown is active', async () => {
      redis.get.mockResolvedValue('1'); // Cooldown active

      await expect(service.resendOtp({ email: 'test@example.com' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('TC-AUTH-005: should request forgot password OTP', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.get.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(mailService.sendPasswordResetOtp).toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });

    it('TC-AUTH-006: should reset password, update hash, and revoke existing sessions', async () => {
      redis.get.mockImplementation((key: string) => {
        if (key.includes('otp:forgot:')) return Promise.resolve('654321');
        return Promise.resolve(null);
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.resetPassword({
        email: 'test@example.com',
        otp: '654321',
        newPassword: 'BrandNewSecurePassword123!',
      });

      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        data: { isRevoked: true },
      });
      expect(result.message).toBeDefined();
    });
  });

  describe('US-AUTH-005: User Profile Management (TC-AUTH-007)', () => {
    it('TC-AUTH-007: should update user profile display name, avatar, and bio', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userProfile.upsert.mockResolvedValue({
        id: 'profile-1',
        userId: mockUser.id,
        displayName: 'Alex Binh Updated',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        bio: 'Fullstack Engineer at CIRCLE',
        dateOfBirth: null,
        updatedAt: new Date(),
      });

      const result = await service.updateProfile(mockUser.id, {
        displayName: 'Alex Binh Updated',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        bio: 'Fullstack Engineer at CIRCLE',
      });

      expect(prisma.userProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id },
        }),
      );
      expect(result.id).toBe(mockUser.id);
      expect(result.profile?.displayName).toBe('Alex Binh Updated');
      expect(result.profile?.bio).toBe('Fullstack Engineer at CIRCLE');
    });
  });

  describe('Session Management', () => {
    it('TC-AUTH-SESSION-001: should parse user agent correctly', () => {
      const desktop = service.parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
      expect(desktop.deviceType).toBe('DESKTOP');
      expect(desktop.os).toBe('macOS');
      expect(desktop.browser).toBe('Chrome');

      const mobile = service.parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Circle Mobile App');
      expect(mobile.deviceType).toBe('MOBILE');
      expect(mobile.os).toBe('iOS');
      expect(mobile.browser).toBe('Circle Mobile App');

      const tablet = service.parseUserAgent('Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/605.1.15');
      expect(tablet.deviceType).toBe('TABLET');
      expect(tablet.os).toBe('iOS');
      expect(tablet.browser).toBe('Safari');
    });

    it('TC-AUTH-SESSION-002: should retrieve user active sessions with current flag', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          userId: mockUser.id,
          tokenHash: 'current-hash',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/128.0.0.0',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
          isRevoked: false,
        },
        {
          id: 'session-2',
          userId: mockUser.id,
          tokenHash: 'other-hash',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS) Mobile Circle Mobile App',
          ipAddress: '192.168.1.187',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
          isRevoked: false,
        },
      ];

      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue(mockSessions);
      jest.spyOn(service, 'hashToken').mockReturnValue('current-hash');

      const result = await service.getUserSessions(mockUser.id, 'current-raw-token');

      expect(prisma.refreshToken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUser.id,
            isRevoked: false,
          }),
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('session-1');
      expect(result[0]!.isCurrent).toBe(true);
      expect(result[1]!.id).toBe('session-2');
      expect(result[1]!.isCurrent).toBe(false);
    });

    it('TC-AUTH-SESSION-003: should revoke a specific remote session', async () => {
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
        id: 'session-target',
        userId: mockUser.id,
        isRevoked: false,
      });
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({
        id: 'session-target',
        isRevoked: true,
      });

      const result = await service.revokeSession(mockUser.id, 'session-target', 'vi');

      expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: { id: 'session-target', userId: mockUser.id },
      });
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'session-target' },
        data: { isRevoked: true },
      });
      expect(result.message).toBeDefined();
    });

    it('TC-AUTH-SESSION-004: should throw NotFoundException when session does not exist or already revoked', async () => {
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.revokeSession(mockUser.id, 'non-existent-session', 'vi'),
      ).rejects.toThrow();
    });

    it('TC-AUTH-SESSION-005: should revoke all other sessions except current', async () => {
      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 3 });
      jest.spyOn(service, 'hashToken').mockReturnValue('current-token-hash');

      const result = await service.revokeOtherSessions(mockUser.id, 'current-raw-token', 'vi');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUser.id,
            isRevoked: false,
            tokenHash: { not: 'current-token-hash' },
          }),
          data: { isRevoked: true },
        }),
      );
      expect(result.message).toBeDefined();
    });
  });
});
