// UrbanAV Design Tokens — Smart Home Glassmorphism · Purple Neon
// Dark violet base, neon purple/pink accents, translucent glass surfaces.
// HSL values from the design spec converted to hex/rgba for React Native.

export const BRAND = {
  50: '#F7E8FF',
  100: '#EFCBFF',
  200: '#DC9BFF',
  300: '#CC6BFF',
  400: '#C04DFF',
  500: '#B83DF5', // Core neon purple — hsl(280 90% 60%)
  600: '#9B25D9',
  700: '#7B25F4', // Deep neon — hsl(265 90% 55%)
  800: '#4D12A1', // Primary deep — hsl(265 80% 35%)
  900: '#2A0A5E',
};

// Neon accents used for glows, hero gradients, highlights
export const NEON = {
  violet: '#7B25F4',
  purple: '#B83DF5',
  magenta: '#E14DFF',
  pink: '#FF80EA',
  glow: '#E666FF',    // primary-glow hsl(290 100% 70%)
  accent: '#D55EED',  // accent hsl(290 80% 65%)
};

// Dark violet surface stack
export const SURFACE = {
  base: '#140821',       // app background hsl(270 60% 8%)
  bgDeep: '#090118',     // deepest radial stop
  bgMid: '#1A052E',      // mid radial stop
  bgTop: '#4F136C',      // top radial stop (purple halo)
  subtle: '#1A0D26',     // popover / sheet surface
  soft: '#241532',       // card base hsl(270 40% 14%)
  muted: '#2E1A42',      // muted hsl(270 25% 18%)
  panel: '#332442',      // secondary hsl(270 30% 20%)
  border: 'rgba(239, 204, 250, 0.14)',
  borderStrong: 'rgba(239, 204, 250, 0.28)',
};

// Translucent glass layers on top of dark surface
export const GLASS = {
  tier1: 'rgba(247, 217, 255, 0.10)',
  tier1Border: 'rgba(239, 204, 250, 0.22)',
  tier2: 'rgba(247, 217, 255, 0.06)',
  tier2Border: 'rgba(239, 204, 250, 0.14)',
  tier3: 'rgba(247, 217, 255, 0.04)',
  tier3Border: 'rgba(239, 204, 250, 0.10)',
  highlight: 'rgba(247, 217, 255, 0.25)',
  tint: 'rgba(184, 61, 245, 0.05)',
};

// Text on dark — high-contrast lavender whites
export const TEXT = {
  primary: '#F4EFF7',      // hsl(280 30% 96%)
  secondary: '#D8CCE6',
  tertiary: '#B6A7BE',     // hsl(280 15% 70%)
  muted: '#8A7D94',
  inverse: '#140821',
  brand: NEON.glow,
  link: NEON.magenta,
};

export const SEMANTIC = {
  success: '#22E082',
  successSoft: 'rgba(34, 224, 130, 0.16)',
  warning: '#FFB547',
  warningSoft: 'rgba(255, 181, 71, 0.16)',
  error: '#FF5B6E',
  errorSoft: 'rgba(255, 91, 110, 0.16)',
  info: '#5EB8FF',
  infoSoft: 'rgba(94, 184, 255, 0.16)',
};

export const SHADOW = {
  soft: 'rgba(9, 1, 24, 0.45)',
  medium: 'rgba(9, 1, 24, 0.6)',
  strong: 'rgba(9, 1, 24, 0.8)',
  brand: 'rgba(184, 61, 245, 0.35)',       // neon purple glow
  brandStrong: 'rgba(225, 77, 255, 0.55)', // magenta glow
  neon: 'rgba(230, 102, 255, 0.45)',       // primary-glow halo
};

// Neumorphic shadow tokens — dark violet extruded surfaces
export const NEU = {
  bg: '#1D0A2E',           // raised element background (slightly lighter than SURFACE.base)
  bgDeep: '#140821',       // same as SURFACE.base for consistency
  bgSubtle: '#221135',     // pressed/inset surface
  shadowLight: '#3D1260',  // purple highlight — top-left
  shadowDark: '#07000E',   // near-black depth — bottom-right
  // For pressed/inset state: shadows are reversed
  pressedLight: '#2A0A44',
  pressedDark: '#08000F',
  accentGlow: 'rgba(184, 61, 245, 0.30)', // subtle glow on active elements
};

// Light greyish-purple theme tokens — used for INNER pages
// (Home, Categories, Cart, Orders, Profile). Auth screens stay dark.
export const LIGHT = {
  bg: '#EFEAF4',           // main background — soft cream-lavender
  bgAlt: '#E6DEF0',        // slightly darker alt band
  card: '#FFFFFF',         // clean white card
  cardSoft: '#F5F0FA',     // subtle tinted card
  border: 'rgba(120, 80, 170, 0.12)',
  borderStrong: 'rgba(120, 80, 170, 0.22)',
  divider: 'rgba(120, 80, 170, 0.08)',
  // Text on light
  text: '#1E1030',         // near-black with purple tint
  textSecondary: '#4A3A60',
  textTertiary: '#7A6B8F',
  textMuted: '#A198B0',
  // Accent
  accent: '#7B25F4',       // deep neon purple
  accentSoft: 'rgba(123, 37, 244, 0.12)',
  accentHover: '#6A14E0',
  // Black CTA button (matches reference SIGN IN button)
  btnBlack: '#0E0614',
  btnBlackPressed: '#1E1030',
};

// Gradient for inner light pages — subtle greyish-purple wash
export const LIGHT_GRADIENT = ['#EFEAF4', '#E6DCF0', '#DED0EC'] as string[];

export const GRADIENT = {
  // Hero app background — dark radial faked with 3-stop linear
  appBg: ['#4F136C', '#1A052E', '#090118'] as string[],
  // Primary CTA — neon violet → magenta
  brand: ['#B83DF5', '#E14DFF'] as string[],
  brandSoft: ['#2E1A42', '#1A0D26'] as string[],
  // Full neon spectrum (headlines, splash, hero rings)
  neon: ['#7B25F4', '#E14DFF', '#FF80EA'] as string[],
  accent: ['#FF80EA', '#B83DF5'] as string[],
  success: ['#22E082', '#12B76A'] as string[],
  sunrise: ['#FFB088', '#E14DFF', '#7B25F4'] as string[],
  // Glass shine sweep (diagonal highlight)
  glassShine: ['rgba(247, 217, 255, 0.18)', 'rgba(247, 217, 255, 0)'] as string[],
  // Card gradient — translucent purple tint
  glassCard: ['rgba(247, 217, 255, 0.12)', 'rgba(247, 217, 255, 0.02)'] as string[],
};

// Legacy flat map — keeps existing screens working while they migrate.
export const COLORS = {
  primary: BRAND[500],
  primaryDark: BRAND[800],
  primaryLight: BRAND[300],
  primarySoft: SURFACE.panel,
  accent: NEON.magenta,
  accentOrange: NEON.pink,

  background: SURFACE.base,
  backgroundLight: SURFACE.subtle,
  backgroundGradientStart: SURFACE.bgTop,
  backgroundGradientMid: SURFACE.bgMid,
  backgroundGradientEnd: SURFACE.bgDeep,

  glassCard: GLASS.tier1,
  glassCardLight: GLASS.tier2,
  glassCardDark: GLASS.tier3,
  glassCardBorder: GLASS.tier1Border,
  glassCardBorderLight: GLASS.tier2Border,
  glassInput: SURFACE.soft,
  glassInputBorder: GLASS.tier1Border,
  glassOverlay: GLASS.tint,

  white: '#FFFFFF',
  lightGray: TEXT.tertiary,
  gray: TEXT.secondary,
  darkGray: TEXT.secondary,
  black: TEXT.primary, // "black" now maps to primary text on dark theme
  textSoft: TEXT.tertiary,

  success: SEMANTIC.success,
  warning: SEMANTIC.warning,
  error: SEMANTIC.error,
  info: SEMANTIC.info,

  shadowLight: SHADOW.soft,
  shadowDark: SHADOW.medium,
  shadowPurple: SHADOW.brand,

  tabBar: 'rgba(26, 13, 38, 0.92)',
  tabBarBorder: GLASS.tier2Border,
  tabBarActive: NEON.glow,
  tabBarInactive: TEXT.muted,
};

export const SIZES = {
  padding: 16,
  paddingLarge: 24,
  paddingSmall: 8,
  paddingXSmall: 4,

  borderRadius: 20,
  borderRadiusSmall: 12,
  borderRadiusLarge: 28,
  borderRadiusFull: 9999,

  fontSize: 14,
  fontSizeSmall: 12,
  fontSizeLarge: 18,
  fontSizeXLarge: 24,
  fontSizeXXLarge: 32,
  fontSizeTiny: 10,

  iconSize: 24,
  iconSizeSmall: 20,
  iconSizeLarge: 32,

  inputHeight: 52,
  buttonHeight: 56,
  headerHeight: 60,
  tabBarHeight: 72,

  glassPadding: 18,
  glassBorderWidth: 1,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};
