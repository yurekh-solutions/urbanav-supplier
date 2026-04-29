import React, { useCallback, useEffect, useState } from 'react';
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
import { MessageSquare, User, CalendarDays, X, Send } from 'lucide-react-native';
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
import { inquiryAPI } from '../api';

const FILTERS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Responded', value: 'responded' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'All', value: 'all' },
];

export default function IncomingInquiriesScreen({ navigation }: any) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responding, setResponding] = useState<any>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const visible =
    filter === 'all' ? inquiries : inquiries.filter((i: any) => String(i.status) === filter);

  const openRespond = (inq: any, kind: 'quote' | 'counter') => {
    setResponding({ ...inq, kind });
    setQuotePrice(String(inq.quotedPrice ?? ''));
    setQuoteNote('');
  };

  const submitRespond = async () => {
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
            <Text style={[TYPE.h2, { color: LIGHT.text, letterSpacing: -0.3 }]}>Inquiries</Text>
            <Text style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 2 }]}>
              {inquiries.filter((i: any) => i.status === 'pending').length} pending ·{' '}
              {inquiries.length} total
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
                  <MessageSquare size={32} color={NEON.purple} strokeWidth={1.75} />
                </View>
                <Text style={[TYPE.h4, { color: LIGHT.text, marginBottom: SPACING.xs }]}>
                  No inquiries
                </Text>
                <Text
                  style={[TYPE.body, { color: LIGHT.textTertiary, textAlign: 'center' }]}
                >
                  New buyer inquiries will appear here.
                </Text>
              </View>
            ) : (
              visible.map((inq: any, idx: number) => {
                const id = inq.id ?? inq._id;
                const buyer = inq.buyerId?.name || inq.buyer?.name || 'Buyer';
                const req = inq.requirementId || {};
                const status = String(inq.status || 'pending');
                const statusTint =
                  status === 'accepted'
                    ? '#0E7A3C'
                    : status === 'responded'
                    ? '#0369A1'
                    : status === 'rejected'
                    ? '#A8152B'
                    : '#B8700B';

                return (
                  <SlideUpView key={id} delay={idx * 50}>
                    <LightCard padding={SPACING.base}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: SPACING.sm,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 2,
                            }}
                          >
                            <User size={14} color={LIGHT.textTertiary} />
                            <Text
                              style={[TYPE.body, { color: LIGHT.text, fontWeight: '700' }]}
                            >
                              {buyer}
                            </Text>
                          </View>
                          {req.eventType ? (
                            <Text
                              style={[
                                TYPE.caption,
                                { color: LIGHT.textTertiary, marginBottom: 2 },
                              ]}
                            >
                              {String(req.eventType).toUpperCase()}
                            </Text>
                          ) : null}
                          {req.date ? (
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <CalendarDays size={12} color={LIGHT.textTertiary} />
                              <Text
                                style={[TYPE.caption, { color: LIGHT.textTertiary }]}
                              >
                                {new Date(req.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <View
                          style={{
                            paddingHorizontal: SPACING.sm,
                            paddingVertical: 4,
                            borderRadius: RADIUS.full,
                            backgroundColor: `${statusTint}22`,
                          }}
                        >
                          <Text
                            style={{
                              color: statusTint,
                              fontSize: 10,
                              fontWeight: '700',
                              letterSpacing: 0.5,
                            }}
                          >
                            {status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {Array.isArray(req.items) && req.items.length > 0 ? (
                        <Text
                          style={[TYPE.caption, { color: LIGHT.textSecondary, marginBottom: SPACING.xs }]}
                          numberOfLines={2}
                        >
                          {req.items
                            .map((it: any) => it.name || it.category || it)
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      ) : null}

                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: SPACING.xs,
                          marginBottom: SPACING.sm,
                        }}
                      >
                        <Text style={[TYPE.caption, { color: LIGHT.textTertiary }]}>
                          {req.budget ? `Budget: ₹${Number(req.budget).toLocaleString('en-IN')}` : ' '}
                        </Text>
                        <Text
                          style={[
                            TYPE.body,
                            { color: NEON.purple, fontWeight: '700' },
                          ]}
                        >
                          {inq.quotedPrice
                            ? `₹${Number(inq.quotedPrice).toLocaleString('en-IN')}`
                            : 'No quote yet'}
                        </Text>
                      </View>

                      {status !== 'accepted' && status !== 'rejected' ? (
                        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                          <TouchableOpacity
                            onPress={() => openRespond(inq, 'quote')}
                            style={{
                              flex: 1,
                              height: 40,
                              borderRadius: RADIUS.full,
                              backgroundColor: NEON.purple,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: '#FFF',
                                fontWeight: '700',
                                fontSize: 13,
                                letterSpacing: 0.4,
                              }}
                            >
                              {status === 'pending' ? 'SEND QUOTE' : 'COUNTER'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              navigation.navigate('Chat', {
                                inquiryId: id,
                                buyerName: buyer,
                              })
                            }
                            style={{
                              width: 44,
                              height: 40,
                              borderRadius: RADIUS.full,
                              backgroundColor: LIGHT.cardSoft,
                              borderWidth: 1,
                              borderColor: LIGHT.border,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MessageSquare size={16} color={LIGHT.text} />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </LightCard>
                  </SlideUpView>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Respond modal */}
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
              onPress={submitRespond}
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
    </LightScreenBackground>
  );
}
