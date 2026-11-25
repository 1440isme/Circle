import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUserData, UpdateCircleNotificationSettingsInput } from '@circle/types';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RegisterDeviceTokenDto, RevokeDeviceTokenDto } from './dto/register-device-token.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: AuthUserData,
    @Query() query: QueryNotificationsDto,
  ) {
    const result = await this.notificationsService.getNotifications(user.id, query);
    return {
      success: true,
      data: result.data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  @Get('circles/:circleId/settings')
  async getCircleSettings(@CurrentUser() user: AuthUserData, @Param('circleId') circleId: string) {
    return { success: true, data: await this.notificationsService.getCircleSettings(user.id, circleId) };
  }

  @Patch('circles/:circleId/settings')
  async updateCircleSettings(
    @CurrentUser() user: AuthUserData,
    @Param('circleId') circleId: string,
    @Body() input: UpdateCircleNotificationSettingsInput,
  ) {
    return { success: true, data: await this.notificationsService.updateCircleSettings(user.id, circleId, input) };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: AuthUserData) {
    const data = await this.notificationsService.getUnreadCount(user.id);
    return {
      success: true,
      data,
    };
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
  ) {
    const data = await this.notificationsService.markAsRead(user.id, id);
    return {
      success: true,
      data,
    };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: AuthUserData) {
    const data = await this.notificationsService.markAllAsRead(user.id);
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
  ) {
    const data = await this.notificationsService.deleteNotification(user.id, id);
    return {
      success: true,
      data,
    };
  }
}

@Controller('devices')
export class DevicesController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  async registerPushToken(
    @CurrentUser() user: AuthUserData,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    const data = await this.notificationsService.registerDeviceToken(user.id, dto);
    return {
      success: true,
      data,
    };
  }

  @Delete('push-token')
  @HttpCode(HttpStatus.OK)
  async revokePushToken(
    @CurrentUser() user: AuthUserData,
    @Body() dto: RevokeDeviceTokenDto,
  ) {
    const data = await this.notificationsService.revokeDeviceToken(user.id, dto.deviceId);
    return {
      success: true,
      data,
    };
  }
}
