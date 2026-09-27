import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
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
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse, AuthResponseData, AuthUserData } from '@circle/types';
import { Locale } from '@circle/shared';

function resolveLocale(circleLocale?: string, acceptLanguage?: string): Locale {
  if (circleLocale === 'en' || circleLocale === 'vi') return circleLocale;
  if (acceptLanguage && acceptLanguage.toLowerCase().startsWith('en')) return 'en';
  return 'vi';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
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
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ): Promise<ApiResponse<AuthResponseData>> {
    const data = await this.authService.login(dto, userAgent, ipAddress);
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
    @Body() dto: VerifyOtpDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ): Promise<ApiResponse<AuthResponseData>> {
    const data = await this.authService.verifyOtp(dto, userAgent, ipAddress);
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
    @Body() dto: ResendOtpDto,
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
    @Body() dto: ForgotPasswordDto,
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
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ApiResponse<{ message: string }>> {
    const data = await this.authService.resetPassword(dto);
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
    @Body() dto: RefreshTokenDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ): Promise<ApiResponse<AuthResponseData>> {
    const data = await this.authService.refreshTokens(dto, userAgent, ipAddress);
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
  ): Promise<ApiResponse<{ message: string }>> {
    const data = await this.authService.logout(userId, body?.refreshToken);
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
}
