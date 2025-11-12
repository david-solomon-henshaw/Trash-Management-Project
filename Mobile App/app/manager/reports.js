import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl, 
  Dimensions,
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

const Reports = () => {
  const router = useRouter();
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
      console.log('Starting to fetch financial reports data...');
      
      const endpoints = [
        '/api/analytics/reports/revenue-overview',
        '/api/analytics/reports/revenue-trend',
        '/api/analytics/reports/revenue-by-street',
        '/api/analytics/reports/revenue-by-customer-type',
        '/api/analytics/reports/payment-status',
        '/api/analytics/reports/collection-rate',
        '/api/analytics/reports/agent-performance',
        '/api/analytics/reports/outstanding-balances'
      ];

      const requests = endpoints.map(endpoint => 
        axios.get(`${API_BASE_URL}${endpoint}`)
      );

      const responses = await Promise.all(requests);
      
      const [
        overviewRes,
        trendRes,
        streetRes,
        typeRes,
        statusRes,
        collectionRes,
        agentRes,
        outstandingRes
      ] = responses;

      setRevenueOverview(overviewRes.data.data);
      setRevenueTrend(trendRes.data.data || []);
      setRevenueByStreet(streetRes.data.data || []);
      setRevenueByType(typeRes.data.data || []);
      setPaymentStatus(statusRes.data.data || []);
      setCollectionRate(collectionRes.data.data);
      setAgentPerformance(agentRes.data.data || []);
      setOutstandingBalances(outstandingRes.data.data);

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
    return `₦${amount?.toLocaleString() || 0}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={{ marginTop: 12, color: '#64748b', fontSize: 16 }}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const paymentStatusChartData = paymentStatus && paymentStatus.length > 0 
    ? paymentStatus.map((item, index) => ({
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        population: item.count,
        color: ['#10b981', '#f59e0b', '#ef4444', '#059669'][index] || '#6b7280',
        legendFontColor: '#374151',
      }))
    : [];

  const revenueByTypeChartData = revenueByType && revenueByType.length > 0
    ? revenueByType.map((item, index) => ({
        name: item.customer_type.charAt(0).toUpperCase() + item.customer_type.slice(1),
        population: item.total_revenue,
        color: ['#10b981', '#059669', '#f59e0b'][index] || '#6b7280',
        legendFontColor: '#374151',
      }))
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Financial Dashboard</Text>
            <Text style={styles.headerSubtitle}>Comprehensive overview of your financial performance</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="analytics" size={24} color="white" />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 20 }}>
          {/* Revenue Overview Cards - Redesigned */}
          <View style={{ marginBottom: 24 }}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Revenue Overview</Text>
            </View>
            <View style={styles.cardGrid}>
              <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
                <View style={styles.statIcon}>
                  <Ionicons name="cash" size={20} color="white" />
                </View>
                <Text style={styles.statLabel}>Total Revenue</Text>
                <Text style={[styles.statValue, { color: 'white' }]}>
                  {formatCurrency(revenueOverview?.total_revenue)}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#059669' }]}>
                <View style={styles.statIcon}>
                  <Ionicons name="calendar" size={20} color="white" />
                </View>
                <Text style={styles.statLabel}>This Month</Text>
                <Text style={[styles.statValue, { color: 'white' }]}>
                  {formatCurrency(revenueOverview?.monthly_revenue)}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#047857' }]}>
                <View style={styles.statIcon}>
                  <Ionicons name="wallet" size={20} color="white" />
                </View>
                <Text style={styles.statLabel}>Cash Payments</Text>
                <Text style={[styles.statValue, { color: 'white' }]}>
                  {formatCurrency(revenueOverview?.cash_revenue)}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#065f46' }]}>
                <View style={styles.statIcon}>
                  <Ionicons name="card" size={20} color="white" />
                </View>
                <Text style={styles.statLabel}>Transfers</Text>
                <Text style={[styles.statValue, { color: 'white' }]}>
                  {formatCurrency(revenueOverview?.transfer_revenue)}
                </Text>
              </View>
            </View>
          </View>

          {/* Collection Rate & Outstanding Balances Side by Side */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            {/* Collection Rate */}
            {collectionRate && (
              <View style={[styles.highlightCard, { backgroundColor: '#10b981', flex: 0.48 }]}>
                <View style={styles.cardHeader}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                    Collection Rate
                  </Text>
                  <Ionicons name="trophy" size={20} color="white" />
                </View>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: 'white', marginVertical: 8 }}>
                  {collectionRate.collection_rate.toFixed(1)}%
                </Text>
                <View style={styles.metricRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Expected</Text>
                    <Text style={styles.metricValue}>
                      {formatCurrency(collectionRate.expected_revenue)}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Collected</Text>
                    <Text style={styles.metricValue}>
                      {formatCurrency(collectionRate.collected_revenue)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Outstanding Balances */}
            {outstandingBalances && (
              <View style={[styles.highlightCard, { backgroundColor: '#dc2626', flex: 0.48 }]}>
                <View style={styles.cardHeader}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                    Outstanding
                  </Text>
                  <Ionicons name="alert-circle" size={20} color="white" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginVertical: 8 }}>
                  {formatCurrency(outstandingBalances.total_outstanding)}
                </Text>
                <View style={styles.metricRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Customers</Text>
                    <Text style={styles.metricValue}>
                      {outstandingBalances.customers_with_balance}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Balance</Text>
                    <Text style={styles.metricValue}>
                      {formatCurrency(outstandingBalances.total_outstanding)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Charts Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bar-chart" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Analytics & Trends</Text>
            </View>
            
            {/* Revenue Trend */}
            {revenueTrend && revenueTrend.length > 0 && (
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Ionicons name="trending-up" size={20} color="#10b981" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.chartTitle}>Revenue Trend</Text>
                    <Text style={styles.chartSubtitle}>Last 6 months performance</Text>
                  </View>
                </View>
                <LineChart
                  data={{
                    labels: revenueTrend.map(item => item.month.slice(-2)),
                    datasets: [{
                      data: revenueTrend.map(item => item.revenue)
                    }]
                  }}
                  width={screenWidth - 60}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#f0fdf4',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#10b981'
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                    }
                  }}
                  bezier
                  style={styles.chartStyle}
                />
              </View>
            )}

            {/* Payment Distribution Charts Side by Side */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {/* Payment Status */}
              {paymentStatusChartData && paymentStatusChartData.length > 0 && (
                <View style={[styles.chartCard, { flex: 0.48 }]}>
                  <View style={styles.chartHeader}>
                    <Ionicons name="pie-chart" size={20} color="#10b981" />
                    <Text style={styles.chartTitle}>Payment Status</Text>
                  </View>
                  <PieChart
                    data={paymentStatusChartData}
                    width={(screenWidth - 80) / 2}
                    height={140}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="10"
                    absolute
                  />
                </View>
              )}

              {/* Revenue by Type */}
              {revenueByTypeChartData && revenueByTypeChartData.length > 0 && (
                <View style={[styles.chartCard, { flex: 0.48 }]}>
                  <View style={styles.chartHeader}>
                    <Ionicons name="business" size={20} color="#10b981" />
                    <Text style={styles.chartTitle}>By Customer Type</Text>
                  </View>
                  <PieChart
                    data={revenueByTypeChartData}
                    width={(screenWidth - 80) / 2}
                    height={140}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="10"
                    absolute
                  />
                </View>
              )}
            </View>
          </View>

          {/* Top Performers Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Top Performers</Text>
            </View>
            
            {/* Top Revenue Streets */}
            {revenueByStreet && revenueByStreet.length > 0 && (
              <View style={styles.listCard}>
                <View style={styles.listHeader}>
                  <Ionicons name="location" size={20} color="#10b981" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.listTitle}>Top Revenue Streets</Text>
                    <Text style={styles.listSubtitle}>Highest earning locations</Text>
                  </View>
                </View>
                {revenueByStreet.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <View style={[styles.rankBadge, index < 3 && styles.topRankBadge]}>
                        <Text style={[styles.rankText, index < 3 && styles.topRankText]}>
                          #{index + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemTitle}>{item.street_name}</Text>
                        <Text style={styles.listItemSubtitle}>{item.payment_count} payments</Text>
                      </View>
                    </View>
                    <Text style={styles.revenueText}>
                      {formatCurrency(item.total_revenue)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Agent Performance */}
            {agentPerformance && agentPerformance.length > 0 && (
              <View style={styles.listCard}>
                <View style={styles.listHeader}>
                  <Ionicons name="people" size={20} color="#10b981" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.listTitle}>Agent Performance</Text>
                    <Text style={styles.listSubtitle}>Top collectors this period</Text>
                  </View>
                </View>
                {agentPerformance.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {item.agent_name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemTitle}>{item.agent_name}</Text>
                        <View style={styles.paymentTypes}>
                          <View style={styles.paymentType}>
                            <Ionicons name="cash" size={12} color="#059669" />
                            <Text style={styles.paymentTypeText}>{item.cash_payments}</Text>
                          </View>
                          <View style={styles.paymentType}>
                            <Ionicons name="card" size={12} color="#10b981" />
                            <Text style={styles.paymentTypeText}>{item.transfer_payments}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.revenueText}>
                        {formatCurrency(item.total_collections)}
                      </Text>
                      <Text style={styles.paymentCount}>{item.payment_count} payments</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  header: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  highlightCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 2,
  },
  metricValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  chartStyle: {
    borderRadius: 12,
    marginVertical: 8,
  },
  listCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
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
    backgroundColor: '#10b981',
  },
  rankText: {
    fontSize: 12,
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
    fontSize: 12,
    color: '#64748b',
  },
  revenueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
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
    marginTop: 2,
    gap: 8,
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
    color: '#64748b',
    marginTop: 2,
  },
};

export default Reports;