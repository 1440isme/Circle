export interface ColorTokens {
  primary: string;
  primaryDark: string;
  sage: string;
  wash: string;
  canvas: string;
  surface: string;
  elevated: string;
  text: string;
  charcoal: string;
  subtle: string;
  slate: string;
  hairline: string;
  border: string;
  peach: string;
  coral: string;
  onPrimary: string;
  success: string;
  warning: string;
  info: string;
  accent: string;
  danger: string;
  glass: string;
  glassBorder: string;
  sheetBg: string;
}

export type UIStyle = 'flat' | 'glass';
export type MessageTheme = 'sage' | 'ocean' | 'lavender' | 'sunset' | 'rose' | 'minimal';

export interface BubbleThemeColors {
  name: string;
  color: string; // Preview accent color
  light: {
    bg: string;
    text: string;
    border: string;
    replyBg: string;
    composerReplyBg: string;
    sendBtnBg: string;
    sendBtnText: string;
    otherBg?: string;
    otherText?: string;
    otherBorder?: string;
    otherAccent?: string;
    otherReplyBg?: string;
  };
  dark: {
    bg: string;
    text: string;
    border: string;
    replyBg: string;
    composerReplyBg: string;
    sendBtnBg: string;
    sendBtnText: string;
    otherBg?: string;
    otherText?: string;
    otherBorder?: string;
    otherAccent?: string;
    otherReplyBg?: string;
  };
}

export const MessageBubbleThemes: Record<MessageTheme, BubbleThemeColors> = {
  sage: {
    name: 'Xanh Mint Pastel',
    color: '#34D399',
    light: {
      bg: '#D1FAE5',
      text: '#065F46',
      border: '#A7F3D0',
      replyBg: 'rgba(6, 95, 70, 0.08)',
      composerReplyBg: '#ECFDF5',
      sendBtnBg: '#10B981',
      sendBtnText: '#FFFFFF',
      otherBg: '#F4FBF7',
      otherText: '#1C1917',
      otherBorder: '#D1FAE5',
      otherAccent: '#059669',
      otherReplyBg: 'rgba(5, 150, 105, 0.08)',
    },
    dark: {
      bg: '#064E3B',
      text: '#ECFDF5',
      border: '#047857',
      replyBg: 'rgba(255, 255, 255, 0.12)',
      composerReplyBg: '#064E3B',
      sendBtnBg: '#34D399',
      sendBtnText: '#131316',
      otherBg: '#15221B',
      otherText: '#F3F4F6',
      otherBorder: '#1E3A2B',
      otherAccent: '#34D399',
      otherReplyBg: 'rgba(52, 211, 153, 0.1)',
    },
  },
  ocean: {
    name: 'Xanh Biển Pastel',
    color: '#38BDF8',
    light: {
      bg: '#E0F2FE',
      text: '#075985',
      border: '#BAE6FD',
      replyBg: 'rgba(7, 89, 133, 0.08)',
      composerReplyBg: '#F0F9FF',
      sendBtnBg: '#0284C7',
      sendBtnText: '#FFFFFF',
      otherBg: '#F0F9FF',
      otherText: '#1C1917',
      otherBorder: '#BAE6FD',
      otherAccent: '#0284C7',
      otherReplyBg: 'rgba(2, 132, 199, 0.08)',
    },
    dark: {
      bg: '#0C4A6E',
      text: '#F0F9FF',
      border: '#0369A1',
      replyBg: 'rgba(255, 255, 255, 0.12)',
      composerReplyBg: '#0C4A6E',
      sendBtnBg: '#38BDF8',
      sendBtnText: '#131316',
      otherBg: '#0F1F2C',
      otherText: '#F3F4F6',
      otherBorder: '#133954',
      otherAccent: '#38BDF8',
      otherReplyBg: 'rgba(56, 189, 248, 0.1)',
    },
  },
  lavender: {
    name: 'Tím Oải Hương Pastel',
    color: '#C084FC',
    light: {
      bg: '#F3E8FF',
      text: '#6B21A8',
      border: '#E9D5FF',
      replyBg: 'rgba(107, 33, 168, 0.08)',
      composerReplyBg: '#FAF5FF',
      sendBtnBg: '#9333EA',
      sendBtnText: '#FFFFFF',
      otherBg: '#FAF5FF',
      otherText: '#1C1917',
      otherBorder: '#E9D5FF',
      otherAccent: '#7C3AED',
      otherReplyBg: 'rgba(124, 58, 237, 0.08)',
    },
    dark: {
      bg: '#581C87',
      text: '#FAF5FF',
      border: '#7E22CE',
      replyBg: 'rgba(255, 255, 255, 0.12)',
      composerReplyBg: '#581C87',
      sendBtnBg: '#C084FC',
      sendBtnText: '#131316',
      otherBg: '#1F1528',
      otherText: '#F3F4F6',
      otherBorder: '#3B2054',
      otherAccent: '#C084FC',
      otherReplyBg: 'rgba(192, 132, 252, 0.1)',
    },
  },
  sunset: {
    name: 'Cam Đào Pastel',
    color: '#FB923C',
    light: {
      bg: '#FFEDD5',
      text: '#9A3412',
      border: '#FED7AA',
      replyBg: 'rgba(154, 52, 18, 0.08)',
      composerReplyBg: '#FFF7ED',
      sendBtnBg: '#EA580C',
      sendBtnText: '#FFFFFF',
      otherBg: '#FFF7ED',
      otherText: '#1C1917',
      otherBorder: '#FED7AA',
      otherAccent: '#EA580C',
      otherReplyBg: 'rgba(234, 88, 12, 0.08)',
    },
    dark: {
      bg: '#7C2D12',
      text: '#FFF7ED',
      border: '#C2410C',
      replyBg: 'rgba(255, 255, 255, 0.12)',
      composerReplyBg: '#7C2D12',
      sendBtnBg: '#FB923C',
      sendBtnText: '#131316',
      otherBg: '#271711',
      otherText: '#F3F4F6',
      otherBorder: '#4A2315',
      otherAccent: '#FB923C',
      otherReplyBg: 'rgba(251, 146, 60, 0.1)',
    },
  },
  rose: {
    name: 'Hồng Phấn Pastel',
    color: '#F472B6',
    light: {
      bg: '#FCE7F3',
      text: '#9D174D',
      border: '#FBCFE8',
      replyBg: 'rgba(157, 23, 77, 0.08)',
      composerReplyBg: '#FDF2F8',
      sendBtnBg: '#DB2777',
      sendBtnText: '#FFFFFF',
      otherBg: '#FFF1F2',
      otherText: '#1C1917',
      otherBorder: '#FECDD3',
      otherAccent: '#E11D48',
      otherReplyBg: 'rgba(225, 29, 72, 0.08)',
    },
    dark: {
      bg: '#831843',
      text: '#FDF2F8',
      border: '#BE185D',
      replyBg: 'rgba(255, 255, 255, 0.12)',
      composerReplyBg: '#831843',
      sendBtnBg: '#F472B6',
      sendBtnText: '#131316',
      otherBg: '#271219',
      otherText: '#F3F4F6',
      otherBorder: '#4C1628',
      otherAccent: '#FB7185',
      otherReplyBg: 'rgba(251, 113, 133, 0.1)',
    },
  },
  minimal: {
    name: 'Xám Tối Giản Pastel',
    color: '#94A3B8',
    light: {
      bg: '#F1F5F9',
      text: '#1E293B',
      border: '#E2E8F0',
      replyBg: 'rgba(30, 41, 59, 0.08)',
      composerReplyBg: '#F8FAFC',
      sendBtnBg: '#475569',
      sendBtnText: '#FFFFFF',
      otherBg: '#F8FAFC',
      otherText: '#1C1917',
      otherBorder: '#E2E8F0',
      otherAccent: '#475569',
      otherReplyBg: 'rgba(71, 85, 105, 0.08)',
    },
    dark: {
      bg: '#1E293B',
      text: '#F8FAFC',
      border: '#334155',
      replyBg: 'rgba(255, 255, 255, 0.12)',
      composerReplyBg: '#1E293B',
      sendBtnBg: '#94A3B8',
      sendBtnText: '#131316',
      otherBg: '#14171F',
      otherText: '#F3F4F6',
      otherBorder: '#262B38',
      otherAccent: '#94A3B8',
      otherReplyBg: 'rgba(148, 163, 184, 0.1)',
    },
  },
};

export const CircleColors: { light: ColorTokens; dark: ColorTokens } = {
  light: {
    primary: '#10B981', // Clean Emerald Light Green (Canonical Brand Primary)
    primaryDark: '#059669',
    sage: '#059669',
    wash: 'rgba(16, 185, 129, 0.08)', // Subtle green wash, ONLY for selected state / pills
    canvas: '#FFFFFF', // Neutral clean white canvas
    surface: '#F5F5F6', // Neutral light surface (Muse Flat token --mk-surface)
    elevated: '#FFFFFF',
    text: '#17171A', // Crisp neutral dark text (--mk-text)
    charcoal: '#17171A',
    subtle: '#6E6E76', // Neutral gray secondary text (--mk-muted)
    slate: '#6E6E76',
    hairline: '#E3E3E8', // 1px hairline border (--mk-border)
    border: '#E3E3E8',
    peach: '#E89D71',
    coral: '#E05A47',
    onPrimary: '#FFFFFF',
    success: '#15803D',
    warning: '#F59E0B',
    info: '#3B82F6',
    accent: '#10B981', // Accent matches Circle primary green
    danger: '#DC2626',
    glass: 'rgba(255, 255, 255, 0.65)',
    glassBorder: 'rgba(255, 255, 255, 0.55)',
    sheetBg: 'rgba(255, 255, 255, 0.90)',
  },
  dark: {
    primary: '#34D399', // Clean Mint Green (Canonical Dark Primary)
    primaryDark: '#10B981',
    sage: '#34D399',
    wash: 'rgba(52, 211, 153, 0.12)', // Subtle mint wash for selected state only
    canvas: '#131316', // Deep neutral obsidian dark canvas (--mk-bg, zero swamp green)
    surface: '#1D1D21', // Neutral dark surface (--mk-surface, zero swamp green)
    elevated: '#2A2A30', // Neutral dark elevated surface (--mk-surface-muted)
    text: '#F2F2F4', // Crisp clean white text (--mk-text)
    charcoal: '#131316',
    subtle: '#A1A1AA', // Neutral light zinc/gray secondary text (--mk-muted)
    slate: '#A1A1AA',
    hairline: '#2E2E35', // 1px dark hairline border (--mk-border)
    border: '#2E2E35',
    peach: '#F4C7A1',
    coral: '#E98282',
    onPrimary: '#131316',
    success: '#4ADE80',
    warning: '#FBBF24',
    info: '#60A5FA',
    accent: '#34D399',
    danger: '#F87171',
    glass: 'rgba(29, 29, 33, 0.70)',
    glassBorder: 'rgba(255, 255, 255, 0.18)',
    sheetBg: 'rgba(24, 24, 28, 0.92)',
  },
};

export type ColorTheme = ColorTokens;
