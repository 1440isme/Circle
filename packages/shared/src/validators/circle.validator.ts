import { z } from 'zod';

export const handleRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCircleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Tên nhóm phải có ít nhất 2 ký tự')
    .max(50, 'Tên nhóm không được vượt quá 50 ký tự'),
  handle: z
    .string()
    .trim()
    .min(3, 'Handle phải có ít nhất 3 ký tự')
    .max(30, 'Handle không được vượt quá 30 ký tự')
    .toLowerCase()
    .regex(
      handleRegex,
      'Handle chỉ được chứa chữ thường, số và dấu gạch ngang (không bắt đầu hoặc kết thúc bằng gạch ngang)',
    ),
  description: z
    .string()
    .trim()
    .max(255, 'Mô tả không được vượt quá 255 ký tự')
    .optional()
    .or(z.literal('')),
  avatarUrl: z
    .string()
    .url('Đường dẫn ảnh đại diện không hợp lệ')
    .optional()
    .or(z.literal('')),
  coverUrl: z
    .string()
    .url('Đường dẫn ảnh bìa không hợp lệ')
    .optional()
    .or(z.literal('')),
  isPrivate: z.boolean().default(false),
});

export type CreateCircleInput = z.infer<typeof createCircleSchema>;

export const updateCircleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Tên nhóm phải có ít nhất 2 ký tự')
    .max(50, 'Tên nhóm không được vượt quá 50 ký tự')
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, 'Mô tả không được vượt quá 255 ký tự')
    .optional()
    .or(z.literal('')),
  avatarUrl: z
    .string()
    .url('Đường dẫn ảnh đại diện không hợp lệ')
    .optional()
    .or(z.literal('')),
  coverUrl: z
    .string()
    .url('Đường dẫn ảnh bìa không hợp lệ')
    .optional()
    .or(z.literal('')),
  isPrivate: z.boolean().optional(),
});

export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
