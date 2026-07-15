import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Polyline, Circle, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import {
  Package,
  MessageSquare,
  ShoppingBag,
  TrendingUp,
  Plus,
  ChevronRight,
  Bell,
  Star,
  Wallet,
  Calendar,
  ArrowUpRight,
  BarChart3,
  Clock,
  Eye,
  Megaphone,
  Users,
} from 'lucide-react-native';
import {
  LightScreenBackground,
  LightCard,
  TYPE,
  LIGHT,
  NEON,
  SPACING,
  RADIUS,
} from '../components/ui';
import { useAuthStore } from '../store';
import {
  equipmentAPI,
  ordersAPI,
  inquiryAPI,
  notificationsAPI,
  resolveMediaUrl,
} from '../api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatINR(paise: number): string {
  const rupees = Math.round(paise / 100);
  return '₹' + rupees.toLocaleString('en-IN');
}

function formatShort(value: number): string {
  if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L';
  if (value >= 1000) return '₹' + (value / 1000).toFixed(1) + 'K';
  return '₹' + value;
}

export default function SupplierHomeScreen({ navigation }: any) {
  const { user, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEarningsPaise: 0,
    monthEarningsPaise: 0,
    activeOrders: 0,
    pendingInquiries: 0,
    equipmentCount: 0,
    unreadNotifications: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const loadDashboard = useCallback(async () => {
    const [ordersRes, inquiriesRes, equipmentRes, notifRes] = await Promise.all([
      ordersAPI.getSupplierOrders().catch(() => null),
      inquiryAPI.getMine().catch(() => null),
      equipmentAPI.getMine().catch(() => null),
      notificationsAPI.getUnreadCount().catch(() => null),
    ]);

    const orders: any[] = ordersRes?.data?.orders ?? ordersRes?.data ?? [];
    const inquiries: any[] = inquiriesRes?.data?.inquiries ?? inquiriesRes?.data ?? [];
    const equipment: any[] = equipmentRes?.data?.equipment ?? equipmentRes?.data ?? [];

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let total = 0;
    let month = 0;
    let active = 0;
    orders.forEach((o: any) => {
      const amt = Number(o.totalPaise ?? o.total ?? 0);
      const status = String(o.status || '').toLowerCase();
      if (status === 'completed') {
        total += amt;
        const when = new Date(o.completedAt || o.updatedAt || o.createdAt || 0);
        if (when >= monthStart) month += amt;
      }
      if (['pending', 'confirmed', 'in-progress', 'in_progress'].includes(status)) {
        active += 1;
      }
    });

    const pending = inquiries.filter(
      (i: any) => String(i.status || '').toLowerCase() === 'pending'
    ).length;

    setStats({
      totalEarningsPaise: total,
      monthEarningsPaise: month,
      activeOrders: active,
      pendingInquiries: pending,
      equipmentCount: equipment.length,
      unreadNotifications: Number(notifRes?.data?.count ?? 0),
    });
    setRecentOrders(orders.slice(0, 3));
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser().catch(() => null);
      await loadDashboard();
      setLoading(false);
    })();
  }, [loadDashboard, refreshUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const avatarUrl = user?.avatar ? resolveMediaUrl(user.avatar) : null;
  const totalRevenue = Math.round(stats.totalEarningsPaise / 100);
  const monthRevenue = Math.round(stats.monthEarningsPaise / 100);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || user?.businessName?.split(' ')[0] || 'Seller';

  return (
    <LightScreenBackground>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.sm,
            paddingBottom: SPACING.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.caption, { color: LIGHT.textTertiary, marginBottom: 2, marginTop: 4 }]}>
              {greeting}, {firstName} 👋
            </Text>
            <Text style={[TYPE.h4, { color: LIGHT.text, fontWeight: '800' }]} numberOfLines={1}>
              {user?.businessName || user?.name || 'Supplier'}
            </Text>
            <Text style={[TYPE.tiny, { color: LIGHT.textTertiary, marginTop: 2 }]}>
              Let's grow your business today!
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: LIGHT.card,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: LIGHT.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Bell size={19} color={LIGHT.text} strokeWidth={1.75} />
            {stats.unreadNotifications > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  minWidth: 17,
                  height: 17,
                  borderRadius: 8.5,
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: LIGHT.bg,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>
                  {stats.unreadNotifications > 9 ? '9+' : stats.unreadNotifications}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={NEON.purple} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.purple} />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Earnings Hero Card */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Earnings')}>
              <LinearGradient
                colors={['#7C3AED', '#8B5CF6', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  marginHorizontal: SPACING.lg,
                  borderRadius: 24,
                  padding: SPACING.lg,
                  marginBottom: SPACING.lg,
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 8,
                  minHeight: 180,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Wallet size={16} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                      <Text style={[TYPE.caption, { color: 'rgba(255,255,255,0.9)', marginLeft: 6, fontWeight: '600' }]}>
                        Today's Earnings
                      </Text>
                    </View>
                    <Text style={{ color: '#FFF', fontSize: 36, fontWeight: '800', letterSpacing: -1 }}>
                      {formatINR(stats.monthEarningsPaise)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <ArrowUpRight size={12} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', marginLeft: 2 }}>
                          +12.5% this month
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                        Lifetime: {formatINR(stats.totalEarningsPaise)}
                      </Text>
                      <ChevronRight size={14} color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                  {/* Money bag illustration area */}
                  <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ position: 'relative' }}>
                      <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 36 }}>💰</Text>
                      </View>
                      {/* Floating coins */}
                      <View style={{ position: 'absolute', top: -5, right: -10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FCD34D', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#92400E' }}></Text>
                      </View>
                      <View style={{ position: 'absolute', bottom: 0, left: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FCD34D', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#92400E' }}>₹</Text>
                      </View>
                    </View>
                    {/* Mini bar chart */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 8 }}>
                      <View style={{ width: 8, height: 16, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                      <View style={{ width: 8, height: 24, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 2 }} />
                      <View style={{ width: 8, height: 20, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
                      <View style={{ width: 8, height: 32, backgroundColor: '#FFF', borderRadius: 2 }} />
                      <View style={{ width: 8, height: 28, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2 }} />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Overview Section */}
            <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
              <Text style={[TYPE.h4, { color: LIGHT.text, fontWeight: '800', marginBottom: SPACING.sm }]}>
                Overview
              </Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                <OverviewCard
                  icon={ShoppingBag}
                  label="Active Orders"
                  value={String(stats.activeOrders)}
                  color="#10B981"
                  onPress={() => navigation.navigate('Main', { screen: 'Orders' })}
                />
                <OverviewCard
                  icon={Wallet}
                  label="Revenue"
                  value={formatShort(totalRevenue)}
                  color="#6366F1"
                  onPress={() => navigation.navigate('Earnings')}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <OverviewCard
                  icon={Star}
                  label="Rating"
                  value={user?.rating ? Number(user.rating).toFixed(1) : '—'}
                  color="#F59E0B"
                />
                <OverviewCard
                  icon={Package}
                  label="Products"
                  value={String(stats.equipmentCount)}
                  color="#8B5CF6"
                  onPress={() => navigation.navigate('Main', { screen: 'Equipment' })}
                />
              </View>
            </View>

            {/* Quick Actions */}
            <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
              <Text style={[TYPE.h4, { color: LIGHT.text, fontWeight: '800', marginBottom: SPACING.sm }]}>
                Quick Actions
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                <QuickActionCircle icon={Plus} label="Add Product" onPress={() => navigation.navigate('AddEditEquipment')} />
                <QuickActionCircle icon={Package} label="My Products" onPress={() => navigation.navigate('Main', { screen: 'Equipment' })} />
                <QuickActionCircle icon={ShoppingBag} label="Orders" onPress={() => navigation.navigate('Main', { screen: 'Orders' })} />
                <QuickActionCircle icon={BarChart3} label="Analytics" onPress={() => navigation.navigate('Earnings')} />
                <QuickActionCircle icon={Wallet} label="Withdraw" onPress={() => navigation.navigate('Earnings')} />
                <QuickActionCircle icon={Megaphone} label="Promotions" onPress={() => {}} />
              </ScrollView>
            </View>

            {/* Sales Overview Chart */}
            <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
                <Text style={[TYPE.h4, { color: LIGHT.text, fontWeight: '800' }]}>Sales Overview</Text>
                <Text style={[TYPE.caption, { color: LIGHT.textTertiary }]}>This Week</Text>
              </View>
              <LightCard padding={SPACING.base}>
                {/* Line chart visualization */}
                <View style={{ height: 130, justifyContent: 'center' }}>
                  <Svg height="120" width="100%" viewBox="0 0 300 120">
                    {/* Grid lines */}
                    <Line x1="0" y1="30" x2="300" y2="30" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4" />
                    <Line x1="0" y1="60" x2="300" y2="60" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4" />
                    <Line x1="0" y1="90" x2="300" y2="90" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4" />
                    {/* Area fill */}
                    <Path
                      d="M 0,90 L 43,70 L 86,75 L 129,50 L 172,60 L 215,30 L 258,45 L 300,35 L 300,120 L 0,120 Z"
                      fill="url(#gradient)"
                      opacity="0.3"
                    />
                    {/* Line */}
                    <Polyline
                      points="0,90 43,70 86,75 129,50 172,60 215,30 258,45 300,35"
                      fill="none"
                      stroke="#7C3AED"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Data points */}
                    <Circle cx="0" cy="90" r="4" fill="#7C3AED" />
                    <Circle cx="43" cy="70" r="4" fill="#7C3AED" />
                    <Circle cx="86" cy="75" r="4" fill="#7C3AED" />
                    <Circle cx="129" cy="50" r="4" fill="#7C3AED" />
                    <Circle cx="172" cy="60" r="4" fill="#7C3AED" />
                    <Circle cx="215" cy="30" r="5" fill="#7C3AED" stroke="#FFF" strokeWidth="2" />
                    <Circle cx="258" cy="45" r="4" fill="#7C3AED" />
                    <Circle cx="300" cy="35" r="4" fill="#7C3AED" />
                    <Defs>
                      <SvgLinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                        <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                      </SvgLinearGradient>
                    </Defs>
                  </Svg>
                </View>
                {/* Day labels */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <Text key={i} style={[TYPE.tiny, { color: i === 5 ? NEON.purple : LIGHT.textTertiary, fontSize: 9, fontWeight: i === 5 ? '700' : '500' }]}>
                      {day}
                    </Text>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: LIGHT.border }}>
                  <View>
                    <Text style={[TYPE.tiny, { color: LIGHT.textTertiary }]}>Total Sales</Text>
                    <Text style={[TYPE.h4, { color: LIGHT.text, fontWeight: '800' }]}>{formatINR(stats.totalEarningsPaise)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[TYPE.tiny, { color: '#10B981', fontWeight: '700' }]}>↑ 12.5%</Text>
                    <Text style={[TYPE.tiny, { color: LIGHT.textTertiary }]}>vs last week</Text>
                  </View>
                </View>
              </LightCard>
            </View>

            {/* Recent Orders */}
            <View style={{ paddingHorizontal: SPACING.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
                <Text style={[TYPE.h4, { color: LIGHT.text, fontWeight: '800' }]}>Recent Orders</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Orders' })}>
                  <Text style={[TYPE.caption, { color: NEON.purple, fontWeight: '600' }]}>View all</Text>
                </TouchableOpacity>
              </View>

              {recentOrders.length === 0 ? (
                <LightCard padding={SPACING.xl}>
                  <View style={{ alignItems: 'center', paddingVertical: SPACING.lg }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: `${NEON.purple}12`, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md }}>
                      <ShoppingBag size={26} color={NEON.purple} strokeWidth={1.5} />
                    </View>
                    <Text style={[TYPE.body, { color: LIGHT.text, fontWeight: '700', marginBottom: 4 }]}>No orders yet</Text>
                    <Text style={[TYPE.caption, { color: LIGHT.textTertiary, textAlign: 'center' }]}>Your first booking will appear here</Text>
                  </View>
                </LightCard>
              ) : (
                recentOrders.map((o: any) => {
                  const id = o.id ?? o._id;
                  const status = String(o.status || 'pending');
                  return (
                    <TouchableOpacity
                      key={id}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('OrderDetail', { orderId: id })}
                      style={{ marginBottom: SPACING.sm }}
                    >
                      <LightCard padding={SPACING.base}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: `${NEON.purple}12`, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm }}>
                            <Package size={22} color={NEON.purple} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={[TYPE.bodySm, { color: LIGHT.text, fontWeight: '700' }]}>
                                {o.orderNumber || `#${String(id).slice(-6)}`}
                              </Text>
                              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: statusTint(status) + '18' }}>
                                <Text style={{ color: statusTint(status), fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                                  {status.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                            <Text style={[TYPE.caption, { color: LIGHT.textTertiary, marginTop: 2 }]}>
                              {o.buyer?.name || o.buyerName || 'Buyer'}
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Clock size={10} color={LIGHT.textTertiary} />
                                <Text style={[TYPE.tiny, { color: LIGHT.textTertiary, marginLeft: 3 }]}>
                                  {o.createdAt ? timeAgo(o.createdAt) : 'Just now'}
                                </Text>
                              </View>
                              <Text style={[TYPE.bodySm, { color: LIGHT.text, fontWeight: '700' }]}>
                                {formatINR(Number(o.totalPaise ?? o.total ?? 0))}
                              </Text>
                            </View>
                          </View>
                          <ChevronRight size={18} color={LIGHT.textTertiary} style={{ marginLeft: 8 }} />
                        </View>
                      </LightCard>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LightScreenBackground>
  );
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function statusTint(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed') return '#10B981';
  if (s === 'cancelled' || s === 'rejected') return '#EF4444';
  if (s === 'in-progress' || s === 'in_progress') return '#6366F1';
  if (s === 'confirmed') return '#3B82F6';
  return '#F59E0B';
}

function OverviewCard({ icon: Icon, label, value, color, onPress }: { icon: any; label: string; value: string; color: string; onPress?: () => void }) {
  const body = (
    <LightCard padding={SPACING.base} style={{ flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} strokeWidth={2} />
        </View>
      </View>
      <Text style={[TYPE.h3, { color: LIGHT.text, fontWeight: '800' }]}>{value}</Text>
      <Text style={[TYPE.tiny, { color: LIGHT.textTertiary, marginTop: 2, fontWeight: '500' }]}>{label}</Text>
    </LightCard>
  );
  return onPress ? (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flex: 1 }}>{body}</TouchableOpacity>
  ) : (
    <View style={{ flex: 1 }}>{body}</View>
  );
}

function QuickActionCircle({ icon: Icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ alignItems: 'center', width: 72 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${NEON.purple}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 6, borderWidth: 1, borderColor: `${NEON.purple}20` }}>
        <Icon size={22} color={NEON.purple} strokeWidth={2} />
      </View>
      <Text style={[TYPE.tiny, { color: LIGHT.text, fontWeight: '600', textAlign: 'center' }]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}
