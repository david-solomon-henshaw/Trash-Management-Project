import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const CustomerAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [byStreet, setByStreet] = useState([]);
  const [byApartment, setByApartment] = useState([]);
  const [byBusiness, setByBusiness] = useState([]);

  const fetchData = async () => {
    try {
      const [
        { data: overviewData }, 
        { data: growthData }, 
        { data: streetData }, 
        { data: apartmentData }, 
        { data: businessData }
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/analytics/customers/overview`),
        axios.get(`${API_BASE_URL}/api/analytics/customers/growth`),
        axios.get(`${API_BASE_URL}/api/analytics/customers/by-street`),
        axios.get(`${API_BASE_URL}/api/analytics/customers/by-apartment-type`),
        axios.get(`${API_BASE_URL}/api/analytics/customers/by-business-type`)
      ]);

      setOverview(overviewData.data);
      setGrowth(growthData.data || []);
      setByStreet(streetData.data || []);
      setByApartment(apartmentData.data || []);
      setByBusiness(businessData.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={{ marginTop: 12, color: '#64748b', fontSize: 16 }}>Loading customer analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const customerTypeData = [
    {
      name: 'Residential',
      population: overview?.residential_customers || 0,
      color: '#6366f1',
      legendFontColor: '#374151',
    },
    {
      name: 'Commercial',
      population: overview?.commercial_customers || 0,
      color: '#10b981',
      legendFontColor: '#374151',
    }
  ];

  const statusData = [
    {
      name: 'Active',
      population: overview?.active_customers || 0,
      color: '#10b981',
      legendFontColor: '#374151',
    },
    {
      name: 'Inactive',
      population: (overview?.total_customers || 0) - (overview?.active_customers || 0),
      color: '#ef4444',
      legendFontColor: '#374151',
    }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="people" size={24} color="#6366f1" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Customer Analytics</Text>
            <Text style={styles.headerSubtitle}>Comprehensive customer insights</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 20 }}>
          {/* Overview Cards */}
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Customer Overview</Text>
            <View style={styles.cardGrid}>
              <View style={[styles.statCard, { backgroundColor: '#6366f1' }]}>
                <View style={styles.statIcon}>
                  <Text style={{ color: 'white', fontSize: 20 }}>👥</Text>
                </View>
                <Text style={styles.statLabel}>Total Customers</Text>
                <Text style={[styles.statValue, { color: 'white' }]}>
                  {overview?.total_customers || 0}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
                <View style={styles.statIcon}>
                  <Text style={{ color: 'white', fontSize: 20 }}>✅</Text>
                </View>
                <Text style={styles.statLabel}>Active</Text>
                <Text style={[styles.statValue, { color: 'white' }]}>
                  {overview?.active_customers || 0}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
                <View style={styles.statIcon}>
                  <Text style={{ color: 'white', fontSize: 20 }}>🏠</Text>
                </View>
                <Text style={styles.statLabel}>Residential</Text>
                <Text style={[styles.statValue, { color: 'white' }]}>
                  {overview?.residential_customers || 0}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
                <View style={styles.statIcon}>
                  <Text style={{ color: 'white', fontSize: 20 }}>🏢</Text>
                </View>
                <Text style={styles.statLabel}>Commercial</Text>
                <Text style={[styles.statValue, { color: 'white' }]}>
                  {overview?.commercial_customers || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Customer Distribution Charts */}
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Customer Distribution</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {/* Customer Type */}
              <View style={[styles.chartCard, { flex: 0.48 }]}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>By Type</Text>
                  <Text style={styles.chartSubtitle}>Residential vs Commercial</Text>
                </View>
                <PieChart
                  data={customerTypeData}
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
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#6366f1' }]} />
                    <Text style={styles.legendText}>Residential</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
                    <Text style={styles.legendText}>Commercial</Text>
                  </View>
                </View>
              </View>

              {/* Status Distribution */}
              <View style={[styles.chartCard, { flex: 0.48 }]}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>By Status</Text>
                  <Text style={styles.chartSubtitle}>Active vs Inactive</Text>
                </View>
                <PieChart
                  data={statusData}
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
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
                    <Text style={styles.legendText}>Active</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
                    <Text style={styles.legendText}>Inactive</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Growth Trend */}
          {growth && growth.length > 0 && (
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Customer Growth</Text>
                <Text style={styles.chartSubtitle}>Last 6 months trend</Text>
              </View>
              <BarChart
                data={{
                  labels: growth.map(item => item.month.slice(-2)),
                  datasets: [{
                    data: growth.map(item => item.count)
                  }]
                }}
                width={screenWidth - 60}
                height={220}
                yAxisLabel=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#f8fafc',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                  barPercentage: 0.6,
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                  }
                }}
                style={styles.chartStyle}
                showBarTops={false}
              />
            </View>
          )}

          {/* Top Performers Section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Customer Distribution</Text>
            
            {/* Top Streets */}
            {byStreet && byStreet.length > 0 && (
              <View style={styles.listCard}>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>Top Streets</Text>
                  <Text style={styles.listSubtitle}>Highest customer concentration</Text>
                </View>
                {byStreet.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <View style={[styles.rankBadge, index < 3 && styles.topRankBadge]}>
                        <Text style={[styles.rankText, index < 3 && styles.topRankText]}>
                          #{index + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemTitle}>{item.street_name}</Text>
                        <Text style={styles.listItemSubtitle}>{item.customer_count} customers</Text>
                      </View>
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: '#dbeafe' }]}>
                      <Text style={{ color: '#1e40af', fontWeight: 'bold', fontSize: 14 }}>
                        {item.customer_count}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Apartment Types */}
            {byApartment && byApartment.length > 0 && (
              <View style={styles.listCard}>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>Residential Types</Text>
                  <Text style={styles.listSubtitle}>Apartment distribution</Text>
                </View>
                {byApartment.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <View style={[styles.typeIcon, { backgroundColor: '#e0e7ff' }]}>
                        <Text style={{ color: '#6366f1', fontSize: 16 }}>🏠</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemTitle}>{item.type_name}</Text>
                        <Text style={styles.listItemSubtitle}>{item.customer_count} customers</Text>
                      </View>
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: '#d1fae5' }]}>
                      <Text style={{ color: '#065f46', fontWeight: 'bold', fontSize: 14 }}>
                        {item.customer_count}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Business Types */}
            {byBusiness && byBusiness.length > 0 && (
              <View style={styles.listCard}>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>Business Types</Text>
                  <Text style={styles.listSubtitle}>Commercial customer breakdown</Text>
                </View>
                {byBusiness.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <View style={[styles.typeIcon, { backgroundColor: '#f3e8ff' }]}>
                        <Text style={{ color: '#8b5cf6', fontSize: 16 }}>🏢</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemTitle}>{item.type_name}</Text>
                        <Text style={styles.listItemSubtitle}>{item.customer_count} customers</Text>
                      </View>
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: '#e9d5ff' }]}>
                      <Text style={{ color: '#6b21a8', fontWeight: 'bold', fontSize: 14 }}>
                        {item.customer_count}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Summary Card */}
          <View style={[styles.highlightCard, { backgroundColor: '#1e293b' }]}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                Customer Insights
              </Text>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>Summary</Text>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Active Rate</Text>
                <Text style={styles.metricValue}>
                  {overview?.total_customers ? Math.round((overview.active_customers / overview.total_customers) * 100) : 0}%
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Residential %</Text>
                <Text style={styles.metricValue}>
                  {overview?.total_customers ? Math.round((overview.residential_customers / overview.total_customers) * 100) : 0}%
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Commercial %</Text>
                <Text style={styles.metricValue}>
                  {overview?.total_customers ? Math.round((overview.commercial_customers / overview.total_customers) * 100) : 0}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
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
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  chartStyle: {
    borderRadius: 12,
    marginVertical: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
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
    backgroundColor: '#6366f1',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  topRankText: {
    color: 'white',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export default CustomerAnalytics;