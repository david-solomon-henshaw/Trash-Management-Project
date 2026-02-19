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
      color: '#16A085',
      route: '/admin/operations/staffs',
    },
    {
      id: 'fleet',
      title: 'Fleet Management',
      description: 'Manage trucks, routes, and assignments',
      icon: '🚛',
      color: '#f59e0b',
      route: '/admin/operations/fleet',
    },
    {
      id: 'apartment-types',
      title: 'Residential Apartment Types',
      description: 'Manage apartment types and base fees',
      icon: '🏠',
      color: '#10b981',
      route: '/admin/operations/apartment-types',
    },
    {
      id: 'commercial-subtypes',
      title: 'Commercial Subtypes',
      description: 'Manage commercial subtypes and base fees',
      icon: '🏢',
      color: '#8b5cf6',
      route: '/admin/operations/commercial-subtypes',
    },{
    id: 'institutional-subtypes',
  title: 'Institutional Subtypes',
  description: 'Manage institutional subtypes and base fees',
  icon: '🏛️',
  color: '#8B4513',
  route: '/admin/operations/institutional-subtypes',
},
    {
      id: 'streets',
      title: 'Street Management',
      description: 'Manage streets and locations',
      icon: '📍',
      color: '#ef4444',
      route: '/admin/operations/streets',
    },
    {
      id: 'customer',
      title: 'Customer Management',
      description: 'Manage and organize customer accounts',
      icon: '👤',
      color: '#ec4899',
      route: '/admin/operations/customer',
    },
    {
      id: 'service-hub',
      title: 'Service Hub',
      description: 'Manage services, pricing, and service categories',
      icon: '🛠️',
      color: '#06b6d4',
      route: '/admin/operations/service-hub',
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

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>Select a module to manage</Text>
          </View>
          
          {/* Grid Layout for Tiles */}
          <View style={styles.gridContainer}>
            {operationsActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.tileCard}
                onPress={() => handleCardPress(action.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.tileIconContainer, { backgroundColor: action.color }]}>
                  <Text style={styles.tileIconEmoji}>{action.icon}</Text>
                </View>
                
                <View style={styles.tileTextContainer}>
                  <Text style={styles.tileTitle}>{action.title}</Text>
                  <Text style={styles.tileDescription}>{action.description}</Text>
                </View>
                
                <View style={styles.tileArrow}>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
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

  // Content
  content: {
    flex: 1,
  },
  cardsContainer: {
    padding: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    marginBottom: 20,
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

  // Grid Layout
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Tile Cards
  tileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '48%',
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tileIconEmoji: {
    fontSize: 24,
  },
  tileTextContainer: {
    flex: 1,
    marginBottom: 8,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  tileDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  tileArrow: {
    alignSelf: 'flex-end',
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