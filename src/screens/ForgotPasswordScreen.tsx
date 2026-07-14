import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock, KeyRound, CheckCircle2 } from 'lucide-react-native';
import { authAPI } from '../api';
import { GRADIENT, GLASS, NEON, TEXT, SURFACE } from '../theme/colors';

type Step = 'email' | 'otp' | 'success';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentOtp, setSentOtp] = useState(''); // For dev mode

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.forgotPassword({ email: email.trim().toLowerCase() });
      if (res.data?.success) {
        // In dev mode, OTP is returned
        if (res.data.otp) setSentOtp(res.data.otp);
        setStep('otp');
      } else {
        setError(res.data?.message || 'Failed to send OTP');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter valid 6-digit OTP');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Use existing verify-otp endpoint which combines OTP verification + password reset
      const res = await authAPI.verifyOTP({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      });
      if (res.data?.success) {
        setStep('success');
      } else {
        setError(res.data?.message || 'Failed to reset password');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid OTP or failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENT.appBg as string[]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                {step === 'email' && <Mail size={32} color={NEON.glow} strokeWidth={1.8} />}
                {step === 'otp' && <Lock size={32} color={NEON.glow} strokeWidth={1.8} />}
                {step === 'success' && <CheckCircle2 size={32} color="#2ECC71" strokeWidth={1.8} />}
              </View>
              <Text style={styles.title}>
                {step === 'email' && 'Forgot Password?'}
                {step === 'otp' && 'Reset Password'}
                {step === 'success' && 'Password Reset!'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'email' && 'Enter your email to receive a reset OTP'}
                {step === 'otp' && 'Enter OTP and your new password'}
                {step === 'success' && 'You can now sign in with your new password'}
              </Text>
            </View>

            {/* Dev mode OTP display */}
            {sentOtp && step === 'otp' && (
              <View style={styles.devOtpBox}>
                <Text style={styles.devOtpLabel}>Dev Mode OTP:</Text>
                <Text style={styles.devOtpValue}>{sentOtp}</Text>
              </View>
            )}

            {/* Input fields */}
            {step === 'email' && (
              <View style={styles.inputWrapper}>
                <Mail size={18} color={TEXT.muted} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={TEXT.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            {step === 'otp' && (
              <>
                <View style={styles.inputWrapper}>
                  <KeyRound size={18} color={TEXT.muted} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor={TEXT.muted}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <View style={[styles.inputWrapper, { marginTop: 12 }]}>
                  <Lock size={18} color={TEXT.muted} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="New password (min 6 chars)"
                    placeholderTextColor={TEXT.muted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
                <View style={[styles.inputWrapper, { marginTop: 12 }]}>
                  <Lock size={18} color={TEXT.muted} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor={TEXT.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              </>
            )}

            {/* Error message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Action button */}
            {step !== 'success' && (
              <TouchableOpacity
                onPress={step === 'email' ? handleSendOtp : handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
                style={styles.actionBtn}
              >
                <LinearGradient
                  colors={GRADIENT.brand as string[]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>
                      {step === 'email' && 'Send OTP'}
                      {step === 'otp' && 'Reset Password'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Success button */}
            {step === 'success' && (
              <TouchableOpacity
                onPress={() => navigation.replace('Login')}
                activeOpacity={0.85}
                style={styles.actionBtn}
              >
                <LinearGradient
                  colors={GRADIENT.brand as string[]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionBtnGradient}
                >
                  <Text style={styles.actionBtnText}>GO TO SIGN IN</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Step indicator */}
            {step !== 'success' && (
              <View style={styles.stepIndicator}>
                {(['email', 'otp'] as Step[]).map((s, i) => (
                  <View
                    key={s}
                    style={[
                      styles.stepDot,
                      { backgroundColor: step === s ? NEON.glow : GLASS.tier2Border },
                    ]}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GLASS.tier2Border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(138, 69, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(138, 69, 232, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: TEXT.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  devOtpBox: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.4)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  devOtpLabel: {
    fontSize: 12,
    color: '#2ECC71',
    fontWeight: '600',
    marginBottom: 4,
  },
  devOtpValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2ECC71',
    letterSpacing: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GLASS.tier2,
    borderWidth: 1,
    borderColor: GLASS.tier2Border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  actionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 24,
    height: 56,
  },
  actionBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
