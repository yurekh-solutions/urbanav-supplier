import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Building2,
  Hash,
  FileText,
  CheckCircle2,
  UploadCloud,
  X,
} from 'lucide-react-native';
import { GRADIENT, GLASS, NEON, TEXT, SEMANTIC, SURFACE } from '../theme/colors';
import { useAuthStore } from '../store';
import { authAPI } from '../api';

const LOGO = require('../../assets/logo.jpg');

type PickedDoc = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

/** Glass / neumorphic input. No box-shadows; border + subtle gradient for depth. */
function GlassField({
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

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.fieldBox, { borderColor }]}>
        <LinearGradient
          colors={['rgba(247, 217, 255, 0.06)', 'rgba(247, 217, 255, 0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {Icon ? <Icon size={18} color={focused ? NEON.glow : TEXT.tertiary} strokeWidth={1.8} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(247, 217, 255, 0.35)"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.fieldInput}
        />
      </Animated.View>
    </View>
  );
}

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuthStore();
  const [step, setStep] = useState<0 | 1>(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — supplier info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 — business info + KYC doc
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [doc, setDoc] = useState<PickedDoc | null>(null);

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step === 0 ? 0.5 : 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step]);

  const validateStep1 = () => {
    if (!fullName.trim()) return 'Please enter your full name';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) return 'Please enter a valid phone number';
    if (!city.trim()) return 'Please enter your city';
    if (!stateName.trim()) return 'Please enter your state';
    if (!password || password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const validateStep2 = () => {
    if (!businessName.trim()) return 'Please enter your business name';
    if (!gstNumber.trim() || gstNumber.trim().length < 10) return 'Please enter a valid GST number';
    if (!panNumber.trim() || panNumber.trim().length < 10) return 'Please enter a valid PAN number';
    if (!doc) return 'Please upload your KYC document (PDF, JPG, or PNG)';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) {
      Alert.alert('Missing info', err);
      return;
    }
    setStep(1);
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;
      const asset: any = (res as any).assets ? (res as any).assets[0] : res;
      if (!asset?.uri) return;

      const size = asset.size ?? 0;
      if (size > 10 * 1024 * 1024) {
        Alert.alert('File too large', 'Please select a file under 10 MB.');
        return;
      }

      setDoc({
        uri: asset.uri,
        name: asset.name || `kyc-${Date.now()}.pdf`,
        mimeType: asset.mimeType || 'application/pdf',
        size,
      });
    } catch (e: any) {
      Alert.alert('Picker error', e?.message || 'Could not open file picker');
    }
  };

  const handleSubmit = async () => {
    const err = validateStep2();
    if (err) {
      Alert.alert('Missing info', err);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        city: city.trim(),
        state: stateName.trim(),
        businessName: businessName.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        panNumber: panNumber.trim().toUpperCase(),
      };

      // Register — store forces role/userType='supplier'. Will throw 'pending_approval'
      // after persisting token to AsyncStorage; we handle either outcome.
      let registered = false;
      try {
        await register(payload);
        registered = true;
      } catch (regErr: any) {
        const msg = regErr?.response?.data?.message || regErr?.message || '';
        if (msg === 'pending_approval') {
          registered = true; // account exists; continue to upload
        } else {
          throw regErr;
        }
      }

      if (!registered) throw new Error('Registration failed');

      // Upload KYC document using the saved token.
      const token = (await AsyncStorage.getItem('@urbanav_token')) || undefined;
      await authAPI.uploadKycDocument(doc!.uri, doc!.name, doc!.mimeType, token);

      setSubmitting(false);
      Alert.alert(
        'Account submitted',
        'Your supplier account and KYC document have been submitted. Our admin team will review and approve your account shortly.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );
    } catch (e: any) {
      setSubmitting(false);
      const msg = e?.response?.data?.message || e?.message || 'Could not submit your account';
      Alert.alert('Registration error', msg);
    }
  };

  const formatBytes = (b?: number) => {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <LinearGradient colors={GRADIENT.appBg as string[]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (step === 0 ? navigation.goBack() : setStep(0))}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={20} color={TEXT.primary} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
              <View>
                <Text style={styles.appName}>UrbanAV</Text>
                <Text style={styles.appSub}>Supplier Sign-up</Text>
              </View>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Animated progress bar */}
          <View style={styles.progressWrap}>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressStep, step >= 0 && styles.progressStepActive]}>
                1 · Supplier info
              </Text>
              <Text style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
                2 · Business & KYC
              </Text>
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

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 0 ? (
              <View>
                <Text style={styles.heroTitle}>Tell us about you</Text>
                <Text style={styles.heroSub}>
                  We'll use this to create your supplier login. Step 1 of 2.
                </Text>

                <GlassField
                  Icon={User}
                  label="Full name"
                  placeholder="e.g. Rohan Mehta"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
                <GlassField
                  Icon={Mail}
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <GlassField
                  Icon={Phone}
                  label="Phone"
                  placeholder="10-digit mobile"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <GlassField
                      Icon={MapPin}
                      label="City"
                      placeholder="Mumbai"
                      value={city}
                      onChangeText={setCity}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <GlassField
                      Icon={MapPin}
                      label="State"
                      placeholder="Maharashtra"
                      value={stateName}
                      onChangeText={setStateName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <GlassField
                  Icon={Lock}
                  label="Password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <GlassField
                  Icon={Lock}
                  label="Confirm password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  onPress={handleNext}
                  activeOpacity={0.85}
                  style={styles.primaryBtn}
                >
                  <LinearGradient
                    colors={GRADIENT.brand as string[]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    colors={GRADIENT.glassShine as string[]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.primaryBtnInner}>
                    <Text style={styles.primaryBtnText}>CONTINUE</Text>
                    <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.replace('Login')}
                  style={{ alignItems: 'center', marginTop: 18 }}
                >
                  <Text style={styles.switchText}>
                    Already have an account? <Text style={{ color: NEON.glow }}>Sign in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.heroTitle}>Business & KYC</Text>
                <Text style={styles.heroSub}>
                  Upload your KYC document. Admin verifies before your account goes live.
                </Text>

                <GlassField
                  Icon={Building2}
                  label="Business name"
                  placeholder="ABC Audio Visuals Pvt Ltd"
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                />
                <GlassField
                  Icon={Hash}
                  label="GST number"
                  placeholder="22AAAAA0000A1Z5"
                  value={gstNumber}
                  onChangeText={(t: string) => setGstNumber(t.toUpperCase())}
                  autoCapitalize="characters"
                />
                <GlassField
                  Icon={Hash}
                  label="PAN number"
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChangeText={(t: string) => setPanNumber(t.toUpperCase())}
                  autoCapitalize="characters"
                />

                <Text style={styles.fieldLabel}>KYC document</Text>
                {!doc ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handlePickDocument}
                    style={styles.dropZone}
                  >
                    <LinearGradient
                      colors={['rgba(230, 102, 255, 0.08)', 'rgba(123, 37, 244, 0.04)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.dropIcon}>
                      <UploadCloud size={26} color={NEON.glow} strokeWidth={1.6} />
                    </View>
                    <Text style={styles.dropTitle}>Tap to upload PDF</Text>
                    <Text style={styles.dropSub}>PDF · JPG · PNG · Max 10 MB</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.docCard}>
                    <LinearGradient
                      colors={['rgba(34, 224, 130, 0.10)', 'rgba(34, 224, 130, 0.02)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.docIcon}>
                      <FileText size={22} color={SEMANTIC.success} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={styles.docMeta}>
                        {doc.mimeType || 'application/pdf'}
                        {doc.size ? `  ·  ${formatBytes(doc.size)}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setDoc(null)}
                      style={styles.docRemove}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color={TEXT.secondary} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.infoBanner}>
                  <CheckCircle2 size={16} color={NEON.glow} strokeWidth={2} />
                  <Text style={styles.infoBannerText}>
                    Admin will verify your document and approve your account.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.85}
                  style={[styles.primaryBtn, submitting && { opacity: 0.75 }]}
                >
                  <LinearGradient
                    colors={GRADIENT.brand as string[]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    colors={GRADIENT.glassShine as string[]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.primaryBtnInner}>
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>SUBMIT FOR REVIEW</Text>
                        <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep(0)}
                  style={{ alignItems: 'center', marginTop: 16 }}
                >
                  <Text style={styles.switchText}>
                    <Text style={{ color: NEON.glow }}>Back</Text> to supplier info
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    overflow: 'hidden',
  },
  appName: { fontSize: 15, fontWeight: '800', color: TEXT.primary, letterSpacing: -0.3 },
  appSub: {
    fontSize: 10,
    fontWeight: '600',
    color: NEON.glow,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  progressWrap: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressStep: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(247, 217, 255, 0.35)',
  },
  progressStepActive: { color: NEON.glow },
  progressTrack: {
    height: 6,
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
  scrollBody: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 40,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT.primary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(247, 217, 255, 0.55)',
    lineHeight: 20,
    marginBottom: 22,
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
    overflow: 'hidden',
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT.primary,
    fontWeight: '500',
    paddingVertical: 0,
  },
  primaryBtn: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(247, 217, 255, 0.35)',
    overflow: 'hidden',
  },
  primaryBtnInner: {
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
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  switchText: {
    fontSize: 13,
    color: TEXT.tertiary,
    fontWeight: '500',
  },
  dropZone: {
    height: 130,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GLASS.tier1Border,
    borderStyle: 'dashed',
    backgroundColor: GLASS.tier2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  dropIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230, 102, 255, 0.12)',
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    marginBottom: 10,
  },
  dropTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT.primary,
    marginBottom: 2,
  },
  dropSub: {
    fontSize: 11,
    color: TEXT.tertiary,
    letterSpacing: 0.6,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 224, 130, 0.35)',
    backgroundColor: GLASS.tier2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 224, 130, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 224, 130, 0.28)',
  },
  docName: { fontSize: 13, fontWeight: '700', color: TEXT.primary },
  docMeta: { fontSize: 11, color: TEXT.tertiary, marginTop: 2 },
  docRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GLASS.tier2,
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GLASS.tier2Border,
    backgroundColor: GLASS.tier3,
    marginBottom: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: TEXT.tertiary,
    lineHeight: 18,
  },
});
