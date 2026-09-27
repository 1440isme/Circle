import { RefreshTokenInput } from '@circle/shared';

export class RefreshTokenDto implements RefreshTokenInput {
  refreshToken!: string;
}
