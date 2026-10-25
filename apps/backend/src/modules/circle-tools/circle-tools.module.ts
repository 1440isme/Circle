import { Module } from '@nestjs/common';
import { CircleToolsService } from './circle-tools.service';
import { CircleToolsController } from './circle-tools.controller';
import { DatabaseModule } from '../../database/database.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [DatabaseModule, ChatModule],
  controllers: [CircleToolsController],
  providers: [CircleToolsService],
  exports: [CircleToolsService],
})
export class CircleToolsModule {}
