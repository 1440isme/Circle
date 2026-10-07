import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUserData, CallType } from '@circle/types';

@Controller()
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  /**
   * GET /api/v1/calls/ice-servers
   * Returns STUN and TURN configurations for WebRTC peer connection setup.
   */
  @Get('calls/ice-servers')
  @HttpCode(HttpStatus.OK)
  getIceServers() {
    return this.callsService.getIceServers();
  }

  /**
   * POST /api/v1/circles/:circleId/calls
   * Initiates a new call session or returns the ongoing call session in the circle.
   */
  @Post('circles/:circleId/calls')
  @HttpCode(HttpStatus.CREATED)
  async initiateCall(
    @CurrentUser() user: AuthUserData,
    @Param('circleId') circleId: string,
    @Body('callType') callType?: CallType,
  ) {
    return this.callsService.initiateCall(
      user.id,
      circleId,
      callType || CallType.AUDIO,
    );
  }

  /**
   * GET /api/v1/circles/:circleId/calls/active
   * Retrieves current active call session in the circle.
   */
  @Get('circles/:circleId/calls/active')
  @HttpCode(HttpStatus.OK)
  async getActiveCall(
    @CurrentUser() user: AuthUserData,
    @Param('circleId') circleId: string,
  ) {
    return this.callsService.getActiveCall(user.id, circleId);
  }

  /**
   * GET /api/v1/circles/:circleId/calls/history
   * Retrieves past call history in the circle (UC12).
   */
  @Get('circles/:circleId/calls/history')
  @HttpCode(HttpStatus.OK)
  async getCallHistory(
    @CurrentUser() user: AuthUserData,
    @Param('circleId') circleId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.callsService.getCallHistory(user.id, circleId, parsedLimit);
  }

  /**
   * POST /api/v1/calls/:callSessionId/join
   * Joins an active call session.
   */
  @Post('calls/:callSessionId/join')
  @HttpCode(HttpStatus.OK)
  async joinCall(
    @CurrentUser() user: AuthUserData,
    @Param('callSessionId') callSessionId: string,
  ) {
    return this.callsService.joinCall(user.id, callSessionId);
  }

  /**
   * POST /api/v1/calls/:callSessionId/leave
   * Leaves an active call session.
   */
  @Post('calls/:callSessionId/leave')
  @HttpCode(HttpStatus.OK)
  async leaveCall(
    @CurrentUser() user: AuthUserData,
    @Param('callSessionId') callSessionId: string,
  ) {
    return this.callsService.leaveCall(user.id, callSessionId);
  }

  /**
   * POST /api/v1/calls/:callSessionId/end
   * Ends an active call session completely.
   */
  @Post('calls/:callSessionId/end')
  @HttpCode(HttpStatus.OK)
  async endCall(
    @CurrentUser() user: AuthUserData,
    @Param('callSessionId') callSessionId: string,
  ) {
    return this.callsService.endCall(user.id, callSessionId);
  }
}
