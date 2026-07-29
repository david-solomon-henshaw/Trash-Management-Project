import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';

// Import components
import CreateTruck from '../../../components/CreateTruck';
import AssignRoute from '../../../components/AssignRoute';
import ViewTrucks from '../../../components/ViewTrucks';

const { width } = Dimensions.get('window');

const Fleet = () => {
  const [activeTab, setActiveTab] = useState('create');
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);

  const tabs = [
    {
      id: 'create',
      label: 'Create Truck',
      icon: 'add-circle-outline',
      color: '#16A085',
    },
    {
      id: 'assign',
      label: 'Assign Route',
      icon: 'navigate-outline',
      color: '#f59e0b',
    },
    {
      id: 'view',
      label: 'View Fleet',
      icon: 'list-outline',
      color: '#8b5cf6',
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header – matches index.js and reports */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <LinearGradient colors={['#16A085', '#f59e0b']} style={styles.logoGradient}>
              <Ionicons name="car-sport" size={18} color="white" />
            </LinearGradient>
            <Text style={styles.logoText}>CleanHaul</Text>
          </View>
          <View style={styles.userInfoRight}>
            {user?.companyName && <Text style={styles.companyName}>{user.companyName}</Text>}
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'ADMIN'}</Text>
            <Text style={styles.staffName}>{user?.full_name || 'User'}</Text>
          </View>
        </View>
        <Text style={styles.headline}>Fleet Management</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? tab.color : '#64748B'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && [styles.activeTabLabel, { color: tab.color }],
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  logoGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 10,
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
  headline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.3,
    marginTop: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
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
    backgroundColor: 'rgba(22, 160, 133, 0.08)',
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