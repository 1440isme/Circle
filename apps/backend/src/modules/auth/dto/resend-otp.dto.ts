import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResendOtpDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsOptional()
  @IsString()
  @IsIn(['VERIFICATION', 'PASSWORD_RESET'], {
    message: 'Type must be either VERIFICATION or PASSWORD_RESET',
  })
  type?: 'VERIFICATION' | 'PASSWORD_RESET' = 'VERIFICATION';
}
