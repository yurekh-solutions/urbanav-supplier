import React, { useEffect, useRef, useState } from 'react';
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
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Clock,
  Mail,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react-native';
import { GRADIENT, GLASS, NEON, TEXT, SEMANTIC } from '../theme/colors';
import { authAPI } from '../api';

const LOGO = require('../../assets/logo.jpg');

/**
 * Admin-approval pending screen. Shown immediately after a supplier submits
 * their registration + KYC documents. The account is not yet active — the
 * user must wait for admin verification before signing in.
 */
export default function PendingApprovalScreen({ navigation, route }: any) {
  const email: string | undefined = route?.params?.email;
  const kycUploaded: boolean = route?.params?.kycUploaded !== false;

  // Live status from polling — starts with route params, updates from backend
  const [liveStatus, setLiveStatus] = useState({
    accountStatus: route?.params?.accountStatus || 'pending',
    kycStatus: route?.params?.kycStatus || 'pending',
    rejectionReason: route?.params?.rejectionReason || '',
  });

  const accountStatus = liveStatus.accountStatus;
  const kycStatus = liveStatus.kycStatus;
  const rejectionReason = liveStatus.rejectionReason;

  const isRejected = accountStatus === 'rejected' || kycStatus === 'rejected';
  const isApproved = accountStatus === 'active' || kycStatus === 'approved';
  const isPending = !isRejected && !isApproved;

  // Poll backend every 10s to check if admin has approved/rejected
  useEffect(() => {
    if (!email || isApproved || isRejected) return; // Stop polling once resolved

    const checkStatus = async () => {
      try {
        const res = await authAPI.checkStatus(email);
        const d = res.data;
        if (d?.success) {
          setLiveStatus({
            accountStatus: d.accountStatus || 'pending',
            kycStatus: d.kycStatus || 'pending',
            rejectionReason: d.kycRejectionReason || '',
          });
        }
      } catch {
        // Silently ignore — will retry on next interval
      }
    };

    // Check immediately, then every 10 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [email, isApproved, isRejected]);

  // Block hardware back button on Android — screen is LOCKED
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  // Gentle pulse on the icon
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

  // Icon color & glow color based on status
  const statusColor = isRejected ? '#FF5B6E' : isApproved ? '#22E082' : '#E666FF';
  const glowColor = isRejected ? 'rgba(255, 91, 110, 0.20)' : isApproved ? 'rgba(34, 224, 130, 0.20)' : 'rgba(230, 102, 255, 0.18)';
  const iconBg = isRejected ? 'rgba(255, 91, 110, 0.12)' : isApproved ? 'rgba(34, 224, 130, 0.12)' : 'rgba(230, 102, 255, 0.10)';
  const iconBorder = isRejected ? 'rgba(255, 91, 110, 0.50)' : isApproved ? 'rgba(34, 224, 130, 0.50)' : 'rgba(230, 102, 255, 0.45)';

  const StatusIcon = isRejected ? XCircle : isApproved ? CheckCircle2 : Clock;

  const statusTitle = isRejected ? 'Application Rejected' : isApproved ? 'Application Approved!' : 'Application Submitted!';
  const statusSubtitle = isRejected
    ? 'Your supplier application was not approved. Please review the reason below and resubmit.'
    : isApproved
    ? 'Congratulations! Your supplier account has been verified and approved.'
    : 'Your supplier application has been sent to our admin team for review.';

  const statusPillText = isRejected ? 'Rejected' : isApproved ? 'Approved' : 'Awaiting admin approval';
  const statusPillColor = isRejected ? 'rgba(255, 91, 110, 0.45)' : isApproved ? 'rgba(34, 224, 130, 0.45)' : 'rgba(255, 191, 71, 0.45)';
  const statusPillBg = isRejected ? 'rgba(255, 91, 110, 0.12)' : isApproved ? 'rgba(34, 224, 130, 0.12)' : 'rgba(255, 191, 71, 0.12)';
  const PillIcon = isRejected ? AlertTriangle : isApproved ? CheckCircle2 : Clock;

  return (
    <LinearGradient colors={GRADIENT.appBg} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ✅ STATUS ICON — changes based on pending/approved/rejected */}
          <View style={styles.successWrap}>
            <Animated.View
              style={[
                styles.successGlow,
                { transform: [{ scale }], opacity: glowOpacity, backgroundColor: glowColor },
              ]}
            />
            <View style={[styles.successIconBox, { backgroundColor: iconBg, borderColor: iconBorder }]}>
              <StatusIcon size={44} color={statusColor} strokeWidth={2} />
            </View>
          </View>

          <Text style={[styles.successTitle, { color: statusColor }]}>{statusTitle}</Text>
          <Text style={styles.successSubtitle}>{statusSubtitle}</Text>

          {/* Status pill */}
          <View style={[styles.statusPill, { borderColor: statusPillColor, backgroundColor: statusPillBg }]}>
            <PillIcon size={13} color={statusColor} strokeWidth={2.2} />
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusPillText}</Text>
          </View>

          {/* Brand header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <Text style={styles.appName}>UrbanAV</Text>
            <Text style={styles.appSub}>Supplier Portal</Text>
          </View>

          {/* ✨ REJECTION REASON — shown only when rejected */}
          {isRejected && rejectionReason ? (
            <View style={styles.rejectionCard}>
              <View style={styles.rejectionHeader}>
                <AlertTriangle size={16} color="#FF5B6E" strokeWidth={2.2} />
                <Text style={styles.rejectionHeaderText}>Rejection Reason</Text>
              </View>
              <Text style={styles.rejectionText}>{rejectionReason}</Text>
            </View>
          ) : null}

          {/* ✨ APPROVAL SUCCESS — shown only when approved */}
          {isApproved ? (
            <View style={styles.approvalCard}>
              <View style={styles.approvalHeader}>
                <CheckCircle2 size={16} color="#22E082" strokeWidth={2.2} />
                <Text style={styles.approvalHeaderText}>You're all set!</Text>
              </View>
              <Text style={styles.approvalText}>
                Your business has been verified. You can now sign in to list equipment, accept bookings, and manage orders.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.replace('Login')}
                activeOpacity={0.85}
                style={styles.signInBtn}
              >
                <Text style={styles.signInBtnText}>GO TO SIGN IN</Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Info card: what happens next — only show for pending */}
          {isPending ? (
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
          ) : null}

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
  // Rejection card
  rejectionCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 91, 110, 0.35)',
    backgroundColor: 'rgba(255, 91, 110, 0.06)',
    padding: 16,
    marginBottom: 18,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  rejectionHeaderText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FF5B6E',
    letterSpacing: 0.3,
  },
  rejectionText: {
    fontSize: 13,
    color: 'rgba(247, 217, 255, 0.75)',
    lineHeight: 20,
  },
  // Approval card
  approvalCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 224, 130, 0.35)',
    backgroundColor: 'rgba(34, 224, 130, 0.06)',
    padding: 16,
    marginBottom: 18,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  approvalHeaderText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#22E082',
    letterSpacing: 0.3,
  },
  approvalText: {
    fontSize: 13,
    color: 'rgba(247, 217, 255, 0.75)',
    lineHeight: 20,
    marginBottom: 16,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 224, 130, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(34, 224, 130, 0.45)',
  },
  signInBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});
