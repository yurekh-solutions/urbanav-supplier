import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ChevronLeft, AlertTriangle } from 'lucide-react-native';
import { Avatar } from '../components/ui';
import { NEON, SURFACE, GLASS, TEXT, GRADIENT, SEMANTIC } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPE } from '../theme/typography';
import { chatAPI } from '../api';
import { useFocusEffect } from '@react-navigation/native';

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

// ─── ChatScreen ───────────────────────────────────────────────────────────────
export default function ChatScreen({ route, navigation }: any) {
  const { orderId, buyerName, chatId: initialChatId } = route.params || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const currentUserId = route.params?.userId || 'current-user';

  // Load chat and messages
  const loadChat = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      
      // Get or create chat for this order
      if (!chatId) {
        const chatRes = await chatAPI.getChatByOrder(orderId);
        const newChatId = chatRes.data?.chat?._id || chatRes.data?.chat?.id;
        if (newChatId) {
          setChatId(newChatId);
        }
      }
      
      // Fetch messages
      const messagesRes = await chatAPI.getMessages(chatId || initialChatId);
      const msgs = messagesRes.data?.messages || messagesRes.data || [];
      
      // Transform messages to our format
      const formatted = msgs.map((msg: any) => ({
        id: msg._id || msg.id || Date.now().toString(),
        senderId: msg.senderId?._id || msg.senderId || msg.sender,
        message: msg.message || '',
        kind: (msg.type || msg.kind || 'text') as MsgKind,
        price: msg.price,
        timestamp: new Date(msg.createdAt || msg.timestamp || Date.now()),
        read: msg.read || false,
      }));
      
      setMessages(formatted);
    } catch (error: any) {
      console.error('Failed to load chat:', error);
      setMessages([]);
      if (error?.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load chat messages');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, chatId, initialChatId]);

  // Load on mount
  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadChat();
    }, [loadChat])
  );

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // Send message via API
  const send = async () => {
    const raw = draft.trim();
    if (!raw || !chatId) return;
    
    try {
      const { text: safe, wasMasked } = maskLocal(raw);
      
      await chatAPI.sendMessage(chatId, {
        message: safe,
        type: 'text',
      });
      
      setDraft('');
      await loadChat();
      
      if (wasMasked) {
        Alert.alert('Notice', 'Phone numbers are automatically hidden.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
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
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={NEON.purple} />
            </View>
          ) : (
            <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.base, gap: 10 }}>
              {messages.length === 0 ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: SPACING['3xl'] }}>
                  <Text style={[TYPE.h4, { color: TEXT.primary, marginBottom: SPACING.xs }]}>
                    No messages yet
                  </Text>
                  <Text style={[TYPE.body, { color: TEXT.tertiary, textAlign: 'center' }]}>
                    Start the conversation with {buyerName || 'the buyer'}!
                  </Text>
                </View>
              ) : (
                messages.map((msg) => {
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
                })
              )}
            </ScrollView>
          )}

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
