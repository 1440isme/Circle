import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  Res,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StorageService } from './storage.service';
import { PresignedUploadDto, DirectUploadDto } from './dto/storage.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Locale, locales } from '@circle/shared';
import { ApiResponse, PresignedUploadResponse, DirectUploadResponse } from '@circle/types';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * POST /api/v1/storage/presigned-url — Generate presigned upload URL for Cloudflare R2
   */
  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  async getPresignedUrl(
    @CurrentUser('id') userId: string,
    @Body() dto: PresignedUploadDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<ApiResponse<PresignedUploadResponse>> {
    const locale: Locale = acceptLanguage?.startsWith('en') ? 'en' : 'vi';
    const result = await this.storageService.getPresignedUploadUrl(userId, dto, locale);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/storage/upload — Direct upload fallback (base64 payload)
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  async directUpload(
    @CurrentUser('id') userId: string,
    @Body() dto: DirectUploadDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<ApiResponse<DirectUploadResponse>> {
    const locale: Locale = acceptLanguage?.startsWith('en') ? 'en' : 'vi';
    const t = locales[locale] || locales.vi;

    if (!dto.base64Data) {
      throw new BadRequestException(t.storage.invalidFileType);
    }

    // Strip optional data:image/png;base64, prefix
    const base64Clean = dto.base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    if (buffer.length > 25 * 1024 * 1024) {
      throw new BadRequestException(t.storage.fileTooLarge);
    }

    const result = await this.storageService.saveDirectUpload(
      userId,
      dto.folder,
      dto.fileName,
      dto.contentType,
      buffer,
    );

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: t.storage.uploadSuccess,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/storage/raw/* — Serve raw media buffer for local fallback mode
   */
  @Public()
  @Get('raw/*')
  getRawMedia(@Req() req: Request, @Res() res: Response) {
    const rawKey = (req.params as any)[0] || (req.params as any)['0'] || req.url.split('/storage/raw/')[1] || '';
    const decodedKey = decodeURIComponent(rawKey.replace(/^\/+/, ''));
    const item = this.storageService.getLocalBuffer(decodedKey);
    if (!item) {
      throw new NotFoundException('Media file not found');
    }

    res.setHeader('Content-Type', item.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(item.buffer);
  }
}
