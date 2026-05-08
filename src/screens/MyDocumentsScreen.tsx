import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Linking,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  FileText,
  Eye,
  UploadCloud,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { GRADIENT, GLASS, NEON, TEXT, SEMANTIC } from '../theme/colors';
import { authAPI, resolveMediaUrl } from '../api';
import { useAuthStore } from '../store';

type DocKey = 'pan' | 'aadhaar' | 'bankProof' | 'gst';
type Requirement = 'required' | 'optional' | 'recommended';

type DocShape = {
  url?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
} | null | undefined;

interface SlotDef {
  key: DocKey;
  label: string;
  requirement: Requirement;
}

const SLOTS: SlotDef[] = [
  { key: 'pan', label: 'PAN Card', requirement: 'required' },
  { key: 'aadhaar', label: 'Aadhaar Card', requirement: 'optional' },
  { key: 'bankProof', label: 'Bank Proof', requirement: 'required' },
  { key: 'gst', label: 'GST / Business License', requirement: 'recommended' },
];

const formatBytes = (b?: number) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

export default function MyDocumentsScreen({ navigation }: any) {
  const { user, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<DocKey | null>(null);

  const kycDocs: Record<DocKey, DocShape> = useMemo(
    () => ({
      pan: user?.kycDocuments?.pan || user?.kycDocument || null,
      aadhaar: user?.kycDocuments?.aadhaar || null,
      bankProof: user?.kycDocuments?.bankProof || null,
      gst: user?.kycDocuments?.gst || null,
    }),
    [user]
  );

  const kycStatus: string = user?.kycStatus || 'pending';

  const loadFresh = useCallback(async () => {
    setLoading(true);
    try {
      await refreshUser();
    } catch {
      /* ignore — server may be unreachable */
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    loadFresh();
  }, [loadFresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
    }
  };

  const handleView = async (doc: DocShape, label: string) => {
    if (!doc?.url) return;
    const url = resolveMediaUrl(doc.url) || doc.url;
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('Cannot open file', 'Your device cannot preview this file.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Cannot open file', `Unable to open ${label}.`);
    }
  };

  const handleReplace = async (slot: DocKey) => {
    if (kycStatus === 'approved') {
      Alert.alert(
        'KYC already approved',
        'Your documents are already approved. Contact support if you need to update them.'
      );
      return;
    }
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;
      const asset: any = (res as any).assets ? (res as any).assets[0] : res;
      if (!asset?.uri) return;

      const size = asset.size ?? 0;
      if (size > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Please select a file under 5 MB.');
        return;
      }

      setUploadingKey(slot);
      const token = (await AsyncStorage.getItem('@urbanav_token')) || undefined;
      const payload: any = {
        pan: null,
        aadhaar: null,
        bankProof: null,
        gst: null,
      };
      payload[slot] = {
        uri: asset.uri,
        name: asset.name || `${slot}-${Date.now()}.pdf`,
        mimeType: asset.mimeType || 'application/pdf',
      };
      await authAPI.uploadKycDocuments(payload, {}, token);
      await refreshUser();
      Alert.alert('Uploaded', 'Document uploaded. Admin will re-verify your KYC.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Upload failed';
      Alert.alert('Upload error', msg);
    } finally {
      setUploadingKey(null);
    }
  };

  const statusMeta = useMemo(() => {
    switch (kycStatus) {
      case 'approved':
        return {
          label: 'APPROVED',
          sub: 'Your KYC has been verified by admin.',
          icon: CheckCircle2,
          color: SEMANTIC.success,
          bg: 'rgba(34, 224, 130, 0.12)',
          border: 'rgba(34, 224, 130, 0.45)',
        };
      case 'rejected':
        return {
          label: 'REJECTED',
          sub: user?.kycRejectionReason || 'Please re-upload the required documents.',
          icon: XCircle,
          color: SEMANTIC.error,
          bg: 'rgba(255, 85, 85, 0.12)',
          border: 'rgba(255, 85, 85, 0.45)',
        };
      case 'submitted':
        return {
          label: 'UNDER REVIEW',
          sub: 'Admin will verify your documents within 24–48 hours.',
          icon: Clock,
          color: SEMANTIC.warning,
          bg: 'rgba(255, 181, 71, 0.12)',
          border: 'rgba(255, 181, 71, 0.45)',
        };
      default:
        return {
          label: 'PENDING',
          sub: 'Upload required documents to start verification.',
          icon: AlertCircle,
          color: SEMANTIC.warning,
          bg: 'rgba(255, 181, 71, 0.12)',
          border: 'rgba(255, 181, 71, 0.45)',
        };
    }
  }, [kycStatus, user?.kycRejectionReason]);

  const StatusIcon = statusMeta.icon;

  return (
    <LinearGradient colors={GRADIENT.appBg as string[]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color={TEXT.primary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My KYC Documents</Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RefreshCw size={18} color={TEXT.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={NEON.glow}
              colors={[NEON.glow]}
            />
          }
        >
          {/* Status card */}
          <View
            style={[
              styles.statusCard,
              { backgroundColor: statusMeta.bg, borderColor: statusMeta.border },
            ]}
          >
            <View style={[styles.statusIconWrap, { borderColor: statusMeta.border }]}>
              <StatusIcon size={22} color={statusMeta.color} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusLabel, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
              <Text style={styles.statusSub}>{statusMeta.sub}</Text>
            </View>
          </View>

          {loading && !refreshing ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={NEON.glow} />
            </View>
          ) : null}

          {/* Documents list */}
          {SLOTS.map((slot) => {
            const doc = kycDocs[slot.key];
            const hasFile = !!doc?.url;
            const uploading = uploadingKey === slot.key;
            const badgeStyle =
              slot.requirement === 'required'
                ? styles.badgeRequired
                : slot.requirement === 'optional'
                ? styles.badgeOptional
                : styles.badgeRecommended;
            const badgeText =
              slot.requirement === 'required'
                ? 'Required'
                : slot.requirement === 'optional'
                ? 'Optional'
                : 'Recommended';
            return (
              <View key={slot.key} style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={styles.docIcon}>
                    <FileText size={18} color={hasFile ? SEMANTIC.success : TEXT.tertiary} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{slot.label}</Text>
                    <View style={badgeStyle}>
                      <Text style={styles.badgeText}>{badgeText}</Text>
                    </View>
                  </View>
                </View>

                {hasFile ? (
                  <View style={styles.fileRow}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {doc?.filename || 'Document'}
                    </Text>
                    <Text style={styles.fileMeta}>
                      {(doc?.mimeType || 'application/pdf').replace('application/', '').toUpperCase()}
                      {doc?.size ? `  ·  ${formatBytes(doc.size)}` : ''}
                      {doc?.uploadedAt ? `  ·  ${formatDate(doc.uploadedAt)}` : ''}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No file uploaded yet.</Text>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    disabled={!hasFile}
                    onPress={() => handleView(doc, slot.label)}
                    activeOpacity={0.85}
                    style={[styles.actionBtn, !hasFile && styles.actionBtnDisabled]}
                  >
                    <Eye size={14} color={hasFile ? NEON.glow : TEXT.tertiary} strokeWidth={2} />
                    <Text
                      style={[
                        styles.actionBtnText,
                        { color: hasFile ? NEON.glow : TEXT.tertiary },
                      ]}
                    >
                      VIEW
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={uploading || kycStatus === 'approved'}
                    onPress={() => handleReplace(slot.key)}
                    activeOpacity={0.85}
                    style={[
                      styles.actionBtn,
                      styles.actionBtnPrimary,
                      (uploading || kycStatus === 'approved') && { opacity: 0.5 },
                    ]}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <UploadCloud size={14} color="#FFFFFF" strokeWidth={2} />
                        <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                          {hasFile ? 'REPLACE' : 'UPLOAD'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <Text style={styles.footerNote}>
            Supported formats: PDF, JPG, PNG · Max 5 MB each. Admin will
            re-verify your KYC each time a document is replaced.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT.primary,
    letterSpacing: -0.2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  statusSub: {
    fontSize: 12.5,
    color: TEXT.secondary,
    lineHeight: 18,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GLASS.tier2Border,
    backgroundColor: GLASS.tier3,
    padding: 14,
    marginBottom: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  docIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 217, 255, 0.06)',
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT.primary,
    marginBottom: 4,
  },
  badgeRequired: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 85, 0.45)',
    backgroundColor: 'rgba(255, 85, 85, 0.14)',
  },
  badgeOptional: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(247, 217, 255, 0.28)',
    backgroundColor: 'rgba(247, 217, 255, 0.08)',
  },
  badgeRecommended: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34, 224, 130, 0.40)',
    backgroundColor: 'rgba(34, 224, 130, 0.14)',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: TEXT.primary,
    textTransform: 'uppercase',
  },
  fileRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 224, 130, 0.30)',
    backgroundColor: 'rgba(34, 224, 130, 0.06)',
    marginBottom: 10,
  },
  fileName: {
    fontSize: 13,
    color: TEXT.primary,
    fontWeight: '600',
    marginBottom: 3,
  },
  fileMeta: {
    fontSize: 11,
    color: TEXT.tertiary,
  },
  emptyText: {
    fontSize: 12,
    color: TEXT.tertiary,
    fontStyle: 'italic',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GLASS.tier1Border,
    backgroundColor: GLASS.tier2,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnPrimary: {
    borderColor: 'rgba(230, 102, 255, 0.55)',
    backgroundColor: 'rgba(230, 102, 255, 0.35)',
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  footerNote: {
    fontSize: 11.5,
    color: TEXT.tertiary,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
});
