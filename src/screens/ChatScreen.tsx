import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ChevronLeft, AlertTriangle } from 'lucide-react-native';
import { Avatar } from '../components/ui';
import { NEON, SURFACE, GLASS, TEXT, GRADIENT, SEMANTIC } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPE } from '../theme/typography';

// Client-side phone masking (mirrors server-side regex)
// Shows a warning badge rather than raw digits if the server wasn't called
const PHONE_RX = [
  /\b(\+?91[\s\-]?)?[6-9]\d{9}\b/g,
  /\b\d{3}[\s.\-]\d{3}[\s.\-]\d{4}\b/g,
  /\b\d{10}\b/g,
  /\b\d{5}[\s\-]\d{5}\b/g,
];

function maskLocal(text: string): { text: string; wasMasked: boolean } {
  let out = text;
  let wasMasked = false;
  for (const re of PHONE_RX) {
    if (re.test(out)) { wasMasked = true; re.lastIndex = 0; }
    out = out.replace(re, '[📵 contact hidden]');
  }
  return { text: out, wasMasked };
}

// ─── Message type ─────────────────────────────────────────────────────────────
type MsgKind = 'text' | 'quote' | 'counter' | 'accept' | 'system';

interface Message {
  id: string;
  senderId: string;
  message: string;
  kind: MsgKind;
  price?: number;
  timestamp: Date;
  read: boolean;
}

const MOCK: Message[] = [
  {
    id: '1', senderId: 'supplier', kind: 'text',
    message: 'Hello! How can I help you with the equipment rental?',
    timestamp: new Date(Date.now() - 3600000), read: true,
  },
  {
    id: '2', senderId: 'buyer', kind: 'text',
    message: 'Hi! I need the projector for a 2-day event. Is it available?',
    timestamp: new Date(Date.now() - 3500000), read: true,
  },
  {
    id: '3', senderId: 'supplier', kind: 'quote', price: 28500,
    message: 'Yes! Here is my best quote for the projector + screen package.',
    timestamp: new Date(Date.now() - 3400000), read: true,
  },
];

// ─── ChatScreen ───────────────────────────────────────────────────────────────
export default function ChatScreen({ route, navigation }: any) {
  const { orderId, supplierName } = route.params || {};
  const [messages, setMessages] = useState<Message[]>(MOCK);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const currentUserId = 'buyer';

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const send = () => {
    const raw = draft.trim();
    if (!raw) return;
    const { text: safe } = maskLocal(raw);
    const msg: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      kind: 'text',
      message: safe,
      timestamp: new Date(),
      read: false,
    };
    setMessages((p) => [...p, msg]);
    setDraft('');
    setTimeout(() => {
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          senderId: 'supplier',
          kind: 'text',
          message: "Thanks for your message! I'll get back to you shortly.",
          timestamp: new Date(),
          read: false,
        },
      ]);
    }, 2000);
  };

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <LinearGradient colors={GRADIENT.appBg} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>

          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
            backgroundColor: GLASS.tier1,
            borderBottomWidth: 1, borderBottomColor: GLASS.tier2Border,
          }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: SPACING.md }}>
              <ChevronLeft size={24} color={TEXT.primary} />
            </TouchableOpacity>
            <Avatar name={supplierName || 'S'} size={38} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={[TYPE.h4, { color: TEXT.primary }]}>{supplierName || 'Supplier Chat'}</Text>
              <Text style={[TYPE.caption, { color: SEMANTIC.success }]}>Online</Text>
            </View>
          </View>

          {/* Anti-bypass notice */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(255, 181, 71, 0.10)',
            paddingHorizontal: SPACING.base, paddingVertical: SPACING.xs,
            borderBottomWidth: 1, borderBottomColor: 'rgba(255, 181, 71, 0.20)',
          }}>
            <AlertTriangle size={12} color="#FFB547" />
            <Text style={[TYPE.tiny, { color: '#FFB547', marginLeft: SPACING.xs }]}>
              Phone numbers are automatically hidden to protect both parties.
            </Text>
          </View>

          {/* Messages */}
          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.base, gap: 10 }}>
            {messages.map((msg) => {
              const mine = msg.senderId === currentUserId;
              const isQuote = msg.kind === 'quote' || msg.kind === 'counter' || msg.kind === 'accept';

              if (msg.kind === 'system') {
                return (
                  <View key={msg.id} style={{ alignItems: 'center', marginVertical: SPACING.sm }}>
                    <View style={{
                      backgroundColor: GLASS.tier2, borderRadius: RADIUS.full,
                      paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
                    }}>
                      <Text style={[TYPE.caption, { color: TEXT.tertiary }]}>{msg.message}</Text>
                    </View>
                  </View>
                );
              }

              return (
                <View key={msg.id} style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <View style={{
                    maxWidth: '80%',
                    backgroundColor: mine ? NEON.purple : GLASS.tier1,
                    borderRadius: RADIUS.lg,
                    borderTopLeftRadius: mine ? RADIUS.lg : 4,
                    borderTopRightRadius: mine ? 4 : RADIUS.lg,
                    padding: SPACING.md,
                    borderWidth: mine ? 0 : 1,
                    borderColor: GLASS.tier1Border,
                    shadowColor: mine ? NEON.purple : 'transparent',
                    shadowOpacity: mine ? 0.35 : 0,
                    shadowRadius: mine ? 10 : 0,
                    shadowOffset: { width: 0, height: 4 },
                  }}>
                    {/* Quote / counter badge */}
                    {isQuote && (
                      <View style={{ marginBottom: msg.message ? SPACING.xs : 0 }}>
                        <Text style={[TYPE.tiny, { color: mine ? 'rgba(255,255,255,0.7)' : TEXT.tertiary }]}>
                          {msg.kind === 'counter' ? 'COUNTER OFFER' : msg.kind === 'accept' ? '✓ ACCEPTED' : 'QUOTE'}
                        </Text>
                        {msg.price != null && (
                          <Text style={[TYPE.h3, { color: mine ? '#FFF' : NEON.glow }]}>
                            ₹{msg.price.toLocaleString('en-IN')}
                          </Text>
                        )}
                      </View>
                    )}
                    {msg.message ? (
                      <Text style={[TYPE.body, { color: mine ? '#FFF' : TEXT.primary }]}>{msg.message}</Text>
                    ) : null}
                    <Text style={[TYPE.tiny, {
                      color: mine ? 'rgba(255,255,255,0.55)' : TEXT.muted,
                      textAlign: mine ? 'right' : 'left',
                      marginTop: 4,
                    }]}>
                      {fmt(msg.timestamp)}{msg.read && mine ? '  ✓✓' : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Input bar */}
          <View style={{
            flexDirection: 'row', alignItems: 'flex-end',
            padding: SPACING.sm,
            backgroundColor: GLASS.tier1,
            borderTopWidth: 1, borderTopColor: GLASS.tier2Border,
          }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: GLASS.tier2,
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: GLASS.tier2Border,
                paddingHorizontal: SPACING.base,
                paddingVertical: SPACING.sm,
                color: TEXT.primary,
                fontSize: 14,
                maxHeight: 100,
                marginRight: SPACING.sm,
              }}
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message..."
              placeholderTextColor={TEXT.muted}
              multiline
            />
            <TouchableOpacity
              onPress={send}
              disabled={!draft.trim()}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: draft.trim() ? NEON.purple : GLASS.tier2,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: draft.trim() ? NEON.glow : 'transparent',
                shadowOpacity: 0.5, shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Send size={18} color={draft.trim() ? '#FFF' : TEXT.muted} />
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
