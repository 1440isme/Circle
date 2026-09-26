import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseData, AuthTokens, GlobalRole } from '@circle/types';

@Injectable()
export class AuthService {
  private readonly bcryptSaltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Hashes a password using Bcrypt with cost 12.
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptSaltRounds);
  }

  /**
   * Compares plain password with Bcrypt hash.
   */
  async comparePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  /**
   * Hashes a refresh token string using SHA-256 for secure database storage and lookup.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Issues Dual-Token pair (Access Token 15m + Refresh Token 7d).
   */
  async generateTokens(payload: { sub: string; email: string; globalRole: string }): Promise<AuthTokens> {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'default-access-secret-32-chars-minimum-key';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-32-chars-minimum-key';
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Persists a hashed refresh token session into database.
   */
  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });
  }

  /**
   * US-AUTH-001: Register user with email, password hashing (cost 12), and profile creation.
   */
  async register(
    dto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseData> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          globalRole: GlobalRole.USER,
          profile: {
            create: {
              displayName: dto.displayName.trim(),
            },
          },
        },
        include: { profile: true },
      });

      return newUser;
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      globalRole: user.globalRole,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken, userAgent, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        globalRole: user.globalRole as GlobalRole,
        profile: user.profile
          ? {
              ...user.profile,
              dateOfBirth: user.profile.dateOfBirth?.toISOString() || null,
              updatedAt: user.profile.updatedAt.toISOString(),
            }
          : null,
      },
      tokens,
    };
  }

  /**
   * US-AUTH-002: Login with email & password, issuance of Dual-token JWT.
   */
  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseData> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true },
    });

    if (!user || !user.isActivated || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      globalRole: user.globalRole,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken, userAgent, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        globalRole: user.globalRole as GlobalRole,
        profile: user.profile
          ? {
              ...user.profile,
              dateOfBirth: user.profile.dateOfBirth?.toISOString() || null,
              updatedAt: user.profile.updatedAt.toISOString(),
            }
          : null,
      },
      tokens,
    };
  }

  /**
   * US-AUTH-002: Refresh Token Rotation with Token Reuse Detection.
   */
  async refreshTokens(
    dto: RefreshTokenDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseData> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-32-chars-minimum-key';

    let payload: { sub: string; email: string; globalRole: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(dto.refreshToken);
    const existingSession = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    // Token Reuse Detection: If an already revoked token is used, revoke all sessions immediately!
    if (existingSession && existingSession.isRevoked) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Security Alert: Refresh token reuse detected. All sessions revoked.');
    }

    if (!existingSession || existingSession.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token and rotate
    await this.prisma.refreshToken.update({
      where: { id: existingSession.id },
      data: { isRevoked: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true },
    });

    if (!user || !user.isActivated || user.deletedAt) {
      throw new UnauthorizedException('User account inactive or not found');
    }

    const newTokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      globalRole: user.globalRole,
    });

    await this.storeRefreshToken(user.id, newTokens.refreshToken, userAgent, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        globalRole: user.globalRole as GlobalRole,
        profile: user.profile
          ? {
              ...user.profile,
              dateOfBirth: user.profile.dateOfBirth?.toISOString() || null,
              updatedAt: user.profile.updatedAt.toISOString(),
            }
          : null,
      },
      tokens: newTokens,
    };
  }

  /**
   * Revoke session on logout.
   */
  async logout(userId: string, refreshToken?: string): Promise<{ message: string }> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash },
        data: { isRevoked: true },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }

    return { message: 'Logged out successfully' };
  }
}
