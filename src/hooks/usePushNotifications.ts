import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://server-1-xgr2.onrender.com/api';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and send token to backend
 */
async function registerForPushNotifications(): Promise<string | null> {
  // Only works on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get Expo Push Token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId 
      ?? Constants.easConfig?.projectId;
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    const token = tokenData.data;
    console.log('📱 Push token:', token);

    // Send token to backend
    const authToken = await AsyncStorage.getItem('@urbanav_token');
    if (authToken) {
      try {
        await axios.post(
          `${API_URL}/auth/fcm-token`,
          { fcmToken: token },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('📱 Push token registered with server');
      } catch (err: any) {
        console.error('Failed to register push token:', err?.message);
      }
    }

    return token;
  } catch (error: any) {
    console.error('Error getting push token:', error?.message);
    return null;
  }
}

// Set up Android notification channel
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('urbanav_default', {
    name: 'UrbanAV Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7B25F4',
    sound: 'default',
  });
}

/**
 * Hook to manage push notifications
 * Call this in App.tsx or your main screen
 */
export function usePushNotifications(onNotificationPress?: (data: any) => void) {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications();

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Notification received:', notification.request.content.title);
      }
    );

    // Listen for notification taps (user presses the notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('📱 Notification pressed:', data);
        if (onNotificationPress) {
          onNotificationPress(data);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);
}

export { registerForPushNotifications };
