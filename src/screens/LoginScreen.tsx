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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { ScreenBackground, SEMANTIC, SPACING, RADIUS, NEON } from '../components/ui';
import { useAuthStore } from '../store';

const LOGO = require('../../assets/logo.jpg');

// ── Glass tokens ────────────────────────────────────────────────────────
const GLASS_BG     = 'rgba(247, 217, 255, 0.06)';
const GLASS_BG2    = 'rgba(247, 217, 255, 0.04)';
const GLASS_BORDER = 'rgba(247, 217, 255, 0.12)';
const GLASS_BORDER_H = 'rgba(123, 37, 244, 0.5)';

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
          placeholderTextColor="rgba(247, 217, 255, 0.28)"
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
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      setError('Invalid email or password. Please try again.');
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
                  ? <EyeOff size={20} color="rgba(247,217,255,0.55)" />
                  : <Eye size={20} color="rgba(247,217,255,0.55)" />}
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
        <ArrowLeft size={20} color="rgba(247, 217, 255, 0.5)" />
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
                  ? <EyeOff size={20} color="rgba(247,217,255,0.55)" />
                  : <Eye size={20} color="rgba(247,217,255,0.55)" />}
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
  backText: { fontSize: 13, color: 'rgba(247, 217, 255, 0.5)', fontWeight: '500' },

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
    color: 'rgba(247, 217, 255, 0.35)', marginBottom: SPACING.xs,
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
    color: 'rgba(247, 217, 255, 0.9)',
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
  dividerText: { fontSize: 11, color: 'rgba(247, 217, 255, 0.25)', fontWeight: '600', letterSpacing: 0.8 },

  glassOutlineBtn: {
    backgroundColor: GLASS_BG,
    borderRadius: 12,
    borderWidth: 1, borderColor: GLASS_BORDER,
    paddingVertical: 14, alignItems: 'center',
  },
  glassOutlineBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 },

  row2: { flexDirection: 'row', gap: SPACING.base },
  row2Inner: { flex: 1 },
});