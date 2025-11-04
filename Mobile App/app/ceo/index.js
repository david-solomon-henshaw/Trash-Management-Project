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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../config';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [metrics, setMetrics] = useState(null);
  const [liveOperations, setLiveOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Default metrics structure
  const defaultMetrics = {
    monthlyRevenue: '₦0',
    activeCustomers: 0,
    routeCompletion: '0%',
    unpaidBalance: '₦0',
    revenueChange: '+0%',
    customerChange: '+0%',
    completionChange: '+0%',
    balanceChange: '+0%'
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Replace with your actual API endpoint - adjust the URL as needed
      const response = await fetch(`${API_BASE_URL}/api/dashboard`);
      const result = await response.json();
      
      console.log('Response:', response);
      console.log('Result:', result);
      
      if (result.success) {
        setMetrics(result.data.metrics);
        setLiveOperations(result.data.liveOperations);
      } else {
        // Fallback to default data if API returns error
        setMetrics(defaultMetrics);
        setLiveOperations([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.log('Error:', error);
      // Fallback to default data if API fails
      setMetrics(defaultMetrics);
      setLiveOperations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const quickActions = [
    {
      id: 'generate-report',
      title: 'Generate Report',
      icon: 'document-text',
      color: '#6366f1',
      route: '/reports',
      description: 'Create performance reports',
    },
    {
      id: 'view-fleet',
      title: 'View Fleet',
      icon: 'car-sport',
      color: '#10b981',
      route: '/ceo/operations/fleet',
      description: 'Manage all vehicles',
    },
    {
      id: 'manage-users',
      title: 'Manage Staff',
      icon: 'people',
      color: '#8b5cf6',
      route: '/ceo/operations/staff',
      description: 'Team management',
    },
    {
      id: 'live-map',
      title: 'Live Map',
      icon: 'map',
      color: '#f59e0b',
      route: '/map',
      description: 'Real-time tracking',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'bar-chart',
      color: '#ef4444',
      route: '/analytics',
      description: 'Business insights',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      color: '#64748b',
      route: '/settings',
      description: 'System configuration',
    },
  ];

  const handleQuickActionPress = (route) => {
    router.push(route);
  };

  const getMetricIcon = (title) => {
    switch (title) {
      case 'Monthly Revenue': return 'cash';
      case 'Active Customers': return 'people';
      case 'Route Completion': return 'checkmark-done';
      case 'Unpaid Balance': return 'alert-circle';
      default: return 'trending-up';
    }
  };

  const getMetricColor = (title) => {
    switch (title) {
      case 'Monthly Revenue': return '#6366f1';
      case 'Active Customers': return '#10b981';
      case 'Route Completion': return '#f59e0b';
      case 'Unpaid Balance': return '#ef4444';
      default: return '#64748b';
    }
  };

  const renderLiveOperation = ({ item }) => (
    <TouchableOpacity 
      style={styles.operationCard}
      onPress={() => router.push('/ceo/operations/fleet')}
    >
      <View style={styles.operationHeader}>
        <View style={styles.operationTitleContainer}>
          <View style={[styles.operationIcon, { backgroundColor: `${item.statusColor}15` }]}>
            <Ionicons name={item.icon} size={20} color={item.statusColor} />
          </View>
          <View>
            <Text style={styles.operationTitle}>{item.title}</Text>
            <Text style={styles.operationSubtitle}>{item.supervisor || item.location}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${item.statusColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: item.statusColor }]} />
          <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.operationDetails}>
        {item.progress && (
          <View style={styles.detailItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.detailText}>{item.progress}</Text>
          </View>
        )}

        {item.time && (
          <View style={styles.detailItem}>
            <Ionicons name="time" size={14} color="#f59e0b" />
            <Text style={styles.detailText}>{item.time}</Text>
          </View>
        )}

        {item.collection && (
          <View style={styles.detailItem}>
            <Ionicons name="cash" size={14} color="#10b981" />
            <Text style={styles.detailText}>{item.collection}</Text>
          </View>
        )}

        {item.issue && (
          <View style={styles.detailItem}>
            <Ionicons name="warning" size={14} color="#f59e0b" />
            <Text style={styles.detailText}>{item.issue}</Text>
          </View>
        )}

        {item.expected && (
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={14} color="#6366f1" />
            <Text style={styles.detailText}>{item.expected}</Text>
          </View>
        )}

        {item.cost && (
          <View style={styles.detailItem}>
            <Ionicons name="card" size={14} color="#ef4444" />
            <Text style={styles.detailText}>{item.cost}</Text>
          </View>
        )}

        {item.note && (
          <View style={styles.detailItem}>
            <Ionicons name="information-circle" size={14} color="#64748b" />
            <Text style={styles.detailText}>{item.note}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMetricCard = (title, value, change, isPositive) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: `${getMetricColor(title)}15` }]}>
          <Ionicons name={getMetricIcon(title)} size={20} color={getMetricColor(title)} />
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <View style={styles.metricFooter}>
        <View style={[styles.changeBadge, { backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
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

  // Use actual metrics or default if still loading
  const displayMetrics = metrics || defaultMetrics;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="business" size={32} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Executive Dashboard</Text>
            <Text style={styles.headerSubtitle}>Real-time business overview & control</Text>
          </View>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statPill}>
            <Ionicons name="time" size={12} color="white" />
            <Text style={styles.statPillText}>Live Updates</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
      >
        {/* Quick Actions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>Essential tools & features</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => handleQuickActionPress(action.route)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Key Metrics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <Text style={styles.sectionSubtitle}>This month's performance</Text>
          </View>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Monthly Revenue', displayMetrics.monthlyRevenue, displayMetrics.revenueChange, true)}
            {renderMetricCard('Active Customers', displayMetrics.activeCustomers, displayMetrics.customerChange, true)}
            {renderMetricCard('Route Completion', displayMetrics.routeCompletion, displayMetrics.completionChange, false)}
            {renderMetricCard('Unpaid Balance', displayMetrics.unpaidBalance, displayMetrics.balanceChange, false)}
          </View>
        </View>

        {/* Live Operations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Live Operations</Text>
              <Text style={styles.sectionSubtitle}>Real-time fleet activity</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/ceo/operations/fleet')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading operations data...</Text>
            </View>
          ) : liveOperations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Active Operations</Text>
              <Text style={styles.emptyText}>All vehicles are currently offline or in maintenance</Text>
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

        {/* Additional Space */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ... (keep your existing styles the same)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  headerStats: {
    flexDirection: 'row',
  },
  statPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statPillText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  viewAllText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2, // Calculate width for 2 columns with padding
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    width: (width - 52) / 2, // Calculate width for 2 columns with padding
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
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
    fontSize: 12,
    fontWeight: '600',
  },
  operationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
  operationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  operationSubtitle: {
    fontSize: 14,
    color: '#64748B',
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
    fontSize: 12,
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
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpace: {
    height: 20,
  },
});