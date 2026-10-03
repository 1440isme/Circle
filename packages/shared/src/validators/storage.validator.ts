import { z } from 'zod';

export const storageFolderSchema = z.enum([
  'moments',
  'avatars',
  'attachments',
  'albums',
]);

export const presignedUploadSchema = z.object({
  folder: storageFolderSchema,
  fileName: z
    .string()
    .min(1, 'Tên tệp không được để trống / File name cannot be empty')
    .max(255, 'Tên tệp quá dài / File name too long'),
  contentType: z
    .string()
    .min(1, 'Định dạng tệp không được để trống / Content type cannot be empty')
    .max(100),
  fileSize: z
    .number()
    .positive('Kích thước tệp phải lớn hơn 0 / File size must be positive')
    .max(25 * 1024 * 1024, 'Kích thước tệp tối đa 25MB / Max file size is 25MB')
    .optional(),
});

export type PresignedUploadInput = z.infer<typeof presignedUploadSchema>;

export const directUploadSchema = z.object({
  folder: storageFolderSchema,
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  base64Data: z.string().min(1, 'Dữ liệu tệp không được để trống'),
});

export type DirectUploadInput = z.infer<typeof directUploadSchema>;
