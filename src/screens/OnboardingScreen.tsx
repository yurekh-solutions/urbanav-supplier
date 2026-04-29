import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Package,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Star,
} from 'lucide-react-native';
import { GRADIENT, GLASS, NEON, TEXT } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { useAuthStore } from '../store';

const LOGO = require('../../assets/logo.jpg');

const { width } = Dimensions.get('window');

// Step data
const STEPS = [
  {
    key: 'list',
    number: '01',
    title: 'List Your AV Inventory',
    body: 'Add projectors, speakers, LED walls, lighting and more. Set your own prices and availability for every item.',
    Icon: Package,
    accent: '#7B25F4',
    gradientFrom: 'rgba(123, 37, 244, 0.12)',
    gradientTo: 'rgba(123, 37, 244, 0.04)',
  },
  {
    key: 'verify',
    number: '02',
    title: 'Get Verified by Admin',
    body: 'Submit your GST, PAN and business details. Admin reviews and approves your account before you can start.',
    Icon: ShieldCheck,
    accent: '#E14D8A',
    gradientFrom: 'rgba(225, 77, 138, 0.12)',
    gradientTo: 'rgba(225, 77, 138, 0.04)',
  },
  {
    key: 'earn',
    number: '03',
    title: 'Accept Bookings & Earn',
    body: 'Receive buyer inquiries, quote your best price, and manage OTP-secured orders from a single dashboard.',
    Icon: TrendingUp,
    accent: '#22E082',
    gradientFrom: 'rgba(34, 224, 130, 0.10)',
    gradientTo: 'rgba(34, 224, 130, 0.03)',
  },
];

// Feature bullets per step
const BULLETS: Record<string, string[]> = {
  list: ['Add unlimited equipment', 'Set daily rental price', 'Upload photos & specs'],
  verify: ['GST & PAN verification', 'Business address', 'Bank account for payouts'],
  earn: ['Real-time buyer inquiries', 'Order management with OTP', 'Earnings dashboard'],
};

export default function OnboardingScreen({ navigation }: any) {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const { completeOnboarding } = useAuthStore();

  // Animated progress bar — smooth width interpolation across steps.
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (page + 1) / STEPS.length,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [page]);

  const goTo = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
    setPage(idx);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / width);
    if (idx !== page) setPage(idx);
  };

  const handleNext = async () => {
    if (page < STEPS.length - 1) {
      goTo(page + 1);
    } else {
      await completeOnboarding();
      navigation.replace('Register');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigation.replace('Login');
  };

  const step = STEPS[page];
  const IconComp = step.Icon;

  return (
    <LinearGradient colors={GRADIENT.appBg as string[]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Header ─────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <View>
              <Text style={styles.appName}>UrbanAV</Text>
              <Text style={styles.appSub}>Supplier Portal</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* ── Step counter + animated progress bar ── */}
        <View style={styles.stepCounter}>
          <Text style={styles.stepNumber}>STEP {step.number}</Text>
          <Text style={styles.stepOf}>{page + 1} of {STEPS.length}</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={[NEON.violet, NEON.glow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* ── Horizontal scroll ─────────────────── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {STEPS.map((s, idx) => {
            const IconC = s.Icon;
            return (
              <View key={s.key} style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                {/* Icon container with glow */}
                <View style={[styles.iconRingOuter, { borderColor: `${s.accent}22` }]}>
                  <View style={[styles.iconRingMid, { backgroundColor: `${s.accent}15` }]}>
                    <View style={[styles.iconCircle, { backgroundColor: `${s.accent}22` }]}>
                      <IconC size={48} color={s.accent} strokeWidth={1.5} />
                    </View>
                  </View>
                </View>

                {/* Step number tag */}
                <View style={[styles.stepTag, { borderColor: `${s.accent}55`, backgroundColor: `${s.accent}14` }]}>
                  <Text style={[styles.stepTagText, { color: s.accent }]}>STEP {s.number}</Text>
                </View>

                {/* Title */}
                <Text style={styles.slideTitle}>{s.title}</Text>

                {/* Body */}
                <Text style={styles.slideBody}>{s.body}</Text>

                {/* Feature bullets */}
                {(BULLETS[s.key] || []).map((b, bi) => (
                  <View key={bi} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: s.accent }]} />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>

        {/* ── Bottom CTA ────────────────────────── */}
        <View style={styles.bottom}>
          {/* Dot indicators */}
          <View style={styles.dotRow}>
            {STEPS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
                <View style={[
                  styles.indicatorDot,
                  i === page
                    ? { backgroundColor: NEON.glow, width: 24 }
                    : i < page
                    ? { backgroundColor: 'rgba(230, 102, 255, 0.5)', width: 12 }
                    : { backgroundColor: 'rgba(247, 217, 255, 0.2)', width: 12 },
                ]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Primary button */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            style={styles.ctaBtn}
          >
            <LinearGradient
              colors={GRADIENT.brand as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaBtnInner}
            >
              <Text style={styles.ctaBtnText}>
                {page === STEPS.length - 1 ? 'CREATE SUPPLIER ACCOUNT' : 'NEXT'}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Already have account */}
          {page === STEPS.length - 1 && (
            <TouchableOpacity onPress={handleSkip} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={styles.alreadyText}>I already have an account</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.14)',
    overflow: 'hidden',
    backgroundColor: 'rgba(247, 217, 255, 0.06)',
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F4EFF7',
    letterSpacing: -0.3,
  },
  appSub: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(230, 102, 255, 0.8)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(247, 217, 255, 0.45)',
    letterSpacing: 0.5,
  },
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 24,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: NEON.glow,
    letterSpacing: 2,
  },
  progressDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: NEON.glow, width: 20 },
  dotDone: { backgroundColor: 'rgba(230, 102, 255, 0.5)' },
  dotIdle: { backgroundColor: 'rgba(247, 217, 255, 0.15)' },
  stepOf: {
    fontSize: 11,
    color: 'rgba(247, 217, 255, 0.35)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  iconRingOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  iconRingMid: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
  },
  progressTrack: {
    marginHorizontal: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(247, 217, 255, 0.08)',
    borderWidth: 1,
    borderColor: GLASS.tier2Border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stepTag: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 16,
  },
  stepTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 12,
  },
  slideBody: {
    fontSize: 14,
    color: 'rgba(247, 217, 255, 0.55)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletText: {
    fontSize: 13,
    color: 'rgba(247, 217, 255, 0.5)',
    fontWeight: '500',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 20,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  indicatorDot: {
    height: 8,
    borderRadius: 4,
  },
  ctaBtn: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    overflow: 'hidden',
  },
  ctaBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  alreadyText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(247, 217, 255, 0.4)',
    textDecorationLine: 'underline',
  },
});