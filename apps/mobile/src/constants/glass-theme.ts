/* ============================================================
 * Liquid Glass Design Tokens cho React Native (Circle Mobile).
 * Nguồn: Liquid Glass UI Kit (Apple HIG principles)
 *
 * NGUYÊN TẮC:
 * 1. Hai lớp tách biệt: glass CHỈ cho functional layer (tab bar, toolbar, FAB, sheet, popover).
 *    Content layer (text, list, card, ảnh) là nền ĐẶC, KHÔNG glass.
 * 2. Tiết chế: Càng ít điểm glass càng sang. Không xếp glass chồng glass.
 * 3. Vật liệu sống: Blur + bão hòa 180% + viền specular highlight ở mép trên.
 * 4. Bo góc đồng tâm: R_ngoài = R_trong + padding (chip: 10, card: 16, bar/sheet: 26, nút tròn: pill).
 * 5. Chữ thắng mọi hiệu ứng: Điều khiển đơn sắc, ink không dùng xám nhạt, cấp phụ dùng ink + opacity 62%.
 *    Chiều cao chạm tối thiểu >= 44px.
 * ============================================================ */

export interface GlassTheme {
  dark: boolean;
  colors: {
    // Content layer (bề mặt đặc, không kính)
    surface: string;
    bg: string;
    border: string;
    ink: string;
    inkMuted: string; // ink đầy đủ + mờ 62%
    accent: string;
    warning: string;
    // Functional layer (vật liệu kính)
    glassBg: string;
    glassBgSheet: string; // kính đậm hơn 1 bậc cho sheet/modal
    glassBgClear: string;
    glassBorder: string;
    glassHighlight: string;
    glassShadow: string;
    glassFg: string;
  };
  blur: {
    intensity: number;
    tint: 'light' | 'dark' | 'default';
  };
  radius: {
    chip: number;
    card: number;
    bar: number;
    pill: number;
  };
  spacing: {
    xs: number; // 4
    sm: number; // 8 (đệm trong kính)
    md: number; // 12
    lg: number; // 16
    xl: number; // 24
    xxl: number; // 32
    touchTarget: number; // 44
  };
}

import { UIStyle } from '@circle/shared';

export const lightGlass: GlassTheme = {
  dark: false,
  colors: {
    // Content layer (neutral clean background)
    surface: '#F5F5F6',
    bg: '#FFFFFF',
    border: '#E3E3E8',
    ink: '#17171A',
    inkMuted: 'rgba(23, 23, 26, 0.62)',
    accent: '#10B981', // Clean Circle primary green
    warning: '#F59E0B',
    // Functional layer (Subtle Frosted Glass - Clean flat structure with delicate blur)
    glassBg: 'rgba(255, 255, 255, 0.88)',
    glassBgSheet: 'rgba(255, 255, 255, 0.96)',
    glassBgClear: 'rgba(255, 255, 255, 0.82)',
    glassBorder: 'rgba(227, 227, 232, 0.80)',
    glassHighlight: 'transparent',
    glassShadow: 'rgba(0, 0, 0, 0.04)',
    glassFg: '#17171A',
  },
  blur: {
    intensity: 35,
    tint: 'light',
  },
  radius: {
    chip: 10,
    card: 16,
    bar: 26,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    touchTarget: 44,
  },
};

export const darkGlass: GlassTheme = {
  dark: true,
  colors: {
    // Content layer (Clean Instagram-style obsidian dark canvas)
    surface: '#16181B',
    bg: '#0B0C0E',
    border: '#26292E',
    ink: '#F9FAFB',
    inkMuted: 'rgba(249, 250, 251, 0.62)',
    accent: '#34D399', // Clean Circle dark mint green
    warning: '#FBBF24',
    // Functional layer (Subtle Frosted Glass - Clean flat structure with delicate blur)
    glassBg: 'rgba(22, 24, 28, 0.85)',
    glassBgSheet: 'rgba(22, 24, 28, 0.94)',
    glassBgClear: 'rgba(255, 255, 255, 0.10)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassHighlight: 'transparent',
    glassShadow: 'rgba(0, 0, 0, 0.15)',
    glassFg: '#F9FAFB',
  },
  blur: {
    intensity: 35,
    tint: 'dark',
  },
  radius: lightGlass.radius,
  spacing: lightGlass.spacing,
};

// Unified Design Theme (Phẳng + Kính mờ nhẹ, không bóng đổ nặng, không viền bóng loáng)
export const lightFlat: GlassTheme = lightGlass;
export const darkFlat: GlassTheme = darkGlass;

export function getGlassTheme(isDark: boolean, _uiStyle?: any): GlassTheme {
  return isDark ? darkGlass : lightGlass;
}

export function getAppDesignTheme(isDark: boolean, _uiStyle?: any): GlassTheme {
  return getGlassTheme(isDark);
}
