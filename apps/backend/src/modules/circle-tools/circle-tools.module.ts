import { Module } from '@nestjs/common';
import { CircleToolsService } from './circle-tools.service';
import { CircleToolsController } from './circle-tools.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CircleToolsController],
  providers: [CircleToolsService],
  exports: [CircleToolsService],
})
export class CircleToolsModule {}
