import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';

import appClient from '../../hooks/services/client';

const { width } = Dimensions.get('window');
const cardGap = 12;
const cardWidth = (width - 32 - 40 - cardGap) / 2; // same calculation as index.js

// Reusable empty state component
const EmptyState = ({ icon, title, message }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name={icon} size={48} color="#cbd5e1" />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
  </View>
);

export default function Reports() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueOverview, setRevenueOverview] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [revenueByStreet, setRevenueByStreet] = useState([]);
  const [revenueByType, setRevenueByType] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState([]);
  const [collectionRate, setCollectionRate] = useState(null);
  const [agentPerformance, setAgentPerformance] = useState([]);
  const [outstandingBalances, setOutstandingBalances] = useState(null);

 const fetchData = async () => {
  try {
    const response = await appClient.get('/analytics/reports/summary');
    const data = response.data.data;

    setRevenueOverview(data.revenueOverview);
    setRevenueTrend(data.revenueTrend || []);
    setRevenueByStreet(data.revenueByStreet || []);
    setRevenueByType(data.revenueByType || []);
    setPaymentStatus(data.paymentStatus || []);
    setCollectionRate(data.collectionRate);
    setAgentPerformance(data.agentPerformance || []);
    setOutstandingBalances(data.outstandingBalances);
  } catch (error) {
    console.error('Error fetching reports:', error);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₦0';
    return `₦${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#16A085" />
            <Text style={styles.loaderText}>Loading reports...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Prepare chart data only if there is actual data
  const hasPaymentStatus = paymentStatus && paymentStatus.length > 0;
  const hasRevenueByType = revenueByType && revenueByType.length > 0;
  const hasRevenueTrend = revenueTrend && revenueTrend.length > 0;
  const hasRevenueByStreet = revenueByStreet && revenueByStreet.length > 0;
  const hasAgentPerformance = agentPerformance && agentPerformance.length > 0;

  const paymentStatusChartData = hasPaymentStatus
    ? paymentStatus.map((item, index) => ({
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        population: item.count,
        color: ['#16A085', '#f59e0b', '#ef4444', '#059669'][index] || '#94a3b8',
        legendFontColor: '#374151',
      }))
    : [];

  const revenueByTypeChartData = hasRevenueByType
    ? revenueByType.map((item, index) => ({
        name: item.customer_type.charAt(0).toUpperCase() + item.customer_type.slice(1),
        population: item.total_revenue,
        color: ['#16A085', '#059669', '#f59e0b'][index] || '#94a3b8',
        legendFontColor: '#374151',
      }))
    : [];

  // Helper to render metric cards with gradient icons like index.js
  const renderMetricCard = (title, value, icon, iconColor) => (
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
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#16A085']}
              tintColor="#16A085"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header - matches index.js style */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.logoRow}>
                <LinearGradient
                  colors={['#16A085', '#f59e0b']}
                  style={styles.logoGradient}
                >
                  <Ionicons name="stats-chart" size={18} color="white" />
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
            <Text style={styles.headline}>Financial reports & analytics</Text>
          </View>

          {/* Revenue Overview Cards */}
          {revenueOverview ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={20} color="#16A085" />
                <Text style={styles.sectionTitle}>Revenue Overview</Text>
              </View>
              <View style={styles.metricsGrid}>
                {renderMetricCard('Total Revenue', formatCurrency(revenueOverview.total_revenue), 'cash', '#6366f1')}
                {renderMetricCard('This Month', formatCurrency(revenueOverview.monthly_revenue), 'calendar', '#f59e0b')}
              </View>
              <View style={[styles.metricsGrid, { marginTop: cardGap }]}>
                {renderMetricCard('Cash Payments', formatCurrency(revenueOverview.cash_revenue), 'wallet', '#16A085')}
                {renderMetricCard('Transfers', formatCurrency(revenueOverview.transfer_revenue), 'card', '#059669')}
              </View>
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <EmptyState
                icon="stats-chart"
                title="No Revenue Data Yet"
                message="Revenue metrics will appear once your first payments are recorded."
              />
            </View>
          )}

          {/* Collection Rate & Outstanding Balances */}
          <View style={styles.rowCards}>
            {collectionRate ? (
              <View style={[styles.sectionCard, styles.halfCard]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderTitle}>Collection Rate</Text>
                  <Ionicons name="trophy" size={20} color="#16A085" />
                </View>
                <Text style={styles.bigNumber}>{collectionRate.collection_rate.toFixed(1)}%</Text>
                <View style={styles.row}>
                  <View style={styles.collectionItem}>
                    <Text style={styles.collectionLabel}>Expected</Text>
                    <Text style={styles.collectionValue}>{formatCurrency(collectionRate.expected_revenue)}</Text>
                  </View>
                  <View style={styles.collectionItem}>
                    <Text style={styles.collectionLabel}>Collected</Text>
                    <Text style={styles.collectionValue}>{formatCurrency(collectionRate.collected_revenue)}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.sectionCard, styles.halfCard]}>
                <EmptyState icon="refresh" title="Collection Rate" message="No data yet" />
              </View>
            )}

            {outstandingBalances ? (
              <View style={[styles.sectionCard, styles.halfCard]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderTitle}>Outstanding</Text>
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                </View>
                <Text style={styles.bigNumber}>{formatCurrency(outstandingBalances.total_outstanding)}</Text>
                <View style={styles.row}>
                  <View style={styles.collectionItem}>
                    <Text style={styles.collectionLabel}>Customers</Text>
                    <Text style={styles.collectionValue}>{outstandingBalances.customers_with_balance}</Text>
                  </View>
                  <View style={styles.collectionItem}>
                    <Text style={styles.collectionLabel}>Total Due</Text>
                    <Text style={styles.collectionValue}>{formatCurrency(outstandingBalances.total_outstanding)}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.sectionCard, styles.halfCard]}>
                <EmptyState icon="checkmark-circle" title="No Outstanding Balances" message="All customers are up to date" />
              </View>
            )}
          </View>

          {/* Revenue Trend Chart */}
          {hasRevenueTrend ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={20} color="#16A085" />
                <Text style={styles.sectionTitle}>Revenue Trend (Last 6 Months)</Text>
              </View>
              <LineChart
                data={{
                  labels: revenueTrend.map((item) => item.month.slice(-2)),
                  datasets: [{ data: revenueTrend.map((item) => item.revenue) }],
                }}
                width={width - 80}
                height={200}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: '#f8fafc',
                  backgroundGradientTo: '#f8fafc',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(22, 160, 133, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                  propsForDots: { r: '5', strokeWidth: '2', stroke: '#16A085' },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <EmptyState icon="bar-chart" title="Revenue Trend" message="Chart will appear after 2+ months of data" />
            </View>
          )}

          {/* Payment Distribution Charts */}
          <View style={styles.rowCards}>
            {hasPaymentStatus ? (
              <View style={[styles.sectionCard, styles.halfCard]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pie-chart" size={20} color="#16A085" />
                  <Text style={styles.sectionTitle}>Payment Status</Text>
                </View>
                <PieChart
                  data={paymentStatusChartData}
                  width={(width - 100) / 2}
                  height={140}
                  chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="10"
                  absolute
                />
              </View>
            ) : (
              <View style={[styles.sectionCard, styles.halfCard]}>
                <EmptyState icon="pie-chart" title="Payment Status" message="No payments recorded" />
              </View>
            )}

            {hasRevenueByType ? (
              <View style={[styles.sectionCard, styles.halfCard]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="business" size={20} color="#16A085" />
                  <Text style={styles.sectionTitle}>By Customer Type</Text>
                </View>
                <PieChart
                  data={revenueByTypeChartData}
                  width={(width - 100) / 2}
                  height={140}
                  chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="10"
                  absolute
                />
              </View>
            ) : (
              <View style={[styles.sectionCard, styles.halfCard]}>
                <EmptyState icon="people" title="Customer Types" message="No customer data yet" />
              </View>
            )}
          </View>

          {/* Top Revenue Streets */}
          {hasRevenueByStreet ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color="#16A085" />
                <Text style={styles.sectionTitle}>Top Revenue Streets</Text>
              </View>
              {revenueByStreet.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <View style={[styles.rankBadge, index < 3 && styles.topRankBadge]}>
                      <Text style={[styles.rankText, index < 3 && styles.topRankText]}>#{index + 1}</Text>
                    </View>
                    <View>
                      <Text style={styles.listItemTitle}>{item.street_name}</Text>
                      <Text style={styles.listItemSubtitle}>{item.payment_count} payments</Text>
                    </View>
                  </View>
                  <Text style={styles.revenueText}>{formatCurrency(item.total_revenue)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <EmptyState icon="map" title="Street Performance" message="Revenue by street will appear here" />
            </View>
          )}

          {/* Agent Performance */}
          {hasAgentPerformance ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={20} color="#16A085" />
                <Text style={styles.sectionTitle}>Top Collectors</Text>
              </View>
              {agentPerformance.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <LinearGradient colors={['#16A085', '#f59e0b']} style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.agent_name.split(' ').map((n) => n[0]).join('')}
                      </Text>
                    </LinearGradient>
                    <View>
                      <Text style={styles.listItemTitle}>{item.agent_name}</Text>
                      <View style={styles.paymentTypes}>
                        <View style={styles.paymentType}>
                          <Ionicons name="cash" size={12} color="#059669" />
                          <Text style={styles.paymentTypeText}>{item.cash_payments}</Text>
                        </View>
                        <View style={styles.paymentType}>
                          <Ionicons name="card" size={12} color="#16A085" />
                          <Text style={styles.paymentTypeText}>{item.transfer_payments}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.revenueText}>{formatCurrency(item.total_collections)}</Text>
                    <Text style={styles.paymentCount}>{item.payment_count} payments</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <EmptyState icon="person" title="Agent Performance" message="Collector data will appear once routes are active" />
            </View>
          )}

          {/* Footer Tagline */}
          <View style={styles.footer}>
            <Text style={styles.tagline}>CLEAN • SMART • RELIABLE</Text>
            <Text style={styles.copyright}>© 2026 CleanHaul • B2B Waste Operations</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  // Header styles (copied from index.js)
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
  // Section card (white with shadow)
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
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  // Metrics grid and cards
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
  },
  // Row cards (two per row)
  rowCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCard: {
    width: '48%',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  bigNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16A085',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  collectionItem: {
    alignItems: 'flex-start',
  },
  collectionLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  collectionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  chart: {
    borderRadius: 16,
    marginTop: 8,
  },
  // List items for streets and agents
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topRankBadge: {
    backgroundColor: '#16A085',
  },
  rankText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
  },
  topRankText: {
    color: 'white',
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  revenueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16A085',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentTypes: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  paymentType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentTypeText: {
    fontSize: 11,
    color: '#64748b',
  },
  paymentCount: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 9,
    color: '#cbd5e1',
  },
});