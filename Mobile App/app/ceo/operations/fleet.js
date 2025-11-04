import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import components
import CreateTruck from '../../../components/CreateTruck';
import AssignRoute from '../../../components/AssignRoute';
import ViewTrucks from '../../../components/ViewTrucks';

const { width } = Dimensions.get('window');

const Fleet = () => {
  const [activeTab, setActiveTab] = useState('create');

  const tabs = [
    { 
      id: 'create', 
      label: 'Create Truck', 
      icon: 'add-circle-outline',
      color: '#6366f1'
    },
    { 
      id: 'assign', 
      label: 'Assign Route', 
      icon: 'navigate-outline',
      color: '#10b981'
    },
    { 
      id: 'view', 
      label: 'View Fleet', 
      icon: 'list-outline',
      color: '#8b5cf6'
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return <CreateTruck />;
      case 'assign':
        return <AssignRoute />;
      case 'view':
        return <ViewTrucks />;
      default:
        return <CreateTruck />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="car-sport-outline" size={32} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Fleet Management</Text>
            <Text style={styles.headerSubtitle}>Manage trucks, teams, and routes</Text>
          </View>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>🚛 Active Fleet</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && [styles.activeTab, { borderBottomColor: tab.color }]
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? tab.color : '#64748B'} 
            />
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && [styles.activeTabLabel, { color: tab.color }]
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  headerStats: {
    flexDirection: 'row',
  },
  statPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statPillText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  tabLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabLabel: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
});

export default Fleet;