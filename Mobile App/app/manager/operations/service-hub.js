import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ServiceHub() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/Login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/Login');
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const serviceActions = [
    {
      id: 'record-service',
      title: 'Record Service',
      description: 'Create new service records and entries',
      icon: 'add-circle',
      color: '#06b6d4',
      route: '/manager/operations/recordService',
    },
    {
      id: 'service-history',
      title: 'Service History',
      description: 'View all service records and history',
      icon: 'time',
      color: '#8b5cf6',
      route: '/manager/operations/serviceHistory',
    },
    {
      id: 'verify-services',
      title: 'Verify Services',
      description: 'Review and validate completed services',
      icon: 'checkmark-done-circle',
      color: '#10b981',
      route: '/manager/operations/verifyService',
    },
    {
      id: 'service-reports',
      title: 'Service Reports',
      description: 'Generate service analytics and reports',
      icon: 'document-text',
      color: '#f59e0b',
      route: '/manager/operations/serviceReports',
    },
  ];

  const handleCardPress = (route) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06b6d4" />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerMain}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Service Hub</Text>
                <Text style={styles.headerSubtitle}>
                  Manage all service operations and tracking
                </Text>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="construct" size={32} color="white" />
              </View>
            </View>
            
            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4</Text>
                <Text style={styles.statLabel}>Modules</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>All</Text>
                <Text style={styles.statLabel}>Access</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24/7</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Actions Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={24} color="#06b6d4" />
            <Text style={styles.sectionTitle}>Service Management</Text>
          </View>
          
          <View style={styles.cardsGrid}>
            {serviceActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => handleCardPress(action.route)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardIconContainer, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={28} color={action.color} />
                </View>
                
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{action.title}</Text>
                  <Text style={styles.cardDescription}>{action.description}</Text>
                </View>

                <View style={[styles.cardArrow, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name="chevron-forward" size={20} color={action.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color="#06b6d4" />
            <Text style={styles.sectionTitle}>Service Features</Text>
          </View>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="calendar" size={20} color="#06b6d4" />
              </View>
              <Text style={styles.featureTitle}>Scheduling</Text>
              <Text style={styles.featureDescription}>
                Schedule and track service appointments efficiently
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={20} color="#06b6d4" />
              </View>
              <Text style={styles.featureTitle}>Verification</Text>
              <Text style={styles.featureDescription}>
                Quality assurance and service validation
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="analytics" size={20} color="#06b6d4" />
              </View>
              <Text style={styles.featureTitle}>Analytics</Text>
              <Text style={styles.featureDescription}>
                Comprehensive service performance insights
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="document" size={20} color="#06b6d4" />
              </View>
              <Text style={styles.featureTitle}>Reporting</Text>
              <Text style={styles.featureDescription}>
                Detailed service reports and documentation
              </Text>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoContent}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={24} color="#06b6d4" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Complete Service Management</Text>
              <Text style={styles.infoDescription}>
                Track, verify, and analyze all service operations from recording to reporting. Maintain quality standards and service excellence.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  cardsGrid: {
    gap: 16,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  cardArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoBanner: {
    margin: 20,
    marginTop: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f9ff',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});