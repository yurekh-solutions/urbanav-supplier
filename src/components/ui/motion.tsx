// Animated primitives - Reanimated v4 only (no moti)
import React, { useEffect } from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing as REasing,
} from 'react-native-reanimated';
import { DURATION, STAGGER } from '../../theme/animations';
import { BRAND, SURFACE } from '../../theme/colors';
import { RADIUS } from '../../theme/spacing';

type MotionProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
  distance?: number;
};

export const FadeInView: React.FC<MotionProps> = ({ children, style, delay = 0, duration = DURATION.base }) => {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration, delay });
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
};

export const SlideUpView: React.FC<MotionProps> = ({ children, style, delay = 0, duration = DURATION.base, distance = 18 }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);
  useEffect(() => {
    opacity.value = withTiming(1, { duration, delay });
    translateY.value = withTiming(0, { duration, delay });
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
};

export const ScaleInView: React.FC<MotionProps> = ({ children, style, delay = 0, duration = DURATION.base }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  useEffect(() => {
    opacity.value = withTiming(1, { duration, delay });
    scale.value = withTiming(1, { duration, delay });
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
};

type StaggeredListProps = {
  children: React.ReactNode[];
  stagger?: number;
  initialDelay?: number;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
};

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  stagger = STAGGER.base,
  initialDelay = 0,
  style,
  itemStyle,
}) => {
  const items = React.Children.toArray(children);
  return (
    <View style={style}>
      {items.map((child, i) => (
        <SlideUpView key={i} delay={initialDelay + i * stagger} style={itemStyle}>
          {child as any}
        </SlideUpView>
      ))}
    </View>
  );
};

// Shimmering skeleton - pure Reanimated, no paid libs.
type SkeletonProps = { width?: number | string; height?: number; radius?: number; style?: StyleProp<ViewStyle> };
export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, radius = RADIUS.sm, style }) => {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1100, easing: REasing.inOut(REasing.ease) }),
      -1,
      false
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: 0.4 + 0.5 * Math.abs(Math.sin(shimmer.value * Math.PI)) }));
  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: SURFACE.muted,
        },
        animStyle,
        style,
      ]}
    />
  );
};

// Success checkmark - pure SVG+Reanimated (no Lottie).
import Svg, { Path, Circle } from 'react-native-svg';
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const SuccessCheck: React.FC<{ size?: number; color?: string }> = ({ size = 72, color = BRAND[500] }) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: 260, easing: REasing.out(REasing.ease) }),
      withTiming(1, { duration: 40 })
    );
  }, []);
  const circleStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scale: 0.8 + 0.2 * progress.value }] }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <AnimatedCircle cx={24} cy={24} r={22} fill={color} style={circleStyle as any} />
        <AnimatedPath
          d="M14 24 L22 31 L34 17"
          stroke="#FFFFFF"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={checkStyle as any}
        />
      </Svg>
    </View>
  );
};

// Tab bar icon bounce
export const TabBounce: React.FC<{ focused: boolean; children: React.ReactNode }> = ({ focused, children }) => {
  const scale = useSharedValue(focused ? 1.15 : 1);
  const translateY = useSharedValue(focused ? -2 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 180 });
    translateY.value = withSpring(focused ? -2 : 0, { damping: 12, stiffness: 180 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      {children}
    </Animated.View>
  );
};

export const motionStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
