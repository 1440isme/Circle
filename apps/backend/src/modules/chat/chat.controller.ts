import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUserData } from '@circle/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createChatSchemas,
  SendMessageInput,
  ReactMessageInput,
  MessagePaginationInput,
  resolveLocale,
} from '@circle/shared';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * GET /api/v1/channels/:channelId/messages — Cursor-based message pagination
   */
  @Get('channels/:channelId/messages')
  @HttpCode(HttpStatus.OK)
  async getChannelMessages(
    @CurrentUser() user: AuthUserData,
    @Param('channelId') channelId: string,
    @Query(new ZodValidationPipe((locale) => createChatSchemas(locale).messagePaginationSchema))
    query: MessagePaginationInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.chatService.getChannelMessages(user.id, channelId, query, locale);
  }

  /**
   * POST /api/v1/channels/:channelId/messages — Send a new message
   */
  @Post('channels/:channelId/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser() user: AuthUserData,
    @Param('channelId') channelId: string,
    @Body(new ZodValidationPipe((locale) => createChatSchemas(locale).sendMessageSchema))
    dto: SendMessageInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.chatService.sendMessage(user.id, channelId, dto, locale);
  }

  /**
   * GET /api/v1/channels/:channelId/pins — Get all pinned messages in a channel
   */
  @Get('channels/:channelId/pins')
  @HttpCode(HttpStatus.OK)
  async getPinnedMessages(
    @CurrentUser() user: AuthUserData,
    @Param('channelId') channelId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.chatService.getPinnedMessages(user.id, channelId, locale);
  }

  /**
   * POST /api/v1/messages/:messageId/reactions — Toggle emoji reaction
   */
  @Post('messages/:messageId/reactions')
  @HttpCode(HttpStatus.OK)
  async reactToMessage(
    @CurrentUser() user: AuthUserData,
    @Param('messageId') messageId: string,
    @Body(new ZodValidationPipe((locale) => createChatSchemas(locale).reactMessageSchema))
    dto: ReactMessageInput,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.chatService.reactToMessage(user.id, messageId, dto, locale);
  }

  /**
   * POST /api/v1/messages/:messageId/pin — Pin a message (UC13)
   */
  @Post('messages/:messageId/pin')
  @HttpCode(HttpStatus.OK)
  async pinMessage(
    @CurrentUser() user: AuthUserData,
    @Param('messageId') messageId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.chatService.pinMessage(user.id, messageId, locale);
  }

  /**
   * DELETE /api/v1/messages/:messageId/pin — Unpin a message (UC13)
   */
  @Delete('messages/:messageId/pin')
  @HttpCode(HttpStatus.OK)
  async unpinMessage(
    @CurrentUser() user: AuthUserData,
    @Param('messageId') messageId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.chatService.unpinMessage(user.id, messageId, locale);
  }

  /**
   * POST /api/v1/messages/:messageId/read — Mark message as read
   */
  @Post('messages/:messageId/read')
  @HttpCode(HttpStatus.OK)
  async markMessageAsRead(
    @CurrentUser() user: AuthUserData,
    @Param('messageId') messageId: string,
    @Headers('x-circle-locale') circleLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale = resolveLocale(circleLocale, acceptLanguage);
    return this.chatService.markMessageAsRead(user.id, messageId, locale);
  }
}
