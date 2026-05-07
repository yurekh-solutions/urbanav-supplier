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
  ClipboardList,
  MapPin,
  CalendarDays,
  Clock,
  Wallet,
  Package,
  User,
  Send,
  X,
  Filter,
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
import { requirementAPI, inquiryAPI } from '../api';

type Requirement = {
  _id: string;
  buyerId?: { _id: string; name?: string } | string;
  location?: { address?: string; city?: string };
  eventType: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  items?: string[];
  budget?: string;
  notes?: string;
  status: string;
  createdAt: string;
};

const STATUS_FILTERS = [
  { label: 'Open', value: 'open' },
  { label: 'Matched', value: 'matched' },
  { label: 'All', value: 'all' },
];

export default function BrowseRequirementsScreen({ navigation }: any) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [status, setStatus] = useState<'open' | 'matched' | 'all'>('open');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [quoting, setQuoting] = useState<Requirement | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await requirementAPI.browse({ status, limit: 100 });
      const list = res.data?.requirements ?? res.data ?? [];
      setRequirements(list);
    } catch {
      setRequirements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openQuote = (r: Requirement) => {
    setQuoting(r);
    setQuotePrice('');
    setQuoteNote('');
  };

  const submitQuote = async () => {
    if (!quoting) return;
    const priceNum = Number(quotePrice);
    if (!priceNum || priceNum <= 0) {
      Alert.alert('Add a price', 'Please enter a valid quote price.');
      return;
    }
    setSubmitting(true);
    try {
      await inquiryAPI.send({
        vendorId: '', // backend ignores this when user is supplier
        requirementId: quoting._id,
        initialPrice: priceNum,
        // message is supported server-side via `message` field (see inquiries route)
        ...(quoteNote ? { message: quoteNote } : {}),
      } as any);
      Alert.alert('Quote sent', 'Your quote was shared with the buyer.');
      setQuoting(null);
      load();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Could not send quote. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const open = requirements.filter((r) => r.status === 'open').length;
    return { total: requirements.length, open };
  }, [requirements]);

  return (
    <LightScreenBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ paddingHorizontal: SPACING.base, paddingTop: SPACING.sm, paddingBottom: SPACING.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <ClipboardList size={22} color={NEON.glow} />
            <Text style={[TYPE.h2, { color: LIGHT.text, marginLeft: 8 }]}>Buyer Requirements</Text>
          </View>
          <Text style={[TYPE.caption, { color: LIGHT.textSecondary }]}>
            {summary.open} open · Browse posts and send a quote directly.
          </Text>
        </View>

        {/* Filter chips */}
        <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.base, marginBottom: SPACING.sm }}>
          {STATUS_FILTERS.map((f) => {
            const selected = status === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setStatus(f.value as any)}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: RADIUS.full,
                  marginRight: SPACING.sm,
                  backgroundColor: selected ? NEON.purple : 'rgba(255,255,255,0.6)',
                  borderWidth: 1,
                  borderColor: selected ? NEON.glow : 'rgba(180,150,220,0.35)',
                }}
              >
                <Text
                  style={[
                    TYPE.label,
                    { color: selected ? '#FFF' : LIGHT.textSecondary, fontWeight: '600' },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={NEON.glow} />
            <Text style={[TYPE.caption, { color: LIGHT.textSecondary, marginTop: 10 }]}>
              Loading requirements…
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: SPACING.base, paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.glow} />}
          >
            {requirements.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <ClipboardList size={48} color={LIGHT.textMuted} />
                <Text style={[TYPE.h4, { color: LIGHT.text, marginTop: 12 }]}>No requirements yet</Text>
                <Text style={[TYPE.caption, { color: LIGHT.textSecondary, marginTop: 6, textAlign: 'center' }]}>
                  When buyers post new requirements, they’ll show up here.
                </Text>
              </View>
            ) : (
              requirements.map((r, idx) => (
                <FadeInView key={r._id} delay={idx * 40}>
                  <LightCard style={{ marginBottom: SPACING.base }}>
                    {/* Header row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[TYPE.h4, { color: LIGHT.text }]} numberOfLines={1}>
                          {r.eventType}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                          <User size={12} color={LIGHT.textSecondary} />
                          <Text style={[TYPE.caption, { color: LIGHT.textSecondary, marginLeft: 4 }]} numberOfLines={1}>
                            {typeof r.buyerId === 'object' ? r.buyerId?.name ?? 'Buyer' : 'Buyer'}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: RADIUS.full,
                          backgroundColor:
                            r.status === 'open'
                              ? 'rgba(181, 255, 166, 0.35)'
                              : r.status === 'matched'
                              ? 'rgba(166, 215, 255, 0.35)'
                              : 'rgba(200,200,200,0.3)',
                        }}
                      >
                        <Text style={[TYPE.tiny, { color: LIGHT.text, fontWeight: '700' }]}>
                          {r.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Info rows */}
                    <View style={{ marginTop: SPACING.sm }}>
                      {(r.location?.address || r.location?.city) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <MapPin size={13} color={LIGHT.textSecondary} />
                          <Text style={[TYPE.caption, { color: LIGHT.text, marginLeft: 6, flex: 1 }]} numberOfLines={1}>
                            {r.location?.address}
                            {r.location?.city ? `, ${r.location.city}` : ''}
                          </Text>
                        </View>
                      )}
                      {r.date ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <CalendarDays size={13} color={LIGHT.textSecondary} />
                          <Text style={[TYPE.caption, { color: LIGHT.text, marginLeft: 6 }]}>
                            {r.date}
                          </Text>
                          {(r.startTime || r.endTime) && (
                            <>
                              <Clock size={13} color={LIGHT.textSecondary} style={{ marginLeft: 10 }} />
                              <Text style={[TYPE.caption, { color: LIGHT.text, marginLeft: 6 }]}>
                                {r.startTime || '—'}
                                {r.endTime ? ` – ${r.endTime}` : ''}
                              </Text>
                            </>
                          )}
                        </View>
                      ) : null}
                      {r.budget ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Wallet size={13} color={LIGHT.textSecondary} />
                          <Text style={[TYPE.caption, { color: LIGHT.text, marginLeft: 6 }]}>{r.budget}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Items */}
                    {r.items && r.items.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm }}>
                        {r.items.slice(0, 6).map((it) => (
                          <View
                            key={it}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: RADIUS.full,
                              backgroundColor: 'rgba(184, 61, 245, 0.12)',
                              borderWidth: 1,
                              borderColor: 'rgba(184, 61, 245, 0.3)',
                              marginRight: 6,
                              marginBottom: 6,
                            }}
                          >
                            <Text style={[TYPE.tiny, { color: NEON.purple, fontWeight: '700' }]} numberOfLines={1}>
                              {it}
                            </Text>
                          </View>
                        ))}
                        {r.items.length > 6 && (
                          <Text style={[TYPE.tiny, { color: LIGHT.textSecondary, marginTop: 6 }]}>
                            +{r.items.length - 6} more
                          </Text>
                        )}
                      </View>
                    )}

                    {r.notes ? (
                      <Text
                        style={[TYPE.caption, { color: LIGHT.textSecondary, marginTop: SPACING.sm, fontStyle: 'italic' }]}
                        numberOfLines={2}
                      >
                        “{r.notes}”
                      </Text>
                    ) : null}

                    {/* Action */}
                    <TouchableOpacity
                      disabled={r.status !== 'open'}
                      onPress={() => openQuote(r)}
                      activeOpacity={0.85}
                      style={{
                        marginTop: SPACING.md,
                        paddingVertical: 11,
                        borderRadius: RADIUS.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        backgroundColor: r.status === 'open' ? NEON.purple : 'rgba(0,0,0,0.08)',
                        opacity: r.status === 'open' ? 1 : 0.6,
                      }}
                    >
                      <Send size={15} color={r.status === 'open' ? '#FFF' : LIGHT.textMuted} />
                      <Text
                        style={[
                          TYPE.label,
                          {
                            color: r.status === 'open' ? '#FFF' : LIGHT.textMuted,
                            fontWeight: '700',
                            marginLeft: 8,
                          },
                        ]}
                      >
                        {r.status === 'open' ? 'Send Quote' : 'Closed'}
                      </Text>
                    </TouchableOpacity>
                  </LightCard>
                </FadeInView>
              ))
            )}
          </ScrollView>
        )}

        {/* Quote modal */}
        <Modal visible={!!quoting} animationType="slide" transparent onRequestClose={() => setQuoting(null)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}
          >
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: SPACING.lg,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                <Text style={[TYPE.h3, { color: LIGHT.text }]}>Send quote</Text>
                <TouchableOpacity onPress={() => setQuoting(null)}>
                  <X size={22} color={LIGHT.textSecondary} />
                </TouchableOpacity>
              </View>

              {quoting && (
                <Text style={[TYPE.caption, { color: LIGHT.textSecondary, marginBottom: SPACING.md }]}>
                  {quoting.eventType} · {quoting.location?.city || 'N/A'}
                  {quoting.date ? ` · ${quoting.date}` : ''}
                </Text>
              )}

              <Text style={[TYPE.label, { color: LIGHT.textSecondary, marginBottom: 6 }]}>
                Price (₹)
              </Text>
              <TextInput
                value={quotePrice}
                onChangeText={setQuotePrice}
                keyboardType="numeric"
                placeholder="e.g. 15000"
                placeholderTextColor={LIGHT.textMuted}
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(180,150,220,0.4)',
                  borderRadius: RADIUS.md,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: LIGHT.text,
                  marginBottom: SPACING.md,
                }}
              />

              <Text style={[TYPE.label, { color: LIGHT.textSecondary, marginBottom: 6 }]}>
                Message (optional)
              </Text>
              <TextInput
                value={quoteNote}
                onChangeText={setQuoteNote}
                placeholder="Include setup time, inclusions, any terms…"
                placeholderTextColor={LIGHT.textMuted}
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(180,150,220,0.4)',
                  borderRadius: RADIUS.md,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: LIGHT.text,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  marginBottom: SPACING.md,
                }}
              />

              <TouchableOpacity
                onPress={submitQuote}
                disabled={submitting}
                activeOpacity={0.85}
                style={{
                  backgroundColor: NEON.purple,
                  borderRadius: RADIUS.md,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Send size={16} color="#FFF" />
                    <Text style={[TYPE.label, { color: '#FFF', fontWeight: '700', marginLeft: 8 }]}>
                      Send Quote
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </LightScreenBackground>
  );
}
