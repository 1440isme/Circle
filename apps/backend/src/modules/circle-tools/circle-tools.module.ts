import { Module, forwardRef } from '@nestjs/common';
import { CircleToolsService } from './circle-tools.service';
import { CircleToolsController } from './circle-tools.controller';
import { DatabaseModule } from '../../database/database.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule), DatabaseModule, forwardRef(() => ChatModule)],
  controllers: [CircleToolsController],
  providers: [CircleToolsService],
  exports: [CircleToolsService],
})
export class CircleToolsModule {}
