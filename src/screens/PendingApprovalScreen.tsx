import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShieldCheck,
  Clock,
  Mail,
  CheckCircle2,
  FileText,
  HelpCircle,
  Lock,
  Users,
  Send,
} from 'lucide-react-native';
import { GRADIENT, GLASS, NEON, TEXT, SEMANTIC } from '../theme/colors';

const LOGO = require('../../assets/logo.jpg');

/**
 * Admin-approval pending screen. Shown immediately after a supplier submits
 * their registration + KYC documents. The account is not yet active — the
 * user must wait for admin verification before signing in.
 */
export default function PendingApprovalScreen({ navigation, route }: any) {
  const email: string | undefined = route?.params?.email;
  const kycUploaded: boolean = route?.params?.kycUploaded !== false;

  // Gentle pulse on the success checkmark
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <LinearGradient colors={GRADIENT.appBg} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ✅ APPLICATION SUBMITTED — Success confirmation UI */}
          <View style={styles.successWrap}>
            <Animated.View
              style={[
                styles.successGlow,
                { transform: [{ scale }], opacity: glowOpacity },
              ]}
            />
            <View style={styles.successIconBox}>
              <CheckCircle2 size={44} color="#22E082" strokeWidth={2} />
            </View>
          </View>

          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your supplier application has been sent to our admin team for review.
          </Text>

          {/* Status pill */}
          <View style={styles.statusPill}>
            <Send size={13} color={SEMANTIC.warning} strokeWidth={2.2} />
            <Text style={styles.statusPillText}>Awaiting admin approval</Text>
          </View>

          {/* Brand header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <Text style={styles.appName}>UrbanAV</Text>
            <Text style={styles.appSub}>Supplier Portal</Text>
          </View>

          {/* ✨ "Why am I seeing this screen?" — explains to the supplier exactly
              why admin approval is mandatory and why they can't sign in yet. */}
          <View style={styles.whyCard}>
            <View style={styles.whyHeader}>
              <View style={styles.whyIconCircle}>
                <HelpCircle size={16} color={NEON.glow} strokeWidth={2.2} />
              </View>
              <Text style={styles.whyHeaderText}>Why am I seeing this screen?</Text>
            </View>

            <View style={styles.whyRow}>
              <View style={styles.whyDot}>
                <ShieldCheck size={13} color={NEON.glow} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whyRowTitle}>Trust & safety for buyers</Text>
                <Text style={styles.whyRowText}>
                  Every supplier on UrbanAV is manually verified so buyers can
                  rent equipment confidently. This protects both sides from
                  fraud and low-quality listings.
                </Text>
              </View>
            </View>

            <View style={styles.whyRow}>
              <View style={styles.whyDot}>
                <FileText size={13} color={NEON.glow} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whyRowTitle}>
                  {kycUploaded
                    ? 'Your KYC documents are under review'
                    : 'Your KYC documents are not uploaded yet'}
                </Text>
                <Text style={styles.whyRowText}>
                  {kycUploaded
                    ? 'Admin is checking your PAN, Bank Proof, Aadhaar and GST / licence documents against your business details. Approval usually takes 24–48 hours.'
                    : 'Your account was created, but documents are still missing. Once you sign in after approval, upload them from “My Documents”. Admin cannot approve you without valid PAN and Bank Proof.'}
                </Text>
              </View>
            </View>

            <View style={styles.whyRow}>
              <View style={styles.whyDot}>
                <Lock size={13} color={NEON.glow} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whyRowTitle}>Sign-in is locked until approval</Text>
                <Text style={styles.whyRowText}>
                  Your login is intentionally blocked right now. The moment
                  admin approves your account, you'll be able to sign in and
                  start listing equipment, accepting inquiries and receiving
                  orders.
                </Text>
              </View>
            </View>

            <View style={styles.whyRow}>
              <View style={styles.whyDot}>
                <Users size={13} color={NEON.glow} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whyRowTitle}>What should I do now?</Text>
                <Text style={styles.whyRowText}>
                  Nothing is required from your side — just wait for our
                  approval email. If admin needs clarification on any document,
                  we'll reach out at{' '}
                  <Text style={{ color: NEON.glow, fontWeight: '700' }}>
                    {email || 'your registered email'}
                  </Text>
                  .
                </Text>
              </View>
            </View>
          </View>

          {/* Info card: what happens next */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What happens next</Text>

            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, styles.timelineDotDone]}>
                <CheckCircle2 size={14} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>Application submitted</Text>
                <Text style={styles.timelineSub}>
                  Your details and documents are with our verification team.
                </Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, styles.timelineDotActive]}>
                <Clock size={13} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>Admin review (24–48 hrs)</Text>
                <Text style={styles.timelineSub}>
                  Admin verifies your PAN, Bank Proof, Aadhaar and GST
                  documents. If anything is unclear, we may ask for a fresh
                  upload.
                </Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineDot}>
                <Mail size={13} color={TEXT.tertiary} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>Approval email</Text>
                <Text style={styles.timelineSub}>
                  {email
                    ? `We'll notify you at ${email} the moment your account is approved.`
                    : "We'll send an email the moment your account is approved."}
                </Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineDot}>
                <FileText size={13} color={TEXT.tertiary} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>Start listing equipment</Text>
                <Text style={styles.timelineSub}>
                  After approval, sign in to list AV equipment and accept
                  bookings.
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.helpText}>
            Need help? Contact{' '}
            <Text style={{ color: NEON.glow }}>support@urbanav.in</Text>
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  // ✅ Application Submitted success UI
  successWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: 8,
  },
  successGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(34, 224, 130, 0.20)',
  },
  successIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 224, 130, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(34, 224, 130, 0.50)',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#22E082',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: 'rgba(247, 217, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  appName: { fontSize: 18, fontWeight: '800', color: TEXT.primary, letterSpacing: -0.3 },
  appSub: {
    fontSize: 10,
    fontWeight: '700',
    color: NEON.glow,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statusPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 71, 0.45)',
    backgroundColor: 'rgba(255, 191, 71, 0.12)',
    marginBottom: 24,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: SEMANTIC.warning,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GLASS.tier2Border,
    backgroundColor: GLASS.tier3,
    padding: 18,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: TEXT.primary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    backgroundColor: GLASS.tier2,
    marginTop: 1,
  },
  timelineDotDone: {
    backgroundColor: 'rgba(34, 224, 130, 0.55)',
    borderColor: 'rgba(34, 224, 130, 0.75)',
  },
  timelineDotActive: {
    backgroundColor: 'rgba(230, 102, 255, 0.55)',
    borderColor: 'rgba(230, 102, 255, 0.75)',
  },
  timelineTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT.primary,
    marginBottom: 2,
  },
  timelineSub: {
    fontSize: 12,
    color: TEXT.tertiary,
    lineHeight: 18,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    color: TEXT.tertiary,
  },
  // "Why am I seeing this screen?" card — explains admin-approval gate.
  whyCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 102, 255, 0.35)',
    backgroundColor: 'rgba(230, 102, 255, 0.06)',
    padding: 16,
    marginBottom: 18,
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 102, 255, 0.18)',
  },
  whyIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 102, 255, 0.45)',
    backgroundColor: 'rgba(230, 102, 255, 0.14)',
  },
  whyHeaderText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: TEXT.primary,
    letterSpacing: 0.3,
  },
  whyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  whyDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 102, 255, 0.45)',
    backgroundColor: 'rgba(230, 102, 255, 0.12)',
    marginTop: 1,
  },
  whyRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT.primary,
    marginBottom: 3,
  },
  whyRowText: {
    fontSize: 12,
    color: TEXT.tertiary,
    lineHeight: 18,
  },
});
