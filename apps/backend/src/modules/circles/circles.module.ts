import { forwardRef, Module } from '@nestjs/common';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [CirclesController],
  providers: [CirclesService],
  exports: [CirclesService],
})
export class CirclesModule {}
