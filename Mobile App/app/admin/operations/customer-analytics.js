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
  StatusBar,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import apiClient from '../../../hooks/services/client';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';

const screenWidth = Dimensions.get('window').width;

const CustomerAnalytics = () => {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
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
        apiClient.get(`/analytics/customers/overview`),
        apiClient.get(`/analytics/customers/growth`),
        apiClient.get(`/analytics/customers/by-street`),
        apiClient.get(`/analytics/customers/by-apartment-type`),
        apiClient.get(`/analytics/customers/by-business-type`)
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

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(22, 160, 133, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#16A085',
    },
    barPercentage: 0.7,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A085" />
          <Text style={styles.loadingText}>Loading customer analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const customerTypeData = [
    {
      name: 'Residential',
      population: overview?.residential_customers || 0,
      color: '#16A085',
      legendFontColor: '#374151',
    },
    {
      name: 'Commercial',
      population: overview?.commercial_customers || 0,
      color: '#059669',
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Customer Analytics</Text>
            <Text style={styles.headerSubtitle}>Comprehensive customer insights</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A085']} tintColor="#16A085" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollContent}>
          {/* Overview Cards */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={20} color="#16A085" />
              <Text style={styles.sectionTitle}>Customer Overview</Text>
            </View>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#16A08520' }]}>
                  <Ionicons name="people" size={20} color="#16A085" />
                </View>
                <Text style={styles.metricLabel}>Total</Text>
                <Text style={styles.metricValue}>{overview?.total_customers || 0}</Text>
              </View>
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#10b98120' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <Text style={styles.metricLabel}>Active</Text>
                <Text style={styles.metricValue}>{overview?.active_customers || 0}</Text>
              </View>
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#05966920' }]}>
                  <Ionicons name="home" size={20} color="#059669" />
                </View>
                <Text style={styles.metricLabel}>Residential</Text>
                <Text style={styles.metricValue}>{overview?.residential_customers || 0}</Text>
              </View>
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#8b5cf620' }]}>
                  <Ionicons name="business" size={20} color="#8b5cf6" />
                </View>
                <Text style={styles.metricLabel}>Commercial</Text>
                <Text style={styles.metricValue}>{overview?.commercial_customers || 0}</Text>
              </View>
            </View>
          </View>

          {/* Charts Row */}
          <View style={styles.rowCards}>
            <View style={[styles.sectionCard, styles.halfCard]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pie-chart" size={20} color="#16A085" />
                <Text style={styles.sectionTitle}>By Type</Text>
              </View>
              <PieChart
                data={customerTypeData}
                width={(screenWidth - 80) / 2}
                height={140}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="10"
                absolute
              />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#16A085' }]} />
                  <Text style={styles.legendText}>Residential</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#059669' }]} />
                  <Text style={styles.legendText}>Commercial</Text>
                </View>
              </View>
            </View>

            <View style={[styles.sectionCard, styles.halfCard]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pie-chart" size={20} color="#16A085" />
                <Text style={styles.sectionTitle}>By Status</Text>
              </View>
              <PieChart
                data={statusData}
                width={(screenWidth - 80) / 2}
                height={140}
                chartConfig={chartConfig}
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

          {/* Growth Chart */}
          {growth && growth.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={20} color="#16A085" />
                <Text style={styles.sectionTitle}>Customer Growth (Last 6 Months)</Text>
              </View>
              <BarChart
                data={{
                  labels: growth.map(item => item.month.slice(-2)),
                  datasets: [{
                    data: growth.map(item => item.count)
                  }]
                }}
                width={screenWidth - 80}
                height={200}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            </View>
          )}

          {/* Top Streets */}
          {byStreet && byStreet.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color="#16A085" />
                <Text style={styles.sectionTitle}>Top Streets</Text>
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
                  <View style={[styles.countBadge, { backgroundColor: '#d1fae5' }]}>
                    <Text style={{ color: '#065f46', fontWeight: 'bold', fontSize: 14 }}>
                      {item.customer_count}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Apartment Types */}
          {byApartment && byApartment.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="home" size={20} color="#16A085" />
                <Text style={styles.sectionTitle}>Residential Types</Text>
              </View>
              {byApartment.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <View style={[styles.typeIcon, { backgroundColor: '#d1fae5' }]}>
                      <Ionicons name="bed" size={16} color="#065f46" />
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
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business" size={20} color="#16A085" />
                <Text style={styles.sectionTitle}>Business Types</Text>
              </View>
              {byBusiness.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <View style={[styles.typeIcon, { backgroundColor: '#d1fae5' }]}>
                      <Ionicons name="storefront" size={16} color="#065f46" />
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

          {/* Summary Card */}
          <View style={[styles.highlightCard, { backgroundColor: '#16A085' }]}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                Customer Insights
              </Text>
              <Ionicons name="analytics" size={20} color="white" />
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

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.tagline}>CLEAN • SMART • RELIABLE</Text>
            <Text style={styles.copyright}>© 2026 CleanHaul • B2B Waste Operations</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  // Header
  header: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  // Section Cards
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  halfCard: {
    width: '48%',
    marginBottom: 16,
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
  // Metrics grid (4 items)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  // Row cards
  rowCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Chart legend
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
  // Chart
  chart: {
    borderRadius: 16,
    marginTop: 8,
  },
  // List items
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
    fontSize: 11,
    color: '#94a3b8',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  // Highlight card
  highlightCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
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

export default CustomerAnalytics;