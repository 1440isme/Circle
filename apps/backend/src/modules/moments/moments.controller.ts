import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MomentsService } from './moments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUserData } from '@circle/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createMomentSchemas,
  CreateMomentInput,
  ReactMomentInput,
  ReplyMomentInput,
  resolveLocale,
} from '@circle/shared';

@Controller('moments')
@UseGuards(JwtAuthGuard)
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  /**
   * POST /api/v1/moments — Create a new moment with Circle-based visibility
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUserData,
    @Body(new ZodValidationPipe((locale) => createMomentSchemas(locale).createMomentSchema))
    dto: CreateMomentInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.momentsService.create(user.id, dto, locale);
  }

  /**
   * GET /api/v1/moments/feed — Get aggregated moments feed from user's circles
   */
  @Get('feed')
  @HttpCode(HttpStatus.OK)
  async getFeed(
    @CurrentUser() user: AuthUserData,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.momentsService.getFeed(user.id, locale);
  }

  /**
   * GET /api/v1/moments/circle/:circleId — Get moments shared within a specific Circle
   */
  @Get('circle/:circleId')
  @HttpCode(HttpStatus.OK)
  async getByCircle(
    @CurrentUser() user: AuthUserData,
    @Param('circleId') circleId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.momentsService.getByCircle(user.id, circleId, locale);
  }

  /**
   * POST /api/v1/moments/:id/react — React with emoji or toggle off
   */
  @Post(':id/react')
  @HttpCode(HttpStatus.OK)
  async react(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Body(new ZodValidationPipe((locale) => createMomentSchemas(locale).reactMomentSchema))
    dto: ReactMomentInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.momentsService.react(user.id, id, dto.emoji, locale);
  }

  /**
   * DELETE /api/v1/moments/:id — Delete a moment
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.momentsService.delete(user.id, id, locale);
  }

  /**
   * POST /api/v1/moments/:id/reply — Reply to a Moment by sending a quoted message directly into the Circle's group chat
   */
  @Post(':id/reply')
  @HttpCode(HttpStatus.CREATED)
  async reply(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Body(new ZodValidationPipe((locale) => createMomentSchemas(locale).replyMomentSchema))
    dto: ReplyMomentInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.momentsService.replyMoment(user.id, id, dto, locale);
  }
}
