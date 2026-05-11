import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
  StyleSheet,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, ArrowLeft, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react-native';
import { ScreenBackground, SEMANTIC, SPACING, RADIUS, NEON } from '../components/ui';
import { useAuthStore } from '../store';

const LOGO = require('../../assets/logo.jpg');

// ── Glass tokens ────────────────────────────────────────────────────────
const GLASS_BG     = 'rgba(247, 217, 255, 0.10)';
const GLASS_BG2    = 'rgba(247, 217, 255, 0.08)';
const GLASS_BORDER = 'rgba(247, 217, 255, 0.25)';
const GLASS_BORDER_H = 'rgba(123, 37, 244, 0.7)';

// ── Shared glass input ──────────────────────────────────────────────────
function GlassInput({
  label, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, autoCapitalize, rightIcon,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean; keyboardType?: any; autoCapitalize?: any;
  rightIcon?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: SPACING.base }}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label.toUpperCase()}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          style={styles.inputField}
          placeholder={placeholder}
          placeholderTextColor="rgba(247, 217, 255, 0.6)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightIcon && rightIcon}
      </View>
    </View>
  );
}

// ── Login Screen ────────────────────────────────────────────────────────
function LoginContent({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionModal, setRejectionModal] = useState<{
    visible: boolean;
    reason: string;
  }>({ visible: false, reason: '' });
  const { login, isLoading } = useAuthStore();

  // Pulse animation for the approval modal checkmark
  const pulseAnim = useState(new Animated.Value(0))[0];

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    try {
      const result: any = await login(email.trim().toLowerCase(), password);
      // Check if the server flagged this as a first-login-after-approval
      if (result?.justApproved) {
        // Trigger pulse animation then show modal
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start(() => setShowApprovalModal(true));
      }
    } catch (err: any) {
      const errorCode = err?.response?.data?.code;
      const errorMsg = err?.response?.data?.message || 'Invalid email or password. Please try again.';
      
      // Handle rejected account
      if (errorCode === 'ACCOUNT_REJECTED') {
        setRejectionModal({
          visible: true,
          reason: err?.response?.data?.rejectionReason || 'Your KYC application was rejected by the admin team.',
        });
      } else {
        setError(errorMsg);
      }
    }
  };

  return (
    <>
      <View style={styles.logoWrap}>
        <View style={styles.glassCircle}>
          <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>SUPPLIER PORTAL</Text>
      </View>

      <Text style={styles.headingBold}>Welcome</Text>
      <Text style={[styles.headingBold, styles.headingLight, { marginBottom: SPACING.xl }]}>back</Text>

      <View style={styles.glassCard}>
        <GlassInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <GlassInput
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPw}
          rightIcon={
            <View style={styles.eyeWrap}>
              <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPw
                  ? <EyeOff size={20} color="rgba(247,217,255,0.8)" />
                  : <Eye size={20} color="rgba(247,217,255,0.8)" />}
              </TouchableOpacity>
            </View>
          }
        />

        {error ? (
          <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
        ) : null}

        <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.8} style={[styles.glassBtn, isLoading && styles.glassBtnLoading]}>
          <Text style={styles.glassBtnText}>{isLoading ? 'SIGNING IN...' : 'SIGN IN'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>NEW SUPPLIER?</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.8} style={styles.glassOutlineBtn}>
          <Text style={styles.glassOutlineBtnText}>REGISTER AS SUPPLIER</Text>
        </TouchableOpacity>
      </View>

      {/* Approval Success Modal */}
      <Modal
        visible={showApprovalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Animated.View
              style={[
                styles.modalIconWrap,
                { transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] }) }] },
              ]}
            >
              <CheckCircle2 size={48} color={SEMANTIC.success} strokeWidth={2} />
            </Animated.View>
            <Text style={styles.modalTitle}>Account Approved!</Text>
            <Text style={styles.modalSub}>
              Your supplier account has been verified by the admin team. You can now list equipment, accept bookings, and manage your business.
            </Text>
            <TouchableOpacity
              onPress={() => setShowApprovalModal(false)}
              activeOpacity={0.85}
              style={styles.modalBtn}
            >
              <View style={styles.modalBtnInner}>
                <Text style={styles.modalBtnText}>START SELLING</Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        visible={rejectionModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectionModal({ visible: false, reason: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <AlertCircle size={48} color={SEMANTIC.error} strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>Account Rejected</Text>
            <Text style={styles.modalSub}>
              {rejectionModal.reason}
            </Text>
            <TouchableOpacity
              onPress={() => setRejectionModal({ visible: false, reason: '' })}
              activeOpacity={0.85}
              style={styles.modalBtn}
            >
              <View style={styles.modalBtnInner}>
                <Text style={styles.modalBtnText}>CONTACT SUPPORT</Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Register Screen ─────────────────────────────────────────────────────
function RegisterContent({ navigation }: any) {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !phone || !password || !businessName) { setError('Please fill in all required fields.'); return; }
    if (!gstNumber) { setError('Please enter your GST Number.'); return; }
    if (!panNumber) { setError('Please enter your PAN Number.'); return; }
    if (!city || !state) { setError('Please enter your service area.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (gstNumber.length !== 15) { setError('GST Number must be 15 characters.'); return; }
    if (panNumber.length !== 10) { setError('PAN Number must be 10 characters.'); return; }
    try {
      await register({
        name: name.trim(),
        businessName: businessName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: 'supplier',
        userType: 'supplier',
        gstNumber: gstNumber.trim().toUpperCase(),
        panNumber: panNumber.trim().toUpperCase(),
        serviceArea: { city: city.trim(), state: state.trim() },
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      if (msg.includes('pending') || msg.includes('approval')) {
        setError('Registration complete. Your account is pending admin approval.');
        setTimeout(() => navigation.navigate('Login'), 2500);
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
        <ArrowLeft size={20} color="rgba(247, 217, 255, 0.85)" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.logoWrap}>
        <View style={styles.glassCircle}>
          <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>SUPPLIER PORTAL</Text>
      </View>

      <Text style={styles.headingBold}>List your</Text>
      <Text style={[styles.headingBold, styles.headingLight, { marginBottom: SPACING.xl }]}>AV inventory</Text>

      <View style={styles.glassCard}>
        <GlassInput label="Business Name *" placeholder="Your rental business name" value={businessName} onChangeText={setBusinessName} autoCapitalize="words" />
        <GlassInput label="Your Name *" placeholder="Contact person name" value={name} onChangeText={setName} autoCapitalize="words" />
        <GlassInput label="Email *" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <GlassInput label="Phone *" placeholder="+91 9876543210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <GlassInput label="GST Number *" placeholder="15-digit GST" value={gstNumber} onChangeText={t => setGstNumber(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} autoCapitalize="characters" />
          </View>
          <View style={{ flex: 1 }}>
            <GlassInput label="PAN Number *" placeholder="10-char PAN" value={panNumber} onChangeText={t => setPanNumber(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} autoCapitalize="characters" />
          </View>
        </View>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <GlassInput label="City *" placeholder="e.g. Mumbai" value={city} onChangeText={setCity} autoCapitalize="words" />
          </View>
          <View style={{ flex: 1 }}>
            <GlassInput label="State *" placeholder="e.g. Maharashtra" value={state} onChangeText={setState} autoCapitalize="words" />
          </View>
        </View>
        <GlassInput
          label="Password"
          placeholder="Min 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPw}
          rightIcon={
            <View style={styles.eyeWrap}>
              <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPw
                  ? <EyeOff size={20} color="rgba(247,217,255,0.8)" />
                  : <Eye size={20} color="rgba(247,217,255,0.8)" />}
              </TouchableOpacity>
            </View>
          }
        />

        {error ? (
          <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
        ) : null}

        <TouchableOpacity onPress={handleRegister} disabled={isLoading} activeOpacity={0.8} style={[styles.glassBtn, isLoading && styles.glassBtnLoading]}>
          <Text style={styles.glassBtnText}>{isLoading ? 'CREATING ACCOUNT...' : 'REGISTER AS SUPPLIER'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ALREADY HAVE AN ACCOUNT?</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.8} style={styles.glassOutlineBtn}>
          <Text style={styles.glassOutlineBtnText}>SIGN IN</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── Shared Layout ───────────────────────────────────────────────────────
function AuthLayout({ children }: { children?: React.ReactNode }) {
  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.rootWrap}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kbdWrap}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            centerContent
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

export default function LoginScreen({ navigation }: any) {
  return (
    <AuthLayout>
      <LoginContent navigation={navigation} />
    </AuthLayout>
  );
}

export function RegisterScreen({ navigation }: any) {
  return (
    <AuthLayout>
      <RegisterContent navigation={navigation} />
    </AuthLayout>
  );
}

// ── Shared Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.xl,
  },

  // Root wrapper
  rootWrap: { flex: 1 },

  // Keyboard avoiding
  kbdWrap: { flex: 1 },

  logoWrap: { alignItems: 'center', marginBottom: SPACING.md },
  glassCircle: {
    width: 80, height: 80,
    borderRadius: 40,
    borderWidth: 1, borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    overflow: 'hidden',
    shadowColor: NEON.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },

  badge: {
    alignSelf: 'center',
    backgroundColor: `${NEON.purple}18`,
    borderWidth: 1, borderColor: `${NEON.purple}40`,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 5,
    marginBottom: SPACING.sm,
  },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, color: NEON.purple },

  headingBold: {
    fontSize: 34, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -0.5, lineHeight: 42, textAlign: 'center',
  },
  headingLight: { fontWeight: '300' },

  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: SPACING.lg, paddingVertical: 4,
  },
  backText: { fontSize: 13, color: 'rgba(247, 217, 255, 0.85)', fontWeight: '500' },

  glassCard: {
    backgroundColor: GLASS_BG2,
    borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: 22,
    padding: SPACING.xl,
    shadowColor: NEON.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },

  label: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2.5,
    color: 'rgba(247, 217, 255, 0.75)', marginBottom: SPACING.xs,
  },
  labelFocused: { color: NEON.purple },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: GLASS_BG,
    borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: 12,
    paddingHorizontal: SPACING.base,
    minHeight: 50,
  },
  inputWrapFocused: {
    borderColor: GLASS_BORDER_H,
    backgroundColor: 'rgba(123, 37, 244, 0.08)',
  },
  inputField: {
    flex: 1, fontSize: 15,
    color: 'rgba(247, 217, 255, 1.0)',
    paddingHorizontal: SPACING.base,
    paddingVertical: 13,
  },

  // Eye icon
  eyeWrap: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },

  errorBox: {
    backgroundColor: `${SEMANTIC.error}18`, borderRadius: 10,
    borderWidth: 1, borderColor: `${SEMANTIC.error}35`,
    padding: 12, marginBottom: SPACING.base,
  },
  errorText: { fontSize: 12.5, color: SEMANTIC.error, textAlign: 'center', fontWeight: '600' },

  glassBtn: {
    backgroundColor: `${NEON.purple}90`,
    borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
    marginBottom: SPACING.base,
    borderWidth: 1, borderColor: `${NEON.purple}70`,
    shadowColor: NEON.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  glassBtnLoading: { opacity: 0.55 },
  glassBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 1.2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.base, marginBottom: SPACING.base },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(247, 217, 255, 0.1)' },
  dividerText: { fontSize: 11, color: 'rgba(247, 217, 255, 0.6)', fontWeight: '600', letterSpacing: 0.8 },

  glassOutlineBtn: {
    backgroundColor: GLASS_BG,
    borderRadius: 12,
    borderWidth: 1, borderColor: GLASS_BORDER,
    paddingVertical: 14, alignItems: 'center',
  },
  glassOutlineBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 },

  row2: { flexDirection: 'row', gap: SPACING.base },
  row2Inner: { flex: 1 },

  // Approval modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: GLASS_BG2,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 24,
    padding: SPACING.xl * 1.5,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: NEON.purple,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${SEMANTIC.success}18`,
    borderWidth: 2,
    borderColor: `${SEMANTIC.success}45`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  modalSub: {
    fontSize: 14,
    color: 'rgba(247, 217, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.xl,
  },
  modalBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(247, 217, 255, 0.35)',
    overflow: 'hidden',
    width: '100%',
  },
  modalBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: `${NEON.purple}90`,
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});