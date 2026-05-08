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
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ShoppingCart,
  User,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  X,
  Phone,
  MapPin,
  MessageSquare,
  FileText,
  Package,
  ChevronRight,
} from 'lucide-react-native';
import {
  LightScreenBackground,
  LightCard,
  FadeInView,
  SlideUpView,
  LIGHT,
  NEON,
  NEU,
  SPACING,
  RADIUS,
  TYPE,
} from '../components/ui';
import { ordersAPI, otpAPI, resolveMediaUrl } from '../api';

// UI tab labels map to one-or-more backend statuses.
const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

// Map a raw backend status into a UI bucket.
function toBucket(order: any): 'upcoming' | 'ongoing' | 'completed' | 'cancelled' {
  const s = String(order?.status || '').toLowerCase();
  if (s === 'completed') return 'completed';
  if (s === 'cancelled') return 'cancelled';
  // OTP-derived: if start was verified but end wasn't, treat as ongoing
  // regardless of the stored status enum.
  if (order?.otpStartVerified && !order?.otpEndVerified) return 'ongoing';
  if (s === 'preparing' || s === 'delivered' || s === 'in-progress' || s === 'in_progress') return 'ongoing';
  return 'upcoming';
}

function bucketTint(bucket: string) {
  if (bucket === 'completed') return { bg: '#22E08226', fg: '#0E7A3C', label: 'COMPLETED' };
  if (bucket === 'cancelled') return { bg: '#FFB1B12A', fg: '#A8152B', label: 'CANCELLED' };
  if (bucket === 'ongoing') return { bg: '#C9B4FF30', fg: '#7B25F4', label: 'ONGOING' };
  return { bg: '#FDE68A40', fg: '#B8700B', label: 'UPCOMING' };
}

function paymentTint(status?: string) {
  const s = String(status || '').toLowerCase();
  if (s === 'paid') return { bg: '#22E08226', fg: '#0E7A3C', label: 'PAID' };
  if (s === 'refunded') return { bg: '#BFDBFE40', fg: '#0369A1', label: 'REFUNDED' };
  if (s === 'failed') return { bg: '#FFB1B12A', fg: '#A8152B', label: 'PAYMENT FAILED' };
  return { bg: '#FDE68A40', fg: '#B8700B', label: 'PAYMENT PENDING' };
}

function formatDate(value?: string | Date | null) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function SupplierOrdersScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const narrow = width < 360;

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

  const counts = useMemo(() => {
    const c = { upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 };
    for (const o of orders) c[toBucket(o)]++;
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o: any) => toBucket(o) === filter);
  }, [orders, filter]);

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

  const confirmCancel = (order: any) =>
    Alert.alert('Cancel order?', `Cancel order ${order.orderNumber || ''}?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          try {
            await ordersAPI.cancel(order.id ?? order._id);
            await load();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to cancel');
          }
        },
      },
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
            (o.id ?? o._id) === id
              ? { ...o, status: 'preparing', otpStartVerified: true }
              : o
          )
        );
      } else {
        await otpAPI.verifyEnd(id, otp);
        setOrders((prev: any[]) =>
          prev.map((o: any) =>
            (o.id ?? o._id) === id
              ? { ...o, status: 'completed', otpEndVerified: true }
              : o
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

  const openChat = (order: any) => {
    navigation.navigate('Chat', {
      orderId: order.id ?? order._id,
      supplierName: order.buyerId?.name || 'Buyer',
      buyerName: order.buyerId?.name || 'Buyer',
    });
  };

  const callBuyer = (phone?: string) => {
    if (!phone) {
      Alert.alert('No phone', 'This buyer has not shared a phone number.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  return (
    <LightScreenBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <FadeInView>
          <View
            style={{
              paddingHorizontal: SPACING.xl,
              paddingTop: SPACING.base,
              paddingBottom: SPACING.sm,
            }}
          >
            <Text style={[TYPE.h2, { color: LIGHT.text, letterSpacing: -0.3 }]}>Orders</Text>
            <Text
              style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 2 }]}
              numberOfLines={2}
            >
              {counts.upcoming} upcoming · {counts.ongoing} ongoing ·{' '}
              {counts.completed} completed · {orders.length} total
            </Text>
          </View>
        </FadeInView>

        {/* Filter Tabs - fixed row (no scroll) */}
        <FadeInView delay={80}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: SPACING.xs,
              paddingHorizontal: SPACING.xl,
              paddingBottom: SPACING.base,
              borderBottomWidth: 1,
              borderBottomColor: LIGHT.border,
            }}
          >
            {FILTERS.map((f) => {
              const selected = filter === f.value;
              const count =
                f.value === 'all' ? orders.length : (counts as any)[f.value] ?? 0;
              return (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: SPACING.sm,
                    paddingVertical: SPACING.xs,
                    borderRadius: RADIUS.md,
                    backgroundColor: selected ? NEON.purple : 'transparent',
                    borderWidth: 1,
                    borderColor: selected ? NEON.purple : LIGHT.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? '#FFF' : LIGHT.text,
                      fontWeight: '700',
                      fontSize: 11,
                    }}
                  >
                    {f.label}
                  </Text>
                  <View
                    style={{
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: selected ? 'rgba(255,255,255,0.22)' : NEU.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? '#FFF' : LIGHT.textTertiary,
                        fontSize: 10,
                        fontWeight: '700',
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
              gap: SPACING.sm,
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.purple} />
            }
          >
            {visible.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              visible.map((o: any, idx: number) => {
                const id = o.id ?? o._id;
                const bucket = toBucket(o);
                const tint = bucketTint(bucket);
                const rawStatus = String(o.status || 'pending').toLowerCase();
                const buyerObj = o.buyerId || {};
                const buyer = buyerObj.name || 'Buyer';
                const buyerPhone = buyerObj.phone;
                const buyerAvatar = resolveMediaUrl(buyerObj.avatar);
                const items: any[] = Array.isArray(o.items) ? o.items : [];
                const total = Number(o.totalAmount ?? 0);
                const addr = o.deliveryAddress || {};
                const addrSummary = [addr.city, addr.pincode].filter(Boolean).join(' · ');
                const pay = paymentTint(o.paymentStatus);
                const firstDate = items[0]?.eventDate;
                const lastDate = items[items.length - 1]?.returnDate || items[0]?.returnDate;

                return (
                  <SlideUpView key={id} delay={idx * 40}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('OrderDetail', { orderId: id, order: o })}
                    >
                      <LightCard padding={SPACING.base}>
                        {/* Top row: order no + date | status pill */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: SPACING.sm,
                            gap: SPACING.sm,
                          }}
                        >
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              style={[TYPE.bodySm, { color: LIGHT.text, fontWeight: '700' }]}
                              numberOfLines={1}
                            >
                              {o.orderNumber || `#${String(id).slice(-6)}`}
                            </Text>
                            <Text
                              style={[TYPE.tiny, { color: LIGHT.textMuted, marginTop: 2 }]}
                            >
                              Placed {formatDate(o.createdAt)}
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
                              {tint.label}
                            </Text>
                          </View>
                        </View>

                        {/* Buyer row */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: SPACING.sm,
                            marginBottom: SPACING.sm,
                          }}
                        >
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: `${NEON.purple}15`,
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}
                          >
                            {buyerAvatar ? (
                              <Image source={{ uri: buyerAvatar }} style={{ width: 36, height: 36 }} />
                            ) : (
                              <User size={16} color={NEON.purple} />
                            )}
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              style={[TYPE.caption, { color: LIGHT.text, fontWeight: '700' }]}
                              numberOfLines={1}
                            >
                              {buyer}
                            </Text>
                            {buyerPhone ? (
                              <TouchableOpacity
                                onPress={() => callBuyer(buyerPhone)}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                              >
                                <Phone size={10} color={NEON.purple} />
                                <Text
                                  style={[
                                    TYPE.tiny,
                                    { color: NEON.purple, fontWeight: '600' },
                                  ]}
                                >
                                  {buyerPhone}
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: RADIUS.full,
                              backgroundColor: pay.bg,
                            }}
                          >
                            <Text
                              style={{
                                color: pay.fg,
                                fontSize: 9,
                                fontWeight: '700',
                                letterSpacing: 0.4,
                              }}
                            >
                              {pay.label}
                            </Text>
                          </View>
                        </View>

                        {/* Items thumbnails */}
                        {items.length > 0 ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: SPACING.sm,
                              marginBottom: SPACING.sm,
                            }}
                          >
                            <View style={{ flexDirection: 'row' }}>
                              {items.slice(0, 3).map((it: any, i: number) => {
                                const img = resolveMediaUrl(it?.image || it?.equipmentId?.images?.[0]);
                                return (
                                  <View
                                    key={i}
                                    style={{
                                      width: 38,
                                      height: 38,
                                      borderRadius: 8,
                                      backgroundColor: LIGHT.cardSoft,
                                      borderWidth: 2,
                                      borderColor: LIGHT.bg,
                                      marginLeft: i === 0 ? 0 : -10,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {img ? (
                                      <Image
                                        source={{ uri: img }}
                                        style={{ width: 38, height: 38 }}
                                      />
                                    ) : (
                                      <Package size={14} color={LIGHT.textTertiary} />
                                    )}
                                  </View>
                                );
                              })}
                              {items.length > 3 ? (
                                <View
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 8,
                                    backgroundColor: LIGHT.cardSoft,
                                    borderWidth: 2,
                                    borderColor: LIGHT.bg,
                                    marginLeft: -10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: LIGHT.textSecondary,
                                      fontSize: 11,
                                      fontWeight: '700',
                                    }}
                                  >
                                    +{items.length - 3}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            <Text
                              style={[TYPE.caption, { color: LIGHT.textSecondary, flex: 1 }]}
                              numberOfLines={2}
                            >
                              {items.map((it: any) => it?.name || 'Item').join(' · ')}
                            </Text>
                          </View>
                        ) : null}

                        {/* Meta grid: address + event date */}
                        <View
                          style={{
                            backgroundColor: LIGHT.cardSoft,
                            borderRadius: RADIUS.md,
                            padding: SPACING.sm,
                            gap: 6,
                            marginBottom: SPACING.sm,
                          }}
                        >
                          {addrSummary ? (
                            <View
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                            >
                              <MapPin size={12} color={LIGHT.textTertiary} />
                              <Text
                                style={[TYPE.caption, { color: LIGHT.textSecondary, flex: 1 }]}
                                numberOfLines={1}
                              >
                                {addrSummary}
                              </Text>
                            </View>
                          ) : null}
                          {firstDate ? (
                            <View
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                            >
                              <CalendarDays size={12} color={LIGHT.textTertiary} />
                              <Text style={[TYPE.caption, { color: LIGHT.textSecondary }]}>
                                {formatDate(firstDate)}
                                {lastDate && lastDate !== firstDate
                                  ? ` → ${formatDate(lastDate)}`
                                  : ''}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Total */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: SPACING.sm,
                          }}
                        >
                          <Text style={[TYPE.caption, { color: LIGHT.textTertiary }]}>
                            {items.length} item{items.length === 1 ? '' : 's'}
                          </Text>
                          <Text style={[TYPE.h4, { color: LIGHT.text, fontWeight: '700' }]}>
                            ₹{total.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        {/* Actions per bucket */}
                        <OrderActions
                          narrow={narrow}
                          order={o}
                          rawStatus={rawStatus}
                          bucket={bucket}
                          onAccept={() => updateStatus(o, 'confirmed')}
                          onCancel={() => confirmCancel(o)}
                          onStart={() => openOtp(o, 'start')}
                          onEnd={() => openOtp(o, 'end')}
                          onChat={() => openChat(o)}
                          onView={() =>
                            navigation.navigate('OrderDetail', { orderId: id, order: o })
                          }
                        />
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
                {otpModal?.phase === 'start' ? 'Start Job — Verify OTP' : 'End Job — Verify OTP'}
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
              Ask the buyer for the 6-digit OTP to{' '}
              {otpModal?.phase === 'start' ? 'START' : 'COMPLETE'} this job.
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
                  VERIFY & {otpModal?.phase === 'start' ? 'START' : 'COMPLETE'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LightScreenBackground>
  );
}

// ────── Empty state per tab ──────
function EmptyState({ filter }: { filter: string }) {
  const messages: Record<string, { title: string; body: string }> = {
    all: { title: 'No orders yet', body: 'Orders from buyers will appear here.' },
    upcoming: {
      title: 'No upcoming orders',
      body: 'New and confirmed orders will appear in this tab.',
    },
    ongoing: {
      title: 'Nothing ongoing',
      body: 'Started jobs (after OTP verification) show up here.',
    },
    completed: {
      title: 'No completed orders',
      body: 'Finished jobs will be archived here.',
    },
    cancelled: {
      title: 'No cancelled orders',
      body: 'Cancelled or rejected orders appear here.',
    },
  };
  const m = messages[filter] || messages.all;
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: SPACING['3xl'],
        paddingHorizontal: SPACING.xl,
      }}
    >
      {/* Icon circle */}
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: `${NEON.purple}12`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.lg,
          borderWidth: 1,
          borderColor: `${NEON.purple}22`,
        }}
      >
        <ShoppingCart size={36} color={NEON.purple} strokeWidth={1.5} />
      </View>

      {/* Title */}
      <Text style={[TYPE.h4, { color: LIGHT.text, marginBottom: SPACING.xs }]}>
        {m.title}
      </Text>

      {/* Subtitle */}
      <Text
        style={[
          TYPE.body,
          {
            color: LIGHT.textTertiary,
            textAlign: 'center',
            marginBottom: SPACING.base,
            lineHeight: 20,
          },
        ]}
        numberOfLines={3}
      >
        {m.body}
      </Text>
    </View>
  );
}

// ────── Action rows per bucket ──────
function OrderActions({
  narrow,
  order,
  rawStatus,
  bucket,
  onAccept,
  onCancel,
  onStart,
  onEnd,
  onChat,
  onView,
}: {
  narrow: boolean;
  order: any;
  rawStatus: string;
  bucket: string;
  onAccept: () => void;
  onCancel: () => void;
  onStart: () => void;
  onEnd: () => void;
  onChat: () => void;
  onView: () => void;
}) {
  const row = { flexDirection: narrow ? ('column' as const) : ('row' as const), gap: SPACING.sm };

  if (bucket === 'completed') {
    return (
      <View style={row}>
        <ActionBtn
          tint={LIGHT.text}
          neutral
          icon={<FileText size={14} color={LIGHT.text} />}
          label="VIEW INVOICE"
          onPress={onView}
        />
        <ActionBtn
          tint={NEON.purple}
          icon={<MessageSquare size={14} color="#FFF" />}
          label="CHAT"
          onPress={onChat}
        />
      </View>
    );
  }

  if (bucket === 'cancelled') {
    return (
      <View style={row}>
        <ActionBtn
          tint={LIGHT.text}
          neutral
          icon={<FileText size={14} color={LIGHT.text} />}
          label="VIEW DETAILS"
          onPress={onView}
        />
        <ActionBtn
          tint={NEON.purple}
          icon={<MessageSquare size={14} color="#FFF" />}
          label="CHAT"
          onPress={onChat}
        />
      </View>
    );
  }

  if (bucket === 'ongoing') {
    return (
      <View style={row}>
        <ActionBtn
          tint="#0E7A3C"
          icon={<Square size={14} color="#FFF" />}
          label="END JOB (OTP)"
          onPress={onEnd}
        />
        <ActionBtn
          tint={NEON.purple}
          outline
          icon={<MessageSquare size={14} color={NEON.purple} />}
          label="CHAT"
          onPress={onChat}
        />
      </View>
    );
  }

  // Upcoming: split into pending vs confirmed
  if (rawStatus === 'pending') {
    return (
      <View style={row}>
        <ActionBtn
          tint={NEON.purple}
          icon={<CheckCircle2 size={14} color="#FFF" />}
          label="ACCEPT"
          onPress={onAccept}
        />
        <ActionBtn
          tint="#A8152B"
          outline
          icon={<XCircle size={14} color="#A8152B" />}
          label="CANCEL"
          onPress={onCancel}
        />
        <ActionBtn
          tint={LIGHT.text}
          neutral
          icon={<MessageSquare size={14} color={LIGHT.text} />}
          label="CHAT"
          onPress={onChat}
        />
      </View>
    );
  }

  // Upcoming/confirmed or otherwise
  return (
    <View style={row}>
      <ActionBtn
        tint={NEON.purple}
        icon={<Play size={14} color="#FFF" />}
        label="START JOB (OTP)"
        onPress={onStart}
      />
      <ActionBtn
        tint="#A8152B"
        outline
        icon={<XCircle size={14} color="#A8152B" />}
        label="CANCEL"
        onPress={onCancel}
      />
      <ActionBtn
        tint={LIGHT.text}
        neutral
        icon={<MessageSquare size={14} color={LIGHT.text} />}
        label="CHAT"
        onPress={onChat}
      />
    </View>
  );
}

function ActionBtn({
  tint,
  icon,
  label,
  onPress,
  outline = false,
  neutral = false,
}: {
  tint: string;
  icon?: any;
  label: string;
  onPress: () => void;
  outline?: boolean;
  neutral?: boolean;
}) {
  const bg = neutral ? LIGHT.cardSoft : outline ? 'transparent' : tint;
  const fg = neutral ? LIGHT.text : outline ? tint : '#FFF';
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 40,
        borderRadius: RADIUS.full,
        backgroundColor: bg,
        borderWidth: neutral ? 1 : outline ? 1 : 0,
        borderColor: neutral ? LIGHT.border : outline ? tint : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 10,
      }}
    >
      {icon}
      <Text
        style={{
          color: fg,
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
