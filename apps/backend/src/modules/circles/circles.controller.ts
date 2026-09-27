import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { CirclesService } from './circles.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createCircleSchema,
  CreateCircleInput,
  updateCircleSchema,
  UpdateCircleInput,
} from '@circle/shared';
import { AuthUserData } from '@circle/types';

@Controller('circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  /**
   * POST /api/v1/circles — Create a new Circle
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createCircleSchema))
  async create(
    @CurrentUser() user: AuthUserData,
    @Body() dto: CreateCircleInput,
  ) {
    return this.circlesService.create(user.id, dto);
  }

  /**
   * GET /api/v1/circles — Get all Circles for current user
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findMyCircles(@CurrentUser() user: AuthUserData) {
    return this.circlesService.findUserCircles(user.id);
  }

  /**
   * GET /api/v1/circles/:idOrHandle — Get Circle details by ID or Handle
   */
  @Get(':idOrHandle')
  @HttpCode(HttpStatus.OK)
  async findByIdOrHandle(
    @CurrentUser() user: AuthUserData,
    @Param('idOrHandle') idOrHandle: string,
  ) {
    return this.circlesService.findByIdOrHandle(idOrHandle, user.id);
  }

  /**
   * PATCH /api/v1/circles/:id — Update Circle metadata
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updateCircleSchema))
  async update(
    @CurrentUser() user: AuthUserData,
    @Param('id') id: string,
    @Body() dto: UpdateCircleInput,
  ) {
    return this.circlesService.update(id, user.id, dto);
  }
}
