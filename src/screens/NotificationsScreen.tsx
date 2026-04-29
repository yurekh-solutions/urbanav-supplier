import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Bell,
  BellOff,
  Package,
  MessageSquare,
  Sparkles,
  CheckCheck,
} from 'lucide-react-native';
import {
  LightScreenBackground,
  LightCard,
  FadeInView,
  LIGHT,
  SPACING,
  RADIUS,
  TYPE,
  SEMANTIC,
} from '../components/ui';
import { notificationsAPI } from '../api';
import { useAuthStore } from '../store';

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
};

type Prefs = {
  push: boolean;
  email: boolean;
  sms: boolean;
  orderUpdates: boolean;
  inquiryUpdates: boolean;
  promotions: boolean;
};

const defaultPrefs: Prefs = {
  push: true,
  email: true,
  sms: false,
  orderUpdates: true,
  inquiryUpdates: true,
  promotions: false,
};

const fmtDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
};

export default function NotificationsScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const { user, isGuest, updateProfile } = useAuthStore();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(
    (user?.notificationPrefs as Prefs) || defaultPrefs
  );

  const load = useCallback(async () => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    try {
      const res = await notificationsAPI.getAll();
      const list: NotificationItem[] =
        res.data?.notifications ?? res.data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.notificationPrefs) setPrefs(user.notificationPrefs);
  }, [user?.notificationPrefs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setItems((list) => list.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const markOneRead = async (id: string) => {
    setItems((list) =>
      list.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    try {
      await notificationsAPI.markAsRead(id);
    } catch {}
  };

  const togglePref = async (key: keyof Prefs) => {
    const next: Prefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await updateProfile({ notificationPrefs: next });
    } catch {
      // revert on failure
      setPrefs(prefs);
    }
  };

  const cardPadding = width < 360 ? SPACING.md : SPACING.base;
  const unreadCount = items.filter((n) => !n.read).length;

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
            Notifications
          </Text>
          {unreadCount > 0 ? (
            <TouchableOpacity
              onPress={markAllRead}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: RADIUS.full,
                backgroundColor: LIGHT.accentSoft,
              }}
            >
              <CheckCheck size={13} color={LIGHT.accent} />
              <Text
                style={{
                  color: LIGHT.accent,
                  fontSize: 11,
                  fontWeight: '800',
                  marginLeft: 4,
                }}
              >
                Mark all read
              </Text>
            </TouchableOpacity>
          ) : null}
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
          {/* Preferences */}
          <Text
            style={{
              color: LIGHT.textTertiary,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            PREFERENCES
          </Text>
          <LightCard padding={0} style={{ marginBottom: SPACING.lg }}>
            {(
              [
                {
                  key: 'push',
                  label: 'Push notifications',
                  sub: 'In-app and device alerts',
                  icon: Bell,
                },
                {
                  key: 'email',
                  label: 'Email updates',
                  sub: 'Receipts and important updates',
                  icon: Bell,
                },
                {
                  key: 'sms',
                  label: 'SMS',
                  sub: 'Only for OTPs and critical alerts',
                  icon: Bell,
                },
                {
                  key: 'orderUpdates',
                  label: 'Order updates',
                  sub: 'Booking, pickup, and return status',
                  icon: Package,
                },
                {
                  key: 'inquiryUpdates',
                  label: 'Inquiry & chat',
                  sub: 'Supplier messages and quotes',
                  icon: MessageSquare,
                },
                {
                  key: 'promotions',
                  label: 'Promotions',
                  sub: 'Deals and seasonal offers',
                  icon: Sparkles,
                },
              ] as const
            ).map((row, idx, arr) => {
              const Icon = row.icon;
              const val = !!prefs[row.key];
              return (
                <View
                  key={row.key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: SPACING.base,
                    borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                    borderBottomColor: LIGHT.divider,
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
                      marginRight: SPACING.md,
                    }}
                  >
                    <Icon size={16} color={LIGHT.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        TYPE.body,
                        { color: LIGHT.text, fontWeight: '600' },
                      ]}
                    >
                      {row.label}
                    </Text>
                    <Text
                      style={[
                        TYPE.tiny,
                        { color: LIGHT.textTertiary, marginTop: 1 },
                      ]}
                      numberOfLines={1}
                    >
                      {row.sub}
                    </Text>
                  </View>
                  <Switch
                    value={val}
                    onValueChange={() => togglePref(row.key)}
                    trackColor={{ false: LIGHT.border, true: LIGHT.accent }}
                    thumbColor="#fff"
                    disabled={isGuest}
                  />
                </View>
              );
            })}
          </LightCard>

          {/* Recent notifications */}
          <Text
            style={{
              color: LIGHT.textTertiary,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            RECENT
          </Text>

          {loading ? (
            <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
              <ActivityIndicator color={LIGHT.accent} />
            </View>
          ) : items.length === 0 ? (
            <LightCard padding={cardPadding} style={{ alignItems: 'center' }}>
              <BellOff size={26} color={LIGHT.textTertiary} />
              <Text
                style={[
                  TYPE.body,
                  {
                    color: LIGHT.text,
                    marginTop: 6,
                    fontWeight: '700',
                  },
                ]}
              >
                {isGuest ? 'Sign in to see notifications' : "You're all caught up"}
              </Text>
              <Text
                style={[
                  TYPE.caption,
                  {
                    color: LIGHT.textTertiary,
                    textAlign: 'center',
                    marginTop: 4,
                  },
                ]}
              >
                {isGuest
                  ? 'Create an account to get booking & chat alerts.'
                  : 'New order, chat, and inquiry updates will appear here.'}
              </Text>
            </LightCard>
          ) : (
            items.map((n, idx) => (
              <FadeInView key={n._id} delay={idx * 30}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => !n.read && markOneRead(n._id)}
                >
                  <LightCard
                    padding={cardPadding}
                    style={{
                      marginBottom: SPACING.sm,
                      borderLeftWidth: n.read ? 0 : 3,
                      borderLeftColor: LIGHT.accent,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: n.read
                            ? LIGHT.bgAlt
                            : LIGHT.accentSoft,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: SPACING.sm,
                        }}
                      >
                        <Bell
                          size={16}
                          color={n.read ? LIGHT.textTertiary : LIGHT.accent}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            TYPE.body,
                            {
                              color: LIGHT.text,
                              fontWeight: n.read ? '600' : '700',
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {n.title || 'Notification'}
                        </Text>
                        {n.message ? (
                          <Text
                            style={[
                              TYPE.caption,
                              { color: LIGHT.textSecondary, marginTop: 2 },
                            ]}
                            numberOfLines={3}
                          >
                            {n.message}
                          </Text>
                        ) : null}
                        <Text
                          style={[
                            TYPE.tiny,
                            { color: LIGHT.textTertiary, marginTop: 4 },
                          ]}
                        >
                          {fmtDate(n.createdAt)}
                        </Text>
                      </View>
                      {!n.read ? (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: SEMANTIC.error,
                            marginLeft: 6,
                            marginTop: 6,
                          }}
                        />
                      ) : null}
                    </View>
                  </LightCard>
                </TouchableOpacity>
              </FadeInView>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LightScreenBackground>
  );
}
