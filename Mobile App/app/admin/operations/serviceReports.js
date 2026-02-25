import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function ServiceReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState({});
  const [dateRange, setDateRange] = useState('week'); // week, month, quarter, year
  const [selectedChart, setSelectedChart] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);

  // DUMMY DATA - Replace with actual API calls
  const dummyReports = {
    overview: {
      totalServices: 156,
      servicedCount: 128,
      notHomeCount: 18,
      refusedCount: 10,
      completionRate: 82,
      averageServicesPerDay: 22,
      totalRevenue: 45800,
      revenueGrowth: 12.5,
    },
    dailyTrends: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: [18, 22, 25, 24, 26, 20, 21],
          color: () => '#06b6d4',
        }
      ],
    },
    statusDistribution: [
      { name: 'Serviced', population: 128, color: '#10b981', legendFontColor: '#64748b', legendFontSize: 12 },
      { name: 'Not Home', population: 18, color: '#f59e0b', legendFontColor: '#64748b', legendFontSize: 12 },
      { name: 'Refused', population: 10, color: '#ef4444', legendFontColor: '#64748b', legendFontSize: 12 },
    ],
    customerTypeDistribution: [
      { name: 'Residential', population: 98, color: '#3b82f6', legendFontColor: '#64748b', legendFontSize: 12 },
      { name: 'Commercial', population: 45, color: '#8b5cf6', legendFontColor: '#64748b', legendFontSize: 12 },
      { name: 'Institutional', population: 13, color: '#ec4899', legendFontColor: '#64748b', legendFontSize: 12 },
    ],
    topPerformers: [
      { name: 'James Wilson', services: 42, completionRate: 95, revenue: 12500 },
      { name: 'Maria Garcia', services: 38, completionRate: 89, revenue: 11200 },
      { name: 'Robert Lee', services: 35, completionRate: 92, revenue: 9800 },
      { name: 'Lisa Taylor', services: 32, completionRate: 87, revenue: 8900 },
      { name: 'Mike Johnson', services: 29, completionRate: 84, revenue: 7600 },
    ],
    routePerformance: [
      { name: 'Central Business', services: 56, completionRate: 88, efficiency: 92 },
      { name: 'West Suburbs', services: 48, completionRate: 85, efficiency: 89 },
      { name: 'East Industrial', services: 35, completionRate: 82, efficiency: 85 },
      { name: 'North Residential', services: 42, completionRate: 90, efficiency: 94 },
    ],
    monthlyComparison: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      currentYear: [120, 135, 142, 156, 148, 165],
      previousYear: [110, 125, 130, 142, 138, 150],
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Simulate data refresh when date range changes
    if (reports.overview) {
      // In real app, this would fetch new data based on dateRange
      // console.log('Fetching data for:', dateRange);
    }
  }, [dateRange]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/Login');
        return;
      }
      // Simulate API call
      setTimeout(() => {
        setReports(dummyReports);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/Login');
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleExportReport = (format) => {
    setShowExportModal(false);
    Alert.alert('Export Started', `Your report is being exported as ${format.toUpperCase()}`);
    // In real app, this would trigger the export process
  };

  const StatCard = ({ title, value, change, icon, color }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {change && (
        <View style={styles.changeIndicator}>
          <Ionicons 
            name={change > 0 ? "trending-up" : "trending-down"} 
            size={16} 
            color={change > 0 ? "#10b981" : "#ef4444"} 
          />
          <Text style={[
            styles.changeText,
            { color: change > 0 ? "#10b981" : "#ef4444" }
          ]}>
            {Math.abs(change)}% {change > 0 ? 'increase' : 'decrease'}
          </Text>
        </View>
      )}
    </View>
  );

  const PerformanceCard = ({ performer, rank }) => (
    <View style={styles.performerCard}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>
      <View style={styles.performerInfo}>
        <Text style={styles.performerName}>{performer.name}</Text>
        <Text style={styles.performerDetails}>
          {performer.services} services • {performer.completionRate}% completion
        </Text>
      </View>
      <View style={styles.revenueContainer}>
        <Text style={styles.revenueText}>₦{performer.revenue.toLocaleString()}</Text>
        <Text style={styles.revenueLabel}>Revenue</Text>
      </View>
    </View>
  );

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#06b6d4'
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#06b6d4" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06b6d4" />
          <Text style={styles.loadingText}>Generating reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06b6d4" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Reports</Text>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => setShowExportModal(true)}
          >
            <Ionicons name="download" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Date Range Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRangeScroll}>
          <View style={styles.dateRangeContainer}>
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.dateRangeButton,
                  dateRange === range && styles.dateRangeButtonActive
                ]}
                onPress={() => setDateRange(range)}
              >
                <Text style={[
                  styles.dateRangeText,
                  dateRange === range && styles.dateRangeTextActive
                ]}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.reportsContainer}>
          
          {/* Overview Stats */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Performance Overview</Text>
              <Text style={styles.sectionSubtitle}>Last {dateRange}</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Services"
                value={reports.overview.totalServices}
                change={8.5}
                icon="business"
                color="#06b6d4"
              />
              <StatCard
                title="Completion Rate"
                value={`${reports.overview.completionRate}%`}
                change={3.2}
                icon="checkmark-done"
                color="#10b981"
              />
              <StatCard
                title="Daily Average"
                value={reports.overview.averageServicesPerDay}
                change={5.1}
                icon="speedometer"
                color="#f59e0b"
              />
              <StatCard
                title="Total Revenue"
                value={`₦${reports.overview.totalRevenue.toLocaleString()}`}
                change={12.5}
                icon="cash"
                color="#8b5cf6"
              />
            </View>
          </View>

          {/* Chart Selector */}
          <View style={styles.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartSelectorScroll}>
              <View style={styles.chartSelector}>
                {[
                  { id: 'overview', label: 'Overview', icon: 'pie-chart' },
                  { id: 'trends', label: 'Daily Trends', icon: 'trending-up' },
                  { id: 'performance', label: 'Performance', icon: 'bar-chart' },
                  { id: 'comparison', label: 'Comparison', icon: 'git-compare' },
                ].map((chart) => (
                  <TouchableOpacity
                    key={chart.id}
                    style={[
                      styles.chartButton,
                      selectedChart === chart.id && styles.chartButtonActive
                    ]}
                    onPress={() => setSelectedChart(chart.id)}
                  >
                    <Ionicons 
                      name={chart.icon} 
                      size={16} 
                      color={selectedChart === chart.id ? "#06b6d4" : "#64748b"} 
                    />
                    <Text style={[
                      styles.chartButtonText,
                      selectedChart === chart.id && styles.chartButtonTextActive
                    ]}>
                      {chart.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Charts */}
            <View style={styles.chartContainer}>
              {selectedChart === 'overview' && (
                <View style={styles.chartSection}>
                  <Text style={styles.chartTitle}>Service Status Distribution</Text>
                  <PieChart
                    data={reports.statusDistribution}
                    width={width - 80}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              )}

              {selectedChart === 'trends' && (
                <View style={styles.chartSection}>
                  <Text style={styles.chartTitle}>Daily Service Trends</Text>
                  <LineChart
                    data={reports.dailyTrends}
                    width={width - 80}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                </View>
              )}

              {selectedChart === 'performance' && (
                <View style={styles.chartSection}>
                  <Text style={styles.chartTitle}>Customer Type Distribution</Text>
                  <BarChart
                    data={{
                      labels: reports.customerTypeDistribution.map(item => item.name),
                      datasets: [{
                        data: reports.customerTypeDistribution.map(item => item.population)
                      }]
                    }}
                    width={width - 80}
                    height={220}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    showValuesOnTopOfBars
                  />
                </View>
              )}

              {selectedChart === 'comparison' && (
                <View style={styles.chartSection}>
                  <Text style={styles.chartTitle}>Monthly Comparison</Text>
                  <LineChart
                    data={{
                      labels: reports.monthlyComparison.labels,
                      datasets: [
                        {
                          data: reports.monthlyComparison.currentYear,
                          color: () => '#06b6d4',
                        },
                        {
                          data: reports.monthlyComparison.previousYear,
                          color: () => '#cbd5e1',
                        }
                      ],
                      legend: ['Current Year', 'Previous Year']
                    }}
                    width={width - 80}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Top Performers */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Performers</Text>
              <Text style={styles.sectionSubtitle}>This {dateRange}</Text>
            </View>
            <View style={styles.performersList}>
              {reports.topPerformers.map((performer, index) => (
                <PerformanceCard
                  key={performer.name}
                  performer={performer}
                  rank={index + 1}
                />
              ))}
            </View>
          </View>

          {/* Route Performance */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Route Performance</Text>
              <Text style={styles.sectionSubtitle}>Efficiency metrics</Text>
            </View>
            <View style={styles.routeList}>
              {reports.routePerformance.map((route) => (
                <View key={route.name} style={styles.routeCard}>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeName}>{route.name}</Text>
                    <Text style={styles.routeDetails}>
                      {route.services} services • {route.completionRate}% completion
                    </Text>
                  </View>
                  <View style={styles.efficiencyBadge}>
                    <Text style={styles.efficiencyText}>{route.efficiency}%</Text>
                    <Text style={styles.efficiencyLabel}>Efficiency</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Service Breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Service Breakdown</Text>
            </View>
            <View style={styles.breakdownGrid}>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownIcon, { backgroundColor: '#10b981' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                </View>
                <Text style={styles.breakdownValue}>{reports.overview.servicedCount}</Text>
                <Text style={styles.breakdownLabel}>Serviced</Text>
                <Text style={styles.breakdownPercentage}>
                  {((reports.overview.servicedCount / reports.overview.totalServices) * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownIcon, { backgroundColor: '#f59e0b' }]}>
                  <Ionicons name="home" size={24} color="white" />
                </View>
                <Text style={styles.breakdownValue}>{reports.overview.notHomeCount}</Text>
                <Text style={styles.breakdownLabel}>Not Home</Text>
                <Text style={styles.breakdownPercentage}>
                  {((reports.overview.notHomeCount / reports.overview.totalServices) * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownIcon, { backgroundColor: '#ef4444' }]}>
                  <Ionicons name="close-circle" size={24} color="white" />
                </View>
                <Text style={styles.breakdownValue}>{reports.overview.refusedCount}</Text>
                <Text style={styles.breakdownLabel}>Refused</Text>
                <Text style={styles.breakdownPercentage}>
                  {((reports.overview.refusedCount / reports.overview.totalServices) * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exportModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Report</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Choose the format for your report export
            </Text>
            <View style={styles.exportOptions}>
              {['pdf', 'excel', 'csv'].map((format) => (
                <TouchableOpacity
                  key={format}
                  style={styles.exportOption}
                  onPress={() => handleExportReport(format)}
                >
                  <Ionicons 
                    name={format === 'pdf' ? 'document-text' : format === 'excel' ? 'table' : 'grid'} 
                    size={24} 
                    color="#06b6d4" 
                  />
                  <Text style={styles.exportOptionText}>
                    {format.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#06b6d4',
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRangeScroll: {
    paddingHorizontal: 20,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateRangeButtonActive: {
    backgroundColor: 'white',
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dateRangeTextActive: {
    color: '#06b6d4',
  },
  content: {
    flex: 1,
  },
  reportsContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartSelectorScroll: {
    marginBottom: 16,
  },
  chartSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  chartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartButtonActive: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#06b6d4',
  },
  chartButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  chartButtonTextActive: {
    color: '#06b6d4',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartSection: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  performersList: {
    gap: 12,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  performerDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  revenueContainer: {
    alignItems: 'flex-end',
  },
  revenueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 2,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  routeList: {
    gap: 12,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'space-between',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  routeDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  efficiencyBadge: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  efficiencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#06b6d4',
    marginBottom: 2,
  },
  efficiencyLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  breakdownIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  breakdownPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06b6d4',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exportModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  exportOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  exportOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    minWidth: 80,
  },
  exportOptionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#06b6d4',
  },
});