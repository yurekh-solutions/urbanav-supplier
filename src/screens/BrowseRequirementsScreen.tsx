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
  Users,
  Send,
  X,
  Filter,
  CheckCircle,
  ChevronLeft,
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
  offersCount?: number;
  myOffer?: { price: number; note?: string } | null;
};
type FilterTab = 'open' | 'my_offers' | 'won' | 'all';

const STATUS_FILTERS: { label: string; value: FilterTab }[] = [
  { label: 'Open Jobs', value: 'open' },
  { label: 'My Offers', value: 'my_offers' },
  { label: 'Selected', value: 'won' },
  { label: 'All', value: 'all' },
];

export default function BrowseRequirementsScreen({ navigation }: any) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('open');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Track locally submitted offers (requirementId -> price)
  const [localOffers, setLocalOffers] = useState<Record<string, number>>({});

  const [quoting, setQuoting] = useState<Requirement | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const params: any = { limit: 100 };
      if (activeTab === 'open') {
        params.status = 'open';
      } else if (activeTab === 'my_offers') {
        params.filter = 'my_offers';
      } else if (activeTab === 'won') {
        params.filter = 'won';
      }
      // 'all' sends no filter
      const res = await requirementAPI.browse(params);
      const list = res.data?.requirements ?? res.data ?? [];
      setRequirements(list);
    } catch {
      setRequirements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

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
      Alert.alert('Add a price', 'Please enter your price.');
      return;
    }
    setSubmitting(true);
    try {
      await requirementAPI.sendOffer(quoting._id, {
        price: priceNum,
        ...(quoteNote ? { note: quoteNote } : {}),
      });
      // Track locally
      setLocalOffers((prev) => ({ ...prev, [quoting._id]: priceNum }));
      Alert.alert('Price sent!', 'Your price was sent to the buyer.');
      setQuoting(null);
      load();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Could not send offer. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  /** Check if supplier already offered on this requirement */
  const getOfferPrice = (r: Requirement): number | null => {
    if (r.myOffer?.price) return r.myOffer.price;
    if (localOffers[r._id]) return localOffers[r._id];
    return null;
  };

  const summary = useMemo(() => {
    const open = requirements.filter((r) => r.status === 'open').length;
    return { total: requirements.length, open };
  }, [requirements]);

  return (
    <LightScreenBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ paddingHorizontal: SPACING.base, paddingTop: SPACING.base, paddingBottom: SPACING.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
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
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: NEON.purple,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <ClipboardList size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.h2, { color: LIGHT.text, fontWeight: '800' }]}>New Jobs</Text>
              <Text style={[TYPE.caption, { color: LIGHT.textSecondary }]}>
                {summary.open} {summary.open === 1 ? 'job' : 'jobs'} available
              </Text>
            </View>
          </View>
        </View>

        {/* Filter tabs - Simple horizontal row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.base, paddingBottom: SPACING.base, gap: 8, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((f) => {
            const selected = activeTab === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setActiveTab(f.value)}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selected ? NEON.purple : '#FFF',
                  borderWidth: 1.5,
                  borderColor: selected ? NEON.purple : '#E0D4F0',
                  shadowColor: selected ? NEON.purple : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: selected ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    color: selected ? '#FFF' : '#4A3060',
                    fontWeight: '700',
                    fontSize: 13,
                  }}
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
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'rgba(184, 61, 245, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <ClipboardList size={40} color={NEON.purple} />
                </View>
                <Text style={[TYPE.h4, { color: LIGHT.text, marginTop: 12, fontWeight: '700' }]}>
                  {activeTab === 'my_offers'
                    ? 'No offers sent yet'
                    : activeTab === 'won'
                    ? 'No selected jobs yet'
                    : 'No jobs available'}
                </Text>
                <Text style={[TYPE.caption, { color: LIGHT.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }]}>
                  {activeTab === 'my_offers'
                    ? 'Open jobs will appear here. Send your price to get work!'
                    : activeTab === 'won'
                    ? 'When a buyer picks your offer, it will show here.'
                    : 'New jobs from buyers will appear here. Keep checking!'}
                </Text>
              </View>
            ) : (
              requirements.map((r, idx) => {
                const offerPrice = getOfferPrice(r);
                const hasOffered = offerPrice !== null;

                return (
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
                                : r.status === 'booked'
                                ? 'rgba(34, 224, 130, 0.2)'
                                : 'rgba(200,200,200,0.3)',
                          }}
                        >
                          <Text style={[TYPE.tiny, { color: LIGHT.text, fontWeight: '700' }]}>
                            {r.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Offers count badge */}
                      {(r.offersCount != null && r.offersCount > 0) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                          <Users size={12} color={LIGHT.textTertiary} />
                          <Text style={[TYPE.tiny, { color: LIGHT.textTertiary, marginLeft: 4 }]}>
                            {r.offersCount} supplier{r.offersCount !== 1 ? 's' : ''} sent price
                          </Text>
                        </View>
                      )}

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
                          "{r.notes}"
                        </Text>
                      ) : null}

                      {/* Action / Your Offer status */}
                      {hasOffered ? (
                        <View
                          style={{
                            marginTop: SPACING.md,
                            paddingVertical: 14,
                            borderRadius: RADIUS.lg,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderWidth: 1.5,
                            borderColor: 'rgba(34, 197, 94, 0.4)',
                          }}
                        >
                          <CheckCircle size={18} color="#22C55E" />
                          <Text
                            style={[
                              TYPE.label,
                              {
                                color: '#22C55E',
                                fontWeight: '800',
                                marginLeft: 8,
                                fontSize: 14,
                              },
                            ]}
                          >
                            YOUR PRICE: ₹{offerPrice!.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          disabled={r.status !== 'open'}
                          onPress={() => openQuote(r)}
                          activeOpacity={0.85}
                          style={{
                            marginTop: SPACING.md,
                            paddingVertical: 14,
                            borderRadius: RADIUS.lg,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            backgroundColor: r.status === 'open' ? NEON.purple : 'rgba(0,0,0,0.08)',
                            opacity: r.status === 'open' ? 1 : 0.5,
                            shadowColor: r.status === 'open' ? NEON.purple : 'transparent',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          <Send size={18} color={r.status === 'open' ? '#FFF' : LIGHT.textMuted} />
                          <Text
                            style={[
                              TYPE.label,
                              {
                                color: r.status === 'open' ? '#FFF' : LIGHT.textMuted,
                                fontWeight: '800',
                                marginLeft: 8,
                                fontSize: 14,
                                letterSpacing: 0.5,
                              },
                            ]}
                          >
                            {r.status === 'open' ? 'SEND PRICE' : 'CLOSED'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </LightCard>
                  </FadeInView>
                );
              })
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
                <Text style={[TYPE.h3, { color: LIGHT.text }]}>Send Your Price</Text>
                <TouchableOpacity onPress={() => setQuoting(null)}>
                  <X size={22} color={LIGHT.textSecondary} />
                </TouchableOpacity>
              </View>

              {quoting && (
                <Text style={[TYPE.caption, { color: LIGHT.textSecondary, marginBottom: SPACING.md }]}>
                  {quoting.eventType} · {quoting.location?.city || 'N/A'}
                  {quoting.date ? ` · ${quoting.date}` : ''}
                  {quoting.offersCount ? ` · ${quoting.offersCount} offer${quoting.offersCount !== 1 ? 's' : ''} so far` : ''}
                </Text>
              )}

              <Text style={[TYPE.label, { color: LIGHT.textSecondary, marginBottom: 6 }]}>
                Your Price ()
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
                Note (optional)
              </Text>
              <TextInput
                value={quoteNote}
                onChangeText={setQuoteNote}
                placeholder="What is included, setup time, terms…"
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
                      Send Price
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
