import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ShoppingCart,
  User,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Key,
  Play,
  Square,
  X,
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
import { ordersAPI, otpAPI } from '../api';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
];

function statusTint(status: string): { bg: string; fg: string } {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return { bg: '#22E08226', fg: '#0E7A3C' };
  if (s === 'cancelled' || s === 'rejected') return { bg: '#FFB1B12A', fg: '#A8152B' };
  if (s === 'in-progress' || s === 'in_progress') return { bg: '#C9B4FF30', fg: '#7B25F4' };
  if (s === 'confirmed') return { bg: '#BFDBFE40', fg: '#0369A1' };
  return { bg: '#FDE68A40', fg: '#B8700B' };
}

export default function SupplierOrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [otpModal, setOtpModal] = useState<{ order: any; phase: 'start' | 'end' } | null>(null);
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await ordersAPI.getSupplierOrders();
      const list = res.data?.orders ?? res.data ?? [];
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

  const updateStatus = async (order: any, nextStatus: string) => {
    const id = order.id ?? order._id;
    try {
      await ordersAPI.updateStatus(id, { status: nextStatus });
      setOrders((prev: any[]) =>
        prev.map((o: any) =>
          (o.id ?? o._id) === id ? { ...o, status: nextStatus } : o
        )
      );
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update order');
    }
  };

  const confirmReject = (order: any) =>
    Alert.alert('Reject order?', `Reject order ${order.orderNumber || ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => updateStatus(order, 'cancelled') },
    ]);

  const openOtp = (order: any, phase: 'start' | 'end') => {
    setOtpModal({ order, phase });
    setOtp('');
  };

  const submitOtp = async () => {
    if (!otpModal) return;
    if (!otp || otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the OTP shared by the buyer.');
      return;
    }
    const id = otpModal.order.id ?? otpModal.order._id;
    setSubmitting(true);
    try {
      if (otpModal.phase === 'start') {
        await otpAPI.verifyStart(id, otp);
        setOrders((prev: any[]) =>
          prev.map((o: any) =>
            (o.id ?? o._id) === id ? { ...o, status: 'in-progress' } : o
          )
        );
      } else {
        await otpAPI.verifyEnd(id, otp);
        setOrders((prev: any[]) =>
          prev.map((o: any) =>
            (o.id ?? o._id) === id ? { ...o, status: 'completed' } : o
          )
        );
      }
      setOtpModal(null);
      setOtp('');
    } catch (e: any) {
      Alert.alert('OTP failed', e?.response?.data?.message || 'Invalid OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const visible = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o: any) => {
      const s = String(o.status || '').toLowerCase();
      if (filter === 'in-progress') return s === 'in-progress' || s === 'in_progress';
      return s === filter;
    });
  }, [orders, filter]);

  return (
    <LightScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <FadeInView>
          <View
            style={{
              paddingHorizontal: SPACING.xl,
              paddingTop: SPACING.base,
              paddingBottom: SPACING.sm,
            }}
          >
            <Text style={[TYPE.h2, { color: LIGHT.text, letterSpacing: -0.3 }]}>Orders</Text>
            <Text style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 2 }]}>
              {orders.length} total
            </Text>
          </View>
        </FadeInView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SPACING.xl,
            paddingBottom: SPACING.sm,
            gap: 8,
          }}
        >
          {FILTERS.map((f) => {
            const selected = filter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={{
                  paddingHorizontal: SPACING.base,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.full,
                  backgroundColor: selected ? NEON.purple : LIGHT.card,
                  borderWidth: 1,
                  borderColor: selected ? NEON.purple : LIGHT.border,
                }}
              >
                <Text
                  style={{
                    color: selected ? '#FFF' : LIGHT.text,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={NEON.purple} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: SPACING.xl,
              paddingBottom: 140,
              gap: SPACING.sm,
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.purple} />
            }
          >
            {visible.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: SPACING['3xl'] }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: `${NEON.purple}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: SPACING.base,
                  }}
                >
                  <ShoppingCart size={32} color={NEON.purple} strokeWidth={1.75} />
                </View>
                <Text style={[TYPE.h4, { color: LIGHT.text, marginBottom: SPACING.xs }]}>
                  No orders
                </Text>
                <Text style={[TYPE.body, { color: LIGHT.textTertiary, textAlign: 'center' }]}>
                  Orders from buyers will appear here.
                </Text>
              </View>
            ) : (
              visible.map((o: any, idx: number) => {
                const id = o.id ?? o._id;
                const status = String(o.status || 'pending').toLowerCase();
                const tint = statusTint(status);
                const buyer = o.buyerId?.name || o.buyer?.name || o.buyerName || 'Buyer';
                const items: any[] = Array.isArray(o.items) ? o.items : [];
                const total = Number(o.totalAmount ?? o.total ?? 0);
                return (
                  <SlideUpView key={id} delay={idx * 50}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('OrderDetail', { orderId: id, order: o })}
                    >
                      <LightCard padding={SPACING.base}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: SPACING.sm,
                          }}
                        >
                          <View>
                            <Text style={[TYPE.bodySm, { color: LIGHT.text, fontWeight: '700' }]}>
                              {o.orderNumber || `#${String(id).slice(-6)}`}
                            </Text>
                            <Text style={[TYPE.tiny, { color: LIGHT.textMuted, marginTop: 2 }]}>
                              {new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN')}
                            </Text>
                          </View>
                          <View
                            style={{
                              paddingHorizontal: SPACING.sm,
                              paddingVertical: 4,
                              borderRadius: RADIUS.full,
                              backgroundColor: tint.bg,
                            }}
                          >
                            <Text
                              style={{
                                color: tint.fg,
                                fontSize: 10,
                                fontWeight: '700',
                                letterSpacing: 0.5,
                              }}
                            >
                              {status.replace('_', '-').toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <User size={13} color={LIGHT.textTertiary} />
                          <Text
                            style={[TYPE.caption, { color: LIGHT.textSecondary, fontWeight: '600' }]}
                            numberOfLines={1}
                          >
                            {buyer}
                          </Text>
                        </View>

                        {items.length > 0 ? (
                          <Text
                            style={[TYPE.caption, { color: LIGHT.textTertiary }]}
                            numberOfLines={2}
                          >
                            {items.map((i: any) => i.name || 'Item').join(' · ')}
                          </Text>
                        ) : null}

                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: SPACING.sm,
                          }}
                        >
                          {items[0]?.eventDate ? (
                            <View
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            >
                              <CalendarDays size={12} color={LIGHT.textTertiary} />
                              <Text style={[TYPE.caption, { color: LIGHT.textTertiary }]}>
                                {new Date(items[0].eventDate).toLocaleDateString('en-IN')}
                              </Text>
                            </View>
                          ) : <View />}
                          <Text style={[TYPE.h4, { color: LIGHT.text, fontWeight: '700' }]}>
                            ₹{total.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        {/* Actions */}
                        {status === 'pending' ? (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: SPACING.sm }}>
                            <ActionBtn
                              tint={NEON.purple}
                              icon={<CheckCircle2 size={14} color="#FFF" />}
                              label="ACCEPT"
                              onPress={() => updateStatus(o, 'confirmed')}
                            />
                            <ActionBtn
                              tint="#A8152B"
                              outline
                              icon={<XCircle size={14} color="#A8152B" />}
                              label="REJECT"
                              onPress={() => confirmReject(o)}
                            />
                          </View>
                        ) : null}
                        {status === 'confirmed' ? (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: SPACING.sm }}>
                            <ActionBtn
                              tint="#0369A1"
                              outline
                              icon={<Key size={14} color="#0369A1" />}
                              label="MARK READY"
                              onPress={() => updateStatus(o, 'ready')}
                            />
                            <ActionBtn
                              tint={NEON.purple}
                              icon={<Play size={14} color="#FFF" />}
                              label="START (OTP)"
                              onPress={() => openOtp(o, 'start')}
                            />
                          </View>
                        ) : null}
                        {status === 'ready' ? (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: SPACING.sm }}>
                            <ActionBtn
                              tint={NEON.purple}
                              icon={<Play size={14} color="#FFF" />}
                              label="START WITH OTP"
                              onPress={() => openOtp(o, 'start')}
                            />
                          </View>
                        ) : null}
                        {status === 'in-progress' || status === 'in_progress' ? (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: SPACING.sm }}>
                            <ActionBtn
                              tint="#0E7A3C"
                              icon={<Square size={14} color="#FFF" />}
                              label="COMPLETE WITH OTP"
                              onPress={() => openOtp(o, 'end')}
                            />
                          </View>
                        ) : null}
                      </LightCard>
                    </TouchableOpacity>
                  </SlideUpView>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* OTP Modal */}
      <Modal
        visible={!!otpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setOtpModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <View
            style={{
              backgroundColor: LIGHT.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: SPACING.xl,
              paddingBottom: SPACING['2xl'],
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.base,
              }}
            >
              <Text style={[TYPE.h3, { color: LIGHT.text, fontWeight: '700' }]}>
                {otpModal?.phase === 'start' ? 'Verify Start OTP' : 'Verify Completion OTP'}
              </Text>
              <TouchableOpacity onPress={() => setOtpModal(null)}>
                <X size={22} color={LIGHT.text} />
              </TouchableOpacity>
            </View>
            <Text
              style={[
                TYPE.body,
                { color: LIGHT.textSecondary, marginBottom: SPACING.base },
              ]}
            >
              Enter the OTP shared by the buyer to{' '}
              {otpModal?.phase === 'start' ? 'start' : 'complete'} this order.
            </Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              placeholder="Enter OTP"
              placeholderTextColor={LIGHT.textMuted}
              maxLength={6}
              style={{
                backgroundColor: LIGHT.card,
                borderWidth: 1,
                borderColor: LIGHT.border,
                borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.base,
                height: 56,
                color: LIGHT.text,
                fontSize: 22,
                letterSpacing: 4,
                textAlign: 'center',
                marginBottom: SPACING.base,
              }}
            />
            <TouchableOpacity
              onPress={submitOtp}
              disabled={submitting}
              style={{
                backgroundColor: submitting ? `${NEON.purple}66` : NEON.purple,
                borderRadius: RADIUS.full,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: '#FFF', fontWeight: '700', letterSpacing: 0.6 }}>
                  VERIFY
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LightScreenBackground>
  );
}

function ActionBtn({
  tint,
  icon,
  label,
  onPress,
  outline = false,
}: {
  tint: string;
  icon?: any;
  label: string;
  onPress: () => void;
  outline?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flex: 1,
        height: 40,
        borderRadius: RADIUS.full,
        backgroundColor: outline ? 'transparent' : tint,
        borderWidth: outline ? 1 : 0,
        borderColor: outline ? tint : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {icon}
      <Text
        style={{
          color: outline ? tint : '#FFF',
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
