import { ResendOtpInput } from '@circle/shared';

export class ResendOtpDto implements ResendOtpInput {
  email!: string;
  type?: 'VERIFICATION' | 'PASSWORD_RESET';
}
