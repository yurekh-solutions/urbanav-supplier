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
  StatusBar,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  Modal,
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
  Home,
  FileText,
  CheckCircle2,
  UploadCloud,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Clock,
  XCircle,
} from 'lucide-react-native';
import { GRADIENT, GLASS, NEON, TEXT, SEMANTIC, SURFACE } from '../theme/colors';
import { useAuthStore } from '../store';
import { authAPI } from '../api';
import { useToast } from '../components/ToastContext';

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

type ErrorPopup = {
  visible: boolean;
  title: string;
  message: string;
  checklist?: string[];
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export default function RegisterScreen({ navigation }: any) {
  const { showToast } = useToast();
  const [step, setStep] = useState<0 | 1>(0);
  const [submitting, setSubmitting] = useState(false);
  // Inline error banner. Cleared on any field edit / step change.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Prominent modal popup for API / upload errors the supplier must see.
  const [errorPopup, setErrorPopup] = useState<ErrorPopup>({
    visible: false,
    title: '',
    message: '',
  });
  // Success modal shown after submit — ends with "Go to status page" CTA
  // that sends the supplier to the full PendingApproval screen.
  const [successPopup, setSuccessPopup] = useState<{
    visible: boolean;
    kycUploaded: boolean;
  }>({ visible: false, kycUploaded: false });

  // Step 1 — supplier info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 — business info + multi-slot KYC docs.
  // NOTE: GST/PAN numbers are no longer collected as free-text — the admin
  // verifies the numbers from the uploaded PDF documents instead.
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [productsOffered, setProductsOffered] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [docs, setDocs] = useState<Record<DocSlotKey, PickedDoc | null>>({
    pan: null,
    aadhaar: null,
    bankProof: null,
    gst: null,
  });

  // Clear the inline error whenever the user interacts with a field.
  useEffect(() => {
    if (errorMsg) setErrorMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fullName, email, phone, address, city, stateName, pincode, password, confirmPassword,
    businessName, businessDescription, productsOffered, yearsInBusiness,
    docs.pan, docs.aadhaar, docs.bankProof, docs.gst, step,
  ]);

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

  const validateStep1 = (): string[] => {
    const issues: string[] = [];
    if (!fullName.trim()) issues.push('Full name is empty');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      issues.push('Email is missing or not a valid email address');
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10)
      issues.push('Phone must be a 10-digit mobile number');
    if (!address.trim()) issues.push('Address (house / street) is empty');
    if (!city.trim()) issues.push('City is empty');
    if (!stateName.trim()) issues.push('State is empty');
    if (!pincode.trim() || !/^[0-9]{6}$/.test(pincode.trim()))
      issues.push('Pincode must be exactly 6 digits (e.g. 400001)');
    if (!password || password.length < 6)
      issues.push('Password must be at least 6 characters');
    if (password !== confirmPassword)
      issues.push('Password and Confirm password do not match');
    return issues;
  };

  const validateStep2 = (): string[] => {
    const issues: string[] = [];
    if (!businessName.trim()) issues.push('Business name is empty');
    if (!businessDescription.trim()) issues.push('Business description is empty');
    if (!productsOffered.trim())
      issues.push('Products / services offered is empty (comma-separated list)');
    if (!yearsInBusiness.trim() || Number.isNaN(Number(yearsInBusiness)) || Number(yearsInBusiness) < 0)
      issues.push('Years in business must be a valid non-negative number');
    if (!docs.pan) issues.push('PAN Card document is required (PDF / JPG / PNG)');
    if (!docs.bankProof) issues.push('Bank Proof document is required (PDF / JPG / PNG)');
    return issues;
  };

  const handleNext = () => {
    const issues = validateStep1();
    if (issues.length) {
      showError(
        'Please fix these before continuing',
        'A few fields in Step 1 need your attention:',
        { checklist: issues }
      );
      setErrorMsg(issues[0]);
      return;
    }
    setErrorMsg(null);
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
        showToast({ message: 'File too large. Please select a file under 5 MB.', type: 'error' });
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
      showToast({ message: e?.message || 'Could not open file picker', type: 'error' });
    }
  };

  const showError = (title: string, message: string, extra?: Partial<ErrorPopup>) => {
    setErrorMsg(message);
    setErrorPopup({
      visible: true,
      title,
      message,
      checklist: undefined,
      primaryLabel: undefined,
      onPrimary: undefined,
      secondaryLabel: undefined,
      onSecondary: undefined,
      ...extra,
    });
  };

  const handleSubmit = async () => {
    const issues = validateStep2();
    if (issues.length) {
      showError(
        'Please fix these before submitting',
        'A few things are still missing in your application:',
        { checklist: issues }
      );
      return;
    }
    // Also double-check Step 1 in case the user went back and cleared something.
    const step1Issues = validateStep1();
    if (step1Issues.length) {
      showError(
        'Step 1 is incomplete',
        'Please go back to Step 1 and fix the following:',
        {
          checklist: step1Issues,
          primaryLabel: 'GO TO STEP 1',
          onPrimary: () => {
            setErrorPopup((p) => ({ ...p, visible: false }));
            setStep(0);
          },
          secondaryLabel: 'DISMISS',
          onSecondary: () => setErrorPopup((p) => ({ ...p, visible: false })),
        }
      );
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const payload = {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        userType: 'supplier',
        role: 'supplier',
        // Send a flat address object. Server /auth/register accepts both
        // nested `address` and flat `street/city/state/pincode` fields.
        address: {
          street: address.trim(),
          city: city.trim(),
          state: stateName.trim(),
          pincode: pincode.trim(),
          country: 'India',
        },
        street: address.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        businessName: businessName.trim(),
      };

      console.log('Submitting registration:', JSON.stringify(payload, null, 2));

      // CRITICAL: Call API directly instead of store.register().
      // store.register() sets hasOnboarded:false which triggers navigator
      // re-render → destroys current stack → navigation.replace fails.
      // We navigate FIRST, then update store AFTER.
      const regRes = await authAPI.register({ ...payload, role: 'supplier', userType: 'supplier' });
      const regData: any = regRes.data || {};
      const regUser = regData.user ?? regData;
      const regToken = regData.token ?? regData.accessToken;

      // Save token for KYC upload
      await AsyncStorage.multiSet([
        ['@urbanav_user', JSON.stringify(regUser)],
        ['@urbanav_token', regToken],
        ['@urbanav_pending', 'true'],
      ]);

      // Upload multi-slot KYC documents + business detail fields.
      // GST/PAN numbers are no longer sent — admin reads them off the PDF.
      const token = (await AsyncStorage.getItem('@urbanav_token')) || undefined;
      const products = productsOffered
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      let kycUploadFailed = false;
      let kycErrorMessage = '';
      try {
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
          },
          token
        );
      } catch (kycErr: any) {
        // KYC upload failed but account is already created. Don't block the
        // user — they can upload documents later from My Documents screen.
        console.warn('KYC upload failed (account still created):', kycErr?.response?.data || kycErr?.message);
        kycUploadFailed = true;
        kycErrorMessage =
          kycErr?.response?.data?.message ||
          kycErr?.message ||
          'Could not upload your documents.';
      }

      setSubmitting(false);

      if (kycUploadFailed) {
        // Tell the supplier exactly what happened with the documents, but
        // make it clear the account was still created so they don't retry
        // register() and hit the "email already exists" wall.
        showError(
          'Documents upload failed',
          `Your account was created but we couldn't upload your documents: ${kycErrorMessage}. You can upload them later from "My Documents".`,
          {
            primaryLabel: 'CONTINUE ANYWAY',
            onPrimary: () => {
              setErrorPopup((p) => ({ ...p, visible: false }));
              navigation.replace('PendingApproval', {
                email: email.trim().toLowerCase(),
                kycUploaded: false,
                accountStatus: regUser?.accountStatus || 'pending',
                kycStatus: regUser?.kycStatus || 'pending',
              });
              // Delay store update to let navigation process first
              setTimeout(() => {
                useAuthStore.setState({
                  user: regUser,
                  token: regToken,
                  isLoading: false,
                  isAuthenticated: false,
                  hasOnboarded: false,
                });
              }, 100);
            },
            secondaryLabel: 'DISMISS',
            onSecondary: () => setErrorPopup((p) => ({ ...p, visible: false })),
          }
        );
        return;
      }

      // All good — navigate DIRECTLY to PendingApproval screen FIRST.
      // We MUST navigate before updating the store, because store.setState()
      // triggers navigator re-render which destroys the current stack.
      console.log('✅ Registration successful! Navigating directly to PendingApproval...');
      console.log('📧 Email:', email.trim().toLowerCase());
      console.log('📄 KYC Uploaded:', !kycUploadFailed);

      try {
        navigation.replace('PendingApproval', {
          email: email.trim().toLowerCase(),
          kycUploaded: !kycUploadFailed,
          accountStatus: regUser?.accountStatus || 'pending',
          kycStatus: regUser?.kycStatus || 'pending',
        });
        console.log('✅ Successfully navigated to PendingApproval');
      } catch (navError) {
        console.error('❌ Navigation failed, trying fallback:', navError);
        navigation.navigate('PendingApproval', {
          email: email.trim().toLowerCase(),
          kycUploaded: !kycUploadFailed,
          accountStatus: regUser?.accountStatus || 'pending',
          kycStatus: regUser?.kycStatus || 'pending',
        });
      }

      // Update store AFTER navigation — delay to let nav action process first
      setTimeout(() => {
        useAuthStore.setState({
          user: regUser,
          token: regToken,
          isLoading: false,
          isAuthenticated: false,
          hasOnboarded: false,
        });
      }, 100);
    } catch (e: any) {
      console.error(' Registration error occurred:', e?.message || e);
      setSubmitting(false);
      const status = e?.response?.status;
      const apiMsg = e?.response?.data?.message || e?.message || '';
      const apiErrorDetail = e?.response?.data?.error || '';
      console.error('Registration error:', JSON.stringify({
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
        code: e?.code,
      }, null, 2));

      // Map the server error to a clear, supplier-friendly popup.
      let title = 'Registration failed';
      let friendly = 'Could not submit your account. Please try again.';
      let extra: Partial<ErrorPopup> = {};

      // Build a field checklist comparing what we sent vs what might be missing.
      // This helps the supplier pinpoint the exact field the server rejected.
      const buildFieldChecklist = (): string[] => {
        const list: string[] = [];
        if (!fullName.trim()) list.push('❌ Full name is empty');
        if (!email.trim()) list.push('❌ Email is empty');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) list.push('❌ Email format looks invalid');
        if (!phone.trim()) list.push('❌ Phone number is empty');
        else if (phone.replace(/\D/g, '').length < 10) list.push('❌ Phone must be 10 digits');
        if (!password || password.length < 6) list.push('❌ Password is too short (min 6)');
        if (!businessName.trim()) list.push('❌ Business name is empty');
        if (!pincode.trim() || !/^[0-9]{6}$/.test(pincode.trim())) list.push('❌ Pincode must be 6 digits');
        return list;
      };

      if (/already exists/i.test(apiMsg)) {
        title = 'Email already registered';
        friendly =
          'An account with this email already exists. Please sign in instead, or use a different email to register.';
        extra = {
          primaryLabel: 'GO TO SIGN IN',
          onPrimary: () => {
            setErrorPopup((p) => ({ ...p, visible: false }));
            navigation.replace('Login');
          },
          secondaryLabel: 'USE DIFFERENT EMAIL',
          onSecondary: () => {
            setErrorPopup((p) => ({ ...p, visible: false }));
            setStep(0);
          },
        };
      } else if (/pincode/i.test(apiMsg)) {
        title = 'Invalid pincode';
        friendly = 'Pincode must be a valid 6-digit Indian PIN code (e.g. 400001).';
        extra = {
          primaryLabel: 'FIX PINCODE',
          onPrimary: () => {
            setErrorPopup((p) => ({ ...p, visible: false }));
            setStep(0);
          },
        };
      } else if (/provide (email|password|name|phone)|required|Validation/i.test(apiMsg + ' ' + apiErrorDetail)) {
        title = 'Some fields need your attention';
        friendly =
          'The server rejected the application because one or more fields were missing or invalid. Please check the list below:';
        const checklist = buildFieldChecklist();
        extra = {
          checklist: checklist.length ? checklist : [
            'Server said: ' + (apiMsg || apiErrorDetail || 'a required field was missing'),
            'Re-open Step 1 & Step 2 and make sure every field is filled correctly.',
          ],
          primaryLabel: 'REVIEW STEP 1',
          onPrimary: () => {
            setErrorPopup((p) => ({ ...p, visible: false }));
            setStep(0);
          },
          secondaryLabel: 'STAY HERE',
          onSecondary: () => setErrorPopup((p) => ({ ...p, visible: false })),
        };
      } else if (/network|timeout|Network Error/i.test(apiMsg) || !status) {
        title = 'Connection problem';
        friendly =
          "We couldn't reach the UrbanAV servers. Check your internet connection and try again.";
      } else if (status === 400) {
        title = 'Registration rejected';
        friendly = apiMsg || 'The server rejected your application. Please review your details and try again.';
        // Still give the supplier a checklist of what we can see.
        const checklist = buildFieldChecklist();
        if (checklist.length) extra = { checklist };
      } else if (status >= 500) {
        title = 'Server error';
        friendly = apiMsg || 'Our servers hit an unexpected error. Please try again in a moment.';
      } else if (apiMsg) {
        friendly = apiMsg;
      }

      showError(title, friendly, extra);
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
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={SEMANTIC.error} strokeWidth={2} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}
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
                <GlassField
                  Icon={Home}
                  label="Address"
                  placeholder="House / Flat no, Street, Area"
                  value={address}
                  onChangeText={setAddress}
                  autoCapitalize="words"
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
                  Icon={Hash}
                  label="Pincode"
                  placeholder="400001"
                  value={pincode}
                  onChangeText={(t: string) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                />
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

                <Text style={[styles.fieldLabel, { marginTop: 6 }]}>Documents</Text>
                <View style={styles.docsIntro}>
                  <FileText size={14} color={NEON.glow} strokeWidth={1.8} />
                  <Text style={styles.docsIntroText}>
                    Upload required documents (PDF, JPG, PNG · Max 5 MB each). Admin verifies your GST / PAN from these documents.
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

      {/* Error popup — shown for API / upload failures so the supplier
          clearly knows what went wrong and what to do next. */}
      <Modal
        visible={errorPopup.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorPopup((p) => ({ ...p, visible: false }))}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={GRADIENT.appBg as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalIconWrap}>
              <View style={styles.modalIconErrorBg}>
                <XCircle size={36} color={SEMANTIC.error} strokeWidth={2} />
              </View>
            </View>
            <Text style={styles.modalTitle}>{errorPopup.title}</Text>
            <Text style={styles.modalBody}>{errorPopup.message}</Text>

            {errorPopup.checklist && errorPopup.checklist.length > 0 ? (
              <View style={styles.checklistBox}>
                {errorPopup.checklist.map((item, idx) => (
                  <View key={`${idx}-${item}`} style={styles.checklistRow}>
                    <View style={styles.checklistBullet}>
                      <AlertCircle size={12} color={SEMANTIC.error} strokeWidth={2.2} />
                    </View>
                    <Text style={styles.checklistText}>{item.replace(/^❌\s*/, '')}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <TouchableOpacity
              onPress={() => {
                if (errorPopup.onPrimary) errorPopup.onPrimary();
                else setErrorPopup((p) => ({ ...p, visible: false }));
              }}
              activeOpacity={0.85}
              style={styles.modalPrimaryBtn}
            >
              <LinearGradient
                colors={GRADIENT.brand as string[]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.modalPrimaryBtnText}>
                {errorPopup.primaryLabel || 'OK, GOT IT'}
              </Text>
            </TouchableOpacity>

            {errorPopup.secondaryLabel ? (
              <TouchableOpacity
                onPress={() => {
                  if (errorPopup.onSecondary) errorPopup.onSecondary();
                  else setErrorPopup((p) => ({ ...p, visible: false }));
                }}
                activeOpacity={0.85}
                style={styles.modalSecondaryBtn}
              >
                <Text style={styles.modalSecondaryBtnText}>
                  {errorPopup.secondaryLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Success / pending-approval popup — shown immediately after submit.
          Tapping CONTINUE sends the supplier to the full PendingApproval
          status screen (which is the admin-gate waiting room). */}
      <Modal
        visible={successPopup.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={GRADIENT.appBg as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalIconWrap}>
              <View style={styles.modalIconSuccessBg}>
                <ShieldCheck size={40} color={NEON.glow} strokeWidth={1.8} />
              </View>
            </View>
            <Text style={styles.modalTitle}>Application submitted</Text>
            <Text style={styles.modalBody}>
              {successPopup.kycUploaded
                ? 'Your supplier account is created and your KYC documents have been sent for review. Our team will verify your details within 24–48 hours.'
                : 'Your supplier account is created. You can upload your KYC documents later from “My Documents” inside the app. Admin will review and activate your account after receiving all documents.'}
            </Text>

            <View style={styles.pendingPill}>
              <Clock size={13} color={SEMANTIC.warning} strokeWidth={2.2} />
              <Text style={styles.pendingPillText}>Pending admin approval</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                console.log('🔄 CONTINUE button pressed - navigating to PendingApproval');
                console.log('📧 Email:', email.trim().toLowerCase());
                console.log('📄 KYC Uploaded:', successPopup.kycUploaded);
                
                // Close the success popup first
                setSuccessPopup({ visible: false, kycUploaded: false });
                
                // Small delay to ensure modal closes before navigation
                setTimeout(() => {
                  try {
                    console.log('🚀 Calling navigation.replace to PendingApproval...');
                    navigation.replace('PendingApproval', {
                      email: email.trim().toLowerCase(),
                      kycUploaded: successPopup.kycUploaded,
                    });
                    console.log('✅ Successfully navigated to PendingApproval');
                  } catch (navError) {
                    console.error('❌ Navigation failed:', navError);
                    // Fallback: try navigate instead of replace
                    navigation.navigate('PendingApproval', {
                      email: email.trim().toLowerCase(),
                      kycUploaded: successPopup.kycUploaded,
                    });
                  }
                }, 150);
              }}
              activeOpacity={0.85}
              style={styles.modalPrimaryBtn}
            >
              <LinearGradient
                colors={GRADIENT.brand as string[]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.modalPrimaryBtnText}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 85, 0.45)',
    backgroundColor: 'rgba(255, 85, 85, 0.10)',
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: SEMANTIC.error,
    fontWeight: '600',
    lineHeight: 18,
  },
  // Modal popup (error + pending-approval success)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 3, 18, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(247, 217, 255, 0.25)',
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    overflow: 'hidden',
    backgroundColor: SURFACE.base,
  },
  modalIconWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconErrorBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 85, 85, 0.45)',
    backgroundColor: 'rgba(255, 85, 85, 0.14)',
  },
  modalIconSuccessBg: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 102, 255, 0.5)',
    backgroundColor: 'rgba(230, 102, 255, 0.14)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: 'rgba(247, 217, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 16,
  },
  pendingPill: {
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
    marginBottom: 18,
  },
  pendingPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: SEMANTIC.warning,
    textTransform: 'uppercase',
  },
  modalPrimaryBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(247, 217, 255, 0.35)',
    overflow: 'hidden',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.4,
  },
  modalSecondaryBtn: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    backgroundColor: GLASS.tier2,
  },
  modalSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT.secondary,
    letterSpacing: 1.3,
  },
  checklistBox: {
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 85, 0.35)',
    backgroundColor: 'rgba(255, 85, 85, 0.08)',
    gap: 8,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checklistBullet: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checklistText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT.primary,
    fontWeight: '500',
  },
});
