import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiResponse, AuthResponseData, AuthUserData, SessionEntity } from '@circle/types';
import { createAuthSchemas, resolveLocale } from '@circle/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe((locale) => createAuthSchemas(locale).registerDtoSchema)) dto: RegisterDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Ip() ipAddress?: string,
  ): Promise<ApiResponse<AuthResponseData>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.register(dto, userAgent, ipAddress, locale);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Registration successful',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe((locale) => createAuthSchemas(locale).loginSchema)) dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Ip() ipAddress?: string,
  ): Promise<ApiResponse<AuthResponseData>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.login(dto, userAgent, ipAddress, locale);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body(new ZodValidationPipe((locale) => createAuthSchemas(locale).verifyOtpSchema)) dto: VerifyOtpDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Ip() ipAddress?: string,
  ): Promise<ApiResponse<AuthResponseData>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.verifyOtp(dto, userAgent, ipAddress, locale);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Email verification successful',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(
    @Body(new ZodValidationPipe((locale) => createAuthSchemas(locale).resendOtpSchema)) dto: ResendOtpDto,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.resendOtp(dto, locale);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ZodValidationPipe((locale) => createAuthSchemas(locale).forgotPasswordSchema)) dto: ForgotPasswordDto,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.forgotPassword(dto, locale);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe((locale) => createAuthSchemas(locale).resetPasswordDtoSchema)) dto: ResetPasswordDto,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.resetPassword(dto, locale);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe((locale) => createAuthSchemas(locale).refreshTokenSchema)) dto: RefreshTokenDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Ip() ipAddress?: string,
  ): Promise<ApiResponse<AuthResponseData>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.refreshTokens(dto, userAgent, ipAddress, locale);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Token refresh successful',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @Body() body?: { refreshToken?: string },
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.logout(userId, body?.refreshToken, locale);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(
    @CurrentUser() user: AuthUserData,
  ): Promise<ApiResponse<AuthUserData>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe((locale) => createAuthSchemas(locale).updateProfileSchema)) dto: UpdateProfileDto,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<ApiResponse<AuthUserData>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.updateProfile(userId, dto, locale);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async getSessions(
    @CurrentUser('id') userId: string,
    @Headers('x-refresh-token') currentRefreshToken?: string,
  ): Promise<ApiResponse<SessionEntity[]>> {
    const data = await this.authService.getUserSessions(userId, currentRefreshToken);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/other')
  @HttpCode(HttpStatus.OK)
  async revokeOtherSessions(
    @CurrentUser('id') userId: string,
    @Headers('x-refresh-token') currentRefreshToken?: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.revokeOtherSessions(userId, currentRefreshToken, locale);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    const data = await this.authService.revokeSession(userId, sessionId, locale);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: data.message,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
