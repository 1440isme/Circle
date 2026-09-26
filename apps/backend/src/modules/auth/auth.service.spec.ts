import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { GlobalRole } from '@circle/types';

describe('AuthService — TC-AUTH-001 & TC-AUTH-002', () => {
  let service: AuthService;
  let prisma: any;
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
      coverUrl: null,
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
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
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
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('US-AUTH-001: User Registration (TC-AUTH-001)', () => {
    it('should register a new user successfully and hash password with bcrypt', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({ id: 'token-1' });

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
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.tokens.refreshToken).toBe('mock-refresh-token');
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
        isRevoked: true, // ALREADY REVOKED!
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(
        service.refreshTokens({ refreshToken: reusedToken }),
      ).rejects.toThrow(UnauthorizedException);

      // Verify all sessions were revoked immediately
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        data: { isRevoked: true },
      });
    });
  });
});
