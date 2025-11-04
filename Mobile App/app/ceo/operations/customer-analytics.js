import React from 'react';
import { View, ScrollView, StyleSheet, Text, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

const CustomerAnalyticsScreen = () => {
  // Dummy Data
  const summaryData = [
    { label: 'Total Customers', value: '2,450' },
    { label: 'New Customers', value: '120' },
    { label: 'Revenue', value: '$60,000' },
    { label: 'Overdue Payments', value: '45' },
  ];

  const customerGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ data: [100, 150, 180, 220, 250, 300] }],
  };

  const revenueBySegmentData = {
    labels: ['Residential', 'Commercial', 'Government'],
    datasets: [{ data: [30000, 20000, 10000] }],
  };

  const paymentStatusData = [
    { name: 'Paid', population: 70, color: '#4CAF50', legendFontColor: '#7F7F7F' },
    { name: 'Pending', population: 20, color: '#FFC107', legendFontColor: '#7F7F7F' },
    { name: 'Overdue', population: 10, color: '#F44336', legendFontColor: '#7F7F7F' },
  ];

  const recentActivityData = [
    { id: 1, name: 'John Doe', action: 'Payment Received', amount: '$500' },
    { id: 2, name: 'Jane Smith', action: 'New Sign-Up', amount: '-' },
    { id: 3, name: 'Acme Corp', action: 'Payment Overdue', amount: '$1,200' },
  ];

  const SummaryCard = ({ label, value }) => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );

  const ActivityCard = ({ name, action, amount }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityRow}>
        <Text style={styles.activityName}>{name}</Text>
        <Text style={styles.activityAction}>{action}</Text>
        <Text style={styles.activityAmount}>{amount}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Customer Analytics</Text>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        {summaryData.map((item, index) => (
          <SummaryCard key={index} label={item.label} value={item.value} />
        ))}
      </View>

      {/* Customer Growth Chart */}
      <Text style={styles.sectionTitle}>Customer Growth</Text>
      <LineChart
        data={customerGrowthData}
        width={screenWidth - 32}
        height={220}
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: '#000',
          backgroundGradientFrom: '#1E1E1E',
          backgroundGradientTo: '#1E1E1E',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: { borderRadius: 16 },
        }}
        bezier
        style={styles.chart}
      />

      {/* Revenue by Segment */}
      <Text style={styles.sectionTitle}>Revenue by Segment</Text>
      <BarChart
        data={revenueBySegmentData}
        width={screenWidth - 32}
        height={220}
        yAxisSuffix="$"
        chartConfig={{
          backgroundColor: '#000',
          backgroundGradientFrom: '#1E1E1E',
          backgroundGradientTo: '#1E1E1E',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        style={styles.chart}
      />

      {/* Payment Status */}
      <Text style={styles.sectionTitle}>Payment Status</Text>
      <PieChart
        data={paymentStatusData}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundColor: '#000',
          backgroundGradientFrom: '#1E1E1E',
          backgroundGradientTo: '#1E1E1E',
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        style={styles.chart}
      />

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {recentActivityData.map((item) => (
        <ActivityCard
          key={item.id}
          name={item.name}
          action={item.action}
          amount={item.amount}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    marginBottom: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardLabel: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 8,
  },
  cardValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    marginTop: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activityCard: {
    marginBottom: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityName: {
    color: '#FFF',
    flex: 1,
    fontSize: 14,
  },
  activityAction: {
    color: '#BB86FC',
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
  activityAmount: {
    color: '#03DAC6',
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
  },
});

export default CustomerAnalyticsScreen;