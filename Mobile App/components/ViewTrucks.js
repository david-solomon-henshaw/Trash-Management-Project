import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
// import { API_BASE_URL } from '../config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ViewTrucks = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    try {
      const token = await AsyncStorage.getItem('token'); 
      const response = await axios.get(
        `${API_BASE_URL}/api/trucks/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTrucks(response.data.trucks || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch trucks';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrucks();
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'operational':
        return { color: '#10b981', icon: 'checkmark-circle', label: 'Operational', bgColor: 'rgba(16, 185, 129, 0.1)' };
      case 'maintenance':
        return { color: '#f59e0b', icon: 'build', label: 'Maintenance', bgColor: 'rgba(245, 158, 11, 0.1)' };
      case 'inactive':
        return { color: '#ef4444', icon: 'close-circle', label: 'Inactive', bgColor: 'rgba(239, 68, 68, 0.1)' };
      default:
        return { color: '#6b7280', icon: 'help-circle', label: 'Unknown', bgColor: 'rgba(107, 114, 128, 0.1)' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const TruckCard = ({ truck }) => {
    const statusConfig = getStatusConfig(truck.truckStatus);
    
    return (
      <View style={styles.truckCard}>
        {/* Header */}
        <View style={styles.truckHeader}>
          <View style={styles.truckIdentity}>
            <View style={styles.truckIcon}>
              <Ionicons name="car-sport" size={24} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.plateNumber}>{truck.plate_number}</Text>
              <Text style={styles.truckModel}>{truck.truckModel}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.truckDetails}>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="scale" size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Capacity</Text>
              <Text style={styles.detailValue}>{truck.truckCapacity} tons</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Assignments</Text>
              <Text style={styles.detailValue}>
                {truck.assignment_history?.length || 0}
              </Text>
            </View>
          </View>

          {/* Recent Assignments */}
          {truck.assignment_history && truck.assignment_history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent Routes</Text>
              {truck.assignment_history.slice(0, 2).map((assignment, index) => (
                <View key={index} style={styles.historyItem}>
                  <Ionicons name="location" size={14} color="#8b5cf6" />
                  <Text style={styles.historyInfo}>
                    {assignment.route || 'Unnamed Route'}
                  </Text>
                  <Text style={styles.historyDate}>
                    {formatDate(assignment.logged_at)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.truckFooter}>
          <View style={styles.dateInfo}>
            <Ionicons name="time" size={12} color="#94a3b8" />
            <Text style={styles.dateText}>Added {formatDate(truck.created_at)}</Text>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading fleet data...</Text>
      </View>
    );
  }

  const operationalCount = trucks.filter(t => t.truckStatus === 'operational').length;
  const maintenanceCount = trucks.filter(t => t.truckStatus === 'maintenance').length;
  const inactiveCount = trucks.filter(t => t.truckStatus === 'inactive').length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#6366f1']}
          tintColor="#6366f1"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Fleet Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Fleet Overview</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={18} color="#6366f1" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{trucks.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statItem, styles.statOperational]}>
              <Text style={styles.statNumber}>{operationalCount}</Text>
              <Text style={styles.statLabel}>Operational</Text>
            </View>
            <View style={[styles.statItem, styles.statMaintenance]}>
              <Text style={styles.statNumber}>{maintenanceCount}</Text>
              <Text style={styles.statLabel}>Maintenance</Text>
            </View>
            <View style={[styles.statItem, styles.statInactive]}>
              <Text style={styles.statNumber}>{inactiveCount}</Text>
              <Text style={styles.statLabel}>Inactive</Text>
            </View>
          </View>
        </View>

        {/* Trucks List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fleet Vehicles</Text>
            <Text style={styles.sectionSubtitle}>
              {trucks.length} truck{trucks.length !== 1 ? 's' : ''} in operation
            </Text>
          </View>

          {trucks.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="car-sport-outline" size={48} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No Trucks Found</Text>
              <Text style={styles.emptyMessage}>
                Your fleet is empty. Add your first truck to get started with route assignments.
              </Text>
              <TouchableOpacity style={styles.emptyAction}>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.emptyActionText}>Add First Truck</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.trucksList}>
              {trucks.map((truck) => (
                <TruckCard key={truck._id} truck={truck} />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
  },
  refreshText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  statOperational: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statMaintenance: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  trucksList: {
    gap: 12,
  },
  truckCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  truckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  truckIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  truckIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  plateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  truckModel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  truckDetails: {
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginRight: 'auto',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  historySection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  historyInfo: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#64748B',
  },
  truckFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyAction: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ViewTrucks;