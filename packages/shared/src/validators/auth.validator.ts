import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email không được để trống')
    .email('Địa chỉ email không đúng định dạng')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự')
      .max(50, 'Tên hiển thị không được vượt quá 50 ký tự'),
    email: z
      .string()
      .trim()
      .min(1, 'Email không được để trống')
      .email('Địa chỉ email không đúng định dạng')
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z
      .string()
      .min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email không được để trống')
    .email('Địa chỉ email không đúng định dạng')
    .toLowerCase(),
  otp: z
    .string()
    .trim()
    .length(6, 'Mã OTP phải có đúng 6 chữ số')
    .regex(/^\d{6}$/, 'Mã OTP chỉ bao gồm chữ số'),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const resendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email không được để trống')
    .email('Địa chỉ email không đúng định dạng')
    .toLowerCase(),
  type: z.enum(['VERIFICATION', 'PASSWORD_RESET']).optional(),
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email không được để trống')
    .email('Địa chỉ email không đúng định dạng')
    .toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Email không được để trống')
      .email('Địa chỉ email không đúng định dạng')
      .toLowerCase(),
    otp: z
      .string()
      .trim()
      .length(6, 'Mã OTP phải có đúng 6 chữ số')
      .regex(/^\d{6}$/, 'Mã OTP chỉ bao gồm chữ số'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
