import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Camera, Image as ImageIcon, Tag } from 'lucide-react-native';
import {
  LightScreenBackground,
  LightCard,
  FadeInView,
  LIGHT,
  NEON,
  SPACING,
  RADIUS,
  TYPE,
} from '../components/ui';
import { equipmentAPI, uploadAPI, resolveMediaUrl } from '../api';

const CATEGORIES = [
  'sound-systems',
  'lighting',
  'projectors',
  'screens',
  'led-walls',
  'led-tvs',
  'microphones',
  'dj-equipment',
  'video-recording',
  'cables-accessories',
];

export default function AddEditEquipmentScreen({ navigation, route }: any) {
  const editing = route?.params?.equipment;
  const isEdit = !!editing;

  const [name, setName] = useState(editing?.name || '');
  const [category, setCategory] = useState(editing?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(editing?.description || '');
  const [basePrice, setBasePrice] = useState(
    String(editing?.basePrice ?? editing?.price ?? '')
  );
  const [tagsInput, setTagsInput] = useState(
    Array.isArray(editing?.tags) ? editing.tags.join(', ') : ''
  );
  const [image, setImage] = useState<string | null>(
    resolveMediaUrl(
      editing?.image || (Array.isArray(editing?.images) ? editing.images[0] : null)
    )
  );
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    editing?.image || (Array.isArray(editing?.images) ? editing.images[0] : null) || null
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo access is required to select an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    setImage(uri);
    setUploading(true);
    try {
      const res = await uploadAPI.image(uri, 'equipment');
      const url = res.data?.url || res.data?.path || res.data?.file?.url;
      if (url) setUploadedUrl(url);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.response?.data?.message || 'Try again');
      setImage(null);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Missing field', 'Please enter a name.');
      return;
    }
    if (!basePrice || isNaN(Number(basePrice))) {
      Alert.alert('Missing field', 'Please enter a valid base price.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);

    const payload: any = {
      name: name.trim(),
      category,
      description: description.trim(),
      basePrice: Number(basePrice),
      price: Number(basePrice),
      tags,
    };
    if (uploadedUrl) {
      payload.image = uploadedUrl;
      payload.images = [uploadedUrl];
    }

    setSaving(true);
    try {
      if (isEdit) {
        const id = editing.id ?? editing._id;
        await equipmentAPI.update(id, payload);
      } else {
        await equipmentAPI.create(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e?.response?.data?.message || 'Try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LightScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FadeInView>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: SPACING.base,
                paddingTop: SPACING.sm,
                paddingBottom: SPACING.sm,
              }}
            >
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
                  marginRight: SPACING.sm,
                }}
              >
                <ChevronLeft size={20} color={LIGHT.text} />
              </TouchableOpacity>
              <Text style={[TYPE.h3, { color: LIGHT.text, fontWeight: '700' }]}>
                {isEdit ? 'Edit Equipment' : 'Add Equipment'}
              </Text>
            </View>
          </FadeInView>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: SPACING.xl,
              paddingBottom: 140,
              gap: SPACING.base,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Image picker */}
            <TouchableOpacity activeOpacity={0.85} onPress={pickImage}>
              <LightCard padding={0} style={{ overflow: 'hidden' }}>
                <View
                  style={{
                    height: 180,
                    backgroundColor: LIGHT.cardSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <ImageIcon size={36} color={LIGHT.textTertiary} strokeWidth={1.5} />
                      <Text
                        style={[TYPE.body, { color: LIGHT.textTertiary, marginTop: SPACING.xs }]}
                      >
                        Tap to upload image
                      </Text>
                    </View>
                  )}
                  {uploading ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ActivityIndicator color="#FFF" />
                      <Text style={{ color: '#FFF', marginTop: 8, fontWeight: '600' }}>
                        Uploading…
                      </Text>
                    </View>
                  ) : null}
                  {image && !uploading ? (
                    <View
                      style={{
                        position: 'absolute',
                        right: 12,
                        bottom: 12,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: RADIUS.full,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Camera size={12} color="#FFF" />
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                        Change
                      </Text>
                    </View>
                  ) : null}
                </View>
              </LightCard>
            </TouchableOpacity>

            <LabeledInput
              label="Name"
              placeholder="e.g. JBL EON 715 Sound System"
              value={name}
              onChangeText={setName}
            />

            {/* Category */}
            <View>
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
                CATEGORY
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {CATEGORIES.map((c) => {
                  const selected = category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCategory(c)}
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
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {c.replace(/-/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <LabeledInput
              label="Base price (₹ per day)"
              placeholder="e.g. 5000"
              value={basePrice}
              onChangeText={setBasePrice}
              keyboardType="numeric"
            />

            <LabeledInput
              label="Description"
              placeholder="Brief description, specs, condition…"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <LabeledInput
              label="Tags (comma-separated)"
              placeholder="e.g. bluetooth, 1000W, wireless"
              value={tagsInput}
              onChangeText={setTagsInput}
              leftIcon={<Tag size={14} color={LIGHT.textTertiary} />}
            />

            <TouchableOpacity
              onPress={save}
              disabled={saving || uploading}
              activeOpacity={0.9}
              style={{
                backgroundColor: saving || uploading ? `${NEON.purple}66` : NEON.purple,
                borderRadius: RADIUS.full,
                paddingVertical: 16,
                alignItems: 'center',
                marginTop: SPACING.sm,
                shadowColor: NEON.purple,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text
                  style={{ color: '#FFF', fontWeight: '700', letterSpacing: 0.6, fontSize: 15 }}
                >
                  {isEdit ? 'SAVE CHANGES' : 'ADD EQUIPMENT'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LightScreenBackground>
  );
}

function LabeledInput({
  label,
  leftIcon,
  multiline,
  ...rest
}: any) {
  return (
    <View>
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
        {label.toUpperCase()}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: LIGHT.card,
          borderRadius: RADIUS.md,
          borderWidth: 1,
          borderColor: LIGHT.border,
          paddingHorizontal: SPACING.base,
          paddingVertical: multiline ? SPACING.sm : 0,
          minHeight: multiline ? 96 : 48,
        }}
      >
        {leftIcon ? <View style={{ marginRight: 8 }}>{leftIcon}</View> : null}
        <TextInput
          {...rest}
          multiline={multiline}
          placeholderTextColor={LIGHT.textMuted}
          style={{
            flex: 1,
            color: LIGHT.text,
            fontSize: 14,
            paddingVertical: multiline ? 0 : 12,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
      </View>
    </View>
  );
}
