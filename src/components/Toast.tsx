import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XCircle, CheckCircle2, Info } from 'lucide-react-native';

export type ToastType = 'error' | 'success' | 'info';

interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  onHide: () => void;
  duration?: number;
}

const { width: SCREEN_W } = Dimensions.get('window');

const TYPE_CONFIG = {
  error: {
    bg: 'rgba(220, 38, 38, 0.96)',
    border: 'rgba(255, 100, 100, 0.6)',
    Icon: XCircle,
    iconColor: '#FFFFFF',
  },
  success: {
    bg: 'rgba(22, 163, 74, 0.96)',
    border: 'rgba(100, 230, 140, 0.6)',
    Icon: CheckCircle2,
    iconColor: '#FFFFFF',
  },
  info: {
    bg: 'rgba(37, 99, 235, 0.96)',
    border: 'rgba(100, 160, 255, 0.6)',
    Icon: Info,
    iconColor: '#FFFFFF',
  },
};

function ToastItem({ visible, message, type, onHide, duration = 3500 }: ToastProps) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      timerRef.current = setTimeout(() => {
        hide();
      }, duration);
    } else {
      hide();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, message]);

  if (!visible) return null;

  const config = TYPE_CONFIG[type];
  const { Icon } = config;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: insets.top + 6,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hide}
        style={[styles.toast, { backgroundColor: config.bg, borderColor: config.border }]}
      >
        <View style={styles.iconWrap}>
          <Icon size={18} color={config.iconColor} strokeWidth={2.2} />
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default ToastItem;
export type { ToastConfig };

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
    maxWidth: SCREEN_W - 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 19,
    letterSpacing: 0.1,
  },
});
