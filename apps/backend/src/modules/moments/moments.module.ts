import { Module } from '@nestjs/common';
import { MomentsService } from './moments.service';
import { MomentsController } from './moments.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MomentsController],
  providers: [MomentsService],
  exports: [MomentsService],
})
export class MomentsModule {}
