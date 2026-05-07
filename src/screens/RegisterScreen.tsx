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
  Eye,
  EyeOff,
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

type DocSlotKey = 'pan' | 'aadhaar' | 'bankProof' | 'gst';
type DocRequirement = 'required' | 'optional' | 'recommended';

interface DocSlotDef {
  key: DocSlotKey;
  label: string;
  requirement: DocRequirement;
}

const DOC_SLOTS: DocSlotDef[] = [
  { key: 'pan', label: 'PAN Card', requirement: 'required' },
  { key: 'aadhaar', label: 'Aadhaar Card', requirement: 'optional' },
  { key: 'bankProof', label: 'Bank Proof', requirement: 'required' },
  { key: 'gst', label: 'GST/Business License', requirement: 'recommended' },
];

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
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
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

/** Simple multi-line input field. */
function TextArea({
  label,
  value,
  onChangeText,
  placeholder,
  numberOfLines = 4,
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
      <Animated.View style={[styles.textAreaBox, { borderColor }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(247, 217, 255, 0.35)"
          multiline
          numberOfLines={numberOfLines}
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.textAreaInput}
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

  // Step 2 — business info + multi-slot KYC docs
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [productsOffered, setProductsOffered] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [docs, setDocs] = useState<Record<DocSlotKey, PickedDoc | null>>({
    pan: null,
    aadhaar: null,
    bankProof: null,
    gst: null,
  });

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
    if (!businessDescription.trim()) return 'Please describe your business';
    if (!productsOffered.trim()) return 'Please list the products / services you offer';
    if (!yearsInBusiness.trim() || Number.isNaN(Number(yearsInBusiness)) || Number(yearsInBusiness) < 0)
      return 'Please enter years in business';
    if (!docs.pan) return 'PAN Card is required';
    if (!docs.bankProof) return 'Bank Proof is required';
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

  const handlePickDocument = async (slot: DocSlotKey) => {
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
      if (size > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Please select a file under 5 MB.');
        return;
      }

      setDocs((prev) => ({
        ...prev,
        [slot]: {
          uri: asset.uri,
          name: asset.name || `${slot}-${Date.now()}.pdf`,
          mimeType: asset.mimeType || 'application/pdf',
          size,
        },
      }));
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

      // Upload multi-slot KYC documents + business detail fields.
      const token = (await AsyncStorage.getItem('@urbanav_token')) || undefined;
      const products = productsOffered
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await authAPI.uploadKycDocuments(
        {
          pan: docs.pan,
          aadhaar: docs.aadhaar,
          bankProof: docs.bankProof,
          gst: docs.gst,
        },
        {
          businessName: businessName.trim(),
          businessDescription: businessDescription.trim(),
          productsOffered: products,
          yearsInBusiness: yearsInBusiness.trim(),
          gstNumber: gstNumber.trim().toUpperCase(),
          panNumber: panNumber.trim().toUpperCase(),
        },
        token
      );

      setSubmitting(false);
      Alert.alert(
        'Account submitted',
        "Your supplier application has been submitted. Our team will review your documents within 24\u201348 hours. You'll receive an email once approved.",
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
                  Tell us about your business and upload the required documents. Admin verifies before your account goes live.
                </Text>

                <GlassField
                  Icon={Building2}
                  label="Business name"
                  placeholder="ABC Audio Visuals Pvt Ltd"
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                />

                <TextArea
                  label="Business description"
                  placeholder="Describe your business and what you offer..."
                  value={businessDescription}
                  onChangeText={setBusinessDescription}
                  numberOfLines={4}
                />

                <TextArea
                  label="Products / Services offered"
                  placeholder="LED walls, DJ setup, projectors (comma separated)"
                  value={productsOffered}
                  onChangeText={setProductsOffered}
                  numberOfLines={3}
                />

                <GlassField
                  Icon={Hash}
                  label="Years in business"
                  placeholder="e.g. 5"
                  value={yearsInBusiness}
                  onChangeText={setYearsInBusiness}
                  keyboardType="number-pad"
                />

                <GlassField
                  Icon={Hash}
                  label="GST number (optional)"
                  placeholder="22AAAAA0000A1Z5"
                  value={gstNumber}
                  onChangeText={(t: string) => setGstNumber(t.toUpperCase())}
                  autoCapitalize="characters"
                />
                <GlassField
                  Icon={Hash}
                  label="PAN number (optional)"
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChangeText={(t: string) => setPanNumber(t.toUpperCase())}
                  autoCapitalize="characters"
                />

                <Text style={[styles.fieldLabel, { marginTop: 6 }]}>Documents</Text>
                <View style={styles.docsIntro}>
                  <FileText size={14} color={NEON.glow} strokeWidth={1.8} />
                  <Text style={styles.docsIntroText}>
                    Upload required documents (PDF, JPG, PNG · Max 5 MB each)
                  </Text>
                </View>

                {DOC_SLOTS.map((slot) => {
                  const picked = docs[slot.key];
                  const badgeStyle =
                    slot.requirement === 'required'
                      ? styles.badgeRequired
                      : slot.requirement === 'optional'
                      ? styles.badgeOptional
                      : styles.badgeRecommended;
                  const badgeText =
                    slot.requirement === 'required'
                      ? 'Required'
                      : slot.requirement === 'optional'
                      ? 'Optional'
                      : 'Recommended';
                  return (
                    <View key={slot.key} style={styles.docSlot}>
                      <View style={styles.docSlotHead}>
                        <Text style={styles.docSlotLabel}>{slot.label}</Text>
                        <View style={badgeStyle}>
                          <Text style={styles.badgeText}>{badgeText}</Text>
                        </View>
                      </View>
                      {!picked ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handlePickDocument(slot.key)}
                          style={styles.docPicker}
                        >
                          <UploadCloud size={16} color={NEON.glow} strokeWidth={1.8} />
                          <Text style={styles.docPickerText}>Choose file</Text>
                          <Text style={styles.docPickerHint}>No file chosen</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.docPickedRow}>
                          <View style={styles.docIconSmall}>
                            <FileText size={16} color={SEMANTIC.success} strokeWidth={1.8} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.docName} numberOfLines={1}>
                              {picked.name}
                            </Text>
                            <Text style={styles.docMeta}>
                              {picked.mimeType || 'application/pdf'}
                              {picked.size ? `  ·  ${formatBytes(picked.size)}` : ''}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handlePickDocument(slot.key)}
                            style={styles.docReplace}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.docReplaceText}>Replace</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setDocs((p) => ({ ...p, [slot.key]: null }))}
                            style={styles.docRemove}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <X size={14} color={TEXT.secondary} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}

                <View style={styles.infoBanner}>
                  <CheckCircle2 size={16} color={NEON.glow} strokeWidth={2} />
                  <Text style={styles.infoBannerText}>
                    What happens next? Our team will review your application within 24–48 hours. You'll receive an email once approved.
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
  textAreaBox: {
    minHeight: 100,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: GLASS.tier2,
    padding: 12,
    overflow: 'hidden',
  },
  textAreaInput: {
    fontSize: 14,
    color: TEXT.primary,
    fontWeight: '500',
    minHeight: 80,
  },
  docsIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GLASS.tier2Border,
    backgroundColor: GLASS.tier3,
    marginBottom: 12,
  },
  docsIntroText: {
    flex: 1,
    fontSize: 12,
    color: TEXT.tertiary,
    lineHeight: 18,
  },
  docSlot: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GLASS.tier2Border,
    backgroundColor: GLASS.tier3,
  },
  docSlotHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  docSlotLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT.primary,
    letterSpacing: 0.2,
  },
  badgeRequired: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 85, 0.45)',
    backgroundColor: 'rgba(255, 85, 85, 0.14)',
  },
  badgeOptional: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.28)',
    backgroundColor: 'rgba(247, 217, 255, 0.08)',
  },
  badgeRecommended: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34, 224, 130, 0.40)',
    backgroundColor: 'rgba(34, 224, 130, 0.14)',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: TEXT.primary,
    textTransform: 'uppercase',
  },
  docPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(247, 217, 255, 0.04)',
  },
  docPickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT.primary,
    letterSpacing: 0.3,
  },
  docPickerHint: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    color: TEXT.tertiary,
  },
  docPickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 224, 130, 0.35)',
    backgroundColor: 'rgba(34, 224, 130, 0.08)',
  },
  docIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 224, 130, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 224, 130, 0.28)',
  },
  docReplace: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    backgroundColor: GLASS.tier2,
  },
  docReplaceText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: TEXT.secondary,
    textTransform: 'uppercase',
  },
});
