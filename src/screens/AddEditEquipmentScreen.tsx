import React, { useState, useEffect } from 'react';
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

  // Sample images from server
  const [sampleImages, setSampleImages] = useState<string[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);

  // Fetch sample images for a category
  const fetchSampleImages = async (cat: string) => {
    setLoadingSamples(true);
    try {
      const res = await equipmentAPI.getSampleImages(cat);
      console.log('Sample images response:', res.data);
      const imgs = res.data?.sampleImages || [];
      // Resolve relative URLs to absolute
      const resolved = imgs.map((img: string) => resolveMediaUrl(img) || img);
      console.log('Resolved image URLs:', resolved);
      setSampleImages(resolved);
    } catch (error) {
      console.error('Error fetching sample images:', error);
      setSampleImages([]);
    } finally {
      setLoadingSamples(false);
    }
  };

  // Fetch sample images on mount and when category changes
  useEffect(() => {
    fetchSampleImages(category);
  }, [category]);

  // When category changes, set default image if no custom image
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    // If no custom image uploaded, clear current image
    if (!uploadedUrl) {
      setImage(null);
    }
  };

  const useSampleImage = (imgUrl: string) => {
    setImage(imgUrl);
    setUploadedUrl(imgUrl);
  };

  const clearImage = () => {
    setImage(null);
    setUploadedUrl(null);
  };

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
    console.log('Selected image URI:', uri);
    setImage(uri);
    setUploading(true);
    try {
      console.log('Uploading image to server...');
      const res = await uploadAPI.image(uri, 'equipment');
      console.log('Upload response:', res.data);
      const url = res.data?.url || res.data?.path || res.data?.file?.url;
      if (url) {
        setUploadedUrl(url);
        console.log('Image uploaded successfully:', url);
      } else {
        console.error('No URL in upload response');
        Alert.alert('Upload failed', 'No URL returned from server');
      }
    } catch (e: any) {
      console.error('Upload error:', e);
      console.error('Error response:', e?.response?.data);
      console.error('Error status:', e?.response?.status);
      Alert.alert(
        'Upload failed',
        e?.response?.data?.message || e?.message || 'Try again'
      );
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
                    marginRight: SPACING.sm,
                  }}
                >
                  <ChevronLeft size={20} color={LIGHT.text} />
                </TouchableOpacity>
              ) : null}
              <Text style={[TYPE.h3, { color: LIGHT.text, fontWeight: '700' }]}>
                {isEdit ? 'Edit Product' : 'Add Product'}
              </Text>
            </View>
          </FadeInView>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: SPACING.base,
              paddingBottom: 140,
              gap: SPACING.base,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Image picker */}
            <View>
              <TouchableOpacity activeOpacity={0.85} onPress={pickImage}>
                <LightCard padding={0} style={{ overflow: 'hidden' }}>
                  <View
                    style={{
                      height: 200,
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
                        <View
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: `${NEON.purple}20`,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: SPACING.sm,
                          }}
                        >
                          <ImageIcon size={28} color={NEON.purple} strokeWidth={1.75} />
                        </View>
                        <Text
                          style={[TYPE.body, { color: LIGHT.text, fontWeight: '600', marginTop: SPACING.xs }]}
                        >
                          Tap to add product image
                        </Text>
                        <Text
                          style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 4 }]}
                        >
                          JPG, PNG up to 5MB
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
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ActivityIndicator color="#FFF" size="large" />
                        <Text style={{ color: '#FFF', marginTop: 12, fontWeight: '700', fontSize: 14 }}>
                          Uploading image...
                        </Text>
                      </View>
                    ) : null}
                    {image && !uploading ? (
                      <View
                        style={{
                          position: 'absolute',
                          right: 12,
                          bottom: 12,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: RADIUS.full,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Camera size={14} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                          Change Image
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </LightCard>
              </TouchableOpacity>
              {image && !uploadedUrl && (
                <TouchableOpacity
                  onPress={clearImage}
                  style={{
                    marginTop: SPACING.xs,
                    alignSelf: 'flex-end',
                    paddingHorizontal: SPACING.sm,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={[TYPE.caption, { color: LIGHT.textTertiary, fontWeight: '600' }]}>
                    Remove image
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <LabeledInput
              label="Product Name"
              placeholder="e.g. JBL Speaker, LED Light"
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
                TYPE
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
                      onPress={() => handleCategoryChange(c)}
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

            {/* Sample images for selected category */}
            {!uploadedUrl && sampleImages.length > 0 && (
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
                  SAMPLE IMAGES
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                  {sampleImages.slice(0, 6).map((imgUrl, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => useSampleImage(imgUrl)}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: RADIUS.md,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: idx === 0 ? NEON.purple : LIGHT.border,
                      }}
                    >
                      <Image
                        source={{ uri: imgUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(184, 61, 245, 0.9)',
                          paddingVertical: 4,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
                          USE THIS
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: SPACING.xs }]}>
                  Don't have images? Use our sample images above
                </Text>
              </View>
            )}

            {loadingSamples && !uploadedUrl && (
              <View style={{ alignItems: 'center', paddingVertical: SPACING.base }}>
                <ActivityIndicator size="small" color={NEON.purple} />
                <Text style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: SPACING.xs }]}>
                  Loading sample images...
                </Text>
              </View>
            )}

            <LabeledInput
              label="Price (₹ per day)"
              placeholder="e.g. 5000"
              value={basePrice}
              onChangeText={setBasePrice}
              keyboardType="numeric"
            />

            <LabeledInput
              label="About Product"
              placeholder="What is it? Condition? Features?"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <LabeledInput
              label="Keywords (optional)"
              placeholder="e.g. bluetooth, speaker, wireless"
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
                  {isEdit ? 'SAVE CHANGES' : 'ADD PRODUCT'}
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
