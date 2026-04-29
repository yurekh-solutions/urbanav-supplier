import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  Modal,
  TextInput,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  FileText,
  ChevronRight,
  LogOut,
  ShoppingCart,
  Heart,
  Package,
  Zap,
  ShieldCheck,
  Briefcase,
  X,
  Phone,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import {
  LightScreenBackground,
  LightCard,
  FadeInView,
  SlideUpView,
  LIGHT,
  NEU,
  NEON,
  SPACING,
  RADIUS,
  TYPE,
  SEMANTIC,
} from '../components/ui';
import { useAuthStore } from '../store';
import { ordersAPI, notificationsAPI, uploadAPI, resolveMediaUrl } from '../api';
import { Camera } from 'lucide-react-native';
import { ShieldCheck as PrivacyIcon } from 'lucide-react-native';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
const formatINR = (paise: number): string => {
  if (!Number.isFinite(paise) || paise <= 0) return '—';
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}k`;
  return `₹${Math.round(rupees)}`;
};

const maskGST = (gst?: string) => {
  if (!gst || gst.length < 4) return gst || '';
  return `${gst.slice(0, 2)}•••••${gst.slice(-4)}`;
};

const APP_VERSION =
  (Constants.expoConfig as any)?.version ||
  (Constants.manifest as any)?.version ||
  '1.0.0';

// ────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }: any) {
  const { user, logout, isGuest, refreshUser, updateProfile } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [stats, setStats] = useState<{
    orders: number | null;
    rating: string;
    moneyLabel: 'Spent' | 'Earned';
    moneyValue: string;
    unread: number;
  }>({
    orders: null,
    rating: '—',
    moneyLabel: 'Spent',
    moneyValue: '—',
    unread: 0,
  });

  // Edit Profile modal
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    businessName: '',
    city: '',
    state: '',
  });

  const role: 'buyer' | 'supplier' | 'admin' =
    (user?.userType || user?.role || 'buyer') as any;
  const isSupplier = role === 'supplier';

  const loadAll = useCallback(async () => {
    if (isGuest || !user) {
      setLoading(false);
      return;
    }
    const [me, ordersRes, unreadRes] = await Promise.all([
      refreshUser().catch(() => null),
      ordersAPI.getSupplierOrders().catch(() => null),
      notificationsAPI.getUnreadCount().catch(() => null),
    ]);

    const liveUser = me || user;
    const orders: any[] =
      ordersRes?.data?.orders ?? ordersRes?.data ?? [];

    // Money aggregate: prefer user.totalEarnings for suppliers, sum for buyers.
    const summedPaise = orders.reduce((s, o) => {
      const amt =
        o.totalPaise ?? (typeof o.total === 'number' ? o.total * 100 : 0);
      return s + (Number(amt) || 0);
    }, 0);

    const totalPaise = isSupplier
      ? Number(liveUser?.totalEarnings) > 0
        ? Number(liveUser.totalEarnings) * 100
        : summedPaise
      : summedPaise;

    const totalOrders =
      typeof liveUser?.totalOrders === 'number'
        ? liveUser.totalOrders
        : orders.length;

    const ratingNum = Number(liveUser?.rating);
    const rating = ratingNum > 0 ? ratingNum.toFixed(1) : '—';

    const unread = Number(unreadRes?.data?.count ?? unreadRes?.data ?? 0) || 0;

    setStats({
      orders: totalOrders,
      rating,
      moneyLabel: isSupplier ? 'Earned' : 'Spent',
      moneyValue: formatINR(totalPaise),
      unread,
    });
    setLoading(false);
  }, [isGuest, user?.id, isSupplier, refreshUser]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const openEdit = () => {
    if (isGuest) return promptSignIn();
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      businessName: user?.businessName || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: { city: form.city.trim(), state: form.state.trim() },
      };
      if (isSupplier) payload.businessName = form.businessName.trim();
      await updateProfile(payload);
      setEditOpen(false);
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const promptSignIn = () =>
    Alert.alert(
      'Sign in required',
      'Create a free account to manage your profile.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('Login') },
      ]
    );

  const handleLogout = () => {
    if (isGuest) {
      navigation.navigate('Login');
      return;
    }
    setLogoutOpen(true);
  };

  const pickAndUploadAvatar = async () => {
    if (isGuest) return promptSignIn();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission required',
          'Please allow photo library access to change your profile picture.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      setUploadingAvatar(true);
      const mime = asset.mimeType || (asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg');
      const res = await uploadAPI.avatar(asset.uri, mime);
      if (!res?.data?.success) throw new Error(res?.data?.message || 'Upload failed');
      await refreshUser();
    } catch (e: any) {
      Alert.alert(
        'Upload failed',
        e?.response?.data?.message || e?.message || 'Please try again.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openMail = () =>
    Linking.openURL(
      'mailto:support@urbanav.in?subject=UrbanAV%20Support'
    ).catch(() => Alert.alert('Unable to open mail app'));

  const goGuarded = (route: string) => {
    if (isGuest) return promptSignIn();
    navigation.navigate(route as never);
  };

  const stub = (title: string) =>
    Alert.alert(title, 'This will be available in the next release.');

  const menuItems = useMemo(
    () => [
      {
        icon: User,
        label: 'Edit Profile',
        sub: 'Name, phone, business & address',
        onPress: openEdit,
      },
      {
        icon: MapPin,
        label: 'Delivery Addresses',
        sub:
          Array.isArray(user?.addresses) && user.addresses.length > 0
            ? `${user.addresses.length} saved address${user.addresses.length === 1 ? '' : 'es'}`
            : user?.address?.city
              ? `${user.address.city}${user.address.state ? ', ' + user.address.state : ''}`
              : 'Add a pickup / delivery address',
        onPress: () => goGuarded('Addresses'),
      },
      {
        icon: Bell,
        label: 'Notifications',
        sub:
          stats.unread > 0
            ? `${stats.unread} unread notification${stats.unread === 1 ? '' : 's'}`
            : 'All caught up',
        onPress: () => goGuarded('Notifications'),
        badge: stats.unread,
      },
      {
        icon: HelpCircle,
        label: 'Help & Support',
        sub: 'support@urbanav.in',
        onPress: openMail,
      },
      {
        icon: FileText,
        label: 'Terms & Conditions',
        sub: 'View terms of service',
        onPress: () => navigation.navigate('Terms' as never),
      },
      {
        icon: PrivacyIcon,
        label: 'Privacy Policy',
        sub: 'How we handle your data',
        onPress: () => navigation.navigate('Privacy' as never),
      },
    ],
    [user?.address?.city, user?.address?.state, user?.addresses?.length, stats.unread, isGuest, isSupplier]
  );

  const quickActions = [
    {
      icon: Package,
      label: 'My Orders',
      onPress: () =>
        isGuest ? promptSignIn() : navigation.navigate('Main', { screen: 'Orders' } as never),
    },
    {
      icon: ShoppingCart,
      label: 'Equipment',
      onPress: () =>
        isGuest ? promptSignIn() : navigation.navigate('Main', { screen: 'Equipment' } as never),
    },
    {
      icon: Heart,
      label: 'Earnings',
      onPress: () => (isGuest ? promptSignIn() : navigation.navigate('Earnings' as never)),
    },
  ];

  const initial = (user?.name || (isGuest ? 'G' : 'U'))
    .trim()
    .charAt(0)
    .toUpperCase();
  const hasAvatar = !!user?.avatar && typeof user.avatar === 'string';

  return (
    <LightScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
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
          <FadeInView>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: SPACING.base,
                paddingTop: SPACING.base,
                paddingBottom: SPACING.sm,
              }}
            >
              <Text style={[TYPE.h2, { color: LIGHT.text, letterSpacing: -0.3 }]}>
                Profile
              </Text>
              {loading && !refreshing ? (
                <ActivityIndicator size="small" color={LIGHT.accent} />
              ) : null}
            </View>
          </FadeInView>

          {/* User info card */}
          <FadeInView delay={60}>
            <View
              style={{
                paddingHorizontal: SPACING.base,
                marginBottom: SPACING.base,
              }}
            >
              <LightCard>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: SPACING.base,
                  }}
                >
                  {/* Avatar — image when available, else initial. Tap to upload. */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={pickAndUploadAvatar}
                    disabled={uploadingAvatar}
                    style={{
                      borderRadius: 32,
                      shadowColor: '#FFFFFF',
                      shadowOffset: { width: -4, height: -4 },
                      shadowOpacity: 0.9,
                      shadowRadius: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: NEU.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: `${NEON.purple}44`,
                        shadowColor: '#2D1558',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 0.35,
                        shadowRadius: 8,
                        elevation: 4,
                        overflow: 'hidden',
                      }}
                    >
                      {hasAvatar ? (
                        <Image
                          source={{ uri: resolveMediaUrl(user.avatar) as string }}
                          style={{ width: 64, height: 64 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text
                          style={{
                            color: NEON.glow,
                            fontSize: 26,
                            fontWeight: '700',
                          }}
                        >
                          {initial}
                        </Text>
                      )}
                    </View>
                    {/* Camera badge */}
                    <View
                      style={{
                        position: 'absolute',
                        right: -2,
                        bottom: -2,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: LIGHT.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: LIGHT.card,
                      }}
                    >
                      {uploadingAvatar ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Camera size={12} color="#fff" strokeWidth={2.4} />
                      )}
                    </View>
                  </TouchableOpacity>

                  <View style={{ flex: 1, marginLeft: SPACING.base }}>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text
                        style={[
                          TYPE.h3,
                          { color: LIGHT.text, letterSpacing: -0.2, flexShrink: 1 },
                        ]}
                        numberOfLines={1}
                      >
                        {user?.name || (isGuest ? 'Guest' : 'User')}
                      </Text>
                      {user?.isVerified ? (
                        <View style={{ marginLeft: 6 }}>
                          <ShieldCheck
                            size={16}
                            color={SEMANTIC.success}
                            strokeWidth={2.2}
                          />
                        </View>
                      ) : null}
                    </View>

                    <Text
                      style={[
                        TYPE.caption,
                        { color: LIGHT.textTertiary, marginTop: 2 },
                      ]}
                      numberOfLines={1}
                    >
                      {user?.email ||
                        (isGuest ? 'Sign in to save orders & chat' : '—')}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: SPACING.xs,
                        flexWrap: 'wrap',
                      }}
                    >
                      <View
                        style={{
                          paddingHorizontal: SPACING.sm,
                          paddingVertical: 3,
                          borderRadius: RADIUS.full,
                          backgroundColor: LIGHT.accentSoft,
                          marginRight: 6,
                        }}
                      >
                        <Text
                          style={[
                            TYPE.tiny,
                            {
                              color: LIGHT.accent,
                              fontWeight: '700',
                              letterSpacing: 0.5,
                            },
                          ]}
                        >
                          {role.toUpperCase()}
                        </Text>
                      </View>
                      {user?.phone ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <Phone size={11} color={LIGHT.textTertiary} />
                          <Text
                            style={[
                              TYPE.tiny,
                              { color: LIGHT.textTertiary, marginLeft: 3 },
                            ]}
                          >
                            {user.phone}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* Supplier-specific strip */}
                {isSupplier && (user?.businessName || user?.gstNumber) ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: LIGHT.accentSoft,
                      borderRadius: RADIUS.md,
                      padding: SPACING.sm,
                      marginBottom: SPACING.md,
                    }}
                  >
                    <Briefcase size={14} color={LIGHT.accent} />
                    <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                      <Text
                        style={[
                          TYPE.caption,
                          { color: LIGHT.text, fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {user?.businessName || 'Business'}
                      </Text>
                      {user?.gstNumber ? (
                        <Text
                          style={[
                            TYPE.tiny,
                            { color: LIGHT.textTertiary, marginTop: 1 },
                          ]}
                        >
                          GST {maskGST(user.gstNumber)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                <View style={{ height: 1, backgroundColor: LIGHT.divider }} />

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    paddingTop: SPACING.md,
                  }}
                >
                  {[
                    {
                      label: 'Orders',
                      value:
                        stats.orders === null ? '—' : String(stats.orders),
                    },
                    { label: 'Rating', value: stats.rating },
                    { label: stats.moneyLabel, value: stats.moneyValue },
                  ].map((stat) => (
                    <View key={stat.label} style={{ alignItems: 'center' }}>
                      <Text
                        style={[
                          TYPE.h3,
                          { color: LIGHT.accent, fontWeight: '700' },
                        ]}
                      >
                        {stat.value}
                      </Text>
                      <Text
                        style={[
                          TYPE.caption,
                          { color: LIGHT.textTertiary },
                        ]}
                      >
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </LightCard>
            </View>
          </FadeInView>

          {/* Quick actions */}
          <SlideUpView delay={120}>
            <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: SPACING.base,
                gap: SPACING.sm,
                marginBottom: SPACING.base,
              }}
            >
              {quickActions.map((action) => {
                const IconComp = action.icon;
                return (
                  <TouchableOpacity
                    key={action.label}
                    style={{ flex: 1 }}
                    onPress={action.onPress}
                  >
                    <LightCard
                      tinted
                      padding={SPACING.md}
                      style={{ alignItems: 'center' }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: LIGHT.accentSoft,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: SPACING.xs,
                        }}
                      >
                        <IconComp
                          size={20}
                          color={LIGHT.accent}
                          strokeWidth={1.75}
                        />
                      </View>
                      <Text
                        style={[
                          TYPE.tiny,
                          {
                            color: LIGHT.text,
                            textAlign: 'center',
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {action.label}
                      </Text>
                    </LightCard>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SlideUpView>

          {/* Menu */}
          <SlideUpView delay={180}>
            <View
              style={{
                paddingHorizontal: SPACING.base,
                marginBottom: SPACING.base,
              }}
            >
              <LightCard padding={0}>
                {menuItems.map((item, index) => {
                  const IconComp = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      onPress={item.onPress}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: SPACING.base,
                          borderBottomWidth:
                            index < menuItems.length - 1 ? 1 : 0,
                          borderBottomColor: LIGHT.divider,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: RADIUS.md,
                            backgroundColor: LIGHT.accentSoft,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: SPACING.md,
                          }}
                        >
                          <IconComp
                            size={18}
                            color={LIGHT.accent}
                            strokeWidth={1.75}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              TYPE.body,
                              { color: LIGHT.text, fontWeight: '600' },
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={[
                              TYPE.tiny,
                              { color: LIGHT.textTertiary, marginTop: 1 },
                            ]}
                            numberOfLines={1}
                          >
                            {item.sub}
                          </Text>
                        </View>
                        {item.badge && item.badge > 0 ? (
                          <View
                            style={{
                              minWidth: 22,
                              height: 22,
                              borderRadius: 11,
                              paddingHorizontal: 6,
                              backgroundColor: SEMANTIC.error,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: '700',
                              }}
                            >
                              {item.badge > 99 ? '99+' : item.badge}
                            </Text>
                          </View>
                        ) : null}
                        <ChevronRight size={16} color={LIGHT.textMuted} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </LightCard>
            </View>
          </SlideUpView>

          {/* App info */}
          <SlideUpView delay={240}>
            <View style={{ alignItems: 'center', paddingBottom: SPACING.base }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: SPACING.xs,
                }}
              >
                <Zap size={14} color={LIGHT.accent} />
                <Text
                  style={[
                    TYPE.caption,
                    { color: LIGHT.textMuted, marginLeft: 4 },
                  ]}
                >
                  UrbanAV v{APP_VERSION}
                </Text>
              </View>
              <Text style={[TYPE.tiny, { color: LIGHT.textMuted }]}>
                © {new Date().getFullYear()} UrbanAV. All rights reserved.
              </Text>
            </View>
          </SlideUpView>

          {/* Logout / Sign in */}
          <SlideUpView delay={280}>
            <View
              style={{
                paddingHorizontal: SPACING.base,
                marginBottom: SPACING.base,
              }}
            >
              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: SPACING.base,
                  borderRadius: RADIUS.lg,
                  backgroundColor: SEMANTIC.errorSoft,
                  borderWidth: 1,
                  borderColor: `${SEMANTIC.error}33`,
                }}
              >
                <LogOut size={20} color={SEMANTIC.error} />
                <Text
                  style={[
                    TYPE.button,
                    {
                      color: SEMANTIC.error,
                      marginLeft: SPACING.sm,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {isGuest ? 'Sign in to your account' : 'Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          </SlideUpView>
        </ScrollView>

        {/* Edit Profile modal */}
        <Modal
          visible={editOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setEditOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.45)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: LIGHT.card,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
                padding: SPACING.base,
                paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.base,
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
                  Edit Profile
                </Text>
                <TouchableOpacity
                  onPress={() => setEditOpen(false)}
                  hitSlop={10}
                >
                  <X size={22} color={LIGHT.textMuted} />
                </TouchableOpacity>
              </View>

              {(
                [
                  { key: 'name', label: 'Full Name', placeholder: 'Your name' },
                  {
                    key: 'phone',
                    label: 'Phone',
                    placeholder: '+91 •••••',
                    keyboardType: 'phone-pad' as const,
                  },
                  ...(isSupplier
                    ? [
                        {
                          key: 'businessName',
                          label: 'Business Name',
                          placeholder: 'Registered business',
                        },
                      ]
                    : []),
                  { key: 'city', label: 'City', placeholder: 'Mumbai' },
                  { key: 'state', label: 'State', placeholder: 'MH' },
                ] as const
              ).map((f) => (
                <View key={f.key} style={{ marginBottom: SPACING.md }}>
                  <Text
                    style={[
                      TYPE.tiny,
                      {
                        color: LIGHT.textTertiary,
                        fontWeight: '700',
                        letterSpacing: 0.6,
                        marginBottom: 4,
                      },
                    ]}
                  >
                    {f.label.toUpperCase()}
                  </Text>
                  <TextInput
                    value={(form as any)[f.key]}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, [f.key]: v }))
                    }
                    placeholder={f.placeholder}
                    placeholderTextColor={LIGHT.textMuted}
                    keyboardType={(f as any).keyboardType || 'default'}
                    style={{
                      borderWidth: 1,
                      borderColor: LIGHT.divider,
                      borderRadius: RADIUS.md,
                      paddingHorizontal: SPACING.md,
                      paddingVertical: SPACING.sm,
                      color: LIGHT.text,
                      fontSize: 15,
                      backgroundColor: LIGHT.bg,
                    }}
                  />
                </View>
              ))}

              <TouchableOpacity
                onPress={saveEdit}
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
                  <Text
                    style={[
                      TYPE.button,
                      { color: '#fff', fontWeight: '700' },
                    ]}
                  >
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Logout confirmation modal (themed, replaces Alert.alert) */}
        <Modal
          visible={logoutOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setLogoutOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setLogoutOpen(false)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(10, 4, 20, 0.55)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{
                width: '100%',
                maxWidth: 340,
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: SEMANTIC.errorSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 12,
                }}
              >
                <LogOut size={24} color={SEMANTIC.error} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: LIGHT.text,
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                Sign out of UrbanAV?
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: LIGHT.textSecondary,
                  textAlign: 'center',
                  lineHeight: 19,
                  marginBottom: 18,
                }}
              >
                You will need to sign back in to view your orders, saved addresses and notifications.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setLogoutOpen(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: LIGHT.divider,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: LIGHT.text, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    setLogoutOpen(false);
                    await logout();
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: RADIUS.md,
                    backgroundColor: SEMANTIC.error,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Sign out</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </LightScreenBackground>
  );
}
