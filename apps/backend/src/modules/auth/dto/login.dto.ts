import { LoginInput } from '@circle/shared';

export class LoginDto implements LoginInput {
  email!: string;
  password!: string;
}
