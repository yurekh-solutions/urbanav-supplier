import React, { useState, useRef, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Clock,
  ShieldAlert,
  Mail,
  Lock,
} from 'lucide-react-native';
import { GRADIENT, GLASS, NEON, TEXT, SEMANTIC, SURFACE } from '../theme/colors';
import { useAuthStore } from '../store';
import { useToast } from '../components/ToastContext';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_SMALL = SCREEN_W < 380;
const LOGO = require('../../assets/logo.jpg');

// ── Glass tokens ────────────────────────────────────────────────────────
const GLASS_BG     = 'rgba(247, 217, 255, 0.10)';
const GLASS_BG2    = 'rgba(247, 217, 255, 0.08)';
const GLASS_BORDER = 'rgba(247, 217, 255, 0.25)';
const GLASS_BORDER_H = 'rgba(123, 37, 244, 0.7)';

// ── Login Input Field (matching RegisterScreen GlassField) ──────────────
function LoginField({
  Icon,
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: any) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [GLASS.tier1Border, NEON.glow],
  });

  const isPassword = secureTextEntry;
  const actualSecure = isPassword && !showPassword;

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.fieldBox, { borderColor }]}>
        <LinearGradient
          colors={['rgba(247, 217, 255, 0.06)', 'rgba(247, 217, 255, 0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        />
        {Icon ? <Icon size={18} color={focused ? NEON.glow : TEXT.tertiary} strokeWidth={1.8} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(247, 217, 255, 0.35)"
          secureTextEntry={actualSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.fieldInput, isPassword ? { paddingRight: 40 } : {}]}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={TEXT.tertiary} strokeWidth={1.8} />
            ) : (
              <Eye size={18} color={TEXT.tertiary} strokeWidth={1.8} />
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

// ── Login Screen ────────────────────────────────────────────────────────
function LoginContent({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const { showToast } = useToast();
  const [rejectionModal, setRejectionModal] = useState<{
    visible: boolean;
    reason: string;
  }>({ visible: false, reason: '' });
  const [pendingModal, setPendingModal] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: '' });
  const [suspendedModal, setSuspendedModal] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: '' });
  const { login, isLoading } = useAuthStore();

  const pulseAnim = useState(new Animated.Value(0))[0];

  const handleLogin = async () => {
    if (!email || !password) { showToast({ message: 'Please enter your email and password.', type: 'error' }); return; }
    try {
      const result: any = await login(email.trim().toLowerCase(), password);
      if (result?.justApproved) {
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start(() => setShowApprovalModal(true));
      }
    } catch (err: any) {
      const errorCode = err?.response?.data?.code;
      const status = err?.response?.status;
      const rawMsg = err?.response?.data?.message || err?.message || '';

      if (!err?.response) {
        // Timeout or network error — no response from server
        const isTimeout =
          err?.code === 'ECONNABORTED' ||
          /timeout/i.test(err?.message || '');
        showToast({ message: isTimeout
          ? 'The server is taking too long to respond (it may be starting up). Please wait ~30 seconds and try again.'
          : 'Unable to connect to the server. Please check your internet connection and try again.', type: 'error' });
      } else if (errorCode === 'ACCOUNT_PENDING') {
        setPendingModal({
          visible: true,
          message: err?.response?.data?.message ||
            'Your supplier account is pending admin approval. Our team will verify your KYC details within 24\u201348 hours.',
        });
      } else if (errorCode === 'ACCOUNT_REJECTED') {
        setRejectionModal({
          visible: true,
          reason: err?.response?.data?.rejectionReason || 'Your KYC application was rejected.',
        });
      } else if (errorCode === 'ACCOUNT_SUSPENDED') {
        setSuspendedModal({
          visible: true,
          message: err?.response?.data?.message || 'Your account has been suspended.',
        });
      } else if (status === 401 || status === 403) {
        // Wrong credentials — give a clear, friendly message
        showToast({ message: 'The email or password you entered is incorrect. Please try again, or tap "Forgot Password" to reset it.', type: 'error' });
      } else if (status === 404) {
        showToast({ message: 'No supplier account found with this email. Please register first or check the email address.', type: 'error' });
      } else if (status >= 500) {
        showToast({ message: 'Our servers are temporarily unavailable. Please try again in a few minutes.', type: 'error' });
      } else {
        // Fallback: show a safe, human-readable message
        showToast({ message: rawMsg && rawMsg.length < 150
          ? rawMsg
          : 'Something went wrong. Please try again later.', type: 'error' });
      }
    }
  };

  return (
    <LinearGradient colors={GRADIENT.appBg} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            </View>

            {/* Badge */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SUPPLIER PORTAL</Text>
            </View>

            {/* Heading */}
            <Text style={styles.headingBold}>Welcome</Text>
            <Text style={[styles.headingBold, styles.headingLight, { marginBottom: 24 }]}>back</Text>

            {/* Form - No glass card, just flat inputs */}
            <View style={styles.formWrap}>
              <LoginField
                Icon={Mail}
                label="EMAIL"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <LoginField
                Icon={Lock}
                label="PASSWORD"
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
                style={styles.primaryBtn}
              >
                <LinearGradient
                  colors={GRADIENT.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.primaryBtnText}>
                  {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>NEW SUPPLIER?</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.85}
                style={styles.outlineBtn}
              >
                <Text style={styles.outlineBtnText}>REGISTER AS SUPPLIER</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
            <View style={[styles.modalIconWrap, styles.modalIconWrapError]}>
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

      {/* Pending Admin Approval Modal */}
      <Modal
        visible={pendingModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingModal({ visible: false, message: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, styles.modalIconWrapPending]}>
              <Clock size={48} color={SEMANTIC.warning} strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>Pending Admin Approval</Text>
            <Text style={styles.modalSub}>{pendingModal.message}</Text>

            <View style={styles.pendingPill}>
              <Clock size={12} color={SEMANTIC.warning} strokeWidth={2.2} />
              <Text style={styles.pendingPillText}>Awaiting admin review</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setPendingModal({ visible: false, message: '' });
                navigation.navigate('PendingApproval', {
                  email: email.trim().toLowerCase(),
                  kycUploaded: true,
                });
              }}
              activeOpacity={0.85}
              style={styles.modalBtn}
            >
              <View style={styles.modalBtnInner}>
                <Text style={styles.modalBtnText}>VIEW STATUS</Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPendingModal({ visible: false, message: '' })}
              activeOpacity={0.7}
              style={styles.modalLinkBtn}
            >
              <Text style={styles.modalLinkText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Suspended Modal */}
      <Modal
        visible={suspendedModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuspendedModal({ visible: false, message: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, styles.modalIconWrapError]}>
              <ShieldAlert size={48} color={SEMANTIC.error} strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>Account Suspended</Text>
            <Text style={styles.modalSub}>{suspendedModal.message}</Text>
            <TouchableOpacity
              onPress={() => setSuspendedModal({ visible: false, message: '' })}
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
    </LinearGradient>
  );
}

// ── Legacy GlassInput for RegisterContent ──────────────────────────────
function GlassInput({
  label, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, autoCapitalize, rightIcon,
  error,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean; keyboardType?: any; autoCapitalize?: any;
  rightIcon?: React.ReactNode;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  return (
    <View style={{ marginBottom: hasError ? 4 : 16 }}>
      <Text style={[styles.label, focused && !hasError && styles.labelFocused, hasError && { color: '#FF5B6E' }]}>{label.toUpperCase()}</Text>
      <View style={[
        styles.inputWrap,
        focused && !hasError && styles.inputWrapFocused,
        hasError && { borderColor: 'rgba(255, 91, 110, 0.6)', backgroundColor: 'rgba(255, 91, 110, 0.06)' },
      ]}>
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
      {hasError ? <Text style={{ color: '#FF5B6E', fontSize: 11, fontWeight: '600', marginTop: 4, marginLeft: 4 }}>{error}</Text> : null}
    </View>
  );
}

// ── Register Screen ────────────────────────────────────────────────────
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
  const [pincode, setPincode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { showToast } = useToast();
  const { register, isLoading } = useAuthStore();

  // ── Live validators — always active ──
  const errors: Record<string, string> = {};

  if (!businessName.trim()) errors.businessName = 'Business name is required';
  if (!name.trim()) errors.name = 'Your name is required';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!phone.trim()) errors.phone = 'Phone number is required';
  else if (!/^[+]?\d{10,13}$/.test(phone.replace(/[\s-]/g, ''))) errors.phone = 'Enter a valid phone number';
  if (!gstNumber.trim()) errors.gstNumber = 'GST number is required';
  else if (gstNumber.trim().length !== 15) errors.gstNumber = `GST must be 15 chars (${gstNumber.trim().length}/15)`;
  if (!panNumber.trim()) errors.panNumber = 'PAN number is required';
  else if (panNumber.trim().length !== 10) errors.panNumber = `PAN must be 10 chars (${panNumber.trim().length}/10)`;
  else if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(panNumber.trim())) errors.panNumber = 'Invalid PAN format (e.g. ABCDE1234F)';
  if (!city.trim()) errors.city = 'City is required';
  if (!state.trim()) errors.state = 'State is required';
  if (!pincode.trim()) errors.pincode = 'Pincode is required';
  else if (pincode.trim().length !== 6) errors.pincode = `Pincode must be 6 digits (${pincode.trim().length}/6)`;
  if (!password) errors.password = 'Password is required';
  else if (password.length < 6) errors.password = `Min 6 characters (${password.length}/6)`;

  const handleRegister = async () => {
    if (Object.keys(errors).length > 0) {
      showToast({ message: 'Please fix the highlighted errors.', type: 'error' });
      return;
    }
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
        serviceArea: { city: city.trim(), state: state.trim(), pincode: pincode.trim() },
      });
      // Registration success → go straight to locked PendingApprovalScreen
      navigation.replace('PendingApproval', {
        email: email.trim().toLowerCase(),
        kycUploaded: false,
        accountStatus: 'pending',
        kycStatus: 'pending',
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const isTimeout = e?.code === 'ECONNABORTED' || /timeout/i.test(msg);
      if (isTimeout || (!e?.response && /network/i.test(msg))) {
        showToast({ message: 'The server is taking too long to respond. Please wait ~30 seconds and try again.', type: 'error' });
      } else if (msg.includes('pending') || msg.includes('approval')) {
        navigation.replace('PendingApproval', {
          email: email.trim().toLowerCase(),
          kycUploaded: false,
          accountStatus: 'pending',
          kycStatus: 'pending',
        });
      } else {
        showToast({ message: msg || 'Registration failed. Please try again.', type: 'error' });
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
      <Text style={[styles.headingBold, styles.headingLight, { marginBottom: 24 }]}>AV inventory</Text>

      <View style={styles.glassCard}>
        <GlassInput label="Business Name *" placeholder="Your rental business name" value={businessName} onChangeText={setBusinessName} autoCapitalize="words" error={errors.businessName} />
        <GlassInput label="Your Name *" placeholder="Contact person name" value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} />
        <GlassInput label="Email *" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <GlassInput label="Phone *" placeholder="9876543210" value={phone} onChangeText={(t: string) => setPhone(t.replace(/[^0-9+\-\s]/g, ''))} keyboardType="phone-pad" error={errors.phone} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <GlassInput label="GST Number *" placeholder="15-digit GST" value={gstNumber} onChangeText={t => setGstNumber(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} autoCapitalize="characters" error={errors.gstNumber} />
          </View>
          <View style={{ flex: 1 }}>
            <GlassInput label="PAN Number *" placeholder="10-char PAN" value={panNumber} onChangeText={t => setPanNumber(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} autoCapitalize="characters" error={errors.panNumber} />
          </View>
        </View>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <GlassInput label="City *" placeholder="e.g. Mumbai" value={city} onChangeText={(t: string) => {
              setCity(t);
              if (t.trim().toLowerCase() === 'mumbai') {
                setState('Maharashtra');
                setPincode('400001');
              }
            }} autoCapitalize="words" error={errors.city} />
          </View>
          <View style={{ flex: 1 }}>
            <GlassInput label="State *" placeholder="e.g. Maharashtra" value={state} onChangeText={setState} autoCapitalize="words" error={errors.state} />
          </View>
        </View>
        <GlassInput label="Pincode *" placeholder="e.g. 400001" value={pincode} onChangeText={(t: string) => setPincode(t.replace(/[^0-9]/g, '').slice(0, 6))} keyboardType="number-pad" autoCapitalize="none" error={errors.pincode} />
        <GlassInput
          label="Password *"
          placeholder="Min 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPw}
          error={errors.password}
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
function AuthLayout({ children, scrollStyle }: { children?: React.ReactNode; scrollStyle?: any }) {
  return (
    <LinearGradient colors={GRADIENT.appBg} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, scrollStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
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
    <AuthLayout scrollStyle={{ flexGrow: 1 }}>
      <RegisterContent navigation={navigation} />
    </AuthLayout>
  );
}

// ── Shared Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: IS_SMALL ? 20 : 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  logoWrap: { alignItems: 'center', marginBottom: 16 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
  },
  glassCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.25)',
    backgroundColor: 'rgba(247, 217, 255, 0.10)',
  },

  badge: {
    alignSelf: 'center',
    backgroundColor: `${NEON.purple}18`,
    borderWidth: 1,
    borderColor: `${NEON.purple}40`,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 8,
  },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, color: NEON.purple },

  headingBold: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 42,
    textAlign: 'center',
  },
  headingLight: { fontWeight: '300' },

  formWrap: {
    marginTop: 8,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(247, 217, 255, 0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: GLASS.tier2,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT.primary,
    fontWeight: '500',
    paddingVertical: 0,
  },

  errorBox: {
    backgroundColor: `${SEMANTIC.error}18`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${SEMANTIC.error}35`,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorText: {
    fontSize: 13,
    color: SEMANTIC.error,
    flex: 1,
    lineHeight: 18,
    fontWeight: '600',
  },

  primaryBtn: {
    marginTop: 12,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(247, 217, 255, 0.1)' },
  dividerText: {
    fontSize: 11,
    color: 'rgba(247, 217, 255, 0.6)',
    fontWeight: '600',
    letterSpacing: 0.8,
  },

  outlineBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GLASS.tier2,
  },
  outlineBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: GLASS.tier2,
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    borderRadius: 24,
    padding: IS_SMALL ? 20 : 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
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
    marginBottom: 20,
  },
  modalIconWrapError: {
    backgroundColor: `${SEMANTIC.error}18`,
    borderColor: `${SEMANTIC.error}45`,
  },
  modalIconWrapPending: {
    backgroundColor: `${SEMANTIC.warning}18`,
    borderColor: `${SEMANTIC.warning}45`,
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: `${SEMANTIC.warning}18`,
    borderWidth: 1,
    borderColor: `${SEMANTIC.warning}40`,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 20,
  },
  pendingPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: SEMANTIC.warning,
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: 'rgba(247, 217, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
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
  modalLinkBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  modalLinkText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(247, 217, 255, 0.65)',
  },

  // RegisterContent legacy styles (kept for compatibility)
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
    paddingVertical: 4,
  },
  backText: { fontSize: 13, color: 'rgba(247, 217, 255, 0.85)', fontWeight: '500' },
  glassCard: {
    backgroundColor: 'rgba(247, 217, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.25)',
    borderRadius: 22,
    padding: IS_SMALL ? 20 : 32,
    shadowColor: NEON.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: 'rgba(247, 217, 255, 0.75)',
    marginBottom: 6,
  },
  labelFocused: { color: NEON.purple },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 217, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  inputWrapFocused: {
    borderColor: 'rgba(123, 37, 244, 0.7)',
    backgroundColor: 'rgba(123, 37, 244, 0.08)',
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(247, 217, 255, 1.0)',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  eyeWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBtn: {
    backgroundColor: `${NEON.purple}90`,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${NEON.purple}70`,
  },
  glassBtnLoading: { opacity: 0.55 },
  glassBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 1.2 },
  glassOutlineBtn: {
    backgroundColor: 'rgba(247, 217, 255, 0.10)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.25)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  glassOutlineBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 },
  row2: { flexDirection: 'row', gap: 16 },
});