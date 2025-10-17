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
      icon: 'people-outline',
      color: '#2E8B57',
      route: '/ceo/operations/staffs',
    },
    {
      id: 'fleet',
      title: 'Fleet Management',
      description: 'Manage trucks, routes, and assignments',
      icon: 'car-outline',
      color: '#F59E0B',
      route: '/ceo/operations/fleet',
    },
    {
      id: 'apartment-types',
      title: 'Apartment Types',
      description: 'Manage apartment types and base fees',
      icon: 'home-outline',
      color: '#3B82F6',
      route: '/ceo/operations/apartment-types',
    },
    {
      id: 'commercial-subtypes',
      title: 'Commercial Subtypes',
      description: 'Manage commercial subtypes and base fees',
      icon: 'business-outline',
      color: '#8B5CF6',
      route: '/ceo/operations/commercial-subtypes',
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
          <Text style={styles.headerTitle}>Operations Management</Text>
          <Text style={styles.headerSubtitle}>
            Manage staff, trucks, apartment types, and commercial subtypes
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {operationsActions.map((action) => (
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
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#2E8B57" />
            <Text style={styles.infoText}>
              Use this section to manage all operations-related tasks.
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
    fontSize: 16,
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
