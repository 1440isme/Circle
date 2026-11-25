import { Module, forwardRef } from '@nestjs/common';
import { NotificationsController, DevicesController } from './notifications.controller';
import { NotificationEventsService } from './notification-events.service';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import { DatabaseModule } from '../../database/database.module';
import { ChatModule } from '../chat/chat.module';

import { CalendarReminderService } from './calendar-reminder.service';

@Module({
  imports: [DatabaseModule, forwardRef(() => ChatModule)],
  controllers: [NotificationsController, DevicesController],
  providers: [NotificationsService, PushNotificationService, NotificationEventsService, CalendarReminderService],
  exports: [NotificationsService, PushNotificationService, NotificationEventsService],
})
export class NotificationsModule {}
