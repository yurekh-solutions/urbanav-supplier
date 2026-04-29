// UrbanAV Design System — Smart Home Dark Purple Neon Glass + Neumorphism
// All components are free/MIT licensed.
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInput,
  TextInputProps,
  Platform,
  ActivityIndicator,
  Pressable,
  ImageSourcePropType,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import {
  BRAND,
  NEON,
  SURFACE,
  GLASS,
  TEXT,
  SEMANTIC,
  SHADOW,
  GRADIENT,
  COLORS,
  SIZES,
  NEU as NEU_TOKENS,
  LIGHT as LIGHT_TOKENS,
  LIGHT_GRADIENT,
} from '../../theme/colors';
import { SPACING, RADIUS } from '../../theme/spacing';
import { TYPE, TypeVariant } from '../../theme/typography';
import { SCALE } from '../../theme/animations';
import {
  ChevronLeft,
  Search as SearchIcon,
  Star,
  X,
  Check,
  AlertCircle,
  Inbox,
} from 'lucide-react-native';

export * from './motion';

// ============================================================
// Typography
// ============================================================
type TypographyProps = {
  variant?: TypeVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  align,
  numberOfLines,
  style,
  children,
}) => (
  <Text numberOfLines={numberOfLines} style={[TYPE[variant], color ? { color } : null, align ? { textAlign: align } : null, style]}>
    {children}
  </Text>
);

// ============================================================
// GlassCard - BlurView wrapped with gradient border + brand shadow
// ============================================================
type GlassTier = 'tier1' | 'tier2' | 'tier3';
type GlassCardProps = {
  children: React.ReactNode;
  tier?: GlassTier;
  intensity?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  tier = 'tier1',
  intensity = 24,
  onPress,
  style,
  padding = SPACING.lg,
  radius = RADIUS.xl,
}) => {
  const bg = GLASS[tier];
  const border = tier === 'tier1' ? GLASS.tier1Border : tier === 'tier2' ? GLASS.tier2Border : GLASS.tier3Border;

  const inner = (
    <View style={{ padding, overflow: 'hidden' }}>
      {/* glass shine sweep */}
      <LinearGradient
        colors={GRADIENT.glassShine}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );

  const wrapperStyle: StyleProp<ViewStyle> = [
    {
      borderRadius: radius,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: bg,
      shadowColor: NEON.purple,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 8,
      overflow: 'hidden',
    },
    style,
  ];

  // BlurView doesn't perform well on Android pre-Pie; fall back to plain bg.
  const useBlur = Platform.OS === 'ios';

  const content = useBlur ? (
    <BlurView intensity={intensity} tint="dark" style={{ borderRadius: radius, overflow: 'hidden' }}>
      {inner}
    </BlurView>
  ) : (
    inner
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={wrapperStyle}>
        {content}
      </PressableScale>
    );
  }
  return <View style={wrapperStyle}>{content}</View>;
};

// ============================================================
// Pressable with scale animation
// ============================================================
type PressableScaleProps = {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

export const PressableScale: React.FC<PressableScaleProps> = ({
  onPress,
  onLongPress,
  disabled,
  children,
  style,
  scaleTo = SCALE.press,
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 260 });
      }}
    >
      <Animated.View style={[animStyle, style, disabled && { opacity: 0.5 }]}>{children}</Animated.View>
    </Pressable>
  );
};

// ============================================================
// Buttons
// ============================================================
type ButtonSize = 'sm' | 'md' | 'lg';
type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

const btnHeight: Record<ButtonSize, number> = { sm: 40, md: 48, lg: 56 };

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading,
  disabled,
  size = 'lg',
  leftIcon,
  rightIcon,
  style,
  fullWidth = true,
}) => {
  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} style={[{ width: fullWidth ? '100%' : undefined }, style]}>
      <LinearGradient
        colors={GRADIENT.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: btnHeight[size],
          borderRadius: RADIUS.xl,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: SPACING.xl,
          shadowColor: NEON.glow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.55,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            {leftIcon ? <View style={{ marginRight: leftIcon ? SPACING.xs : 0 }}>{leftIcon}</View> : null}
            <Text
              numberOfLines={1}
              style={[
                size === 'sm' ? TYPE.buttonSm : TYPE.button,
                { color: '#FFF', flexShrink: 1 },
              ]}
            >
              {title}
            </Text>
            {rightIcon ? <View style={{ marginLeft: rightIcon ? SPACING.xs : 0 }}>{rightIcon}</View> : null}
          </>
        )}
      </LinearGradient>
    </PressableScale>
  );
};

export const GhostButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading,
  disabled,
  size = 'lg',
  leftIcon,
  rightIcon,
  style,
  fullWidth = true,
}) => (
  <PressableScale onPress={onPress} disabled={disabled || loading} style={[{ width: fullWidth ? '100%' : undefined }, style]}>
    <View
      style={{
        height: btnHeight[size],
        borderRadius: RADIUS.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
        backgroundColor: GLASS.tier1,
        borderWidth: 1,
        borderColor: GLASS.tier1Border,
      }}
    >
      {loading ? (
        <ActivityIndicator color={NEON.glow} />
      ) : (
        <>
          {leftIcon ? <View style={{ marginRight: leftIcon ? SPACING.xs : 0 }}>{leftIcon}</View> : null}
          <Text
            numberOfLines={1}
            style={[
              size === 'sm' ? TYPE.buttonSm : TYPE.button,
              { color: NEON.glow, flexShrink: 1 },
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={{ marginLeft: rightIcon ? SPACING.xs : 0 }}>{rightIcon}</View> : null}
        </>
      )}
    </View>
  </PressableScale>
);

type IconButtonProps = {
  icon: React.ReactNode;
  onPress: () => void;
  size?: number;
  bg?: string;
  style?: StyleProp<ViewStyle>;
};
export const IconButton: React.FC<IconButtonProps> = ({ icon, onPress, size = 44, bg = GLASS.tier1, style }) => (
  <PressableScale onPress={onPress} style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GLASS.tier1Border }, style]}>
    {icon}
  </PressableScale>
);

// Back-compat alias
export const GlassButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ title, onPress, variant = 'primary', loading, disabled, style }) => {
  if (variant === 'secondary') return <GhostButton title={title} onPress={onPress} loading={loading} disabled={disabled} style={style} />;
  return <PrimaryButton title={title} onPress={onPress} loading={loading} disabled={disabled} style={style} />;
};

// ============================================================
// Inputs
// ============================================================
type InputProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);
  const borderColor = errorText ? SEMANTIC.error : focused ? NEON.glow : GLASS.tier1Border;
  return (
    <View style={containerStyle}>
      {label ? <Text style={[TYPE.label, { color: TEXT.secondary, marginBottom: SPACING.xs }]}>{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: RADIUS.lg,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: GLASS.tier1,
          paddingHorizontal: SPACING.base,
          minHeight: 52,
          shadowColor: focused ? NEON.glow : 'transparent',
          shadowOpacity: focused ? 0.4 : 0,
          shadowRadius: focused ? 12 : 0,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        {leftIcon ? <View style={{ marginRight: SPACING.sm }}>{leftIcon}</View> : null}
        <TextInput
          style={[{ flex: 1, color: TEXT.primary, fontSize: 15, paddingVertical: SPACING.md }, style]}
          placeholderTextColor={TEXT.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {rightIcon ? <View style={{ marginLeft: SPACING.sm }}>{rightIcon}</View> : null}
      </View>
      {errorText ? (
        <Text style={[TYPE.caption, { color: SEMANTIC.error, marginTop: SPACING.xs }]}>{errorText}</Text>
      ) : helperText ? (
        <Text style={[TYPE.caption, { color: TEXT.tertiary, marginTop: SPACING.xs }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

// Back-compat: existing screens import GlassInput
export const GlassInput: React.FC<{
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  icon?: React.ReactNode;
  style?: any;
}> = ({ icon, style, ...rest }) => (
  <Input {...(rest as any)} leftIcon={icon} containerStyle={style} />
);

export const SearchBar: React.FC<{
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}> = ({ value, onChangeText, placeholder = 'Search', onSubmit }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: GLASS.tier1,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: GLASS.tier1Border,
      paddingHorizontal: SPACING.base,
      height: 48,
    }}
  >
    <SearchIcon size={18} color={TEXT.tertiary} />
    <TextInput
      style={{ flex: 1, color: TEXT.primary, fontSize: 15, marginLeft: SPACING.sm }}
      placeholder={placeholder}
      placeholderTextColor={TEXT.muted}
      value={value}
      onChangeText={onChangeText}
      returnKeyType="search"
      onSubmitEditing={onSubmit}
    />
    {value ? (
      <TouchableOpacity onPress={() => onChangeText('')}>
        <X size={18} color={TEXT.muted} />
      </TouchableOpacity>
    ) : null}
  </View>
);

// ============================================================
// Chips / Badges / Rating / Avatar
// ============================================================
type ChipProps = { label: string; selected?: boolean; onPress?: () => void; icon?: React.ReactNode };
export const Chip: React.FC<ChipProps> = ({ label, selected, onPress, icon }) => (
  <PressableScale onPress={onPress} style={{ marginRight: SPACING.sm, marginBottom: SPACING.sm }}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
        backgroundColor: selected ? NEON.purple : GLASS.tier2,
        borderWidth: 1,
        borderColor: selected ? NEON.glow : GLASS.tier2Border,
        shadowColor: selected ? NEON.glow : 'transparent',
        shadowOpacity: selected ? 0.5 : 0,
        shadowRadius: selected ? 10 : 0,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      {icon ? <View style={{ marginRight: SPACING.xs }}>{icon}</View> : null}
      <Text style={[TYPE.label, { color: selected ? '#FFF' : TEXT.secondary }]}>{label}</Text>
    </View>
  </PressableScale>
);

type BadgeTone = 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export const Badge: React.FC<{ label: string; tone?: BadgeTone; style?: StyleProp<ViewStyle> }> = ({ label, tone = 'brand', style }) => {
  const toneMap: Record<BadgeTone, { bg: string; fg: string }> = {
    brand: { bg: 'rgba(184, 61, 245, 0.22)', fg: NEON.glow },
    success: { bg: SEMANTIC.successSoft, fg: SEMANTIC.success },
    warning: { bg: SEMANTIC.warningSoft, fg: SEMANTIC.warning },
    error: { bg: SEMANTIC.errorSoft, fg: SEMANTIC.error },
    info: { bg: SEMANTIC.infoSoft, fg: SEMANTIC.info },
    neutral: { bg: GLASS.tier2, fg: TEXT.secondary },
  };
  const t = toneMap[tone];
  return (
    <View style={[{ paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, backgroundColor: t.bg, alignSelf: 'flex-start' }, style]}>
      <Text style={[TYPE.tiny, { color: t.fg }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

export const RatingStars: React.FC<{ value: number; size?: number; max?: number; onChange?: (v: number) => void }> = ({
  value,
  size = 16,
  max = 5,
  onChange,
}) => (
  <View style={{ flexDirection: 'row' }}>
    {Array.from({ length: max }).map((_, i) => {
      const filled = i < Math.round(value);
      const Comp: any = onChange ? TouchableOpacity : View;
      return (
        <Comp key={i} onPress={onChange ? () => onChange(i + 1) : undefined} style={{ marginRight: 2 }}>
          <Star size={size} color={filled ? '#FFB547' : 'rgba(239, 204, 250, 0.25)'} fill={filled ? '#FFB547' : 'transparent'} />
        </Comp>
      );
    })}
  </View>
);

export const Avatar: React.FC<{ name?: string; source?: ImageSourcePropType; size?: number }> = ({ name = '', source, size = 44 }) => {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: SURFACE.soft,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: GLASS.tier1Border,
      }}
    >
      {source ? (
        <Image source={source} style={{ width: size, height: size }} />
      ) : (
        <Text style={[TYPE.h4, { color: NEON.glow }]}>{initial}</Text>
      )}
    </View>
  );
};

// Respects `#ContactForPrice` masking rule from memory.
export const PriceTag: React.FC<{ value: number | string; suffix?: string; size?: 'sm' | 'md' | 'lg'; style?: StyleProp<TextStyle> }> = ({
  value,
  suffix = '',
  size = 'md',
  style,
}) => {
  const raw = typeof value === 'number' ? value.toString() : value;
  const hidden = typeof raw === 'string' && raw.includes('#ContactForPrice');
  if (hidden) {
    return <Text style={[TYPE.h4, { color: NEON.glow }, style]}>Contact for price</Text>;
  }
  const variant: TypeVariant = size === 'lg' ? 'numeric' : size === 'sm' ? 'h4' : 'h3';
  const numeric = typeof value === 'number' ? value : Number(raw);
  const pretty = isNaN(numeric) ? raw : `₹${numeric.toLocaleString('en-IN')}`;
  return (
    <Text style={[TYPE[variant], { color: NEON.glow }, style]}>
      {pretty}
      {suffix ? <Text style={[TYPE.bodySm, { color: TEXT.tertiary }]}> {suffix}</Text> : null}
    </Text>
  );
};

// ============================================================
// Screen chrome
// ============================================================
export const ScreenHeader: React.FC<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ title, subtitle, onBack, right, style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.base, paddingTop: SPACING.base, paddingBottom: SPACING.sm }, style]}>
    {onBack ? (
      <IconButton icon={<ChevronLeft size={22} color={TEXT.primary} />} onPress={onBack} size={40} />
    ) : (
      <View style={{ width: 40 }} />
    )}
    <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
      <Text style={TYPE.h3} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={[TYPE.caption, { color: TEXT.tertiary }]} numberOfLines={1}>{subtitle}</Text> : null}
    </View>
    {right ?? <View style={{ width: 40 }} />}
  </View>
);

export const EmptyState: React.FC<{
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, message, icon, action }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', padding: SPACING['2xl'] }}>
    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: GLASS.tier1, borderWidth: 1, borderColor: GLASS.tier1Border, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.base }}>
      {icon ?? <Inbox size={36} color={NEON.glow} />}
    </View>
    <Text style={[TYPE.h3, { textAlign: 'center' }]}>{title}</Text>
    {message ? <Text style={[TYPE.body, { color: TEXT.tertiary, textAlign: 'center', marginTop: SPACING.xs }]}>{message}</Text> : null}
    {action ? <View style={{ marginTop: SPACING.base }}>{action}</View> : null}
  </View>
);

export const Divider: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[{ height: 1, backgroundColor: GLASS.tier2Border, marginVertical: SPACING.sm }, style]} />
);

export const SectionTitle: React.FC<{ title: string; action?: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ title, action, style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }, style]}>
    <Text style={TYPE.h3}>{title}</Text>
    {action}
  </View>
);

// ============================================================
// App background gradient wrapper
// ============================================================
export const ScreenBackground: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => (
  <LinearGradient colors={GRADIENT.appBg} style={[{ flex: 1 }, style]}>
    {children}
  </LinearGradient>
);

// Re-export theme for convenience
export { BRAND, NEON, SURFACE, GLASS, TEXT, SEMANTIC, SHADOW, GRADIENT, COLORS, SIZES, SPACING, RADIUS, TYPE };
export { LIGHT_TOKENS as LIGHT };

// ============================================================
// Neumorphic Components — Dark Purple Extruded Design
// ============================================================

// NeuSurface constants
const N_BG = NEU_TOKENS.bg;           // #1D0A2E
const N_LIGHT = NEU_TOKENS.shadowLight; // #3D1260
const N_DARK = NEU_TOKENS.shadowDark;   // #07000E

type NeuDepth = 'raised' | 'flat' | 'pressed';

type NeuCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  depth?: NeuDepth;
  onPress?: () => void;
  accentBorder?: boolean;
  padding?: number;
};

/**
 * NeuCard — Neumorphic raised/pressed card
 * Double-wrapper technique: outer = light shadow, inner = dark shadow
 */
export const NeuCard: React.FC<NeuCardProps> = ({
  children,
  style,
  depth = 'raised',
  onPress,
  accentBorder = false,
  padding = SPACING.base,
}) => {
  const isPressed = depth === 'pressed';
  const isFlat = depth === 'flat';

  const outerShadow: ViewStyle = isFlat
    ? {}
    : isPressed
    ? {
        shadowColor: N_DARK,
        shadowOffset: { width: -3, height: -3 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
      }
    : {
        shadowColor: N_LIGHT,
        shadowOffset: { width: -5, height: -5 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
      };

  const innerShadow: ViewStyle = isFlat
    ? {}
    : isPressed
    ? {
        shadowColor: N_LIGHT,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      }
    : {
        shadowColor: N_DARK,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
      };

  const inner = (
    <View
      style={[
        innerShadow,
        {
          borderRadius: RADIUS.xl,
          backgroundColor: isPressed ? NEU_TOKENS.bgSubtle : N_BG,
          padding,
          borderWidth: accentBorder ? 1 : 0,
          borderColor: accentBorder ? `${NEON.purple}55` : 'transparent',
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  const wrapped = (
    <View style={[outerShadow, { borderRadius: RADIUS.xl }]}>
      {inner}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.85}>{wrapped}</TouchableOpacity>;
  }
  return wrapped;
};

// ─────────────────────────────────────────
// NeuButton
// ─────────────────────────────────────────
type NeuButtonVariant = 'primary' | 'ghost' | 'danger';
type NeuButtonProps = {
  title: string;
  onPress: () => void;
  variant?: NeuButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: ButtonSize;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const NeuButton: React.FC<NeuButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  leftIcon,
  rightIcon,
  size = 'lg',
  fullWidth = true,
  style,
}) => {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, SCALE) }],
  }));

  // Variant-based colors
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  const bgColor = isPrimary ? BRAND[600] : isGhost ? N_BG : '#3A0A14';
  const textColor = isPrimary ? '#FFF' : isGhost ? NEON.glow : SEMANTIC.error;
  const glowColor = isPrimary ? NEON.purple : isGhost ? `${NEON.glow}44` : SEMANTIC.error;

  return (
    <Animated.View style={[anim, { width: fullWidth ? '100%' : undefined }]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => { pressed.value = 1; }}
        onPressOut={() => { pressed.value = 0; }}
        activeOpacity={0.9}
      >
        {/* Outer: light top-left shadow */}
        <View
          style={{
            borderRadius: RADIUS.xl,
            shadowColor: isPrimary ? NEON.purple : N_LIGHT,
            shadowOffset: { width: -4, height: -4 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
          }}
        >
          {/* Inner: dark bottom-right shadow */}
          <View
            style={[
              {
                height: btnHeight[size],
                borderRadius: RADIUS.xl,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: SPACING.xl,
                backgroundColor: disabled ? `${bgColor}66` : bgColor,
                shadowColor: N_DARK,
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.9,
                shadowRadius: 8,
                // Android elevation
                elevation: isPrimary ? 8 : 4,
                // Subtle glow on primary
                borderWidth: isPrimary ? 1 : isGhost ? 1 : 0,
                borderColor: isPrimary ? `${glowColor}66` : isGhost ? `${NEON.glow}33` : 'transparent',
              },
              style,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={textColor} />
            ) : (
              <>
                {leftIcon ? <View style={{ marginRight: SPACING.xs }}>{leftIcon}</View> : null}
                <Text
                  numberOfLines={1}
                  style={[
                    size === 'sm' ? TYPE.buttonSm : TYPE.button,
                    { color: textColor, flexShrink: 1 },
                  ]}
                >
                  {title}
                </Text>
                {rightIcon ? <View style={{ marginLeft: SPACING.xs }}>{rightIcon}</View> : null}
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────
// NeuInput — Underline neumorphic input
// ─────────────────────────────────────────
type NeuInputProps = TextInputProps & {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  errorText?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const NeuInput: React.FC<NeuInputProps> = ({
  label,
  leftIcon,
  rightIcon,
  errorText,
  containerStyle,
  style,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[{ marginBottom: SPACING.md }, containerStyle]}>
      {label ? (
        <Text
          style={[
            TYPE.label,
            {
              color: focused ? NEON.glow : TEXT.tertiary,
              marginBottom: SPACING.xs,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      {/* Neumorphic inset input container */}
      <View
        style={[{
          borderRadius: RADIUS.lg,
          // outer light shadow (top-left)
          shadowColor: N_LIGHT,
          shadowOffset: { width: -3, height: -3 },
          shadowOpacity: focused ? 0.5 : 0.3,
          shadowRadius: 8,
        }]}
      >
        <View
          style={[{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: RADIUS.lg,
            backgroundColor: NEU_TOKENS.bgSubtle, // pressed = inset
            paddingHorizontal: SPACING.base,
            paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 0,
            minHeight: 52,
            // inner dark shadow (bottom-right) — pressed look
            shadowColor: N_DARK,
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 0.9,
            shadowRadius: 8,
            // Accent underline
            borderBottomWidth: 2,
            borderBottomColor: focused ? NEON.glow : `${NEON.purple}44`,
            borderTopWidth: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            elevation: 0,
          }]}
        >
          {leftIcon ? <View style={{ marginRight: SPACING.sm }}>{leftIcon}</View> : null}
          <TextInput
            {...rest}
            onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
            style={[
              TYPE.body,
              {
                flex: 1,
                color: TEXT.primary,
                paddingVertical: Platform.OS === 'android' ? SPACING.sm : 0,
              },
              style,
            ]}
            placeholderTextColor={TEXT.muted}
          />
          {rightIcon ? <View style={{ marginLeft: SPACING.sm }}>{rightIcon}</View> : null}
        </View>
      </View>
      {errorText ? (
        <Text style={[TYPE.caption, { color: SEMANTIC.error, marginTop: SPACING.xs }]}>{errorText}</Text>
      ) : null}
    </View>
  );
};

// ─────────────────────────────────────────
// NeuCircle — neumorphic icon circle (like the reference home icon)
// ─────────────────────────────────────────
type NeuCircleProps = {
  children: React.ReactNode;
  size?: number;
  accentGlow?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const NeuCircle: React.FC<NeuCircleProps> = ({ children, size = 96, accentGlow = false, style }) => (
  <View
    style={[{
      borderRadius: size / 2,
      shadowColor: N_LIGHT,
      shadowOffset: { width: -6, height: -6 },
      shadowOpacity: 0.65,
      shadowRadius: 12,
    }, style]}
  >
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: N_BG,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: N_DARK,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
        borderWidth: accentGlow ? 1.5 : 0,
        borderColor: accentGlow ? `${NEON.purple}66` : 'transparent',
        elevation: 10,
      }}
    >
      {children}
    </View>
  </View>
);

// Re-export NEU tokens for screens to use
export { NEU_TOKENS as NEU };

// ============================================================
// LIGHT THEME COMPONENTS — for INNER pages (greyish-purple)
// Reference: middle + right phone screens (smart home app)
// Clean, flat, minimal shadows, rounded corners.
// ============================================================

/**
 * LightScreenBackground — soft greyish-purple gradient for inner pages.
 * Use this instead of <ScreenBackground> on Home, Categories, Cart, Orders, Profile.
 */
export const LightScreenBackground: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => (
  <LinearGradient colors={LIGHT_GRADIENT} style={[{ flex: 1 }, style]}>
    {children}
  </LinearGradient>
);

/**
 * OutlineCircle — thin-bordered circle for icons (matches reference login).
 * No neumorphic shadows, just a clean 1.5px purple border.
 */
export const OutlineCircle: React.FC<{
  children: React.ReactNode;
  size?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}> = ({ children, size = 96, borderColor, style }) => (
  <View
    style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: borderColor ?? 'rgba(247, 217, 255, 0.32)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      },
      style,
    ]}
  >
    {children}
  </View>
);

/**
 * UnderlineInput — minimal underline input for login/register.
 * Just a label on top and a bottom border — NO box/shadow.
 */
type UnderlineInputProps = TextInputProps & {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  errorText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  dark?: boolean; // true = light-on-dark (auth), false = dark-on-light (inner)
};

export const UnderlineInput: React.FC<UnderlineInputProps> = ({
  label,
  leftIcon,
  rightIcon,
  errorText,
  containerStyle,
  style,
  dark = true,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);
  const labelColor = dark ? 'rgba(247, 217, 255, 0.55)' : LIGHT_TOKENS.textTertiary;
  const textColor = dark ? '#F4EFF7' : LIGHT_TOKENS.text;
  const placeholderColor = dark ? 'rgba(247, 217, 255, 0.35)' : LIGHT_TOKENS.textMuted;
  const underlineColor = focused
    ? (dark ? NEON.glow : LIGHT_TOKENS.accent)
    : (dark ? 'rgba(247, 217, 255, 0.22)' : LIGHT_TOKENS.border);

  return (
    <View style={[{ marginBottom: SPACING.lg }, containerStyle]}>
      {label ? (
        <Text
          style={[
            TYPE.tiny,
            {
              color: labelColor,
              marginBottom: SPACING.xs,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontWeight: '600',
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1.5,
          borderBottomColor: underlineColor,
          paddingVertical: SPACING.sm,
        }}
      >
        {leftIcon ? <View style={{ marginRight: SPACING.sm }}>{leftIcon}</View> : null}
        <TextInput
          {...rest}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          style={[
            {
              flex: 1,
              color: textColor,
              fontSize: 16,
              paddingVertical: Platform.OS === 'android' ? 4 : 0,
            },
            style,
          ]}
          placeholderTextColor={placeholderColor}
        />
        {rightIcon ? <View style={{ marginLeft: SPACING.sm }}>{rightIcon}</View> : null}
      </View>
      {errorText ? (
        <Text style={[TYPE.caption, { color: SEMANTIC.error, marginTop: SPACING.xs }]}>{errorText}</Text>
      ) : null}
    </View>
  );
};

/**
 * BlackButton — solid black rounded pill button matching reference SIGN IN.
 * No gradient, no shadow, just pure black with white text.
 */
type BlackButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const BlackButton: React.FC<BlackButtonProps> = ({
  title,
  onPress,
  loading,
  disabled,
  size = 'lg',
  leftIcon,
  rightIcon,
  fullWidth = true,
  style,
}) => (
  <PressableScale
    onPress={onPress}
    disabled={disabled || loading}
    style={[{ width: fullWidth ? '100%' : undefined }, style]}
  >
    <View
      style={{
        height: btnHeight[size],
        borderRadius: btnHeight[size] / 2,
        backgroundColor: disabled ? '#2A1E3A' : LIGHT_TOKENS.btnBlack,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <>
          {leftIcon ? <View style={{ marginRight: SPACING.sm }}>{leftIcon}</View> : null}
          <Text
            numberOfLines={1}
            style={[
              size === 'sm' ? TYPE.buttonSm : TYPE.button,
              { color: '#FFF', letterSpacing: 2, flexShrink: 1 },
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={{ marginLeft: SPACING.sm }}>{rightIcon}</View> : null}
        </>
      )}
    </View>
  </PressableScale>
);

/**
 * LightCard — clean white card for inner light pages. No heavy shadow.
 */
export const LightCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
  tinted?: boolean; // use cardSoft instead of pure white
}> = ({ children, onPress, style, padding = SPACING.base, radius = RADIUS.xl, tinted = false }) => {
  const body = (
    <View
      style={[
        {
          backgroundColor: tinted ? LIGHT_TOKENS.cardSoft : LIGHT_TOKENS.card,
          borderRadius: radius,
          padding,
          borderWidth: 1,
          borderColor: LIGHT_TOKENS.border,
          // extremely subtle shadow
          shadowColor: '#3A2055',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (onPress) {
    return (
      <PressableScale onPress={onPress}>{body}</PressableScale>
    );
  }
  return body;
};

/**
 * FlatTile — category tile for inner pages. Flat, no blur, clean icon.
 */
export const FlatTile: React.FC<{
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
  tint?: string;
  size?: number;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ label, icon, onPress, tint = LIGHT_TOKENS.accent, size = 86, selected = false, style }) => (
  <PressableScale onPress={onPress}>
    <View
      style={[
        {
          width: size,
          alignItems: 'center',
          paddingVertical: SPACING.sm,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          backgroundColor: selected ? tint : `${tint}14`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.xs,
          borderWidth: selected ? 0 : 1,
          borderColor: `${tint}22`,
        }}
      >
        {icon}
      </View>
      <Text
        numberOfLines={1}
        style={[
          TYPE.tiny,
          {
            color: selected ? tint : LIGHT_TOKENS.textSecondary,
            fontWeight: selected ? '700' : '600',
            textAlign: 'center',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  </PressableScale>
);

/**
 * LightHeader — header for inner light pages.
 */
export const LightHeader: React.FC<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ title, subtitle, onBack, right, style }) => (
  <View
    style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingTop: SPACING.base,
        paddingBottom: SPACING.sm,
      },
      style,
    ]}
  >
    {onBack ? (
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: LIGHT_TOKENS.card,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: LIGHT_TOKENS.border,
        }}
      >
        <ChevronLeft size={22} color={LIGHT_TOKENS.text} />
      </TouchableOpacity>
    ) : (
      <View style={{ width: 40 }} />
    )}
    <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
      <Text
        numberOfLines={1}
        style={[TYPE.h3, { color: LIGHT_TOKENS.text, letterSpacing: 0.5 }]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          numberOfLines={1}
          style={[TYPE.caption, { color: LIGHT_TOKENS.textTertiary }]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
    {right ?? <View style={{ width: 40 }} />}
  </View>
);

/**
 * LightSearchBar — clean search bar for light inner pages.
 */
export const LightSearchBar: React.FC<{
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ value, onChangeText, placeholder = 'Search', onSubmit, style }) => (
  <View
    style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: LIGHT_TOKENS.card,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: LIGHT_TOKENS.border,
        paddingHorizontal: SPACING.base,
        height: 48,
      },
      style,
    ]}
  >
    <SearchIcon size={18} color={LIGHT_TOKENS.textTertiary} />
    <TextInput
      style={{
        flex: 1,
        color: LIGHT_TOKENS.text,
        fontSize: 15,
        marginLeft: SPACING.sm,
      }}
      placeholder={placeholder}
      placeholderTextColor={LIGHT_TOKENS.textMuted}
      value={value}
      onChangeText={onChangeText}
      returnKeyType="search"
      onSubmitEditing={onSubmit}
    />
    {value ? (
      <TouchableOpacity onPress={() => onChangeText('')}>
        <X size={18} color={LIGHT_TOKENS.textMuted} />
      </TouchableOpacity>
    ) : null}
  </View>
);

