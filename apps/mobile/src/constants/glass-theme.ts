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
    // Functional layer (Liquid Glass)
    glassBg: 'rgba(255, 255, 255, 0.65)',
    glassBgSheet: 'rgba(255, 255, 255, 0.90)',
    glassBgClear: 'rgba(255, 255, 255, 0.28)',
    glassBorder: 'rgba(227, 227, 232, 0.75)',
    glassHighlight: 'rgba(255, 255, 255, 0.65)',
    glassShadow: 'rgba(0, 0, 0, 0.08)',
    glassFg: '#17171A',
  },
  blur: {
    intensity: 45,
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
    // Content layer (neutral deep obsidian background, zero green cast)
    surface: '#1D1D21',
    bg: '#131316',
    border: '#2E2E35',
    ink: '#F2F2F4',
    inkMuted: 'rgba(242, 242, 244, 0.62)',
    accent: '#34D399', // Clean Circle dark mint green
    warning: '#FBBF24',
    // Functional layer (Liquid Glass)
    glassBg: 'rgba(29, 29, 33, 0.70)',
    glassBgSheet: 'rgba(24, 24, 28, 0.92)',
    glassBgClear: 'rgba(255, 255, 255, 0.12)',
    glassBorder: 'rgba(255, 255, 255, 0.15)',
    glassHighlight: 'rgba(255, 255, 255, 0.18)',
    glassShadow: 'rgba(0, 0, 0, 0.35)',
    glassFg: '#F2F2F4',
  },
  blur: {
    intensity: 45,
    tint: 'dark',
  },
  radius: lightGlass.radius,
  spacing: lightGlass.spacing,
};

// Flat Design (Mặc định: Phẳng, bề mặt đặc neutral, không blur)
export const lightFlat: GlassTheme = {
  ...lightGlass,
  colors: {
    ...lightGlass.colors,
    glassBg: '#F5F5F6',
    glassBgSheet: '#FFFFFF',
    glassBgClear: '#EBEBEE',
    glassBorder: '#E3E3E8',
    glassHighlight: 'transparent',
    glassShadow: 'rgba(0, 0, 0, 0.05)',
  },
  blur: {
    intensity: 0,
    tint: 'light',
  },
};

export const darkFlat: GlassTheme = {
  ...darkGlass,
  colors: {
    ...darkGlass.colors,
    glassBg: '#1D1D21',
    glassBgSheet: '#131316',
    glassBgClear: '#2A2A30',
    glassBorder: '#2E2E35',
    glassHighlight: 'transparent',
    glassShadow: 'rgba(0, 0, 0, 0.25)',
  },
  blur: {
    intensity: 0,
    tint: 'dark',
  },
};

export function getGlassTheme(isDark: boolean, uiStyle: UIStyle = 'flat'): GlassTheme {
  if (uiStyle === 'glass') {
    return isDark ? darkGlass : lightGlass;
  }
  return isDark ? darkFlat : lightFlat;
}

export function getAppDesignTheme(isDark: boolean, uiStyle: UIStyle = 'flat'): GlassTheme {
  return getGlassTheme(isDark, uiStyle);
}
