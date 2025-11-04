import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { API_BASE_URL } from '../../config'

const screenWidth = Dimensions.get('window').width;

const Reports = () => {
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
      const [
        overviewRes,
        trendRes,
        streetRes,
        typeRes,
        statusRes,
        collectionRes,
        agentRes,
        outstandingRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/reports/revenue-overview`).then(res => {
          console.log('Revenue Overview API response status:', res.status);
          return res;
        }),
        fetch(`${API_BASE_URL}/api/analytics/reports/revenue-trend`).then(res => {
          console.log('Revenue Trend API response status:', res.status);
          return res;
        }),
        fetch(`${API_BASE_URL}/api/analytics/reports/revenue-by-street`).then(res => {
          console.log('Revenue by Street API response status:', res.status);
          return res;
        }),
        fetch(`${API_BASE_URL}/api/analytics/reports/revenue-by-customer-type`).then(res => {
          console.log('Revenue by Customer Type API response status:', res.status);
          return res;
        }),
        fetch(`${API_BASE_URL}/api/analytics/reports/payment-status`).then(res => {
          console.log('Payment Status API response status:', res.status);
          return res;
        }),
        fetch(`${API_BASE_URL}/api/analytics/reports/collection-rate`).then(res => {
          console.log('Collection Rate API response status:', res.status);
          return res;
        }),
        fetch(`${API_BASE_URL}/api/analytics/reports/agent-performance`).then(res => {
          console.log('Agent Performance API response status:', res.status);
          return res;
        }),
        fetch(`${API_BASE_URL}/api/analytics/reports/outstanding-balances`).then(res => {
          console.log('Outstanding Balances API response status:', res.status);
          return res;
        })
      ]);

      const [
        overviewData,
        trendData,
        streetData,
        typeData,
        statusData,
        collectionData,
        agentData,
        outstandingData
      ] = await Promise.all([
        overviewRes.json().then(data => {
          console.log('Revenue Overview data:', data);
          return data;
        }),
        trendRes.json().then(data => {
          console.log('Revenue Trend data:', data);
          return data;
        }),
        streetRes.json().then(data => {
          console.log('Revenue by Street data:', data);
          return data;
        }),
        typeRes.json().then(data => {
          console.log('Revenue by Customer Type data:', data);
          return data;
        }),
        statusRes.json().then(data => {
          console.log('Payment Status data:', data);
          return data;
        }),
        collectionRes.json().then(data => {
          console.log('Collection Rate data:', data);
          return data;
        }),
        agentRes.json().then(data => {
          console.log('Agent Performance data:', data);
          return data;
        }),
        outstandingRes.json().then(data => {
          console.log('Outstanding Balances data:', data);
          return data;
        })
      ]);

      console.log('Setting Revenue Overview state:', overviewData.data);
      setRevenueOverview(overviewData.data);
      
      console.log('Setting Revenue Trend state:', trendData.data || []);
      setRevenueTrend(trendData.data || []);
      
      console.log('Setting Revenue by Street state:', streetData.data || []);
      setRevenueByStreet(streetData.data || []);
      
      console.log('Setting Revenue by Type state:', typeData.data || []);
      setRevenueByType(typeData.data || []);
      
      console.log('Setting Payment Status state:', statusData.data || []);
      setPaymentStatus(statusData.data || []);
      
      console.log('Setting Collection Rate state:', collectionData.data);
      setCollectionRate(collectionData.data);
      
      console.log('Setting Agent Performance state:', agentData.data || []);
      setAgentPerformance(agentData.data || []);
      
      console.log('Setting Outstanding Balances state:', outstandingData.data);
      setOutstandingBalances(outstandingData.data);
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
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  const paymentStatusChartData = paymentStatus && paymentStatus.length > 0 
    ? paymentStatus.map((item, index) => ({
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        population: item.count,
        color: ['#10b981', '#f59e0b', '#ef4444'][index] || '#6b7280',
        legendFontColor: '#374151',
      }))
    : [];

  const revenueByTypeChartData = revenueByType && revenueByType.length > 0
    ? revenueByType.map((item, index) => ({
        name: item.customer_type.charAt(0).toUpperCase() + item.customer_type.slice(1),
        population: item.total_revenue,
        color: ['#3b82f6', '#10b981'][index] || '#6b7280',
        legendFontColor: '#374151',
      }))
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ padding: 16 }}>
        {/* Header */}
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>
          Financial Reports
        </Text>

        {/* Revenue Overview Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>
              {formatCurrency(revenueOverview?.total_revenue)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {formatCurrency(revenueOverview?.monthly_revenue)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cash Payments</Text>
            <Text style={[styles.statValue, { color: '#1f2937', fontSize: 20 }]}>
              {formatCurrency(revenueOverview?.cash_revenue)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Transfers</Text>
            <Text style={[styles.statValue, { color: '#1f2937', fontSize: 20 }]}>
              {formatCurrency(revenueOverview?.transfer_revenue)}
            </Text>
          </View>
        </View>

        {/* Collection Rate Card */}
        {collectionRate && (
          <View style={[styles.chartCard, { backgroundColor: '#3b82f6' }]}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 8 }}>
              Collection Rate
            </Text>
            <Text style={{ fontSize: 48, fontWeight: 'bold', color: 'white' }}>
              {collectionRate.collection_rate.toFixed(1)}%
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <View>
                <Text style={{ color: '#dbeafe', fontSize: 12 }}>Expected</Text>
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {formatCurrency(collectionRate.expected_revenue)}
                </Text>
              </View>
              <View>
                <Text style={{ color: '#dbeafe', fontSize: 12 }}>Collected</Text>
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {formatCurrency(collectionRate.collected_revenue)}
                </Text>
              </View>
              <View>
                <Text style={{ color: '#dbeafe', fontSize: 12 }}>Outstanding</Text>
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {formatCurrency(collectionRate.outstanding)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Revenue Trend */}
        {revenueTrend && revenueTrend.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Revenue Trend (6 Months)</Text>
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
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#10b981'
                }
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          </View>
        )}

        {/* Payment Status Distribution */}
        {paymentStatusChartData && paymentStatusChartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Payment Status Distribution</Text>
            <PieChart
              data={paymentStatusChartData}
              width={screenWidth - 60}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Revenue by Customer Type */}
        {revenueByTypeChartData && revenueByTypeChartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Revenue by Customer Type</Text>
            <PieChart
              data={revenueByTypeChartData}
              width={screenWidth - 60}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Top Revenue Streets */}
        {revenueByStreet && revenueByStreet.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Top Revenue by Street</Text>
            {revenueByStreet.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#374151', fontWeight: '600' }}>{item.street_name}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>{item.payment_count} payments</Text>
                </View>
                <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 16 }}>
                  {formatCurrency(item.total_revenue)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Agent Performance */}
        {agentPerformance && agentPerformance.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Agent Performance</Text>
            {agentPerformance.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#374151', fontWeight: '600' }}>{item.agent_name}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    <Text style={{ color: '#6b7280', fontSize: 12, marginRight: 12 }}>
                      💵 {item.cash_payments}
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>
                      💳 {item.transfer_payments}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 16 }}>
                    {formatCurrency(item.total_collections)}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>
                    {item.payment_count} payments
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Outstanding Balances */}
        {outstandingBalances && (
          <View style={[styles.chartCard, { backgroundColor: '#fef3c7' }]}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#92400e', marginBottom: 16 }}>
              Outstanding Balances
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: '#78350f', fontSize: 12 }}>Total Outstanding</Text>
                <Text style={{ color: '#92400e', fontWeight: 'bold', fontSize: 24, marginTop: 4 }}>
                  {formatCurrency(outstandingBalances.total_outstanding)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#78350f', fontSize: 12 }}>Customers with Balance</Text>
                <Text style={{ color: '#92400e', fontWeight: 'bold', fontSize: 24, marginTop: 4 }}>
                  {outstandingBalances.customers_with_balance}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  </SafeAreaView>
  );
};

const styles = {
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
};

export default Reports;