import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Package,
  MessageSquare,
  ShoppingBag,
  TrendingUp,
  Plus,
  ChevronRight,
  Bell,
  Star,
  Wallet,
} from 'lucide-react-native';
import {
  LightScreenBackground,
  LightCard,
  TYPE,
  LIGHT,
  NEON,
  SPACING,
  RADIUS,
} from '../components/ui';
import { useAuthStore } from '../store';
import {
  equipmentAPI,
  ordersAPI,
  inquiryAPI,
  notificationsAPI,
  resolveMediaUrl,
} from '../api';

function formatINR(paise: number): string {
  const rupees = Math.round(paise / 100);
  return '₹' + rupees.toLocaleString('en-IN');
}

export default function SupplierHomeScreen({ navigation }: any) {
  const { user, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEarningsPaise: 0,
    monthEarningsPaise: 0,
    activeOrders: 0,
    pendingInquiries: 0,
    equipmentCount: 0,
    unreadNotifications: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const loadDashboard = useCallback(async () => {
    const [ordersRes, inquiriesRes, equipmentRes, notifRes] = await Promise.all([
      ordersAPI.getSupplierOrders().catch(() => null),
      inquiryAPI.getMine().catch(() => null),
      equipmentAPI.getMine().catch(() => null),
      notificationsAPI.getUnreadCount().catch(() => null),
    ]);

    const orders: any[] = ordersRes?.data?.orders ?? ordersRes?.data ?? [];
    const inquiries: any[] = inquiriesRes?.data?.inquiries ?? inquiriesRes?.data ?? [];
    const equipment: any[] = equipmentRes?.data?.equipment ?? equipmentRes?.data ?? [];

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let total = 0;
    let month = 0;
    let active = 0;
    orders.forEach((o: any) => {
      const amt = Number(o.totalPaise ?? o.total ?? 0);
      const status = String(o.status || '').toLowerCase();
      if (status === 'completed') {
        total += amt;
        const when = new Date(o.completedAt || o.updatedAt || o.createdAt || 0);
        if (when >= monthStart) month += amt;
      }
      if (['pending', 'confirmed', 'in-progress', 'in_progress'].includes(status)) {
        active += 1;
      }
    });

    const pending = inquiries.filter(
      (i: any) => String(i.status || '').toLowerCase() === 'pending'
    ).length;

    setStats({
      totalEarningsPaise: total,
      monthEarningsPaise: month,
      activeOrders: active,
      pendingInquiries: pending,
      equipmentCount: equipment.length,
      unreadNotifications: Number(notifRes?.data?.count ?? 0),
    });
    setRecentOrders(orders.slice(0, 3));
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser().catch(() => null);
      await loadDashboard();
      setLoading(false);
    })();
  }, [loadDashboard, refreshUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const avatarUrl = user?.avatar ? resolveMediaUrl(user.avatar) : null;

  return (
    <LightScreenBackground>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.xl,
            paddingTop: SPACING.sm,
            paddingBottom: SPACING.base,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: `${NEON.purple}15`,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: `${NEON.purple}33`,
                marginRight: SPACING.md,
                overflow: 'hidden',
              }}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ color: NEON.purple, fontWeight: '700', fontSize: 16 }}>
                  {(user?.businessName || user?.name || 'S').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.caption, { color: LIGHT.textTertiary }]}>Welcome back</Text>
              <Text
                style={[TYPE.h4, { color: LIGHT.text, fontWeight: '700' }]}
                numberOfLines={1}
              >
                {user?.businessName || user?.name || 'Supplier'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: LIGHT.card,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: LIGHT.border,
            }}
          >
            <Bell size={20} color={LIGHT.text} strokeWidth={1.75} />
            {stats.unreadNotifications > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#E14D8A',
                  paddingHorizontal: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
                  {stats.unreadNotifications > 9 ? '9+' : stats.unreadNotifications}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={NEON.purple} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: SPACING.xl,
              paddingBottom: SPACING['3xl'],
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.purple} />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Earnings hero */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Earnings')}>
              <LinearGradient
                colors={['#7B25F4', '#B06BFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: RADIUS.xl,
                  padding: SPACING.xl,
                  marginBottom: SPACING.base,
                  shadowColor: NEON.purple,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
                  <Wallet size={18} color="#FFF" strokeWidth={2} />
                  <Text
                    style={[
                      TYPE.caption,
                      { color: 'rgba(255,255,255,0.85)', marginLeft: 6, letterSpacing: 1, fontWeight: '600' },
                    ]}
                  >
                    THIS MONTH
                  </Text>
                </View>
                <Text
                  style={{
                    color: '#FFF',
                    fontSize: 36,
                    fontWeight: '300',
                    letterSpacing: -0.8,
                  }}
                >
                  {formatINR(stats.monthEarningsPaise)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm }}>
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                    Lifetime: {formatINR(stats.totalEarningsPaise)}
                  </Text>
                  <ChevronRight size={14} color="rgba(255,255,255,0.75)" style={{ marginLeft: 4 }} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Stats grid */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
              <StatTile
                icon={ShoppingBag}
                label="Active Orders"
                value={String(stats.activeOrders)}
                tint="#0E7A3C"
                onPress={() => navigation.navigate('Main', { screen: 'Orders' })}
              />
              <StatTile
                icon={MessageSquare}
                label="Pending"
                value={String(stats.pendingInquiries)}
                tint="#E14D8A"
                onPress={() => navigation.navigate('Main', { screen: 'Inquiries' })}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl }}>
              <StatTile
                icon={Package}
                label="Equipment"
                value={String(stats.equipmentCount)}
                tint="#7B25F4"
                onPress={() => navigation.navigate('Main', { screen: 'Equipment' })}
              />
              <StatTile
                icon={Star}
                label="Rating"
                value={user?.rating ? Number(user.rating).toFixed(1) : '—'}
                tint="#F59E0B"
              />
            </View>

            {/* Quick actions */}
            <Text
              style={[
                TYPE.caption,
                {
                  color: LIGHT.textTertiary,
                  letterSpacing: 1.2,
                  fontWeight: '700',
                  marginBottom: SPACING.sm,
                },
              ]}
            >
              QUICK ACTIONS
            </Text>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl }}>
              <ActionTile
                icon={Plus}
                label="Add Equipment"
                onPress={() => navigation.navigate('AddEditEquipment')}
              />
              <ActionTile
                icon={TrendingUp}
                label="View Earnings"
                onPress={() => navigation.navigate('Earnings')}
              />
            </View>

            {/* Recent orders */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: SPACING.sm,
              }}
            >
              <Text
                style={[
                  TYPE.caption,
                  { color: LIGHT.textTertiary, letterSpacing: 1.2, fontWeight: '700' },
                ]}
              >
                RECENT ORDERS
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Main', { screen: 'Orders' })}
              >
                <Text style={[TYPE.caption, { color: NEON.purple, fontWeight: '600' }]}>
                  View all
                </Text>
              </TouchableOpacity>
            </View>

            {recentOrders.length === 0 ? (
              <LightCard>
                <Text style={[TYPE.body, { color: LIGHT.textSecondary, textAlign: 'center' }]}>
                  No orders yet. Your first booking will appear here.
                </Text>
              </LightCard>
            ) : (
              recentOrders.map((o: any) => {
                const id = o.id ?? o._id;
                const status = String(o.status || 'pending');
                return (
                  <TouchableOpacity
                    key={id}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: id })}
                    style={{ marginBottom: SPACING.sm }}
                  >
                    <LightCard padding={SPACING.base}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[TYPE.bodySm, { color: LIGHT.text, fontWeight: '700' }]}>
                            {o.orderNumber || `#${String(id).slice(-6)}`}
                          </Text>
                          <Text
                            style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 2 }]}
                            numberOfLines={1}
                          >
                            {o.buyer?.name || o.buyerName || 'Buyer'} ·{' '}
                            {o.eventDate
                              ? new Date(o.eventDate).toLocaleDateString()
                              : 'TBD'}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: SPACING.sm,
                            paddingVertical: 4,
                            borderRadius: RADIUS.sm,
                            backgroundColor: statusTint(status) + '20',
                          }}
                        >
                          <Text
                            style={{
                              color: statusTint(status),
                              fontSize: 10,
                              fontWeight: '700',
                              letterSpacing: 0.6,
                            }}
                          >
                            {status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </LightCard>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LightScreenBackground>
  );
}

function statusTint(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed') return '#0E7A3C';
  if (s === 'cancelled' || s === 'rejected') return '#B42318';
  if (s === 'in-progress' || s === 'in_progress') return '#7B25F4';
  if (s === 'confirmed') return '#0369A1';
  return '#F59E0B';
}

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
  onPress,
}: {
  icon: any;
  label: string;
  value: string;
  tint: string;
  onPress?: () => void;
}) {
  const body = (
    <LightCard padding={SPACING.base} style={{ flex: 1 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: `${tint}18`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.sm,
        }}
      >
        <Icon size={18} color={tint} strokeWidth={2} />
      </View>
      <Text style={[TYPE.h2, { color: LIGHT.text, fontWeight: '700', letterSpacing: -0.5 }]}>
        {value}
      </Text>
      <Text style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 2 }]}>{label}</Text>
    </LightCard>
  );
  return onPress ? (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flex: 1 }}>
      {body}
    </TouchableOpacity>
  ) : (
    <View style={{ flex: 1 }}>{body}</View>
  );
}

function ActionTile({
  icon: Icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flex: 1 }}>
      <LightCard padding={SPACING.base}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.sm,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: `${NEON.purple}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} color={NEON.purple} strokeWidth={2} />
          </View>
          <Text
            style={[TYPE.bodySm, { color: LIGHT.text, fontWeight: '600', flex: 1 }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <ChevronRight size={16} color={LIGHT.textTertiary} />
        </View>
      </LightCard>
    </TouchableOpacity>
  );
}
