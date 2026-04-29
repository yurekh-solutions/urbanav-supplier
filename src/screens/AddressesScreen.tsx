import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Home,
  Building2,
  CheckCircle2,
  X,
  Star,
} from 'lucide-react-native';
import {
  LightScreenBackground,
  LightCard,
  FadeInView,
  SlideUpView,
  LIGHT,
  SPACING,
  RADIUS,
  TYPE,
  SEMANTIC,
} from '../components/ui';
import { addressesAPI } from '../api';
import { useAuthStore } from '../store';

type Address = {
  _id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
};

const emptyForm = {
  _id: '',
  label: 'Home',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  isDefault: false,
};

export default function AddressesScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const { isGuest } = useAuthStore();
  const [list, setList] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const loadAddresses = useCallback(async () => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    try {
      const res = await addressesAPI.list();
      setList(res.data?.addresses || []);
    } catch {
      // keep whatever we had
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  const openCreate = () => {
    if (isGuest) return promptSignIn();
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (a: Address) => {
    setForm({
      _id: a._id,
      label: a.label || 'Home',
      line1: a.line1,
      line2: a.line2 || '',
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      phone: a.phone || '',
      isDefault: !!a.isDefault,
    });
    setModalOpen(true);
  };

  const promptSignIn = () =>
    Alert.alert(
      'Sign in required',
      'Create a free account to save delivery addresses.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('Login') },
      ]
    );

  const validate = () => {
    if (!form.line1.trim()) return 'Address line 1 is required';
    if (!form.city.trim()) return 'City is required';
    if (!form.state.trim()) return 'State is required';
    if (!/^\d{6}$/.test(form.pincode.trim()))
      return 'Enter a valid 6-digit pincode';
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) return Alert.alert('Check your details', err);
    setSaving(true);
    try {
      const payload = {
        label: form.label.trim() || 'Home',
        line1: form.line1.trim(),
        line2: form.line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        phone: form.phone.trim(),
        isDefault: form.isDefault,
      };
      const res = form._id
        ? await addressesAPI.update(form._id, payload)
        : await addressesAPI.create(payload);
      setList(res.data?.addresses || []);
      setModalOpen(false);
    } catch (e: any) {
      Alert.alert(
        'Save failed',
        e?.response?.data?.message || e?.message || 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = (a: Address) =>
    Alert.alert(
      'Delete address',
      `Remove "${a.label || 'address'}" from your saved list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await addressesAPI.remove(a._id);
              setList(res.data?.addresses || []);
            } catch (e: any) {
              Alert.alert('Delete failed', e?.message || 'Please try again.');
            }
          },
        },
      ]
    );

  const setDefault = async (a: Address) => {
    if (a.isDefault) return;
    try {
      const res = await addressesAPI.setDefault(a._id);
      setList(res.data?.addresses || []);
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not set default.');
    }
  };

  const cardPadding = width < 360 ? SPACING.md : SPACING.base;

  return (
    <LightScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: SPACING.base,
            paddingTop: SPACING.sm,
            paddingBottom: SPACING.md,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={{ padding: 4, marginRight: 4 }}
          >
            <ChevronLeft size={26} color={LIGHT.text} />
          </TouchableOpacity>
          <Text
            style={[
              TYPE.h2,
              { color: LIGHT.text, letterSpacing: -0.3, flex: 1 },
            ]}
          >
            Delivery Addresses
          </Text>
          <TouchableOpacity
            onPress={openCreate}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: SPACING.md,
              paddingVertical: 8,
              borderRadius: RADIUS.full,
              backgroundColor: LIGHT.accent,
            }}
          >
            <Plus size={16} color="#fff" strokeWidth={2.5} />
            <Text
              style={{
                color: '#fff',
                fontWeight: '700',
                marginLeft: 4,
                fontSize: 13,
              }}
            >
              Add
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: SPACING.base,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={LIGHT.accent}
              colors={[LIGHT.accent]}
            />
          }
        >
          {loading ? (
            <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
              <ActivityIndicator color={LIGHT.accent} />
            </View>
          ) : isGuest ? (
            <LightCard padding={cardPadding} style={{ alignItems: 'center' }}>
              <MapPin size={28} color={LIGHT.accent} />
              <Text
                style={[
                  TYPE.h4,
                  { color: LIGHT.text, marginTop: SPACING.sm, textAlign: 'center' },
                ]}
              >
                Sign in to save addresses
              </Text>
              <Text
                style={[
                  TYPE.caption,
                  {
                    color: LIGHT.textTertiary,
                    marginTop: 4,
                    textAlign: 'center',
                  },
                ]}
              >
                Your saved delivery & pickup locations sync across devices.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={{
                  marginTop: SPACING.base,
                  backgroundColor: LIGHT.accent,
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: 10,
                  borderRadius: RADIUS.full,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Sign in</Text>
              </TouchableOpacity>
            </LightCard>
          ) : list.length === 0 ? (
            <LightCard padding={cardPadding} style={{ alignItems: 'center' }}>
              <MapPin size={28} color={LIGHT.accent} />
              <Text
                style={[
                  TYPE.h4,
                  { color: LIGHT.text, marginTop: SPACING.sm, textAlign: 'center' },
                ]}
              >
                No saved addresses yet
              </Text>
              <Text
                style={[
                  TYPE.caption,
                  {
                    color: LIGHT.textTertiary,
                    marginTop: 4,
                    textAlign: 'center',
                  },
                ]}
              >
                Add a pickup or delivery address to speed up checkout.
              </Text>
              <TouchableOpacity
                onPress={openCreate}
                style={{
                  marginTop: SPACING.base,
                  backgroundColor: LIGHT.accent,
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: 10,
                  borderRadius: RADIUS.full,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Plus size={16} color="#fff" strokeWidth={2.5} />
                <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>
                  Add address
                </Text>
              </TouchableOpacity>
            </LightCard>
          ) : (
            list.map((a, idx) => {
              const Icon =
                a.label?.toLowerCase() === 'work' ? Building2 : Home;
              return (
                <FadeInView key={a._id} delay={idx * 40}>
                  <LightCard
                    padding={cardPadding}
                    style={{
                      marginBottom: SPACING.md,
                      borderWidth: a.isDefault ? 1.5 : 0,
                      borderColor: a.isDefault ? LIGHT.accent : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: SPACING.sm,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: LIGHT.accentSoft,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: SPACING.sm,
                        }}
                      >
                        <Icon size={18} color={LIGHT.accent} />
                      </View>
                      <Text
                        style={[
                          TYPE.body,
                          { color: LIGHT.text, fontWeight: '700', flex: 1 },
                        ]}
                        numberOfLines={1}
                      >
                        {a.label || 'Address'}
                      </Text>
                      {a.isDefault ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: RADIUS.full,
                            backgroundColor: LIGHT.accentSoft,
                          }}
                        >
                          <Star size={11} color={LIGHT.accent} />
                          <Text
                            style={{
                              color: LIGHT.accent,
                              fontSize: 10,
                              fontWeight: '800',
                              marginLeft: 3,
                              letterSpacing: 0.5,
                            }}
                          >
                            DEFAULT
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text
                      style={[
                        TYPE.body,
                        { color: LIGHT.text, lineHeight: 20 },
                      ]}
                    >
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ''}
                    </Text>
                    <Text
                      style={[
                        TYPE.caption,
                        { color: LIGHT.textSecondary, marginTop: 2 },
                      ]}
                    >
                      {a.city}, {a.state} {a.pincode}
                    </Text>
                    {a.phone ? (
                      <Text
                        style={[
                          TYPE.tiny,
                          { color: LIGHT.textTertiary, marginTop: 2 },
                        ]}
                      >
                        Phone: {a.phone}
                      </Text>
                    ) : null}

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: SPACING.md,
                        gap: SPACING.sm,
                      }}
                    >
                      {!a.isDefault ? (
                        <TouchableOpacity
                          onPress={() => setDefault(a)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: SPACING.md,
                            paddingVertical: 8,
                            borderRadius: RADIUS.full,
                            backgroundColor: LIGHT.accentSoft,
                          }}
                        >
                          <CheckCircle2 size={13} color={LIGHT.accent} />
                          <Text
                            style={{
                              color: LIGHT.accent,
                              fontWeight: '700',
                              fontSize: 12,
                              marginLeft: 5,
                            }}
                          >
                            Set default
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity
                        onPress={() => openEdit(a)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: SPACING.md,
                          paddingVertical: 8,
                          borderRadius: RADIUS.full,
                          backgroundColor: LIGHT.bgAlt,
                        }}
                      >
                        <Pencil size={13} color={LIGHT.text} />
                        <Text
                          style={{
                            color: LIGHT.text,
                            fontWeight: '700',
                            fontSize: 12,
                            marginLeft: 5,
                          }}
                        >
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => remove(a)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: SPACING.md,
                          paddingVertical: 8,
                          borderRadius: RADIUS.full,
                          backgroundColor: SEMANTIC.errorSoft,
                          marginLeft: 'auto',
                        }}
                      >
                        <Trash2 size={13} color={SEMANTIC.error} />
                      </TouchableOpacity>
                    </View>
                  </LightCard>
                </FadeInView>
              );
            })
          )}
        </ScrollView>

        {/* Modal form */}
        <Modal
          visible={modalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setModalOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
          >
            <View style={{ flex: 1 }} />
            <View
              style={{
                backgroundColor: LIGHT.card,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
                padding: SPACING.base,
                paddingBottom:
                  Platform.OS === 'ios' ? SPACING.xl : SPACING.base,
                maxHeight: '90%',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: SPACING.base,
                }}
              >
                <Text style={[TYPE.h3, { color: LIGHT.text }]}>
                  {form._id ? 'Edit Address' : 'New Address'}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalOpen(false)}
                  hitSlop={12}
                >
                  <X size={22} color={LIGHT.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Label chips */}
                <Text style={styles.fieldLabel}>LABEL</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: SPACING.xs,
                    marginBottom: SPACING.md,
                  }}
                >
                  {['Home', 'Work', 'Other'].map((l) => (
                    <TouchableOpacity
                      key={l}
                      onPress={() => setForm((s) => ({ ...s, label: l }))}
                      style={{
                        paddingHorizontal: SPACING.md,
                        paddingVertical: 8,
                        borderRadius: RADIUS.full,
                        backgroundColor:
                          form.label === l ? LIGHT.accent : LIGHT.bgAlt,
                      }}
                    >
                      <Text
                        style={{
                          color: form.label === l ? '#fff' : LIGHT.text,
                          fontWeight: '700',
                          fontSize: 12,
                        }}
                      >
                        {l}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {(
                  [
                    {
                      key: 'line1',
                      label: 'Address line 1',
                      placeholder: 'Flat / House / Street',
                    },
                    {
                      key: 'line2',
                      label: 'Address line 2 (optional)',
                      placeholder: 'Landmark, area',
                    },
                    { key: 'city', label: 'City', placeholder: 'Mumbai' },
                    { key: 'state', label: 'State', placeholder: 'Maharashtra' },
                    {
                      key: 'pincode',
                      label: 'Pincode',
                      placeholder: '400001',
                      keyboardType: 'number-pad' as const,
                    },
                    {
                      key: 'phone',
                      label: 'Phone (optional)',
                      placeholder: '+91 9xxxxxxxxx',
                      keyboardType: 'phone-pad' as const,
                    },
                  ] as const
                ).map((f) => (
                  <View key={f.key} style={{ marginBottom: SPACING.md }}>
                    <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
                    <TextInput
                      value={(form as any)[f.key]}
                      onChangeText={(v) =>
                        setForm((s) => ({ ...s, [f.key]: v }))
                      }
                      placeholder={f.placeholder}
                      placeholderTextColor={LIGHT.textMuted}
                      keyboardType={(f as any).keyboardType || 'default'}
                      style={styles.input}
                    />
                  </View>
                ))}

                <TouchableOpacity
                  onPress={() =>
                    setForm((s) => ({ ...s, isDefault: !s.isDefault }))
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 4,
                    marginBottom: SPACING.md,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: form.isDefault ? LIGHT.accent : LIGHT.border,
                      backgroundColor: form.isDefault
                        ? LIGHT.accent
                        : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    {form.isDefault ? (
                      <CheckCircle2 size={14} color="#fff" />
                    ) : null}
                  </View>
                  <Text style={{ color: LIGHT.text, fontWeight: '600' }}>
                    Set as default address
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity
                onPress={save}
                disabled={saving}
                style={{
                  backgroundColor: LIGHT.accent,
                  paddingVertical: SPACING.md,
                  borderRadius: RADIUS.lg,
                  alignItems: 'center',
                  marginTop: SPACING.sm,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    {form._id ? 'Save Changes' : 'Add Address'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </LightScreenBackground>
  );
}

const styles = {
  fieldLabel: {
    color: LIGHT.textTertiary,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: LIGHT.divider,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: LIGHT.text,
    fontSize: 15,
    backgroundColor: LIGHT.bg,
  },
};
