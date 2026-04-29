import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ShieldCheck,
  Mail,
  Database,
  Lock,
  Eye,
  Share2,
  UserCheck,
  Trash2,
} from 'lucide-react-native';
import {
  LightScreenBackground,
  LightCard,
  FadeInView,
  LIGHT,
  SPACING,
  RADIUS,
  TYPE,
} from '../components/ui';

const LAST_UPDATED = 'April 2026';

const SECTIONS = [
  {
    icon: Database,
    heading: '1. What We Collect',
    body:
      'We collect account details you provide (name, email, phone, business info), usage data (orders, inquiries, device info), and optional location to help match you with nearby vendors. Payment details are processed by PCI-compliant partners and never stored on our servers.',
  },
  {
    icon: Eye,
    heading: '2. How We Use Your Data',
    body:
      'To deliver and improve the UrbanAV marketplace: matching buyers with vendors, enabling chat between parties, sending order updates, processing payments, preventing fraud, and (only with consent) sending product announcements.',
  },
  {
    icon: Share2,
    heading: '3. Who We Share With',
    body:
      'Vendors you inquire with see your requirement and contact details. We use trusted processors (cloud hosting, payments, analytics, messaging) under strict agreements. We never sell your personal data to advertisers.',
  },
  {
    icon: Lock,
    heading: '4. Security',
    body:
      'Data is encrypted in transit (TLS) and at rest where applicable. Passwords are hashed with bcrypt. Access to production data is limited to authorised engineers with audit logging.',
  },
  {
    icon: UserCheck,
    heading: '5. Your Rights',
    body:
      'You may access, correct, export, or delete your data at any time from the Profile screen or by emailing privacy@urbanav.in. Account deletion removes personal identifiers within 30 days, subject to legal retention obligations.',
  },
  {
    icon: Trash2,
    heading: '6. Retention',
    body:
      'Active accounts are retained while you use UrbanAV. Order and invoicing records are kept for 7 years for tax compliance. Chat logs for dispute resolution are kept for 12 months after order closure.',
  },
  {
    icon: ShieldCheck,
    heading: '7. Cookies & Analytics',
    body:
      'We use minimal first-party cookies for session handling and privacy-friendly analytics (no ad tracking). You can clear cookies from your browser or opt out of analytics in Profile → Notifications.',
  },
  {
    icon: Mail,
    heading: '8. Contact',
    body:
      'For any privacy questions or data requests reach out to privacy@urbanav.in. We aim to respond within 5 business days.',
  },
];

export default function PrivacyScreen({ navigation }: any) {
  const openMail = () =>
    Linking.openURL('mailto:privacy@urbanav.in?subject=UrbanAV%20Privacy').catch(() => {});

  return (
    <LightScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
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
          <Text style={[TYPE.h2, { color: LIGHT.text, letterSpacing: -0.3 }]}>
            Privacy Policy
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: SPACING.base,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView>
            <LightCard style={{ marginBottom: SPACING.base }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: SPACING.sm,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: LIGHT.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: SPACING.sm,
                  }}
                >
                  <ShieldCheck size={18} color={LIGHT.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      TYPE.body,
                      { color: LIGHT.text, fontWeight: '700' },
                    ]}
                  >
                    Your data, your rights
                  </Text>
                  <Text
                    style={[
                      TYPE.tiny,
                      { color: LIGHT.textTertiary, marginTop: 1 },
                    ]}
                  >
                    Last updated: {LAST_UPDATED}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  TYPE.caption,
                  { color: LIGHT.textSecondary, lineHeight: 18 },
                ]}
              >
                This policy explains what data UrbanAV collects, why we need it,
                and the controls you have over it.
              </Text>
            </LightCard>
          </FadeInView>

          {SECTIONS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <FadeInView key={s.heading} delay={30 + idx * 20}>
                <LightCard style={{ marginBottom: SPACING.sm }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: LIGHT.accentSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: SPACING.sm,
                      }}
                    >
                      <Icon size={14} color={LIGHT.accent} />
                    </View>
                    <Text
                      style={[
                        TYPE.body,
                        { color: LIGHT.text, fontWeight: '700', flex: 1 },
                      ]}
                    >
                      {s.heading}
                    </Text>
                  </View>
                  <Text
                    style={[
                      TYPE.caption,
                      { color: LIGHT.textSecondary, lineHeight: 20 },
                    ]}
                  >
                    {s.body}
                  </Text>
                </LightCard>
              </FadeInView>
            );
          })}

          <FadeInView delay={400}>
            <TouchableOpacity
              onPress={openMail}
              style={{
                marginTop: SPACING.sm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: SPACING.md,
                borderRadius: RADIUS.lg,
                backgroundColor: LIGHT.accent,
              }}
            >
              <Mail size={15} color="#fff" />
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  marginLeft: 8,
                  fontSize: 13,
                }}
              >
                Contact privacy@urbanav.in
              </Text>
            </TouchableOpacity>
          </FadeInView>
        </ScrollView>
      </SafeAreaView>
    </LightScreenBackground>
  );
}
