import { RegisterDeviceTokenInput, DevicePlatform } from '@circle/types';

export class RegisterDeviceTokenDto implements RegisterDeviceTokenInput {
  token: string;
  deviceId: string;
  platform: DevicePlatform;
}

export class RevokeDeviceTokenDto {
  deviceId: string;
}
