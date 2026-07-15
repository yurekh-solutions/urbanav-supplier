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
  Linking,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  MessageSquare,
  User,
  CalendarDays,
  X,
  Send,
  Phone,
  MapPin,
  Tag,
  IndianRupee,
  XCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
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
import { inquiryAPI, resolveMediaUrl } from '../api';

const FILTERS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Responded', value: 'responded' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

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

function statusTint(status: string) {
  if (status === 'accepted') return { bg: '#22E08226', fg: '#0E7A3C' };
  if (status === 'rejected') return { bg: '#FFB1B12A', fg: '#A8152B' };
  if (status === 'responded') return { bg: '#BFDBFE40', fg: '#0369A1' };
  return { bg: '#FDE68A40', fg: '#B8700B' };
}

function lastHistoryText(inq: any): string | null {
  const arr = Array.isArray(inq?.counterHistory) ? inq.counterHistory : [];
  if (!arr.length) return null;
  const last = arr[arr.length - 1];
  if (last.text) return `${last.from === 'vendor' ? 'You' : 'Buyer'}: ${last.text}`;
  if (last.price) return `${last.from === 'vendor' ? 'You' : 'Buyer'} quoted ₹${Number(last.price).toLocaleString('en-IN')}`;
  return null;
}

export default function IncomingInquiriesScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const narrow = width < 360;

  const [inquiries, setInquiries] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quote modal
  const [responding, setResponding] = useState<any>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reject modal
  const [rejecting, setRejecting] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await inquiryAPI.getMine();
      const list = res.data?.inquiries ?? res.data ?? [];
      setInquiries(list);
    } catch {
      setInquiries([]);
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
    const c = { pending: 0, responded: 0, accepted: 0, rejected: 0 };
    for (const i of inquiries) {
      const s = String(i.status || '').toLowerCase();
      if (s in c) (c as any)[s]++;
    }
    return c;
  }, [inquiries]);

  const visible = filter === 'all'
    ? inquiries
    : inquiries.filter((i: any) => String(i.status) === filter);

  const openQuote = (inq: any, kind: 'quote' | 'counter') => {
    setResponding({ ...inq, kind });
    setQuotePrice(String(inq.quotedPrice ?? ''));
    setQuoteNote('');
  };

  const submitQuote = async () => {
    if (!responding) return;
    if (!quotePrice || isNaN(Number(quotePrice))) {
      Alert.alert('Invalid price', 'Please enter a valid quote amount.');
      return;
    }
    setSubmitting(true);
    try {
      const id = responding.id ?? responding._id;
      await inquiryAPI.respond(id, {
        kind: responding.kind,
        price: Number(quotePrice),
        text: quoteNote || undefined,
      });
      setResponding(null);
      setQuotePrice('');
      setQuoteNote('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReject = async () => {
    if (!rejecting) return;
    setSubmitting(true);
    try {
      const id = rejecting.id ?? rejecting._id;
      await inquiryAPI.reject(id, rejectReason.trim() || undefined);
      setRejecting(null);
      setRejectReason('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to reject inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const openChat = (inq: any) => {
    const id = inq.id ?? inq._id;
    const buyer = inq.buyerId?.name || 'Buyer';
    navigation.navigate('Chat', {
      inquiryId: id,
      orderId: inq.orderId,
      supplierName: buyer,
      buyerName: buyer,
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
              paddingHorizontal: SPACING.base,
              paddingTop: SPACING.base,
              paddingBottom: SPACING.sm,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {navigation.canGoBack() ? (
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
                  marginRight: 12,
                }}
              >
                <ChevronLeft size={20} color={LIGHT.text} />
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.h2, { color: LIGHT.text, letterSpacing: -0.3 }]}>Requests</Text>
              <Text
                style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 2 }]}
                numberOfLines={2}
              >
                {counts.pending} pending · {counts.responded} responded ·{' '}
                {counts.accepted} accepted · {inquiries.length} total
              </Text>
            </View>
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
                f.value === 'all' ? inquiries.length : (counts as any)[f.value] ?? 0;
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
                  <MessageSquare size={36} color={NEON.purple} strokeWidth={1.5} />
                </View>

                {/* Title */}
                <Text style={[TYPE.h4, { color: LIGHT.text, marginBottom: SPACING.xs }]}>
                  {filter === 'all'
                    ? 'No inquiries yet'
                    : `No ${filter} inquiries`}
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
                  {filter === 'all'
                    ? 'New buyer inquiries will appear here once you\'re matched.'
                    : `There are currently no inquiries in the ${filter} state.`}
                </Text>

                {/* CTA Button */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Browse')}
                  style={{
                    paddingHorizontal: SPACING.xl,
                    paddingVertical: SPACING.sm,
                    borderRadius: RADIUS.full,
                    backgroundColor: NEON.purple,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    shadowColor: NEON.purple,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', letterSpacing: 0.5 }}>
                    BROWSE REQUIREMENTS
                  </Text>
                  <ChevronRight size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              visible.map((inq: any, idx: number) => {
                const id = inq.id ?? inq._id;
                const buyerObj = inq.buyerId || {};
                const buyer = buyerObj.name || 'Buyer';
                const phone = buyerObj.phone;
                const avatar = resolveMediaUrl(buyerObj.avatar) || null;
                const req = inq.requirementId || {};
                const loc = req.location || {};
                const status = String(inq.status || 'pending').toLowerCase();
                const tint = statusTint(status);
                const historyPreview = lastHistoryText(inq);

                const items: string[] = Array.isArray(req.items)
                  ? req.items
                      .map((it: any) => (typeof it === 'string' ? it : it?.name || it?.category))
                      .filter(Boolean)
                  : [];

                const eventWhen = formatDate(req.startAt || req.date);

                return (
                  <SlideUpView key={id} delay={idx * 40}>
                    <LightCard padding={SPACING.base}>
                      {/* Buyer header row */}
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
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: `${NEON.purple}15`,
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {avatar ? (
                            <Image source={{ uri: avatar }} style={{ width: 40, height: 40 }} />
                          ) : (
                            <User size={18} color={NEON.purple} />
                          )}
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={[TYPE.body, { color: LIGHT.text, fontWeight: '700' }]}
                            numberOfLines={1}
                          >
                            {buyer}
                          </Text>
                          {phone ? (
                            <TouchableOpacity
                              onPress={() => callBuyer(phone)}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            >
                              <Phone size={11} color={NEON.purple} />
                              <Text
                                style={[
                                  TYPE.caption,
                                  { color: NEON.purple, fontWeight: '600' },
                                ]}
                              >
                                {phone}
                              </Text>
                            </TouchableOpacity>
                          ) : null}
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
                            {status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Requirement summary */}
                      <View
                        style={{
                          backgroundColor: LIGHT.cardSoft,
                          borderRadius: RADIUS.md,
                          padding: SPACING.sm,
                          gap: 6,
                          marginBottom: SPACING.sm,
                        }}
                      >
                        {req.eventType ? (
                          <View
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                          >
                            <Tag size={12} color={LIGHT.textTertiary} />
                            <Text
                              style={[
                                TYPE.caption,
                                { color: LIGHT.textSecondary, fontWeight: '600' },
                              ]}
                            >
                              {String(req.eventType).toUpperCase()}
                            </Text>
                          </View>
                        ) : null}
                        {eventWhen ? (
                          <View
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                          >
                            <CalendarDays size={12} color={LIGHT.textTertiary} />
                            <Text style={[TYPE.caption, { color: LIGHT.textSecondary }]}>
                              {eventWhen}
                              {req.startTime ? ` · ${req.startTime}` : ''}
                              {req.endTime ? ` – ${req.endTime}` : ''}
                            </Text>
                          </View>
                        ) : null}
                        {(loc.city || loc.address) ? (
                          <View
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                          >
                            <MapPin size={12} color={LIGHT.textTertiary} />
                            <Text
                              style={[TYPE.caption, { color: LIGHT.textSecondary }]}
                              numberOfLines={1}
                            >
                              {loc.city || loc.address}
                            </Text>
                          </View>
                        ) : null}
                        {items.length > 0 ? (
                          <Text
                            style={[
                              TYPE.caption,
                              { color: LIGHT.textTertiary, marginTop: 2 },
                            ]}
                            numberOfLines={2}
                          >
                            {items.join(' · ')}
                          </Text>
                        ) : null}
                      </View>

                      {/* Price row */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: historyPreview ? SPACING.xs : SPACING.sm,
                        }}
                      >
                        <Text style={[TYPE.caption, { color: LIGHT.textTertiary }]}>
                          {req.budget ? `Budget: ${req.budget}` : 'Budget: flexible'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <IndianRupee size={14} color={NEON.purple} />
                          <Text
                            style={[
                              TYPE.body,
                              { color: NEON.purple, fontWeight: '700' },
                            ]}
                          >
                            {inq.quotedPrice
                              ? Number(inq.quotedPrice).toLocaleString('en-IN')
                              : 'No quote yet'}
                          </Text>
                        </View>
                      </View>

                      {historyPreview ? (
                        <Text
                          style={[
                            TYPE.caption,
                            {
                              color: LIGHT.textTertiary,
                              fontStyle: 'italic',
                              marginBottom: SPACING.sm,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {historyPreview}
                        </Text>
                      ) : null}

                      {/* Actions */}
                      {status === 'accepted' ? (
                        <View
                          style={{
                            flexDirection: narrow ? 'column' : 'row',
                            gap: SPACING.sm,
                          }}
                        >
                          <ActionButton
                            label="CHAT WITH BUYER"
                            icon={<MessageSquare size={14} color="#FFF" />}
                            color={NEON.purple}
                            onPress={() => openChat(inq)}
                          />
                        </View>
                      ) : status === 'rejected' ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: SPACING.sm,
                            alignItems: 'center',
                          }}
                        >
                          <XCircle size={14} color="#A8152B" />
                          <Text
                            style={[TYPE.caption, { color: '#A8152B', fontWeight: '600' }]}
                          >
                            You declined this inquiry
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={{
                            flexDirection: narrow ? 'column' : 'row',
                            gap: SPACING.sm,
                          }}
                        >
                          <ActionButton
                            label={status === 'pending' ? 'QUOTE' : 'COUNTER'}
                            icon={<IndianRupee size={14} color="#FFF" />}
                            color={NEON.purple}
                            onPress={() =>
                              openQuote(inq, status === 'pending' ? 'quote' : 'counter')
                            }
                          />
                          <ActionButton
                            label="REJECT"
                            icon={<XCircle size={14} color="#A8152B" />}
                            color="#A8152B"
                            outline
                            onPress={() => {
                              setRejecting(inq);
                              setRejectReason('');
                            }}
                          />
                          <ActionButton
                            label="CHAT"
                            icon={<MessageSquare size={14} color={LIGHT.text} />}
                            color={LIGHT.text}
                            neutral
                            onPress={() => openChat(inq)}
                          />
                        </View>
                      )}
                    </LightCard>
                  </SlideUpView>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Quote / Counter modal */}
      <Modal
        visible={!!responding}
        transparent
        animationType="slide"
        onRequestClose={() => setResponding(null)}
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
                {responding?.kind === 'counter' ? 'Send counter-offer' : 'Send quote'}
              </Text>
              <TouchableOpacity onPress={() => setResponding(null)}>
                <X size={22} color={LIGHT.text} />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                TYPE.caption,
                {
                  color: LIGHT.textTertiary,
                  letterSpacing: 1.1,
                  fontWeight: '700',
                  marginBottom: SPACING.xs,
                },
              ]}
            >
              PRICE (₹)
            </Text>
            <TextInput
              value={quotePrice}
              onChangeText={setQuotePrice}
              keyboardType="numeric"
              placeholder="e.g. 15000"
              placeholderTextColor={LIGHT.textMuted}
              style={{
                backgroundColor: LIGHT.card,
                borderWidth: 1,
                borderColor: LIGHT.border,
                borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.base,
                height: 48,
                color: LIGHT.text,
                fontSize: 16,
                marginBottom: SPACING.base,
              }}
            />

            <Text
              style={[
                TYPE.caption,
                {
                  color: LIGHT.textTertiary,
                  letterSpacing: 1.1,
                  fontWeight: '700',
                  marginBottom: SPACING.xs,
                },
              ]}
            >
              NOTE (OPTIONAL)
            </Text>
            <TextInput
              value={quoteNote}
              onChangeText={setQuoteNote}
              multiline
              placeholder="Inclusions, delivery, terms…"
              placeholderTextColor={LIGHT.textMuted}
              style={{
                backgroundColor: LIGHT.card,
                borderWidth: 1,
                borderColor: LIGHT.border,
                borderRadius: RADIUS.md,
                padding: SPACING.base,
                minHeight: 90,
                color: LIGHT.text,
                fontSize: 14,
                marginBottom: SPACING.base,
                textAlignVertical: 'top',
              }}
            />

            <TouchableOpacity
              onPress={submitQuote}
              disabled={submitting}
              style={{
                flexDirection: 'row',
                gap: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: submitting ? `${NEON.purple}66` : NEON.purple,
                borderRadius: RADIUS.full,
                paddingVertical: 14,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Send size={16} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: '700', letterSpacing: 0.5 }}>
                    SEND
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reject modal */}
      <Modal
        visible={!!rejecting}
        transparent
        animationType="fade"
        onRequestClose={() => setRejecting(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: SPACING.xl,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: LIGHT.bg,
              borderRadius: RADIUS.xl,
              padding: SPACING.xl,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.sm,
                marginBottom: SPACING.base,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#FFB1B12A',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle size={20} color="#A8152B" />
              </View>
              <Text style={[TYPE.h3, { color: LIGHT.text, fontWeight: '700', flex: 1 }]}>
                Reject inquiry?
              </Text>
            </View>
            <Text
              style={[TYPE.body, { color: LIGHT.textSecondary, marginBottom: SPACING.base }]}
            >
              The buyer will be notified. You can optionally share a reason.
            </Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              placeholder="e.g. Not available on this date"
              placeholderTextColor={LIGHT.textMuted}
              style={{
                backgroundColor: LIGHT.card,
                borderWidth: 1,
                borderColor: LIGHT.border,
                borderRadius: RADIUS.md,
                padding: SPACING.base,
                minHeight: 70,
                color: LIGHT.text,
                fontSize: 14,
                marginBottom: SPACING.base,
                textAlignVertical: 'top',
              }}
            />
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <TouchableOpacity
                onPress={() => setRejecting(null)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: RADIUS.full,
                  borderWidth: 1,
                  borderColor: LIGHT.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: LIGHT.text, fontWeight: '700' }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitReject}
                disabled={submitting}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: RADIUS.full,
                  backgroundColor: submitting ? '#A8152B88' : '#A8152B',
                  alignItems: 'center',
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700', letterSpacing: 0.5 }}>
                    REJECT
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LightScreenBackground>
  );
}

// ────── Small action button ──────
function ActionButton({
  label,
  icon,
  color,
  onPress,
  outline = false,
  neutral = false,
}: {
  label: string;
  icon?: any;
  color: string;
  onPress: () => void;
  outline?: boolean;
  neutral?: boolean;
}) {
  const bg = neutral ? LIGHT.cardSoft : outline ? 'transparent' : color;
  const fg = neutral ? LIGHT.text : outline ? color : '#FFF';
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
        borderColor: neutral ? LIGHT.border : outline ? color : 'transparent',
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
