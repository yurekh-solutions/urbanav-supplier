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
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  UserPlus,
  FileText,
  ShieldCheck,
  Store,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { GRADIENT, GLASS, NEON } from '../theme/colors';
import { useAuthStore } from '../store';

const LOGO = require('../../assets/logo.jpg');

const STEPS = [
  {
    key: 'register',
    number: '01',
    title: 'Create Your Account',
    body: 'Fill in your business details, contact info, and service area to get started as a supplier on UrbanAV.',
    Icon: UserPlus,
    accent: '#7B25F4',
    bullets: ['Business name & contact', 'GST & PAN details', 'Service area & pincode'],
  },
  {
    key: 'documents',
    number: '02',
    title: 'Upload Documents',
    body: 'Submit your KYC documents for verification. Our team reviews each application carefully.',
    Icon: FileText,
    accent: '#E14D8A',
    bullets: ['PAN Card (Required)', 'Bank Proof (Required)', 'GST / Business Licence'],
  },
  {
    key: 'approval',
    number: '03',
    title: 'Admin Review & Approval',
    body: 'Our admin team verifies your documents and business details. Approval typically takes 24\u201348 hours.',
    Icon: ShieldCheck,
    accent: '#E666FF',
    bullets: ['Document verification', 'Business detail check', 'Email notification on approval'],
  },
  {
    key: 'sell',
    number: '04',
    title: 'Start Listing & Earning',
    body: 'Once approved, list your AV equipment, receive buyer inquiries, and manage orders from your dashboard.',
    Icon: Store,
    accent: '#22E082',
    bullets: ['List unlimited equipment', 'Receive buyer inquiries', 'Manage orders & earnings'],
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const { completeOnboarding } = useAuthStore();

  const { width, height } = useWindowDimensions();
  const isCompact = height < 700;
  const isNarrow = width < 380;
  const slideMaxWidth = Math.min(width, 480);

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (page + 1) / STEPS.length,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [page]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: page * width, animated: false });
  }, [width]);

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
      navigation.replace('Login');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigation.replace('Login');
  };

  const step = STEPS[page];

  return (
    <LinearGradient colors={GRADIENT.appBg} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
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

        {/* Progress */}
        <View style={styles.progressSection}>
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
        </View>

        {/* Horizontal scroll */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {STEPS.map((s) => {
            const IconC = s.Icon;
            const ringSize = isCompact ? 110 : isNarrow ? 120 : 140;
            const iconSize = isCompact ? 44 : isNarrow ? 48 : 56;

            return (
              <ScrollView
                key={s.key}
                style={{ width }}
                contentContainerStyle={{
                  flexGrow: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: isNarrow ? 20 : 28,
                  paddingVertical: 12,
                }}
                showsVerticalScrollIndicator={false}
              >
                <View style={{ width: '100%', maxWidth: slideMaxWidth, alignItems: 'center' }}>

                  {/* Icon with glow ring */}
                  <View style={{
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    backgroundColor: `${s.accent}12`,
                    borderWidth: 1.5,
                    borderColor: `${s.accent}30`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                    <View style={{
                      width: ringSize * 0.72,
                      height: ringSize * 0.72,
                      borderRadius: (ringSize * 0.72) / 2,
                      backgroundColor: `${s.accent}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <IconC size={iconSize} color={s.accent} strokeWidth={1.5} />
                    </View>
                  </View>

                  {/* Step tag */}
                  <View style={[styles.stepTag, { borderColor: `${s.accent}55`, backgroundColor: `${s.accent}14` }]}>
                    <Text style={[styles.stepTagText, { color: s.accent }]}>STEP {s.number}</Text>
                  </View>

                  {/* Title */}
                  <Text style={[styles.slideTitle, isNarrow && { fontSize: 22, lineHeight: 28 }]}>
                    {s.title}
                  </Text>

                  {/* Body */}
                  <Text style={[styles.slideBody, isNarrow && { fontSize: 13, lineHeight: 20 }]}>
                    {s.body}
                  </Text>

                  {/* Feature bullets — card style */}
                  <View style={styles.bulletCard}>
                    {(s.bullets || []).map((b, bi) => (
                      <View key={bi} style={styles.bulletRow}>
                        <CheckCircle2 size={14} color={s.accent} strokeWidth={2.2} />
                        <Text style={styles.bulletText}>{b}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Admin approval notice — only on approval step */}
                  {s.key === 'approval' ? (
                    <View style={styles.importantNote}>
                      <View style={styles.noteIconWrap}>
                        <AlertCircle size={18} color="#60A5FA" strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.noteTitle}>Important Note</Text>
                        <Text style={styles.noteText}>
                          You can only sign in after your supplier application is approved by admin. We'll notify you via email once verified.
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            );
          })}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottom}>
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

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            style={styles.ctaBtn}
          >
            <LinearGradient
              colors={GRADIENT.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.ctaBtnInner}>
              <Text style={styles.ctaBtnText}>
                {page === STEPS.length - 1 ? 'CREATE SUPPLIER ACCOUNT' : 'NEXT'}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          {page === STEPS.length - 1 && (
            <TouchableOpacity onPress={handleSkip} style={{ marginTop: 14, alignItems: 'center' }}>
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
  progressSection: {
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: NEON.glow,
    letterSpacing: 2,
  },
  stepOf: {
    fontSize: 11,
    color: 'rgba(247, 217, 255, 0.35)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(247, 217, 255, 0.08)',
    borderWidth: 1,
    borderColor: GLASS.tier2Border,
    overflow: 'hidden',
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
    marginBottom: 10,
  },
  slideBody: {
    fontSize: 14,
    color: 'rgba(247, 217, 255, 0.55)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  bulletCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(247, 217, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 13,
    color: 'rgba(247, 217, 255, 0.65)',
    fontWeight: '500',
  },
  importantNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
    borderRadius: 14,
    padding: 14,
    alignSelf: 'stretch',
  },
  noteIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#93C5FD',
    marginBottom: 3,
  },
  noteText: {
    fontSize: 12,
    color: 'rgba(147, 197, 253, 0.8)',
    lineHeight: 18,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 18,
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(247, 217, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
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
