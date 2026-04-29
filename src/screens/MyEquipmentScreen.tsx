import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Edit3, Trash2, Package } from 'lucide-react-native';
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
import { equipmentAPI, resolveMediaUrl } from '../api';

export default function MyEquipmentScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await equipmentAPI.getMine();
      const list = res.data?.equipment ?? res.data ?? [];
      setItems(list);
    } catch {
      setItems([]);
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

  const confirmDelete = (item: any) => {
    const id = item.id ?? item._id;
    Alert.alert(
      'Delete equipment?',
      `Are you sure you want to remove "${item.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await equipmentAPI.delete(id);
              setItems((prev) => prev.filter((i) => (i.id ?? i._id) !== id));
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'Delete failed');
            }
          },
        },
      ]
    );
  };

  const toggleAvailability = async (item: any) => {
    const id = item.id ?? item._id;
    const nextAvailable = !(item.available ?? item.isAvailable ?? true);
    try {
      await equipmentAPI.update(id, { available: nextAvailable, isAvailable: nextAvailable });
      setItems((prev) =>
        prev.map((i) =>
          (i.id ?? i._id) === id ? { ...i, available: nextAvailable, isAvailable: nextAvailable } : i
        )
      );
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Update failed');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
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
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={[TYPE.h2, { color: LIGHT.text, letterSpacing: -0.3 }]}>My Equipment</Text>
              <Text style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 2 }]}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddEditEquipment')}
              activeOpacity={0.85}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: NEON.purple,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: NEON.purple,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Plus size={22} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
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
              paddingBottom: 120,
              gap: SPACING.sm,
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.purple} />
            }
          >
            {items.length === 0 ? (
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
                  <Package size={32} color={NEON.purple} strokeWidth={1.75} />
                </View>
                <Text style={[TYPE.h4, { color: LIGHT.text, marginBottom: SPACING.xs }]}>
                  No equipment yet
                </Text>
                <Text
                  style={[
                    TYPE.body,
                    {
                      color: LIGHT.textTertiary,
                      textAlign: 'center',
                      marginBottom: SPACING.lg,
                      paddingHorizontal: SPACING.lg,
                    },
                  ]}
                >
                  Add your first piece of equipment to start receiving inquiries.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AddEditEquipment')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.sm + 2,
                    backgroundColor: NEON.purple,
                    borderRadius: RADIUS.full,
                  }}
                >
                  <Plus size={16} color="#FFF" strokeWidth={2.5} />
                  <Text style={{ color: '#FFF', fontWeight: '700', letterSpacing: 0.4 }}>
                    ADD EQUIPMENT
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              items.map((item, index) => {
                const id = item.id ?? item._id;
                const imageUrl =
                  resolveMediaUrl(item.image) ||
                  (Array.isArray(item.images) ? resolveMediaUrl(item.images[0]) : null);
                const available = item.available ?? item.isAvailable ?? true;
                const basePrice = item.basePrice ?? item.price ?? 0;
                return (
                  <SlideUpView key={id} delay={index * 50}>
                    <LightCard padding={SPACING.sm}>
                      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                        <View
                          style={{
                            width: 84,
                            height: 84,
                            borderRadius: RADIUS.md,
                            backgroundColor: LIGHT.cardSoft,
                            overflow: 'hidden',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {imageUrl ? (
                            <Image
                              source={{ uri: imageUrl }}
                              style={{ width: '100%', height: '100%' }}
                            />
                          ) : (
                            <Package size={28} color={LIGHT.textTertiary} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Text
                              style={[TYPE.bodySm, { color: LIGHT.text, fontWeight: '700', flex: 1 }]}
                              numberOfLines={1}
                            >
                              {item.name || 'Untitled'}
                            </Text>
                            <TouchableOpacity
                              onPress={() => toggleAvailability(item)}
                              activeOpacity={0.85}
                              style={{
                                paddingHorizontal: SPACING.sm,
                                paddingVertical: 3,
                                borderRadius: RADIUS.full,
                                backgroundColor: available ? '#22E08226' : '#FFB1B12A',
                              }}
                            >
                              <Text
                                style={{
                                  color: available ? '#0E7A3C' : '#A8152B',
                                  fontSize: 10,
                                  fontWeight: '700',
                                  letterSpacing: 0.4,
                                }}
                              >
                                {available ? 'AVAILABLE' : 'HIDDEN'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <Text
                            style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 2 }]}
                            numberOfLines={1}
                          >
                            {String(item.category || 'general').replace(/-/g, ' ')}
                          </Text>
                          <Text
                            style={[TYPE.body, { color: NEON.purple, fontWeight: '700', marginTop: 4 }]}
                          >
                            ₹{Number(basePrice).toLocaleString('en-IN')}
                            <Text style={[TYPE.caption, { color: LIGHT.textTertiary }]}>/day</Text>
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: SPACING.xs }}>
                            <TouchableOpacity
                              onPress={() =>
                                navigation.navigate('AddEditEquipment', { equipment: item })
                              }
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: SPACING.sm,
                                paddingVertical: 6,
                                borderRadius: RADIUS.full,
                                backgroundColor: LIGHT.cardSoft,
                                borderWidth: 1,
                                borderColor: LIGHT.border,
                              }}
                            >
                              <Edit3 size={12} color={LIGHT.text} />
                              <Text
                                style={{ fontSize: 11, fontWeight: '700', color: LIGHT.text }}
                              >
                                Edit
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => confirmDelete(item)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: SPACING.sm,
                                paddingVertical: 6,
                                borderRadius: RADIUS.full,
                                backgroundColor: '#FFB1B122',
                              }}
                            >
                              <Trash2 size={12} color="#A8152B" />
                              <Text
                                style={{ fontSize: 11, fontWeight: '700', color: '#A8152B' }}
                              >
                                Delete
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </LightCard>
                  </SlideUpView>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LightScreenBackground>
  );
}
