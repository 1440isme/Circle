import { Module, forwardRef } from '@nestjs/common';
import { NotificationsController, DevicesController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import { DatabaseModule } from '../../database/database.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => ChatModule)],
  controllers: [NotificationsController, DevicesController],
  providers: [NotificationsService, PushNotificationService],
  exports: [NotificationsService, PushNotificationService],
})
export class NotificationsModule {}
