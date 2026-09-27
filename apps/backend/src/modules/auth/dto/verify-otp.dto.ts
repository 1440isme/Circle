import { VerifyOtpInput } from '@circle/shared';

export class VerifyOtpDto implements VerifyOtpInput {
  email!: string;
  otp!: string;
}
