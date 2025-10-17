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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [metrics, setMetrics] = useState({
    monthlyRevenue: '₦2.4M',
    activeCustomers: 847,
    routeCompletion: '94.7%',
    unpaidBalance: '₦180k',
    revenueChange: '+12.5%',
    customerChange: '+8.2%',
    completionChange: '-2.1%',
    balanceChange: '-15.3%',
  });

  const [liveOperations, setLiveOperations] = useState([
    {
      id: '1',
      title: 'Truck A - NGR 123XY',
      status: 'Active',
      statusColor: '#28a745',
      supervisor: 'John Doe',
      location: 'Victoria Island',
      progress: '15/20 houses completed',
      time: 'On duty 3h 25m',
      collection: '₦45,000 collected',
    },
    {
      id: '2',
      title: 'Truck B - NGR 456AB',
      status: 'Maintenance',
      statusColor: '#ffc107',
      supervisor: 'Sarah Wilson',
      issue: 'Engine repair needed',
      expected: 'Expected: Feb 20',
      cost: 'Cost: ₦85,000',
    },
    {
      id: '3',
      title: 'Truck C - NGR 789CD',
      status: 'Active',
      statusColor: '#28a745',
      supervisor: 'Mike Johnson',
      location: 'Ikoyi Area',
      progress: '8/12 streets done',
      time: 'On duty 2h 10m',
    },
    {
      id: '4',
      title: 'Truck D - NGR 321EF',
      status: 'Idle',
      statusColor: '#6c757d',
      location: 'Depot',
      note: 'No assignment',
    },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const quickActions = [
    {
      id: 'generate-report',
      title: 'Generate Report',
      icon: 'document-text-outline',
      color: '#2E8B57',
      route: '/reports',
    },
    {
      id: 'view-fleet',
      title: 'View Fleet',
      icon: 'car-sport-outline',
      color: '#F59E0B',
      route: '/ceo/operations/fleet',
    },
    {
      id: 'manage-users',
      title: 'Manage Users',
      icon: 'people-outline',
      color: '#3B82F6',
      route: '/ceo/operations/staff',
    },
    {
      id: 'live-map',
      title: 'Live Map',
      icon: 'map-outline',
      color: '#8B5CF6',
      route: '/map',
    },
  ];

  const handleQuickActionPress = (route) => {
    router.push(route);
  };

  const renderLiveOperation = ({ item }) => (
    <View style={styles.operationCard}>
      <View style={styles.operationHeader}>
        <Text style={styles.operationTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${item.statusColor}20` }]}>
          <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.operationInfo}>
        {item.supervisor && (
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.supervisor}</Text>
          </View>
        )}

        {item.location && (
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
        )}

        {item.progress && (
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.progress}</Text>
          </View>
        )}

        {item.time && (
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.time}</Text>
          </View>
        )}

        {item.collection && (
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.collection}</Text>
          </View>
        )}

        {item.issue && (
          <View style={styles.infoItem}>
            <Ionicons name="construct-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.issue}</Text>
          </View>
        )}

        {item.expected && (
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.expected}</Text>
          </View>
        )}

        {item.cost && (
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.cost}</Text>
          </View>
        )}

        {item.note && (
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.note}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CEO Dashboard</Text>
        <Text style={styles.headerSubtitle}>Company Overview & Control</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { borderColor: `${action.color}20` }]}
                onPress={() => handleQuickActionPress(action.route)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Key Metrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Monthly Revenue</Text>
              <Text style={styles.metricValue}>{metrics.monthlyRevenue}</Text>
              <Text style={[styles.metricChange, styles.metricUp]}>↗ {metrics.revenueChange}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Active Customers</Text>
              <Text style={styles.metricValue}>{metrics.activeCustomers}</Text>
              <Text style={[styles.metricChange, styles.metricUp]}>↗ {metrics.customerChange}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Route Completion</Text>
              <Text style={styles.metricValue}>{metrics.routeCompletion}</Text>
              <Text style={[styles.metricChange, styles.metricDown]}>↘ {metrics.completionChange}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Unpaid Balance</Text>
              <Text style={styles.metricValue}>{metrics.unpaidBalance}</Text>
              <Text style={[styles.metricChange, styles.metricDown]}>↘ {metrics.balanceChange}</Text>
            </View>
          </View>
        </View>

        {/* Live Operations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Operations</Text>
            <TouchableOpacity onPress={() => router.push('/ceo/operations/fleet')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2E8B57" style={styles.loadingIndicator} />
          ) : liveOperations.length === 0 ? (
            <Text style={styles.emptyText}>No live operations found.</Text>
          ) : (
            <FlatList
              data={liveOperations}
              renderItem={renderLiveOperation}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2E8B57',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAll: {
    color: '#2E8B57',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricUp: {
    color: '#28a745',
  },
  metricDown: {
    color: '#dc3545',
  },
  operationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B57',
  },
  operationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  operationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  operationInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '48%',
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#64748B',
    marginTop: 20,
  },
});
