import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  ShieldCheck,
  Copy,
  Eye,
  EyeOff,
  MessageCircle,
  Star,
  ChevronLeft,
  CheckCircle,
} from 'lucide-react-native';
import {
  GlassCard,
  PrimaryButton,
  GhostButton,
  Badge,
  RatingStars,
  Typography,
  ScreenHeader,
  Divider,
  SlideUpView,
  FadeInView,
  SuccessCheck,
  PriceTag,
} from '../components/ui';
import { NEON, SURFACE, GLASS, TEXT, GRADIENT, SEMANTIC, SHADOW } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPE } from '../theme/typography';
import { reviewAPI } from '../api';

// ─── Status helpers ──────────────────────────────────────────────────────────
const STATUS_STEP: Record<string, number> = {
  pending: 1, confirmed: 2, preparing: 3, delivered: 4, completed: 5, cancelled: 0,
};
const STATUS_COLOR: Record<string, string> = {
  pending: '#FFB547',
  confirmed: NEON.violet,
  preparing: NEON.purple,
  delivered: SEMANTIC.success,
  completed: NEON.glow,
  cancelled: SEMANTIC.error,
};
const STEPS = ['Pending', 'Confirmed', 'Preparing', 'Delivered', 'Completed'];

// ─── OtpLifecycleCard ─────────────────────────────────────────────────────────
interface OtpCardProps {
  label: string;
  otp?: string;
  verified: boolean;
}

const OtpLifecycleCard: React.FC<OtpCardProps> = ({ label, otp, verified }) => {
  const [revealed, setRevealed] = useState(false);

  const copyOtp = async () => {
    if (!otp) return;
    await Clipboard.setStringAsync(otp);
    Alert.alert('Copied', `${label} OTP copied to clipboard`);
  };

  if (!otp) {
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: GLASS.tier3, borderRadius: RADIUS.md,
        padding: SPACING.md, borderWidth: 1, borderColor: GLASS.tier3Border,
      }}>
        <Shield size={18} color={TEXT.muted} />
        <Text style={[TYPE.bodySm, { color: TEXT.muted, marginLeft: SPACING.sm }]}>
          {label} OTP — generated after booking
        </Text>
      </View>
    );
  }

  return (
    <View style={{
      backgroundColor: verified ? 'rgba(34, 224, 130, 0.08)' : GLASS.tier1,
      borderRadius: RADIUS.lg, padding: SPACING.base,
      borderWidth: 1,
      borderColor: verified ? 'rgba(34, 224, 130, 0.30)' : GLASS.tier1Border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {verified
            ? <ShieldCheck size={18} color={SEMANTIC.success} />
            : <Shield size={18} color={NEON.glow} />
          }
          <Text style={[TYPE.label, { color: TEXT.secondary, marginLeft: SPACING.sm }]}>
            {label} OTP
          </Text>
        </View>
        <Badge
          label={verified ? 'Verified' : 'Pending'}
          tone={verified ? 'success' : 'brand'}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md }}>
        <Text style={[TYPE.h2, {
          letterSpacing: 8,
          color: revealed ? NEON.glow : 'transparent',
          textShadowColor: revealed ? NEON.magenta : 'transparent',
          textShadowRadius: revealed ? 8 : 0,
          flex: 1,
        }]}>
          {revealed ? otp : '● ● ● ● ● ●'}
        </Text>
        <TouchableOpacity onPress={() => setRevealed(!revealed)} style={{ marginRight: SPACING.sm }}>
          {revealed ? <EyeOff size={20} color={TEXT.tertiary} /> : <Eye size={20} color={TEXT.tertiary} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={copyOtp}>
          <Copy size={20} color={NEON.glow} />
        </TouchableOpacity>
      </View>

      {!verified && (
        <Text style={[TYPE.caption, { color: TEXT.muted, marginTop: SPACING.xs }]}>
          Share this code with the supplier {label === 'Start' ? 'when equipment arrives' : 'after the event ends'}
        </Text>
      )}
    </View>
  );
};

// ─── ReviewModal ──────────────────────────────────────────────────────────────
interface ReviewModalProps {
  visible: boolean;
  vendorId: string;
  orderId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ visible, vendorId, orderId, onClose, onSubmitted }) => {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await reviewAPI.create({ orderId, vendorId, rating: stars, comment });
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onSubmitted();
      }, 1400);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Could not submit review';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(9,1,24,0.7)' }}>
        <View style={{
          backgroundColor: SURFACE.soft, borderTopLeftRadius: RADIUS['2xl'],
          borderTopRightRadius: RADIUS['2xl'], padding: SPACING.xl,
          borderTopWidth: 1, borderColor: GLASS.tier1Border,
        }}>
          {done ? (
            <FadeInView style={{ alignItems: 'center', paddingVertical: SPACING['2xl'] }}>
              <SuccessCheck size={72} color={NEON.purple} />
              <Text style={[TYPE.h2, { color: TEXT.primary, marginTop: SPACING.lg, textAlign: 'center' }]}>
                Thanks for your review!
              </Text>
            </FadeInView>
          ) : (
            <>
              <Text style={[TYPE.h3, { color: TEXT.primary, marginBottom: SPACING.base }]}>Rate your experience</Text>
              <View style={{ alignItems: 'center', marginVertical: SPACING.lg }}>
                <RatingStars value={stars} size={36} onChange={setStars} />
                <Text style={[TYPE.bodySm, { color: TEXT.tertiary, marginTop: SPACING.sm }]}>
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][stars]}
                </Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: GLASS.tier1, borderRadius: RADIUS.lg,
                  borderWidth: 1, borderColor: GLASS.tier1Border,
                  color: TEXT.primary, padding: SPACING.md, minHeight: 80,
                  fontSize: 14, textAlignVertical: 'top',
                }}
                placeholder="Share details about your experience (optional)"
                placeholderTextColor={TEXT.muted}
                multiline
                value={comment}
                onChangeText={setComment}
              />
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xl }}>
                <GhostButton title="Skip" onPress={onClose} fullWidth={false}
                  style={{ flex: 1 }} size="md" />
                <PrimaryButton title="Submit" onPress={submit} loading={loading}
                  fullWidth={false} style={{ flex: 2 }} size="md" />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OrderDetailScreen({ route, navigation }: any) {
  const { order } = route.params;
  const currentStep = STATUS_STEP[order.status] || 0;
  const statusColor = STATUS_COLOR[order.status] || TEXT.muted;
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  return (
    <LinearGradient colors={GRADIENT.appBg} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader
          title="Order Details"
          subtitle={order.orderNumber}
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingBottom: 32 }}>

          {/* Status timeline */}
          <SlideUpView delay={0}>
            <GlassCard style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.base }}>
                <Text style={[TYPE.h3, { color: TEXT.primary }]}>{order.orderNumber}</Text>
                <Badge
                  label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  tone={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'error' : 'brand'}
                />
              </View>

              {order.status !== 'cancelled' && (
                <View>
                  {STEPS.map((name, i) => {
                    const stepNum = i + 1;
                    const active = stepNum <= currentStep;
                    const last = i === STEPS.length - 1;
                    return (
                      <View key={name} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: last ? 0 : 4 }}>
                        <View style={{ alignItems: 'center', marginRight: SPACING.md, width: 28 }}>
                          <View style={{
                            width: 28, height: 28, borderRadius: 14,
                            backgroundColor: active ? NEON.purple : GLASS.tier2,
                            borderWidth: 1.5,
                            borderColor: active ? NEON.glow : GLASS.tier2Border,
                            alignItems: 'center', justifyContent: 'center',
                            shadowColor: active ? NEON.glow : 'transparent',
                            shadowOpacity: active ? 0.6 : 0,
                            shadowRadius: 8,
                          }}>
                            {active && <CheckCircle size={14} color="#FFF" />}
                          </View>
                          {!last && (
                            <View style={{
                              width: 2, height: 22,
                              backgroundColor: active ? NEON.purple : GLASS.tier2Border,
                              marginTop: 2,
                            }} />
                          )}
                        </View>
                        <Text style={[TYPE.body, {
                          color: active ? TEXT.primary : TEXT.muted,
                          fontWeight: active ? '600' : '400',
                          paddingTop: 4,
                        }]}>
                          {name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </GlassCard>
          </SlideUpView>

          {/* Supplier info */}
          <SlideUpView delay={60}>
            <GlassCard style={{ marginBottom: SPACING.md }}>
              <Text style={[TYPE.label, { color: TEXT.tertiary, marginBottom: SPACING.xs }]}>SUPPLIER</Text>
              <Text style={[TYPE.h3, { color: NEON.glow, marginBottom: SPACING.md }]}>
                {order.supplier || order.supplierName || 'Supplier'}
              </Text>
              <GhostButton
                title="Chat with Supplier"
                onPress={() => navigation.navigate('Chat', { orderId: order.id, supplierName: order.supplier })}
                size="sm"
                leftIcon={<MessageCircle size={16} color={NEON.glow} />}
              />
            </GlassCard>
          </SlideUpView>

          {/* Event details */}
          <SlideUpView delay={120}>
            <GlassCard style={{ marginBottom: SPACING.md }}>
              <Text style={[TYPE.label, { color: TEXT.tertiary, marginBottom: SPACING.md }]}>EVENT DETAILS</Text>
              {[
                ['Event Date', new Date(order.eventDate || order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
                ['Booked On', new Date(order.createdAt).toLocaleDateString('en-IN')],
              ].map(([label, value]) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm }}>
                  <Text style={[TYPE.body, { color: TEXT.tertiary }]}>{label}</Text>
                  <Text style={[TYPE.body, { color: TEXT.primary }]}>{value}</Text>
                </View>
              ))}
            </GlassCard>
          </SlideUpView>

          {/* Equipment */}
          {order.items?.length > 0 && (
            <SlideUpView delay={160}>
              <GlassCard style={{ marginBottom: SPACING.md }}>
                <Text style={[TYPE.label, { color: TEXT.tertiary, marginBottom: SPACING.md }]}>EQUIPMENT</Text>
                {(order.items as any[]).map((item: any, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs }}>
                    <Text style={[TYPE.body, { color: TEXT.secondary }]}>
                      {typeof item === 'string' ? item : item.name}
                    </Text>
                    {item.quantity && (
                      <Text style={[TYPE.caption, { color: TEXT.muted }]}>×{item.quantity}</Text>
                    )}
                  </View>
                ))}
              </GlassCard>
            </SlideUpView>
          )}

          {/* Payment summary */}
          <SlideUpView delay={200}>
            <GlassCard style={{ marginBottom: SPACING.md }}>
              <Text style={[TYPE.label, { color: TEXT.tertiary, marginBottom: SPACING.md }]}>PAYMENT</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: SPACING.sm }}>
                <Text style={[TYPE.body, { color: TEXT.tertiary }]}>Total Amount</Text>
                <PriceTag value={order.totalAmount ?? order.total ?? 0} size="md" />
              </View>
              {order.advanceAmount > 0 && (
                <>
                  <Divider />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm }}>
                    <Text style={[TYPE.body, { color: TEXT.tertiary }]}>Advance Paid</Text>
                    <PriceTag value={order.advanceAmount} size="sm" />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm }}>
                    <Text style={[TYPE.body, { color: TEXT.tertiary }]}>Balance Due</Text>
                    <PriceTag value={order.balanceDue} size="sm" />
                  </View>
                </>
              )}
              <Divider />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: SPACING.sm }}>
                <Text style={[TYPE.body, { color: TEXT.tertiary }]}>Payment Status</Text>
                <Badge
                  label={order.paymentStatus || 'Pending'}
                  tone={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'error' : 'warning'}
                />
              </View>
            </GlassCard>
          </SlideUpView>

          {/* OTP Trust Layer */}
          {(order.otpStart || order.otpEnd || order.status === 'confirmed' || order.status === 'preparing' || order.status === 'delivered') && (
            <SlideUpView delay={240}>
              <GlassCard style={{ marginBottom: SPACING.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
                  <Shield size={18} color={NEON.glow} />
                  <Text style={[TYPE.h4, { color: TEXT.primary, marginLeft: SPACING.sm }]}>OTP Trust Shield</Text>
                  <Badge label="Secure" tone="brand" style={{ marginLeft: SPACING.sm }} />
                </View>
                <Text style={[TYPE.caption, { color: TEXT.tertiary, marginBottom: SPACING.md }]}>
                  Share each OTP only when the supplier physically arrives / departs. Never share via chat.
                </Text>
                <View style={{ gap: SPACING.sm }}>
                  <OtpLifecycleCard
                    label="Start"
                    otp={order.otpStart}
                    verified={!!order.otpStartVerified}
                  />
                  <OtpLifecycleCard
                    label="End"
                    otp={order.otpEnd}
                    verified={!!order.otpEndVerified}
                  />
                </View>
              </GlassCard>
            </SlideUpView>
          )}

          {/* Review prompt — only when completed and not yet reviewed */}
          {order.status === 'completed' && !reviewed && (
            <SlideUpView delay={280}>
              <GlassCard style={{ marginBottom: SPACING.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
                  <Star size={18} color="#FFB547" fill="#FFB547" />
                  <Text style={[TYPE.h4, { color: TEXT.primary, marginLeft: SPACING.sm }]}>Rate your experience</Text>
                </View>
                <Text style={[TYPE.body, { color: TEXT.tertiary, marginBottom: SPACING.md }]}>
                  How was your event? Your feedback helps the UrbanAV community.
                </Text>
                <PrimaryButton
                  title="Write a Review"
                  onPress={() => setReviewOpen(true)}
                  size="md"
                  leftIcon={<Star size={16} color="#FFF" />}
                />
              </GlassCard>
            </SlideUpView>
          )}

        </ScrollView>

        {/* Review modal */}
        <ReviewModal
          visible={reviewOpen}
          vendorId={order.supplierId ?? order.supplier ?? ''}
          orderId={order._id ?? order.id}
          onClose={() => setReviewOpen(false)}
          onSubmitted={() => { setReviewOpen(false); setReviewed(true); }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
