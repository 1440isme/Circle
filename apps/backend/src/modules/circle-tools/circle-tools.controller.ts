import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CircleToolsService } from './circle-tools.service';
import {
  CreateSharedAlbumDto,
  UpdateSharedAlbumDto,
  AddPhotosDto,
  CreateWheelDto,
  CreateAnonymousPostDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  RespondEventRsvpDto,
} from './dto/circle-tools.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '@circle/types';

@Controller('circles/:circleId')
@UseGuards(JwtAuthGuard)
export class CircleToolsController {
  constructor(private readonly toolsService: CircleToolsService) {}

  // ===========================================================================
  // 1. SHARED ALBUM (UC14)
  // ===========================================================================

  @Get('albums')
  async getAlbums(
    @Param('circleId') circleId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.getAlbums(circleId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('albums/:albumId')
  async getAlbumById(
    @Param('circleId') circleId: string,
    @Param('albumId') albumId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.getAlbumById(circleId, albumId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('albums')
  @HttpCode(HttpStatus.CREATED)
  async createAlbum(
    @Param('circleId') circleId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSharedAlbumDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.createAlbum(circleId, userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('albums/:albumId')
  async updateAlbum(
    @Param('circleId') circleId: string,
    @Param('albumId') albumId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSharedAlbumDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.updateAlbum(circleId, albumId, userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('albums/:albumId')
  async deleteAlbum(
    @Param('circleId') circleId: string,
    @Param('albumId') albumId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.deleteAlbum(circleId, albumId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('albums/:albumId/photos')
  @HttpCode(HttpStatus.CREATED)
  async addPhotos(
    @Param('circleId') circleId: string,
    @Param('albumId') albumId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddPhotosDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.addPhotos(circleId, albumId, userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('photos/:photoId')
  async deletePhoto(
    @Param('circleId') circleId: string,
    @Param('photoId') photoId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.deletePhoto(circleId, photoId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // 2. DECISION WHEEL (UC16)
  // ===========================================================================

  @Get('wheels')
  async getWheels(
    @Param('circleId') circleId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.getWheels(circleId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('wheels')
  @HttpCode(HttpStatus.CREATED)
  async createWheel(
    @Param('circleId') circleId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWheelDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.createWheel(circleId, userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('wheels/:wheelId/spin')
  @HttpCode(HttpStatus.OK)
  async spinWheel(
    @Param('circleId') circleId: string,
    @Param('wheelId') wheelId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.spinWheel(circleId, wheelId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('wheels/:wheelId')
  async deleteWheel(
    @Param('circleId') circleId: string,
    @Param('wheelId') wheelId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.deleteWheel(circleId, wheelId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // 3. ANONYMOUS POST / WORDS UNSAID (UC21)
  // ===========================================================================

  @Get('anonymous-posts')
  async getAnonymousPosts(
    @Param('circleId') circleId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.getAnonymousPosts(circleId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('anonymous-posts')
  @HttpCode(HttpStatus.CREATED)
  async createAnonymousPost(
    @Param('circleId') circleId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAnonymousPostDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.createAnonymousPost(circleId, userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('anonymous-posts/:postId')
  async deleteAnonymousPost(
    @Param('circleId') circleId: string,
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.deleteAnonymousPost(circleId, postId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // 4. GROUP CALENDAR & REMINDERS (UC17)
  // ===========================================================================

  @Get('calendar-events')
  async getCalendarEvents(
    @Param('circleId') circleId: string,
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<ApiResponse<any>> {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    const data = await this.toolsService.getCalendarEvents(circleId, userId, monthNum, yearNum);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('calendar-events')
  @HttpCode(HttpStatus.CREATED)
  async createCalendarEvent(
    @Param('circleId') circleId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCalendarEventDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.createCalendarEvent(circleId, userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('calendar-events/:eventId')
  async updateCalendarEvent(
    @Param('circleId') circleId: string,
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCalendarEventDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.updateCalendarEvent(circleId, eventId, userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('calendar-events/:eventId/cancel')
  async cancelCalendarEvent(
    @Param('circleId') circleId: string,
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.cancelCalendarEvent(circleId, eventId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('calendar-events/:eventId')
  async deleteCalendarEvent(
    @Param('circleId') circleId: string,
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.deleteCalendarEvent(circleId, eventId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }
  @Put('calendar-events/:eventId/rsvp')
  async respondEventRsvp(
    @Param('circleId') circleId: string,
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RespondEventRsvpDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.toolsService.respondEventRsvp(circleId, eventId, userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
