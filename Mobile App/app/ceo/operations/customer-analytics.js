import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const customerTypeData = [
    {
      name: 'Residential',
      population: overview?.residential_customers || 0,
      color: '#3b82f6',
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
      population: overview?.inactive_customers || 0,
      color: '#ef4444',
      legendFontColor: '#374151',
    }
  ];

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 16 }}>
        {/* Header Stats */}
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>
          Customer Analytics
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Customers</Text>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>
              {overview?.total_customers || 0}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active</Text>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {overview?.active_customers || 0}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Residential</Text>
            <Text style={[styles.statValue, { color: '#1f2937', fontSize: 24 }]}>
              {overview?.residential_customers || 0}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Commercial</Text>
            <Text style={[styles.statValue, { color: '#1f2937', fontSize: 24 }]}>
              {overview?.commercial_customers || 0}
            </Text>
          </View>
        </View>

        {/* Customer Type Distribution */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Customer Type Distribution</Text>
          <PieChart
            data={customerTypeData}
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

        {/* Status Distribution */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Customer Status</Text>
          <PieChart
            data={statusData}
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

        {/* Growth Trend */}
        {growth && growth.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Customer Growth (6 Months)</Text>
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
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                barPercentage: 0.7,
              }}
              style={{ borderRadius: 8 }}
            />
          </View>
        )}

        {/* Top Streets */}
        {byStreet && byStreet.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Top Streets by Customer Count</Text>
            {byStreet.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={{ color: '#374151', flex: 1 }}>{item.street_name}</Text>
                <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
                  <Text style={{ color: '#1e40af', fontWeight: '600' }}>{item.customer_count}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Apartment Types */}
        {byApartment && byApartment.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Residential by Apartment Type</Text>
            {byApartment.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={{ color: '#374151', flex: 1 }}>{item.type_name}</Text>
                <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
                  <Text style={{ color: '#065f46', fontWeight: '600' }}>{item.customer_count}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Business Types */}
        {byBusiness && byBusiness.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Commercial by Business Type</Text>
            {byBusiness.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={{ color: '#374151', flex: 1 }}>{item.type_name}</Text>
                <View style={[styles.badge, { backgroundColor: '#e9d5ff' }]}>
                  <Text style={{ color: '#6b21a8', fontWeight: '600' }}>{item.customer_count}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
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
    fontSize: 30,
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
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
};

export default CustomerAnalytics;