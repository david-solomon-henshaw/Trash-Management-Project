import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerIndex() {
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

  const customerActions = [
    {
      id: 'add-customer',
      title: 'Add Customer',
      description: 'Register a new customer account',
      icon: 'person-add',
      color: '#2E8B57',
      route: '/ceo/operations/add-customer',
    },
    {
      id: 'view-customers',
      title: 'View Customers',
      description: 'Browse all registered customers',
      icon: 'people',
      color: '#3B82F6',
      route: '/ceo/operations/view-customers',
    },
     {
      id: 'record-payment',
      title: 'Record Payment',
      description: 'Record a new payment',
      icon: 'cash',
      color: '#F59E0B',
      route: '/ceo/operations/record-payment',
    },
    
     {
      id: 'customer-analytics',
      title: 'Customer Analytics',
      description: 'Record a new payment',
      icon: 'stats-chart',
      color: '#8B5CF6',
      route: '/ceo/operations/customer-analytics',
    },
     {
      id: 'billing-history',
      title: 'Billing History',
      description: 'View payment record',
      icon: 'receipt',
      color: '#F59E0B',
      route: '/ceo/operations/billing-history',
    },
  ];

  const handleCardPress = (route) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Customer Management</Text>
          <Text style={styles.headerSubtitle}>
            Manage and organize customer accounts
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {customerActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => handleCardPress(action.route)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={32} color={action.color} />
                </View>
                
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>{action.title}</Text>
                  <Text style={styles.cardDescription}>{action.description}</Text>
                </View>

                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}

          {/* Coming Soon Cards */}
          <View style={styles.comingSoonSection}>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            
       

            <View style={styles.comingSoonCard}>
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="receipt" size={32} color="#F59E0B" />
                </View>
                
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Billing History</Text>
                  <Text style={styles.cardDescription}>View payment records</Text>
                </View>

                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonBadgeText}>Soon</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#2E8B57" />
            <Text style={styles.infoText}>
              Use this section to manage all customer-related operations. More features are coming soon!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  content: {
    flex: 1,
  },
  cardsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
  comingSoonSection: {
    marginTop: 24,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  comingSoonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    opacity: 0.6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  comingSoonBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    marginLeft: 12,
  },
});