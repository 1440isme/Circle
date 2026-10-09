/**
 * CIRCLE — Shared Utilities, Constants & Validators
 */

export const APP_NAME = "CIRCLE";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function sanitizeText(input: string): string {
  return input.trim();
}

// Validation schemas & types
export * from "./validators/auth.validator";
export * from "./validators/circle.validator";
export * from "./validators/moment.validator";
export * from "./validators/chat.validator";
export * from "./validators/storage.validator";

// Locales & Bilingual Support (vi, en)
export * from "./locales";

// Design Tokens & Theme Colors (SSOT for Web & Mobile)
export * from "./theme/colors";

