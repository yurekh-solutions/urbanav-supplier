'use client';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, StatusBar, SafeAreaView, KeyboardAvoidingView,
  TextInput, Alert,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT, GLASS, NEON, SEMANTIC } from '../theme/colors';
import { SPACING } from '../theme/spacing';

function GlassInput({
  label, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, autoCapitalize,
  maxLength, rightIcon,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean; keyboardType?: any; autoCapitalize?: any;
  maxLength?: number; rightIcon?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: SPACING.base }}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          style={styles.inputField}
          placeholder={placeholder}
          placeholderTextColor="rgba(247, 217, 255, 0.28)"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
        {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
      </View>
    </View>
  );
}

export default function KYCFormScreen({ navigation, route }: any) {
  const user = (route.params as any)?.user;

  const [gstNumber, setGst] = useState(user?.gstNumber || '');
  const [panNumber, setPan] = useState(user?.panNumber || '');
  const [city, setCity] = useState(user?.serviceArea?.city || '');
  const [state, setState] = useState(user?.serviceArea?.state || '');
  const [pincode, setPincode] = useState(user?.serviceArea?.pincode || '');
  const [fullAddress, setAddress] = useState(user?.serviceArea?.fullAddress || '');
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');
  const [accountNumber, setAcct] = useState(user?.bankDetails?.accountNumber || '');
  const [ifsc, setIfsc] = useState(user?.bankDetails?.ifsc || '');
  const [accountHolder, setHolder] = useState(user?.bankDetails?.accountHolderName || '');
  const [showAcct, setShowAcct] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!gstNumber || !panNumber || !city || !state) {
      setError('Please fill in all required fields (GST, PAN, City, State).'); return;
    }
    if (gstNumber.length !== 15) { setError('GST Number must be 15 characters.'); return; }
    if (panNumber.length !== 10) { setError('PAN Number must be 10 characters.'); return; }

    setLoading(true);
    setError('');
    try {
      await authAPI.submitKYC({
        gstNumber: gstNumber.toUpperCase(),
        panNumber: panNumber.toUpperCase(),
        serviceArea: { city, state, pincode, fullAddress },
        bankDetails: { bankName, accountNumber, ifsc: ifsc.toUpperCase(), accountHolderName: accountHolder },
      });
      Alert.alert(
        'KYC Submitted!',
        'Your documents have been submitted for review. Admin will approve your account soon.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENT.appBg as string[]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <View style={styles.backIcon}>
                  <Text style={styles.backArrow}>←</Text>
                </View>
                <Text style={styles.backLabel}>Back</Text>
              </TouchableOpacity>
            </View>

            {/* Logo + Badge */}
            <View style={styles.logoWrap}>
              <View style={styles.logoCircle} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>SUPPLIER PORTAL</Text>
              </View>
              <Text style={styles.title}>Complete Your KYC</Text>
              <Text style={styles.subtitle}>
                Submit your business and banking details. Admin reviews and approves your account.
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Business Information</Text>
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <GlassInput
                    label="GST NUMBER *"
                    placeholder="15-digit GST"
                    value={gstNumber}
                    maxLength={15}
                    onChangeText={(t: string) => setGst(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <GlassInput
                    label="PAN NUMBER *"
                    placeholder="10-char PAN"
                    value={panNumber}
                    maxLength={10}
                    onChangeText={(t: string) => setPan(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <Text style={[styles.sectionLabel, { marginTop: SPACING.base }]}>Service Area</Text>
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <GlassInput label="CITY *" placeholder="e.g. Mumbai" value={city}
                    onChangeText={setCity} autoCapitalize="words" />
                </View>
                <View style={{ flex: 1 }}>
                  <GlassInput label="STATE *" placeholder="e.g. Maharashtra" value={state}
                    onChangeText={setState} autoCapitalize="words" />
                </View>
              </View>
              <GlassInput label="PINCODE" placeholder="6-digit pincode" value={pincode}
                onChangeText={(t: string) => setPincode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="phone-pad" maxLength={6} />
              <GlassInput label="FULL ADDRESS" placeholder="Shop/Office address" value={fullAddress}
                onChangeText={setAddress} autoCapitalize="words" />

              <Text style={[styles.sectionLabel, { marginTop: SPACING.base }]}>Bank Details (for payouts)</Text>
              <GlassInput label="BANK NAME" placeholder="e.g. HDFC Bank" value={bankName}
                onChangeText={setBankName} autoCapitalize="words" />
              <GlassInput label="ACCOUNT HOLDER" placeholder="As per bank records" value={accountHolder}
                onChangeText={setHolder} autoCapitalize="words" />
              <GlassInput
                label="ACCOUNT NUMBER" placeholder="Bank account number"
                value={accountNumber}
                onChangeText={(t: string) => setAcct(t.replace(/[^0-9]/g, ''))}
                keyboardType="phone-pad"
                secureTextEntry={!showAcct}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowAcct(!showAcct)}>
                    {showAcct
                      ? <EyeOff size={18} color="rgba(247,217,255,0.55)" />
                      : <Eye size={18} color="rgba(247,217,255,0.55)" />}
                  </TouchableOpacity>
                }
              />
              <GlassInput label="IFSC CODE" placeholder="e.g. HDFC0001234" value={ifsc}
                onChangeText={(t: string) => setIfsc(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                autoCapitalize="characters" maxLength={11} />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                style={[styles.submitBtn, loading && styles.submitBtnLoading]}
              >
                <LinearGradient
                  colors={GRADIENT.brand as string[]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtnInner}
                >
                  <Text style={styles.submitBtnText}>
                    {loading ? 'SUBMITTING...' : 'SUBMIT KYC FOR REVIEW'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.note}>
                After submission, admin will review and approve your account within 24–48 hours.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },
  header: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(247, 217, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 16,
    color: 'rgba(247, 217, 255, 0.55)',
    marginTop: -1,
  },
  backLabel: {
    fontSize: 13,
    color: 'rgba(247, 217, 255, 0.5)',
    fontWeight: '500',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.14)',
    backgroundColor: 'rgba(247, 217, 255, 0.06)',
    marginBottom: SPACING.sm,
    shadowColor: NEON.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  badge: {
    backgroundColor: `${NEON.purple}18`,
    borderWidth: 1,
    borderColor: `${NEON.purple}40`,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: SPACING.sm,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: NEON.purple,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(247, 217, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: 'rgba(247, 217, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.12)',
    borderRadius: 22,
    padding: SPACING.xl,
    width: '100%',
    shadowColor: NEON.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(247, 217, 255, 0.45)',
    marginBottom: SPACING.base,
    textTransform: 'uppercase',
  },
  row2: {
    flexDirection: 'row',
    gap: SPACING.base,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 217, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: SPACING.base,
    minHeight: 50,
  },
  inputWrapFocused: {
    borderColor: 'rgba(123, 37, 244, 0.5)',
    backgroundColor: 'rgba(123, 37, 244, 0.08)',
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(247, 217, 255, 0.9)',
    paddingHorizontal: SPACING.base,
    paddingVertical: 13,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: 'rgba(247, 217, 255, 0.35)',
    marginBottom: 6,
  },
  labelFocused: { color: NEON.purple },
  errorBox: {
    backgroundColor: `${SEMANTIC.error}18`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${SEMANTIC.error}35`,
    padding: 12,
    marginBottom: SPACING.base,
  },
  errorText: {
    fontSize: 12.5,
    color: SEMANTIC.error,
    textAlign: 'center',
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: 14,
    marginTop: SPACING.sm,
    shadowColor: NEON.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  submitBtnLoading: { opacity: 0.55 },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  note: {
    fontSize: 11,
    color: 'rgba(247, 217, 255, 0.3)',
    textAlign: 'center',
    marginTop: SPACING.base,
    lineHeight: 17,
  },
});