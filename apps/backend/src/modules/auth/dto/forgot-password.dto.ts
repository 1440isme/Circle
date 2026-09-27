import { ForgotPasswordInput } from '@circle/shared';

export class ForgotPasswordDto implements ForgotPasswordInput {
  email!: string;
}
