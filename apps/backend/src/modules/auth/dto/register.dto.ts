import { RegisterDtoInput } from '@circle/shared';

export class RegisterDto implements RegisterDtoInput {
  displayName!: string;
  email!: string;
  password!: string;
}
