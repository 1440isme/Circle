import { z } from 'zod';
import { locales, Locale } from '../locales';

export interface PasswordRequirements {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
}

export function checkPasswordRequirements(password: string): PasswordRequirements {
  const p = password || '';
  const minLength = p.length >= 8;
  const hasUpper = /[A-Z]/.test(p);
  const hasLower = /[a-z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSpecial = /[^A-Za-z0-9]/.test(p);
  const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  return { minLength, hasUpper, hasLower, hasNumber, hasSpecial, isValid };
}

/**
 * Creates localized Auth Zod validation schemas based on the active client locale.
 * Strictly guarantees zero hardcoded language strings.
 */
export function createAuthSchemas(locale: Locale = 'vi') {
  const dict = locales[locale] || locales.vi;
  const v = dict.validation;

  const strongPasswordSchema = z
    .string()
    .min(8, v.passwordMinLength)
    .regex(/[A-Z]/, v.passwordUppercase)
    .regex(/[a-z]/, v.passwordLowercase)
    .regex(/[0-9]/, v.passwordNumber)
    .regex(/[^A-Za-z0-9]/, v.passwordSpecialChar);

  const loginSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, v.emailRequired)
      .email(v.emailInvalid)
      .toLowerCase(),
    password: z
      .string()
      .min(1, v.passwordRequired),
  });

  const registerDtoSchema = z.object({
    displayName: z
      .string()
      .trim()
      .min(2, v.displayNameMinLength)
      .max(50, v.displayNameMaxLength),
    email: z
      .string()
      .trim()
      .min(1, v.emailRequired)
      .email(v.emailInvalid)
      .toLowerCase(),
    password: strongPasswordSchema,
  });

  const registerSchema = registerDtoSchema
    .extend({
      confirmPassword: z
        .string()
        .min(1, v.confirmPasswordRequired),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: v.passwordMismatch,
      path: ['confirmPassword'],
    });

  const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, v.refreshTokenRequired),
  });

  const verifyOtpSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, v.emailRequired)
      .email(v.emailInvalid)
      .toLowerCase(),
    otp: z
      .string()
      .trim()
      .length(6, v.otpSixDigits)
      .regex(/^\d{6}$/, v.otpDigitsOnly),
  });

  const resendOtpSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, v.emailRequired)
      .email(v.emailInvalid)
      .toLowerCase(),
    type: z.enum(['VERIFICATION', 'PASSWORD_RESET']).optional(),
  });

  const forgotPasswordSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, v.emailRequired)
      .email(v.emailInvalid)
      .toLowerCase(),
  });

  const resetPasswordDtoSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, v.emailRequired)
      .email(v.emailInvalid)
      .toLowerCase(),
    otp: z
      .string()
      .trim()
      .length(6, v.otpSixDigits)
      .regex(/^\d{6}$/, v.otpDigitsOnly),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().optional(),
  });

  const resetPasswordSchema = z
    .object({
      email: z
        .string()
        .trim()
        .min(1, v.emailRequired)
        .email(v.emailInvalid)
        .toLowerCase(),
      otp: z
        .string()
        .trim()
        .length(6, v.otpSixDigits)
        .regex(/^\d{6}$/, v.otpDigitsOnly),
      newPassword: strongPasswordSchema,
      confirmPassword: z.string().min(1, v.confirmPasswordRequired),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: v.passwordMismatch,
      path: ['confirmPassword'],
    });

  const updateProfileSchema = z.object({
    displayName: z
      .string()
      .trim()
      .min(2, v.displayNameMinLength)
      .max(50, v.displayNameMaxLength)
      .optional(),
    avatarUrl: z
      .string()
      .trim()
      .refine(
        (val) =>
          !val ||
          val.startsWith('http://') ||
          val.startsWith('https://') ||
          val.startsWith('/'),
        'URL ảnh đại diện không hợp lệ / Invalid avatar URL',
      )
      .nullable()
      .optional(),
    bio: z.string().trim().max(300).nullable().optional(),
    dateOfBirth: z.string().nullable().optional(),
  });

  return {
    loginSchema,
    registerSchema,
    registerDtoSchema,
    refreshTokenSchema,
    verifyOtpSchema,
    resendOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resetPasswordDtoSchema,
    updateProfileSchema,
  };
}

// Default export schemas (default to Vietnamese locale for backward compatibility)
const defaultSchemas = createAuthSchemas('vi');

export const loginSchema = defaultSchemas.loginSchema;
export const registerSchema = defaultSchemas.registerSchema;
export const registerDtoSchema = defaultSchemas.registerDtoSchema;
export const refreshTokenSchema = defaultSchemas.refreshTokenSchema;
export const verifyOtpSchema = defaultSchemas.verifyOtpSchema;
export const resendOtpSchema = defaultSchemas.resendOtpSchema;
export const forgotPasswordSchema = defaultSchemas.forgotPasswordSchema;
export const resetPasswordSchema = defaultSchemas.resetPasswordSchema;
export const resetPasswordDtoSchema = defaultSchemas.resetPasswordDtoSchema;
export const updateProfileSchema = defaultSchemas.updateProfileSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterDtoInput = z.infer<typeof registerDtoSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordDtoInput = z.infer<typeof resetPasswordDtoSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Extracts the first human-readable validation error message from a ZodError.
 */
export function getFirstZodError(error: z.ZodError): string {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const firstList = Object.values(fieldErrors).find((arr) => arr && arr.length > 0);
  return firstList?.[0] || '';
}
