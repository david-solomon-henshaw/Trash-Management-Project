import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

export default function ServiceHub() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/');
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
      color: '#16A085',
      route: '/admin/operations/recordService',
    },
    {
      id: 'service-history',
      title: 'Service History',
      description: 'View all service records and history',
      icon: 'time',
      color: '#8b5cf6',
      route: '/admin/operations/serviceHistory',
    },
    {
      id: 'verify-services',
      title: 'Verify Services',
      description: 'Review and validate completed services',
      icon: 'checkmark-done-circle',
      color: '#10b981',
      route: '/admin/operations/verifyService',
    },
    {
      id: 'service-reports',
      title: 'Service Reports',
      description: 'Generate service analytics and reports',
      icon: 'document-text',
      color: '#f59e0b',
      route: '/admin/operations/serviceReports',
    },
  ];

  const handleCardPress = (route) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Service Hub</Text>
            <Text style={styles.headerSubtitle}>Manage all service operations</Text>
          </View>
          <View style={styles.userInfoRight}>
            {user?.companyName && <Text style={styles.companyName}>{user.companyName}</Text>}
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'ADMIN'}</Text>
            <Text style={styles.staffName}>{user?.full_name || 'User'}</Text>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {/* Main Actions Grid */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={24} color="#16A085" />
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
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={24} color="#16A085" />
              <Text style={styles.sectionTitle}>Service Features</Text>
            </View>

            <View style={styles.featuresGrid}>
              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="calendar" size={20} color="#16A085" />
                </View>
                <Text style={styles.featureTitle}>Scheduling</Text>
                <Text style={styles.featureDescription}>
                  Schedule and track service appointments efficiently
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="shield-checkmark" size={20} color="#16A085" />
                </View>
                <Text style={styles.featureTitle}>Verification</Text>
                <Text style={styles.featureDescription}>
                  Quality assurance and service validation
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="analytics" size={20} color="#16A085" />
                </View>
                <Text style={styles.featureTitle}>Analytics</Text>
                <Text style={styles.featureDescription}>
                  Comprehensive service performance insights
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="document" size={20} color="#16A085" />
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
                <Ionicons name="information-circle" size={24} color="#16A085" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Complete Service Management</Text>
                <Text style={styles.infoDescription}>
                  Track, verify, and analyze all service operations from recording to reporting. Maintain quality standards and service excellence.
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    marginBottom: 12,
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
  userInfoRight: {
    alignItems: 'flex-end',
    gap: 2,
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
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22,160,133,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16A085',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  cardsGrid: {
    gap: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
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
    width: (width - 80) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
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

/// fix the notes at the bottom 