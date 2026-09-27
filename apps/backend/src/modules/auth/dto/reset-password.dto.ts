import { ResetPasswordDtoInput } from '@circle/shared';

export class ResetPasswordDto implements ResetPasswordDtoInput {
  email!: string;
  otp!: string;
  newPassword!: string;
  confirmPassword?: string;
}
