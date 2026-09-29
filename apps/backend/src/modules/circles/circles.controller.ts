import {
  Body,
  Controller,
  Delete,
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
  CreateInviteInput,
  CreateJoinRequestInput,
  ReviewJoinRequestInput,
  TransferOwnershipInput,
  UpdateNicknameInput,
  AddMembersInput,
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

  /**
   * POST /api/v1/circles/:id/invites — Create custom invite code with expiry/limits
   */
  @Post(':id/invites')
  @HttpCode(HttpStatus.CREATED)
  async createInvite(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Body(new ZodValidationPipe((locale) => createCircleSchemas(locale).createInviteSchema))
    dto: CreateInviteInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.createCustomInviteCode(id, user.id, dto, locale);
  }

  /**
   * GET /api/v1/circles/:id/invites — Get all active custom invites for Circle
   */
  @Get(':id/invites')
  @HttpCode(HttpStatus.OK)
  async getInvites(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.getCustomInvites(id, user.id, locale);
  }

  /**
   * GET /api/v1/circles/:id/members — Get all members of a Circle
   */
  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  async getMembers(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.getMembers(id, user.id, locale);
  }

  /**
   * POST /api/v1/circles/:id/members — Add new members to Circle
   */
  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  async addMembers(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Body(new ZodValidationPipe((locale) => createCircleSchemas(locale).addMembersSchema))
    dto: AddMembersInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.addMembers(id, user.id, dto.memberIds, locale);
  }


  /**
   * DELETE /api/v1/circles/:id/members/:memberId — Remove member (kick)
   */
  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.removeMember(id, user.id, memberId, locale);
  }

  /**
   * PATCH /api/v1/circles/:id/members/:memberId/nickname — Update member nickname
   */
  @Patch(':id/members/:memberId/nickname')
  @HttpCode(HttpStatus.OK)
  async updateMemberNickname(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body(new ZodValidationPipe((locale) => createCircleSchemas(locale).updateNicknameSchema))
    dto: UpdateNicknameInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.updateMemberNickname(id, user.id, memberId, dto.nickname, locale);
  }

  /**
   * POST /api/v1/circles/:id/leave — Leave a Circle
   */
  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  async leave(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.leaveCircle(id, user.id, locale);
  }

  /**
   * POST /api/v1/circles/:id/transfer-ownership — Transfer ownership to another member
   */
  @Post(':id/transfer-ownership')
  @HttpCode(HttpStatus.OK)
  async transferOwnership(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Body(new ZodValidationPipe((locale) => createCircleSchemas(locale).transferOwnershipSchema))
    dto: TransferOwnershipInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.transferOwnership(id, user.id, dto.newOwnerMemberId, locale);
  }

  /**
   * POST /api/v1/circles/:id/join-requests — Request to join private Circle
   */
  @Post(':id/join-requests')
  @HttpCode(HttpStatus.CREATED)
  async createJoinRequest(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Body(new ZodValidationPipe((locale) => createCircleSchemas(locale).createJoinRequestSchema))
    dto: CreateJoinRequestInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.requestToJoin(id, user.id, dto, locale);
  }

  /**
   * GET /api/v1/circles/:id/join-requests — Get pending join requests
   */
  @Get(':id/join-requests')
  @HttpCode(HttpStatus.OK)
  async getJoinRequests(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.getJoinRequests(id, user.id, locale);
  }

  /**
   * PATCH /api/v1/circles/:id/join-requests/:requestId — Review join request (Approve/Reject)
   */
  @Patch(':id/join-requests/:requestId')
  @HttpCode(HttpStatus.OK)
  async reviewJoinRequest(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @Body(new ZodValidationPipe((locale) => createCircleSchemas(locale).reviewJoinRequestSchema))
    dto: ReviewJoinRequestInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.circlesService.reviewJoinRequest(id, user.id, requestId, dto, locale);
  }
}
