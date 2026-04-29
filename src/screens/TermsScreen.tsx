import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, FileText, Mail, ExternalLink } from 'lucide-react-native';
import {
  LightScreenBackground,
  LightCard,
  FadeInView,
  LIGHT,
  SPACING,
  RADIUS,
  TYPE,
} from '../components/ui';

type Section = { heading: string; body: string };

const SECTIONS: Section[] = [
  {
    heading: '1. Acceptance of terms',
    body:
      'By creating an account, posting a requirement, or booking any equipment through UrbanAV, you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, please do not use the platform.',
  },
  {
    heading: '2. Who we are',
    body:
      'UrbanAV is an online marketplace that connects buyers (event organizers, venues, production houses) with verified AV suppliers across India. UrbanAV is the platform, not the supplier of equipment.',
  },
  {
    heading: '3. Accounts & eligibility',
    body:
      'You must be 18 years or older to register. You are responsible for keeping your login credentials secure and for all activity under your account. Guest browsing is allowed, but booking, chat, and reviews require an account.',
  },
  {
    heading: '4. Bookings & payments',
    body:
      'All bookings are subject to supplier availability and confirmation. An advance payment may be required to confirm a booking. Prices are listed in INR and may vary by event, location, and duration. Full card details are never stored on our servers, payments are processed by a PCI-compliant partner.',
  },
  {
    heading: '5. Cancellations & refunds',
    body:
      'Cancellation windows and refund eligibility depend on the supplier and how close the cancellation is to the event date. Refunds, when due, are credited back to the original payment method within 7 to 10 business days. Full policy is shown during checkout.',
  },
  {
    heading: '6. Damage, delays & disputes',
    body:
      'Equipment must be returned in the same condition as received. Loss or damage may be deducted from the security deposit or charged separately. Disputes should be raised within 48 hours of event completion via the in-app support flow.',
  },
  {
    heading: '7. Supplier responsibilities',
    body:
      'Suppliers warrant that listed equipment is functional, safe, and legally owned or licensed for rental. Misrepresentation or repeated cancellations may lead to suspension from the platform.',
  },
  {
    heading: '8. Prohibited activity',
    body:
      'You agree not to use UrbanAV for fraud, harassment, off-platform deal circumvention, posting unlawful content, or any activity that disrupts the service.',
  },
  {
    heading: '9. Intellectual property',
    body:
      'All platform content such as logos, screens, copy, and algorithms belongs to UrbanAV. Supplier listings remain the property of the respective supplier. You may not scrape, mirror, or resell content without written permission.',
  },
  {
    heading: '10. Limitation of liability',
    body:
      'UrbanAV is not liable for indirect, incidental, or consequential losses arising from equipment failure, event delays, or disputes between buyers and suppliers. Our maximum liability is limited to the fee paid for the specific booking in question.',
  },
  {
    heading: '11. Privacy',
    body:
      'We collect only the data necessary to run the marketplace: name, contact, order history, and device information needed for fraud and abuse prevention. Read our Privacy Policy at urbanav.in/privacy for full details.',
  },
  {
    heading: '12. Changes to these terms',
    body:
      'We may update these terms as the platform evolves. Material changes will be notified in-app or via email. Continued use after an update means you accept the new terms.',
  },
  {
    heading: '13. Contact',
    body:
      'For any questions about these terms, reach us at support@urbanav.in. We typically respond within one business day.',
  },
];

const LAST_UPDATED = 'April 2026';

export default function TermsScreen({ navigation }: any) {
  const openMail = () =>
    Linking.openURL('mailto:support@urbanav.in?subject=UrbanAV%20Terms').catch(
      () => {}
    );
  const openPrivacy = () =>
    Linking.openURL('https://urbanav.in/privacy').catch(() => {});

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
            Terms & Conditions
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
                  <FileText size={18} color={LIGHT.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      TYPE.body,
                      { color: LIGHT.text, fontWeight: '700' },
                    ]}
                  >
                    UrbanAV Terms of Service
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
                Please read these terms carefully. They govern your use of the
                UrbanAV mobile and web platforms.
              </Text>
            </LightCard>
          </FadeInView>

          {SECTIONS.map((s, idx) => (
            <FadeInView key={s.heading} delay={30 + idx * 20}>
              <LightCard style={{ marginBottom: SPACING.sm }}>
                <Text
                  style={[
                    TYPE.body,
                    {
                      color: LIGHT.text,
                      fontWeight: '700',
                      marginBottom: 4,
                    },
                  ]}
                >
                  {s.heading}
                </Text>
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
          ))}

          {/* CTAs */}
          <FadeInView delay={400}>
            <View
              style={{
                flexDirection: 'row',
                gap: SPACING.sm,
                marginTop: SPACING.sm,
              }}
            >
              <TouchableOpacity
                onPress={openMail}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: SPACING.md,
                  borderRadius: RADIUS.lg,
                  backgroundColor: LIGHT.card,
                  borderWidth: 1,
                  borderColor: LIGHT.border,
                }}
              >
                <Mail size={15} color={LIGHT.accent} />
                <Text
                  style={{
                    color: LIGHT.text,
                    fontWeight: '700',
                    marginLeft: 6,
                    fontSize: 13,
                  }}
                >
                  Contact
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={openPrivacy}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: SPACING.md,
                  borderRadius: RADIUS.lg,
                  backgroundColor: LIGHT.accent,
                }}
              >
                <ExternalLink size={15} color="#fff" />
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: '700',
                    marginLeft: 6,
                    fontSize: 13,
                  }}
                >
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        </ScrollView>
      </SafeAreaView>
    </LightScreenBackground>
  );
}
