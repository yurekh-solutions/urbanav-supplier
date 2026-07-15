import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  BarChart3,
  Package,
  MessageSquare,
  ShoppingCart,
  Plus,
  ClipboardList,
  User,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Auth / onboarding
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import KYCFormScreen from './src/screens/KYCFormScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PendingApprovalScreen from './src/screens/PendingApprovalScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import MyDocumentsScreen from './src/screens/MyDocumentsScreen';

// Shared screens
import ProfileScreen from './src/screens/ProfileScreen';
import ChatScreen from './src/screens/ChatScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import AddressesScreen from './src/screens/AddressesScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import TermsScreen from './src/screens/TermsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';

// Supplier-specific
import SupplierHomeScreen from './src/screens/SupplierHomeScreen';
import MyEquipmentScreen from './src/screens/MyEquipmentScreen';
import AddEditEquipmentScreen from './src/screens/AddEditEquipmentScreen';
import IncomingInquiriesScreen from './src/screens/IncomingInquiriesScreen';
import BrowseRequirementsScreen from './src/screens/BrowseRequirementsScreen';
import SupplierOrdersScreen from './src/screens/SupplierOrdersScreen';
import EarningsScreen from './src/screens/EarningsScreen';

import { NEON, SURFACE, TEXT, GLASS } from './src/theme/colors';
import { LAYOUT } from './src/theme/spacing';
import { TabBounce } from './src/components/ui';
import { useAuthStore } from './src/store';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { ToastProvider } from './src/components/ToastContext';

const BackHandler = Platform.OS === 'android' ? require('react-native').BackHandler : null;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SupplierTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(20, 8, 33, 0.92)',
          borderTopColor: GLASS.tier2Border,
          borderTopWidth: 1,
          height: LAYOUT.tabBarHeight,
          paddingBottom: 10,
          paddingTop: 10,
          position: 'absolute',
          shadowColor: NEON.purple,
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 16,
        },
        tabBarActiveTintColor: NEON.glow,
        tabBarInactiveTintColor: TEXT.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={SupplierHomeScreen}
        options={{
          tabBarIcon: ({ focused, color }: any) => (
            <TabBounce focused={focused}>
              <BarChart3 size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </TabBounce>
          ),
        }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseRequirementsScreen}
        options={{
          tabBarLabel: 'Find Work',
          tabBarIcon: ({ focused, color }: any) => (
            <TabBounce focused={focused}>
              <ClipboardList size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </TabBounce>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={SupplierOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused, color }: any) => (
            <TabBounce focused={focused}>
              <ShoppingCart size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </TabBounce>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }: any) => (
            <TabBounce focused={focused}>
              <User size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </TabBounce>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, hasOnboarded, checkAuth, user } = useAuthStore();

  // Register push notifications when authenticated
  usePushNotifications();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || !BackHandler) return;
    const backAction = () => false;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: SURFACE.base,
        }}
      >
        <ActivityIndicator size="large" color={NEON.glow} />
        <Text style={{ color: TEXT.secondary, marginTop: 16, fontSize: 16, fontWeight: '600' }}>
          Loading UrbanAV Supplier...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: SURFACE.base }}>
      <SafeAreaProvider>
      <ToastProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            contentStyle: { backgroundColor: SURFACE.base },
          }}
        >
          {!hasOnboarded ? (
            <>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="KYCForm" component={KYCFormScreen} />
              <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
            </>
          ) : !isAuthenticated ? (
            // Unauthenticated but has onboarded — check if pending approval
            user?.accountStatus === 'pending' || user?.kycStatus === 'pending' ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="KYCForm" component={KYCFormScreen} />
                <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} initialParams={{
                  email: user?.email || '',
                  kycUploaded: user?.kycStatus === 'submitted' || user?.kycStatus === 'approved',
                  accountStatus: user?.accountStatus || 'pending',
                  kycStatus: user?.kycStatus || 'pending',
                  rejectionReason: user?.kycRejectionReason || '',
                }} />
              </>
            ) : user?.accountStatus === 'rejected' || user?.kycStatus === 'rejected' ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="KYCForm" component={KYCFormScreen} />
                <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} initialParams={{
                  email: user?.email || '',
                  accountStatus: 'rejected',
                  kycStatus: 'rejected',
                  rejectionReason: user?.kycRejectionReason || '',
                }} />
              </>
            ) : (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="KYCForm" component={KYCFormScreen} />
                <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
              </>
            )
          ) : (
            <>
              <Stack.Screen name="Main" component={SupplierTabs} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
              <Stack.Screen name="AddEditEquipment" component={AddEditEquipmentScreen} />
              <Stack.Screen name="MyEquipment" component={MyEquipmentScreen} />
              <Stack.Screen name="Inquiries" component={IncomingInquiriesScreen} />
              <Stack.Screen name="Earnings" component={EarningsScreen} />
              <Stack.Screen name="Addresses" component={AddressesScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Terms" component={TermsScreen} />
              <Stack.Screen name="Privacy" component={PrivacyScreen} />
              <Stack.Screen name="MyDocuments" component={MyDocumentsScreen} />
              <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
