import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function OperationsIndex() {
  const router = useRouter();
  
  const operationsActions = [
    {
      id: 'staffs',
      title: 'Staff Management',
      description: 'Manage staff accounts and roles',
      icon: '👥',
      iconLib: 'people-outline',
      color: '#16A085',
      route: '/ceo/operations/staffs',
      stats: '24 Active',
    },
    {
      id: 'fleet',
      title: 'Fleet Management',
      description: 'Manage trucks, routes, and assignments',
      icon: '🚛',
      iconLib: 'car-outline',
      color: '#f59e0b',
      route: '/ceo/operations/fleet',
      stats: '12 Vehicles',
    },
    {
      id: 'apartment-types',
      title: 'Apartment Types',
      description: 'Manage apartment types and base fees',
      icon: '🏠',
      iconLib: 'home-outline',
      color: '#10b981',
      route: '/ceo/operations/apartment-types',
      stats: '8 Types',
    },
    {
      id: 'commercial-subtypes',
      title: 'Commercial Subtypes',
      description: 'Manage commercial subtypes and base fees',
      icon: '🏢',
      iconLib: 'business-outline',
      color: '#8b5cf6',
      route: '/ceo/operations/commercial-subtypes',
      stats: '6 Subtypes',
    },
    {
      id: 'streets',
      title: 'Street Management',
      description: 'Manage streets and locations',
      icon: '📍',
      iconLib: 'pin-outline',
      color: '#ef4444',
      route: '/ceo/operations/streets',
      stats: '45 Streets',
    },
    {
      id: 'customer',
      title: 'Customer Management',
      description: 'Manage and organize customer accounts',
      icon: '👤',
      iconLib: 'people',
      color: '#ec4899',
      route: '/ceo/operations/customer',
      stats: '156 Customers',
    },
  ];

  const handleCardPress = (route) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16A085" />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>⚙️</Text>
          </View>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Operations Hub</Text>
          <Text style={styles.headerSubtitle}>
            Centralized management for all operations
          </Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>6</Text>
          <Text style={styles.statLabel}>Modules</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>251</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>Active</Text>
          <Text style={styles.statLabel}>System</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>Select a module to manage</Text>
          </View>
          
          {operationsActions.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionCard,
                index === 0 && styles.firstCard,
              ]}
              onPress={() => handleCardPress(action.route)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
                  <Text style={styles.iconEmoji}>{action.icon}</Text>
                </View>
                
                <View style={styles.cardTextContainer}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{action.title}</Text>
                    <View style={[styles.statsBadge, { backgroundColor: `${action.color}15` }]}>
                      <Text style={[styles.statsText, { color: action.color }]}>
                        {action.stats}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardDescription}>{action.description}</Text>
                </View>
                
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Enhanced Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>💡</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Operations Center</Text>
              <Text style={styles.infoText}>
                Manage all operational aspects of EcoHaul from this centralized hub. Changes sync in real-time across the platform.
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
  
  // Enhanced Header
  header: {
    backgroundColor: '#16A085',
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerTop: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16A085',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },

  // Content
  content: {
    flex: 1,
  },
  cardsContainer: {
    padding: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },

  // Action Cards
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  firstCard: {
    borderWidth: 2,
    borderColor: '#16A085',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconEmoji: {
    fontSize: 28,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  statsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Info Section
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
});