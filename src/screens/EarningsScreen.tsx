import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Wallet,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import {
  LightScreenBackground,
  LightCard,
  FadeInView,
  SlideUpView,
  LIGHT,
  NEON,
  SPACING,
  RADIUS,
  TYPE,
} from '../components/ui';
import { ordersAPI } from '../api';

function formatINR(paise: number): string {
  const rupees = Math.round(paise / 100);
  return '₹' + rupees.toLocaleString('en-IN');
}

export default function EarningsScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await ordersAPI.getSupplierOrders();
      const list: any[] = res.data?.orders ?? res.data ?? [];
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const {
    totalEarningsPaise,
    monthEarningsPaise,
    weekEarningsPaise,
    completedCount,
    pendingPayoutPaise,
    completedOrders,
  } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    let total = 0;
    let month = 0;
    let week = 0;
    let pendingPayout = 0;
    const completed: any[] = [];

    orders.forEach((o: any) => {
      const amt = Number(o.totalAmount ?? o.totalPaise ?? o.total ?? 0);
      const status = String(o.status || '').toLowerCase();
      const paymentStatus = String(o.paymentStatus || '').toLowerCase();
      const when = new Date(o.completedAt || o.updatedAt || o.createdAt || 0);

      if (status === 'completed') {
        total += amt;
        if (when >= monthStart) month += amt;
        if (when >= weekStart) week += amt;
        if (paymentStatus !== 'paid') pendingPayout += amt;
        completed.push(o);
      }
    });

    completed.sort((a: any, b: any) => {
      const da = new Date(a.completedAt || a.updatedAt || a.createdAt || 0).getTime();
      const db = new Date(b.completedAt || b.updatedAt || b.createdAt || 0).getTime();
      return db - da;
    });

    return {
      totalEarningsPaise: total,
      monthEarningsPaise: month,
      weekEarningsPaise: week,
      completedCount: completed.length,
      pendingPayoutPaise: pendingPayout,
      completedOrders: completed,
    };
  }, [orders]);

  return (
    <LightScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <FadeInView>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: SPACING.base,
              paddingTop: SPACING.sm,
              paddingBottom: SPACING.sm,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: LIGHT.card,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: LIGHT.border,
                marginRight: SPACING.sm,
              }}
            >
              <ChevronLeft size={20} color={LIGHT.text} />
            </TouchableOpacity>
            <Text style={[TYPE.h3, { color: LIGHT.text, fontWeight: '700' }]}>Earnings</Text>
          </View>
        </FadeInView>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={NEON.purple} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: SPACING.xl,
              paddingBottom: 140,
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.purple} />
            }
          >
            {/* Lifetime hero */}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Wallet size={18} color="#FFF" strokeWidth={2} />
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    marginLeft: 6,
                    letterSpacing: 1.2,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  LIFETIME EARNINGS
                </Text>
              </View>
              <Text
                style={{
                  color: '#FFF',
                  fontSize: 40,
                  fontWeight: '300',
                  letterSpacing: -0.8,
                }}
              >
                {formatINR(totalEarningsPaise)}
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  marginTop: 6,
                  fontSize: 12,
                }}
              >
                From {completedCount} completed {completedCount === 1 ? 'order' : 'orders'}
              </Text>
            </LinearGradient>

            {/* Period tiles */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
              <PeriodTile
                icon={TrendingUp}
                label="This Month"
                value={formatINR(monthEarningsPaise)}
                tint="#0E7A3C"
              />
              <PeriodTile
                icon={Calendar}
                label="This Week"
                value={formatINR(weekEarningsPaise)}
                tint="#0369A1"
              />
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl }}>
              <PeriodTile
                icon={Clock}
                label="Pending Payout"
                value={formatINR(pendingPayoutPaise)}
                tint="#B8700B"
              />
              <PeriodTile
                icon={CheckCircle2}
                label="Completed"
                value={String(completedCount)}
                tint={NEON.purple}
              />
            </View>

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
              COMPLETED ORDERS
            </Text>

            {completedOrders.length === 0 ? (
              <LightCard>
                <Text
                  style={[
                    TYPE.body,
                    { color: LIGHT.textSecondary, textAlign: 'center' },
                  ]}
                >
                  No completed orders yet. Earnings will appear here after you complete your first
                  order.
                </Text>
              </LightCard>
            ) : (
              completedOrders.map((o: any, idx: number) => {
                const id = o.id ?? o._id;
                const amount = Number(o.totalAmount ?? o.total ?? 0);
                const paid =
                  String(o.paymentStatus || '').toLowerCase() === 'paid';
                const buyer = o.buyerId?.name || o.buyer?.name || 'Buyer';
                return (
                  <SlideUpView key={id} delay={idx * 40}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() =>
                        navigation.navigate('OrderDetail', { orderId: id, order: o })
                      }
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
                            <Text
                              style={[TYPE.bodySm, { color: LIGHT.text, fontWeight: '700' }]}
                            >
                              {o.orderNumber || `#${String(id).slice(-6)}`}
                            </Text>
                            <Text
                              style={[
                                TYPE.caption,
                                { color: LIGHT.textTertiary, marginTop: 2 },
                              ]}
                              numberOfLines={1}
                            >
                              {buyer} ·{' '}
                              {new Date(
                                o.completedAt || o.updatedAt || o.createdAt || Date.now()
                              ).toLocaleDateString('en-IN')}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text
                              style={[
                                TYPE.body,
                                { color: LIGHT.text, fontWeight: '700' },
                              ]}
                            >
                              ₹{amount.toLocaleString('en-IN')}
                            </Text>
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: RADIUS.full,
                                backgroundColor: paid ? '#22E08226' : '#FDE68A40',
                                marginTop: 4,
                              }}
                            >
                              <Text
                                style={{
                                  color: paid ? '#0E7A3C' : '#B8700B',
                                  fontSize: 9,
                                  fontWeight: '700',
                                  letterSpacing: 0.4,
                                }}
                              >
                                {paid ? 'PAID' : 'PENDING'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </LightCard>
                    </TouchableOpacity>
                  </SlideUpView>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LightScreenBackground>
  );
}

function PeriodTile({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: any;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <LightCard padding={SPACING.base}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: `${tint}18`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.sm,
          }}
        >
          <Icon size={16} color={tint} strokeWidth={2} />
        </View>
        <Text
          style={[TYPE.h4, { color: LIGHT.text, fontWeight: '700', letterSpacing: -0.5 }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 2 }]}>{label}</Text>
      </LightCard>
    </View>
  );
}
