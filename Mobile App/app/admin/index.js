import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Dimensions,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import LiveOperationModal from '../../components/LiveOperationModal';
import appClient from '../../hooks/services/client';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { width } = Dimensions.get('window');
const cardGap = 12;
const cardWidth = (width - 32 - 40 - cardGap) / 2; // 32px scrollContent padding + 40px sectionCard padding (20 * 2)

export default function HomeScreen() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const [metrics, setMetrics] = useState(null);
  const [liveOperations, setLiveOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showOperationModal, setShowOperationModal] = useState(false);
 

  
  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return '#10b981';
      case 'paused': return '#f59e0b';
      case 'at_dumpsite': return '#8b5cf6';
      default: return '#94a3b8';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress': return 'play-circle';
      case 'paused': return 'pause-circle';
      case 'at_dumpsite': return 'trash';
      default: return 'car';
    }
  };

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/');
      return false;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) return;

      const activeRoutesResponse = await appClient.get(`/trucks/active-routes`);

      if (activeRoutesResponse.data.success) {
        const formattedRoutes = activeRoutesResponse.data.routes.map(route => ({
          ...route,
          statusColor: getStatusColor(route.status),
          icon: getStatusIcon(route.status)
        }));
        setLiveOperations(formattedRoutes);
      } else {
        setLiveOperations([]);
      }

      setMetrics({
        monthlyRevenue: '₦0',
        activeCustomers: 0,
        routeCompletion: '0%',
        unpaidBalance: '₦0',
        revenueChange: '+0%',
        customerChange: '+0%',
        completionChange: '+0%',
        balanceChange: '+0%',
        activeRoutes: activeRoutesResponse.data.routes?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
      setLiveOperations([]);
      setMetrics({
        monthlyRevenue: '₦0',
        activeCustomers: 0,
        routeCompletion: '0%',
        unpaidBalance: '₦0',
        revenueChange: '+0%',
        customerChange: '+0%',
        completionChange: '+0%',
        balanceChange: '+0%',
        activeRoutes: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleOperationPress = (operation) => {
    setSelectedOperation(operation);
    setShowOperationModal(true);
  };

  const handleCloseModal = () => {
    setShowOperationModal(false);
    setSelectedOperation(null);
  };

  const handleViewFullDetails = () => {
    handleCloseModal();
  };

  const quickActions = [
    {
      id: 'live-operations',
      title: 'Live Operations',
      icon: 'map',
      color: '#ef4444',
      route: '/admin/operations/live',
      description: 'Real-time tracking',
    },
    {
      id: 'fleet-management',
      title: 'Fleet Management',
      icon: 'car-sport',
      color: '#10b981',
      route: '/admin/operations/fleet',
      description: 'Manage vehicles',
    },
    {
      id: 'team-management',
      title: 'Team Management',
      icon: 'people',
      color: '#8b5cf6',
      route: '/admin/operations/staffs',
      description: 'Staff & teams',
    },
  ];

  const handleQuickActionPress = (route) => {
    router.push(route);
  };

  const renderLiveOperation = ({ item }) => (
    <TouchableOpacity
      style={styles.operationCard}
      onPress={() => handleOperationPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.operationHeader}>
        <View style={styles.operationTitleContainer}>
          <View style={[styles.operationIcon, { backgroundColor: `${item.statusColor}15` }]}>
            <Ionicons name={item.icon} size={20} color={item.statusColor} />
          </View>
          <View style={styles.operationTextContainer}>
            <Text style={styles.operationTitle}>{item.title}</Text>
            <Text style={styles.operationSubtitle}>
              {item.supervisor ? `Supervisor: ${item.supervisor}` : 'No supervisor'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${item.statusColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: item.statusColor }]} />
          <Text style={[styles.statusText, { color: item.statusColor }]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.operationDetails}>
        {item.truck && (
          <View style={styles.detailItem}>
            <Ionicons name="speedometer" size={14} color="#64748b" />
            <Text style={styles.detailText}>
              {item.truck.truckModel} • {item.truck.truckCapacity}kg capacity
            </Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Ionicons name="map" size={14} color="#64748b" />
          <Text style={styles.detailText}>
            {item.streets?.length || 0} streets assigned
          </Text>
        </View>
        {item.assignment_lifecycle?.current_location && (
          <View style={styles.detailItem}>
            <Ionicons name="location" size={14} color="#6366f1" />
            <Text style={styles.detailText}>
              Live Location: {item.assignment_lifecycle.current_location.latitude.toFixed(4)}, {item.assignment_lifecycle.current_location.longitude.toFixed(4)}
            </Text>
          </View>
        )}
        {item.assignment_lifecycle?.started_at && (
          <View style={styles.detailItem}>
            <Ionicons name="time" size={14} color="#f59e0b" />
            <Text style={styles.detailText}>
              Started: {new Date(item.assignment_lifecycle.started_at).toLocaleTimeString()}
            </Text>
          </View>
        )}
        {item.assignment_lifecycle?.checkpoints && item.assignment_lifecycle.checkpoints.length > 0 && (
          <View style={styles.detailItem}>
            <Ionicons name="flag" size={14} color="#8b5cf6" />
            <Text style={styles.detailText}>
              {item.assignment_lifecycle.checkpoints.length} checkpoints completed
            </Text>
          </View>
        )}
        {item.updated_at && (
          <View style={styles.detailItem}>
            <Ionicons name="refresh" size={14} color="#10b981" />
            <Text style={styles.detailText}>
              Updated: {new Date(item.updated_at).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMetricCard = (title, value, change, isPositive, icon) => {
    const colorMap = {
      'Monthly Revenue': '#6366f1',
      'Active Customers': '#10b981',
      'Route Completion': '#f59e0b',
      'Unpaid Balance': '#ef4444',
    };
    const iconColor = colorMap[title] || '#64748b';

    return (
      <View style={[styles.metricCard, { width: cardWidth }]}>
        <View style={styles.metricHeader}>
          <LinearGradient
            colors={[iconColor, iconColor + '80']}
            style={styles.metricIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={icon} size={20} color="white" />
          </LinearGradient>
          <Text style={styles.metricTitle} numberOfLines={1}>{title}</Text>
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <View style={styles.metricFooter}>
          <View style={[styles.changeBadge, { backgroundColor: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
            <Ionicons
              name={isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={isPositive ? "#10b981" : "#ef4444"}
            />
            <Text style={[styles.metricChange, { color: isPositive ? "#10b981" : "#ef4444" }]}>
              {change}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const displayMetrics = metrics || {
    monthlyRevenue: '₦0',
    activeCustomers: 0,
    routeCompletion: '0%',
    unpaidBalance: '₦0',
    revenueChange: '+0%',
    customerChange: '+0%',
    completionChange: '+0%',
    balanceChange: '+0%',
    activeRoutes: 0
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Floating background blobs */}
      <View style={styles.backgroundBlobs}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#16A085']}
              tintColor="#16A085"
            />
          }
        >
          {/* Header with Headline */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.logoRow}>
                <LinearGradient
                  colors={['#16A085', '#f59e0b']}
                  style={styles.logoGradient}
                >
                  <FontAwesome name="recycle" size={18} color="white" />
                </LinearGradient>
                <Text style={styles.logoText}>CleanHaul</Text>
              </View>
              <View style={styles.userInfoRight}>
                {user?.companyName && (
                  <Text style={styles.companyName}>{user.companyName}</Text>
                )}
                <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'ADMIN'}</Text>
                <Text style={styles.staffName}>{user?.full_name || 'User'}</Text>
              </View>
            </View>

            <Text style={styles.headline}>
              Real‑time operations dashboard
            </Text>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionCard}
                  onPress={() => handleQuickActionPress(action.route)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[action.color, action.color + '80']}
                    style={styles.quickActionIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={action.icon} size={24} color="white" />
                  </LinearGradient>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionDescription}>{action.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Metrics Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <View style={styles.metricsGrid}>
              {renderMetricCard('Monthly Revenue', displayMetrics.monthlyRevenue, displayMetrics.revenueChange, true, 'cash')}
              {renderMetricCard('Active Customers', displayMetrics.activeCustomers, displayMetrics.customerChange, true, 'people')}
            </View>
            <View style={[styles.metricsGrid, { marginTop: cardGap }]}>
              {renderMetricCard('Route Completion', displayMetrics.routeCompletion, displayMetrics.completionChange, true, 'checkmark-done')}
              {renderMetricCard('Unpaid Balance', displayMetrics.unpaidBalance, displayMetrics.balanceChange, false, 'alert-circle')}
            </View>
          </View>

          {/* Live Operations Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Live Operations</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/admin/operations/live')}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={14} color="#16A085" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16A085" />
                <Text style={styles.loadingText}>Loading operations...</Text>
              </View>
            ) : liveOperations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No Active Operations</Text>
                <Text style={styles.emptyText}>All vehicles are currently offline</Text>
              </View>
            ) : (
              <FlatList
                data={liveOperations}
                renderItem={renderLiveOperation}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.tagline}>Clean • Smart • Reliable</Text>
            <Text style={styles.copyright}>© 2026 CleanHaul • Global Waste Ops</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <LiveOperationModal
        visible={showOperationModal}
        operation={selectedOperation}
        onClose={handleCloseModal}
        onViewFullDetails={handleViewFullDetails}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'column',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 10,
  },
  badge: {
    backgroundColor: 'rgba(22,160,133,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(22,160,133,0.2)',
  },
  badge: {
    backgroundColor: 'rgba(22,160,133,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(22,160,133,0.2)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A085',
    letterSpacing: 0.5,
  },
  companyName: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A085',
  },
  staffName: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '600',
  },
  userInfoRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.3,
    marginTop: 12,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#16A085',
    fontWeight: '600',
  },

  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },

  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: cardGap,
  },
  metricCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  metricFooter: {
    flexDirection: 'row',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricChange: {
    fontSize: 10,
    fontWeight: '600',
  },

  operationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  operationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  operationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  operationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  operationTextContainer: {
    flex: 1,
  },
  operationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  operationSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  operationDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#4b5563',
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  tagline: {
    fontSize: 10,
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 8,
    color: '#9ca3af',
  },
});