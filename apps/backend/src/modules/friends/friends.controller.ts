import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createFriendSchemas,
  SendFriendRequestInput,
  resolveLocale,
} from '@circle/shared';
import { AuthUserData } from '@circle/types';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  /**
   * GET /api/v1/friends — List all accepted friends
   */
  @Get()
  async getFriends(@CurrentUser() user: AuthUserData) {
    return this.friendsService.getFriends(user.id);
  }

  /**
   * GET /api/v1/friends/search?q=... — Search users by name or email with relationship status
   */
  @Get('search')
  async searchUsers(
    @CurrentUser() user: AuthUserData,
    @Query('q') query?: string,
  ) {
    return this.friendsService.searchUsers(user.id, query || '');
  }

  /**
   * GET /api/v1/friends/requests/received — List received pending friend requests
   */
  @Get('requests/received')
  async getReceivedRequests(@CurrentUser() user: AuthUserData) {
    return this.friendsService.getReceivedRequests(user.id);
  }

  /**
   * GET /api/v1/friends/requests/sent — List sent pending friend requests
   */
  @Get('requests/sent')
  async getSentRequests(@CurrentUser() user: AuthUserData) {
    return this.friendsService.getSentRequests(user.id);
  }

  /**
   * POST /api/v1/friends/requests — Send a friend request
   */
  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  async sendFriendRequest(
    @CurrentUser() user: AuthUserData,
    @Body(new ZodValidationPipe((locale) => createFriendSchemas(locale).sendFriendRequestSchema))
    dto: SendFriendRequestInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.friendsService.sendFriendRequest(user.id, dto.targetUserId, locale);
  }

  /**
   * POST /api/v1/friends/requests/:id/accept — Accept received friend request
   */
  @Post('requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptFriendRequest(
    @CurrentUser() user: AuthUserData,
    @Param('id') friendshipId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.friendsService.acceptFriendRequest(user.id, friendshipId, locale);
  }

  /**
   * POST /api/v1/friends/requests/:id/reject — Reject received friend request
   */
  @Post('requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectFriendRequest(
    @CurrentUser() user: AuthUserData,
    @Param('id') friendshipId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.friendsService.rejectFriendRequest(user.id, friendshipId, locale);
  }

  /**
   * DELETE /api/v1/friends/requests/:id — Cancel sent pending friend request
   */
  @Delete('requests/:id')
  @HttpCode(HttpStatus.OK)
  async cancelFriendRequest(
    @CurrentUser() user: AuthUserData,
    @Param('id') friendshipId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.friendsService.cancelFriendRequest(user.id, friendshipId, locale);
  }

  /**
   * DELETE /api/v1/friends/:friendId — Unfriend
   */
  @Delete(':friendId')
  @HttpCode(HttpStatus.OK)
  async unfriend(
    @CurrentUser() user: AuthUserData,
    @Param('friendId') friendId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.friendsService.unfriend(user.id, friendId, locale);
  }
}
