import { ChangePasswordDtoInput } from '@circle/shared';

export class ChangePasswordDto implements ChangePasswordDtoInput {
  currentPassword!: string;
  newPassword!: string;
  confirmPassword!: string;
}
