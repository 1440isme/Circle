import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthResponseData, AuthTokens, AuthUserData, GlobalRole } from '@circle/types';
import { Locale, locales } from '@circle/shared';

@Injectable()
export class AuthService {
  private readonly bcryptSaltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mailService: MailService,
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
   * Generates a cryptographically random 6-digit numeric OTP string.
   */
  generateNumericOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
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
   * US-AUTH-001 & US-AUTH-004: Register user with isActivated: false and send verification OTP.
   */
  async register(
    dto: RegisterDto,
    _userAgent?: string,
    _ipAddress?: string,
    locale: Locale = 'vi',
  ): Promise<AuthResponseData> {
    const t = locales[locale] || locales.vi;
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(t.auth.emailAlreadyRegistered);
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          isActivated: false,
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

    // Generate & store OTP in Redis (TTL 300 seconds = 5 minutes)
    const otp = this.generateNumericOtp();
    await this.redis.set(`otp:verify:${user.email}`, otp, 300);

    // Send email with OTP (asynchronous, non-blocking)
    await this.mailService.sendOtpVerification(user.email, otp, user.profile?.displayName, locale);

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
      tokens: null as any,
    };
  }

  /**
   * US-AUTH-002: Login with email & password, issuance of Dual-token JWT.
   */
  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
    locale: Locale = 'vi',
  ): Promise<AuthResponseData> {
    const t = locales[locale] || locales.vi;
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException(t.auth.invalidCredentials);
    }

    const isPasswordValid = await this.comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException(t.auth.invalidCredentials);
    }

    if (!user.isActivated) {
      throw new UnauthorizedException({
        message: t.auth.accountNotActivated,
        code: 'ACCOUNT_NOT_ACTIVATED',
        email: user.email,
      });
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
   * US-AUTH-004: Verifies 6-digit OTP to activate account and issue tokens.
   */
  async verifyOtp(
    dto: VerifyOtpDto,
    userAgent?: string,
    ipAddress?: string,
    locale: Locale = 'vi',
  ): Promise<AuthResponseData> {
    const t = locales[locale] || locales.vi;
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      throw new BadRequestException(t.auth.userNotFound);
    }

    if (user.isActivated) {
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

    const otpKey = `otp:verify:${email}`;
    const attemptKey = `otp:attempts:verify:${email}`;

    const storedOtp = await this.redis.get(otpKey);
    if (!storedOtp) {
      throw new BadRequestException(t.auth.otpExpiredOrNotFound);
    }

    const attempts = Number(await this.redis.get(attemptKey)) || 0;
    if (attempts >= 5) {
      await this.redis.del(otpKey);
      await this.redis.del(attemptKey);
      throw new BadRequestException(t.auth.otpMaxAttemptsExceeded);
    }

    if (storedOtp !== dto.otp) {
      await this.redis.incr(attemptKey);
      await this.redis.expire(attemptKey, 300);
      throw new BadRequestException(t.auth.otpIncorrect);
    }

    // Clean up Redis keys
    await this.redis.del(otpKey);
    await this.redis.del(attemptKey);

    // Activate user in DB
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { isActivated: true },
      include: { profile: true },
    });

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: updatedUser.id,
      email: updatedUser.email,
      globalRole: updatedUser.globalRole,
    });

    await this.storeRefreshToken(updatedUser.id, tokens.refreshToken, userAgent, ipAddress);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        globalRole: updatedUser.globalRole as GlobalRole,
        profile: updatedUser.profile
          ? {
              ...updatedUser.profile,
              dateOfBirth: updatedUser.profile.dateOfBirth?.toISOString() || null,
              updatedAt: updatedUser.profile.updatedAt.toISOString(),
            }
          : null,
      },
      tokens,
    };
  }

  /**
   * US-AUTH-004: Resends OTP with 60-second cooldown rate limit.
   */
  async resendOtp(
    dto: ResendOtpDto,
    locale: Locale = 'vi',
  ): Promise<{ message: string }> {
    const t = locales[locale] || locales.vi;
    const email = dto.email.toLowerCase();
    const type = dto.type || 'VERIFICATION';
    const cooldownKey = `otp:cooldown:${type}:${email}`;

    const isInCooldown = await this.redis.get(cooldownKey);
    if (isInCooldown) {
      throw new BadRequestException(t.auth.resendCooldown);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      // Anti-enumeration protection
      return { message: t.auth.resendGenericNotice };
    }

    if (type === 'VERIFICATION' && user.isActivated) {
      throw new BadRequestException(t.auth.accountAlreadyActivated);
    }

    const otp = this.generateNumericOtp();
    const otpKey = type === 'VERIFICATION' ? `otp:verify:${email}` : `otp:forgot:${email}`;
    const attemptKey =
      type === 'VERIFICATION' ? `otp:attempts:verify:${email}` : `otp:attempts:forgot:${email}`;

    await this.redis.set(otpKey, otp, 300); // 5 mins
    await this.redis.del(attemptKey); // Reset attempts
    await this.redis.set(cooldownKey, '1', 60); // 60s cooldown

    if (type === 'VERIFICATION') {
      await this.mailService.sendOtpVerification(email, otp, user.profile?.displayName, locale);
    } else {
      await this.mailService.sendPasswordResetOtp(email, otp, user.profile?.displayName, locale);
    }

    return { message: t.auth.resendSuccessNotice };
  }

  /**
   * US-AUTH-004: Requests a password reset OTP.
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
    locale: Locale = 'vi',
  ): Promise<{ message: string }> {
    const t = locales[locale] || locales.vi;
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (user && user.isActivated && !user.deletedAt) {
      const cooldownKey = `otp:cooldown:PASSWORD_RESET:${email}`;
      const isInCooldown = await this.redis.get(cooldownKey);

      if (!isInCooldown) {
        const otp = this.generateNumericOtp();
        await this.redis.set(`otp:forgot:${email}`, otp, 300);
        await this.redis.del(`otp:attempts:forgot:${email}`);
        await this.redis.set(cooldownKey, '1', 60);
        await this.mailService.sendPasswordResetOtp(email, otp, user.profile?.displayName, locale);
      }
    }

    // Always return neutral message for security (prevents account enumeration)
    return {
      message: t.auth.resetOtpGenericNotice,
    };
  }

  /**
   * US-AUTH-004: Resets user password using verified OTP and revokes all active sessions.
   */
  async resetPassword(
    dto: ResetPasswordDto,
    locale: Locale = 'vi',
  ): Promise<{ message: string }> {
    const t = locales[locale] || locales.vi;
    const email = dto.email.toLowerCase();
    const otpKey = `otp:forgot:${email}`;
    const attemptKey = `otp:attempts:forgot:${email}`;

    const storedOtp = await this.redis.get(otpKey);
    if (!storedOtp) {
      throw new BadRequestException(t.auth.otpExpiredOrNotFound);
    }

    const attempts = Number(await this.redis.get(attemptKey)) || 0;
    if (attempts >= 5) {
      await this.redis.del(otpKey);
      await this.redis.del(attemptKey);
      throw new BadRequestException(t.auth.otpMaxAttemptsExceeded);
    }

    if (storedOtp !== dto.otp) {
      await this.redis.incr(attemptKey);
      await this.redis.expire(attemptKey, 300);
      throw new BadRequestException(t.auth.otpIncorrect);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      throw new BadRequestException(t.auth.invalidResetRequest);
    }

    const newPasswordHash = await this.hashPassword(dto.newPassword);

    await this.prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      // Revoke all existing sessions for this user on password reset
      await tx.refreshToken.updateMany({
        where: { userId: user.id },
        data: { isRevoked: true },
      });
    });

    // Clean up Redis keys
    await this.redis.del(otpKey);
    await this.redis.del(attemptKey);

    return {
      message: t.auth.passwordResetSuccess,
    };
  }

  /**
   * US-AUTH-002: Refresh Token Rotation with Token Reuse Detection.
   */
  async refreshTokens(
    dto: RefreshTokenDto,
    userAgent?: string,
    ipAddress?: string,
    locale: Locale = 'vi',
  ): Promise<AuthResponseData> {
    const t = locales[locale] || locales.vi;
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-32-chars-minimum-key';

    let payload: { sub: string; email: string; globalRole: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException(t.auth.invalidOrExpiredRefreshToken);
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
      throw new UnauthorizedException(t.auth.securityAlertSessionRevoked);
    }

    if (!existingSession || existingSession.expiresAt < new Date()) {
      throw new UnauthorizedException(t.auth.invalidOrExpiredRefreshToken);
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
      throw new UnauthorizedException(t.auth.accountInactiveOrNotFound);
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
  async logout(
    userId: string,
    refreshToken?: string,
    locale: Locale = 'vi',
  ): Promise<{ message: string }> {
    const t = locales[locale] || locales.vi;
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

    return { message: t.auth.loggedOutSuccess };
  }

  /**
   * Updates user profile (displayName, avatarUrl, bio, coverUrl, dateOfBirth).
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    locale: Locale = 'vi',
  ): Promise<AuthUserData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || user.deletedAt) {
      const t = locales[locale] || locales.vi;
      throw new UnauthorizedException(t.auth.accountInactiveOrNotFound);
    }

    const updatedProfile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: dto.displayName || user.email.split('@')[0] || 'User',
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      },
      update: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.dateOfBirth !== undefined && {
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        }),
      },
    });

    return {
      id: user.id,
      email: user.email,
      globalRole: user.globalRole as GlobalRole,
      profile: {
        ...updatedProfile,
        dateOfBirth: updatedProfile.dateOfBirth?.toISOString() || null,
        updatedAt: updatedProfile.updatedAt.toISOString(),
      },
    };
  }
}
