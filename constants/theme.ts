import { Platform } from 'react-native';

// Main brand palette
export const Palette = {
  // Primary — vibrant indigo/violet
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#4834D4',

  // Accent — electric teal
  accent: '#00CEC9',
  accentLight: '#81ECEC',

  // Energy — warm amber
  energy: '#FDCB6E',
  energyDark: '#E17055',

  // Success — mint green
  success: '#00B894',
  successLight: '#55EFC4',

  // Danger
  danger: '#FF7675',
  dangerDark: '#D63031',

  // Neutrals
  white: '#FFFFFF',
  black: '#0D0D0D',

  // Dark mode surfaces
  dark: {
    bg: '#0F0F1A',
    surface: '#1A1A2E',
    card: '#16213E',
    border: '#2D2D44',
    text: '#E8E8F0',
    textMuted: '#9999BB',
    textSecondary: '#CCCCEE',
  },

  // Light mode surfaces
  light: {
    bg: '#F5F5FF',
    surface: '#FFFFFF',
    card: '#F0F0FF',
    border: '#E0E0F0',
    text: '#1A1A2E',
    textMuted: '#666688',
  },
};

// Mood colors
export const MoodColors = {
  tired: { bg: '#2D2B55', accent: '#A29BFE', emoji: '😴' },
  energetic: { bg: '#1D3557', accent: '#00CEC9', emoji: '⚡' },
  bored: { bg: '#2D1B1B', accent: '#FDCB6E', emoji: '😑' },
};

// XP levels
export const Levels = [
  { level: 1, title: 'Newcomer', xpNeeded: 0 },
  { level: 2, title: 'Learner', xpNeeded: 500 },
  { level: 3, title: 'Scholar', xpNeeded: 1000 },
  { level: 4, title: 'Expert', xpNeeded: 2000 },
  { level: 5, title: 'Master', xpNeeded: 4000 },
  { level: 6, title: 'Legend', xpNeeded: 8000 },
];

export const Colors = {
  light: {
    text: Palette.light.text,
    background: Palette.light.bg,
    tint: Palette.primary,
    icon: Palette.light.textMuted,
    tabIconDefault: Palette.light.textMuted,
    tabIconSelected: Palette.primary,
    surface: Palette.light.surface,
    card: Palette.light.card,
    border: Palette.light.border,
  },
  dark: {
    text: Palette.dark.text,
    background: Palette.dark.bg,
    tint: Palette.primaryLight,
    icon: Palette.dark.textMuted,
    tabIconDefault: Palette.dark.textMuted,
    tabIconSelected: Palette.primaryLight,
    surface: Palette.dark.surface,
    card: Palette.dark.card,
    border: Palette.dark.border,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
