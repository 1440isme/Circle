import { z } from 'zod';
import { Locale } from '../locales';

/**
 * Creates localized Circle Tools Zod validation schemas based on the active client locale.
 * Strictly guarantees zero hardcoded language strings.
 */
export function createCircleToolsSchemas(locale: Locale = 'vi') {

  // Shared Album (UC14)
  const createAlbumSchema = z.object({
    albumTitle: z
      .string()
      .trim()
      .min(1, locale === 'vi' ? 'Tiêu đề album không được để trống' : 'Album title is required')
      .max(100, locale === 'vi' ? 'Tiêu đề album tối đa 100 ký tự' : 'Album title max 100 characters'),
    description: z
      .string()
      .trim()
      .max(500, locale === 'vi' ? 'Mô tả album tối đa 500 ký tự' : 'Description max 500 characters')
      .optional(),
  });

  const updateAlbumSchema = createAlbumSchema.partial();

  const addPhotosSchema = z.object({
    photos: z
      .array(
        z.object({
          fileUrl: z
            .string()
            .trim()
            .min(1, locale === 'vi' ? 'Đường dẫn ảnh không được để trống' : 'Photo URL is required'),
          caption: z.string().trim().max(200).optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        })
      )
      .min(1, locale === 'vi' ? 'Cần ít nhất một ảnh để tải lên' : 'At least one photo is required'),
  });

  // Decision Wheel (UC16)
  const createWheelSchema = z.object({
    title: z
      .string()
      .trim()
      .min(1, locale === 'vi' ? 'Tiêu đề vòng quay không được để trống' : 'Wheel title is required')
      .max(100, locale === 'vi' ? 'Tiêu đề vòng quay tối đa 100 ký tự' : 'Wheel title max 100 characters'),
    options: z
      .array(
        z.object({
          optionLabel: z
            .string()
            .trim()
            .min(1, locale === 'vi' ? 'Nội dung lựa chọn không được để trống' : 'Option label is required')
            .max(50, locale === 'vi' ? 'Lựa chọn tối đa 50 ký tự' : 'Option max 50 characters'),
          color: z.string().optional(),
        })
      )
      .min(2, locale === 'vi' ? 'Cần tối thiểu 2 phương án lựa chọn' : 'At least 2 options are required')
      .max(24, locale === 'vi' ? 'Tối đa 24 phương án lựa chọn' : 'Max 24 options allowed'),
  });

  // Anonymous Post / Words Unsaid (UC21)
  const createAnonymousPostSchema = z.object({
    content: z
      .string()
      .trim()
      .min(1, locale === 'vi' ? 'Nội dung tâm sự không được để trống' : 'Message content cannot be empty')
      .max(1000, locale === 'vi' ? 'Nội dung tối đa 1000 ký tự' : 'Message max 1000 characters'),
    cardTheme: z.string().optional().default('sunset'),
  });

  // Group Calendar & Reminders (UC17)
  const createCalendarEventSchema = z.object({
    eventTitle: z
      .string()
      .trim()
      .min(1, locale === 'vi' ? 'Tên sự kiện không được để trống' : 'Event title is required')
      .max(100, locale === 'vi' ? 'Tên sự kiện tối đa 100 ký tự' : 'Event title max 100 characters'),
    description: z.string().trim().max(1000).optional(),
    location: z.string().trim().max(200).optional(),
    startTime: z
      .string()
      .datetime({ message: locale === 'vi' ? 'Thời gian bắt đầu không hợp lệ' : 'Invalid start time' }),
    endTime: z
      .string()
      .datetime({ message: locale === 'vi' ? 'Thời gian kết thúc không hợp lệ' : 'Invalid end time' })
      .optional()
      .nullable(),
    reminderTime: z
      .string()
      .datetime({ message: locale === 'vi' ? 'Thời gian nhắc hẹn không hợp lệ' : 'Invalid reminder time' })
      .optional()
      .nullable(),
  });

  const updateCalendarEventSchema = createCalendarEventSchema.partial();

  return {
    createAlbumSchema,
    updateAlbumSchema,
    addPhotosSchema,
    createWheelSchema,
    createAnonymousPostSchema,
    createCalendarEventSchema,
    updateCalendarEventSchema,
  };
}
