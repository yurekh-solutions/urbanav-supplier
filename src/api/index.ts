import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = 'http://localhost:4001/api';
export const API_BASE = API_URL.replace(/\/api$/, '');

/** Resolve a possibly-relative media URL (e.g. `/uploads/xxx.jpg`) to an absolute URL. */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT from AsyncStorage
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@urbanav_token');
    if (token && token !== 'mock-token') {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// Auto-clear the session when the server reports that our token is no
// longer valid (invalid signature, deleted user, expired, etc.). This
// prevents the UI from looping on 401 / 500 errors after a stale token.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    if (status === 401 || code === 'USER_NOT_FOUND') {
      try {
        await AsyncStorage.multiRemove([
          '@urbanav_user',
          '@urbanav_token',
          '@urbanav_authenticated',
        ]);
      } catch {}
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  verifyOTP: (data: any) => api.post('/auth/verify-otp', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  submitKYC: (data: any) => api.put('/auth/kyc', data),
  // Upload a KYC document (PDF/JPG/PNG) using multipart/form-data.
  uploadKycDocument: async (uri: string, filename: string, mimeType = 'application/pdf', token?: string) => {
    const form = new FormData();
    if (Platform.OS === 'web') {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      (form as any).append('document', blob, filename);
    } else {
      form.append('document', { uri, name: filename, type: mimeType } as any);
    }
    return api.post('/auth/kyc-document', form, {
      headers: {
        ...(Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      transformRequest: (d) => d,
    });
  },
  // Upload multi-slot KYC documents (PAN / Aadhaar / BankProof / GST)
  // together with business description, products offered, years in business.
  uploadKycDocuments: async (
    docs: {
      pan?: { uri: string; name: string; mimeType: string } | null;
      aadhaar?: { uri: string; name: string; mimeType: string } | null;
      bankProof?: { uri: string; name: string; mimeType: string } | null;
      gst?: { uri: string; name: string; mimeType: string } | null;
    },
    meta: {
      businessName?: string;
      businessDescription?: string;
      productsOffered?: string[];
      yearsInBusiness?: number | string;
      gstNumber?: string;
      panNumber?: string;
    },
    token?: string
  ) => {
    const form = new FormData();

    const appendFile = async (field: 'pan' | 'aadhaar' | 'bankProof' | 'gst', d?: { uri: string; name: string; mimeType: string } | null) => {
      if (!d || !d.uri) return;
      if (Platform.OS === 'web') {
        const resp = await fetch(d.uri);
        const blob = await resp.blob();
        (form as any).append(field, blob, d.name);
      } else {
        form.append(field, { uri: d.uri, name: d.name, type: d.mimeType } as any);
      }
    };

    await appendFile('pan', docs.pan);
    await appendFile('aadhaar', docs.aadhaar);
    await appendFile('bankProof', docs.bankProof);
    await appendFile('gst', docs.gst);

    if (meta.businessName !== undefined) form.append('businessName', meta.businessName);
    if (meta.businessDescription !== undefined) form.append('businessDescription', meta.businessDescription);
    if (meta.productsOffered !== undefined) form.append('productsOffered', JSON.stringify(meta.productsOffered));
    if (meta.yearsInBusiness !== undefined) form.append('yearsInBusiness', String(meta.yearsInBusiness));
    if (meta.gstNumber !== undefined) form.append('gstNumber', meta.gstNumber);
    if (meta.panNumber !== undefined) form.append('panNumber', meta.panNumber);

    return api.post('/auth/kyc-documents', form, {
      headers: {
        ...(Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      transformRequest: (d) => d,
    });
  },
};

export const equipmentAPI = {
  getAll: (params?: any) => api.get('/equipment', { params }),
  getMine: () => api.get('/equipment/mine'),
  getById: (id: string) => api.get(`/equipment/${id}`),
  create: (data: any) => api.post('/equipment', data),
  update: (id: string, data: any) => api.put(`/equipment/${id}`, data),
  delete: (id: string) => api.delete(`/equipment/${id}`),
};

export const ordersAPI = {
  // Optional `status` is the backend enum (e.g. 'pending','confirmed','completed').
  // UI status labels (Upcoming/Ongoing/Completed/Cancelled) are mapped
  // client-side; we still pass the raw enum if a specific filter is needed.
  getSupplierOrders: (params?: { status?: string }) =>
    api.get('/orders/supplier', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, data: any) => api.put(`/orders/${id}/status`, data),
  cancel: (id: string) => api.put(`/orders/${id}/cancel`),
};

export const chatAPI = {
  getChatByOrder: (orderId: string) => api.get(`/chat/order/${orderId}`),
  getMessages: (chatId: string) => api.get(`/chat/${chatId}/messages`),
  sendMessage: (chatId: string, data: any) => api.post(`/chat/${chatId}/messages`, data),
  markAsRead: (chatId: string) => api.put(`/chat/${chatId}/read`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const inquiryAPI = {
  // Supplier sees all inquiries addressed to them (backend branches on userType).
  getMine: () => api.get('/inquiries'),
  getById: (id: string) => api.get(`/inquiries/${id}`),
  respond: (id: string, data: any) => api.patch(`/inquiries/${id}/respond`, data),
  accept: (id: string) => api.patch(`/inquiries/${id}/accept`),
  reject: (id: string, reason?: string) =>
    api.patch(`/inquiries/${id}/reject`, { reason }),
  // Supplier sends a new inquiry (quote) to a buyer for a specific requirement.
  send: (data: { vendorId: string; requirementId: string; initialPrice?: number }) =>
    api.post('/inquiries', data),
};

export const availabilityAPI = {
  getMine: (params?: { from?: string; to?: string }) =>
    api.get('/availability/me', { params }),
  getForVendor: (vendorId: string, params?: { from?: string; to?: string }) =>
    api.get('/availability', { params: { vendorId, ...(params || {}) } }),
  block: (data: {
    date: string;
    blockedSlots?: { start: string; end: string; reason?: string }[];
    fullyBlocked?: boolean;
    equipmentIds?: string[];
  }) => api.post('/availability', data),
  unblock: (id: string) => api.delete(`/availability/${id}`),
};

export const requirementAPI = {
  // Supplier browses open buyer requirements (marketplace feed).
  browse: (params?: { city?: string; eventType?: string; item?: string; status?: string; filter?: string; limit?: number }) =>
    api.get('/requirements', { params }),
  getById: (id: string) => api.get(`/requirements/${id}`),
  // Submit a competitive offer on a requirement
  sendOffer: (id: string, data: { price: number; note?: string }) =>
    api.post(`/requirements/${id}/offer`, data),
};

export const otpAPI = {
  verifyStart: (bookingId: string, otp: string) => api.post('/otp/verify-start', { bookingId, otp }),
  verifyEnd: (bookingId: string, otp: string) => api.post('/otp/verify-end', { bookingId, otp }),
};

export const reviewAPI = {
  create: (data: any) => api.post('/reviews', data),
  forVendor: (vendorId: string) => api.get(`/reviews/vendor/${vendorId}`),
};

export const addressesAPI = {
  list: () => api.get('/addresses'),
  create: (data: any) => api.post('/addresses', data),
  update: (id: string, data: any) => api.put(`/addresses/${id}`, data),
  remove: (id: string) => api.delete(`/addresses/${id}`),
  setDefault: (id: string) => api.put(`/addresses/${id}/default`),
};

// Multipart upload using FormData. Works both in React Native (file://) and web (blob:).
const isWeb = Platform.OS === 'web';

async function appendFile(form: FormData, uri: string, filename: string, mimeType: string) {
  if (isWeb) {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    (form as any).append('file', blob, filename);
  } else {
    form.append('file', { uri, name: filename, type: mimeType } as any);
  }
}

export const uploadAPI = {
  avatar: async (uri: string, mimeType = 'image/jpeg') => {
    const form = new FormData();
    const filename = uri.split('/').pop()?.split('?')[0] || `avatar-${Date.now()}.jpg`;
    await appendFile(form, uri, filename, mimeType);
    return api.post('/upload/avatar', form, {
      headers: isWeb ? {} : { 'Content-Type': 'multipart/form-data' },
      transformRequest: (d) => d,
    });
  },
  image: async (uri: string, folder = 'misc', mimeType = 'image/jpeg') => {
    const form = new FormData();
    const filename = uri.split('/').pop()?.split('?')[0] || `img-${Date.now()}.jpg`;
    await appendFile(form, uri, filename, mimeType);
    form.append('folder', folder);
    return api.post('/upload/image', form, {
      headers: isWeb ? {} : { 'Content-Type': 'multipart/form-data' },
      transformRequest: (d) => d,
    });
  },
};

export default api;
