import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CirclesService } from './circles.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createCircleSchemas,
  CreateCircleInput,
  UpdateCircleInput,
  JoinCircleInput,
  resolveLocale,
} from '@circle/shared';
import { AuthUserData } from '@circle/types';

@Controller('circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  /**
   * POST /api/v1/circles — Create a new Circle
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUserData,
    @Body(new ZodValidationPipe((locale) => createCircleSchemas(locale).createCircleSchema))
    dto: CreateCircleInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.create(user.id, dto, locale);
  }

  /**
   * POST /api/v1/circles/join — Join a Circle via invite code
   */
  @Post('join')
  @HttpCode(HttpStatus.OK)
  async join(
    @CurrentUser() user: AuthUserData,
    @Body(new ZodValidationPipe((locale) => createCircleSchemas(locale).joinCircleSchema))
    dto: JoinCircleInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.joinByInviteCode(user.id, dto, locale);
  }

  /**
   * GET /api/v1/circles — Get all Circles for current user
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findMyCircles(
    @CurrentUser() user: AuthUserData,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.findUserCircles(user.id, locale);
  }

  /**
   * GET /api/v1/circles/friends/selectable — Get available friends for quick Circle creation
   */
  @Get('friends/selectable')
  @HttpCode(HttpStatus.OK)
  async getSelectableFriends(@CurrentUser() user: AuthUserData) {
    const data = await this.circlesService.getSelectableFriends(user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/circles/:idOrHandle — Get Circle details by ID or Handle
   */
  @Get(':idOrHandle')
  @HttpCode(HttpStatus.OK)
  async findByIdOrHandle(
    @CurrentUser() user: AuthUserData,
    @Param('idOrHandle') idOrHandle: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.findByIdOrHandle(idOrHandle, user.id, locale);
  }

  /**
   * PATCH /api/v1/circles/:id — Update Circle metadata
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Body(new ZodValidationPipe((locale) => createCircleSchemas(locale).updateCircleSchema))
    dto: UpdateCircleInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.update(id, user.id, dto, locale);
  }
}
