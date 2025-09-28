import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { API_BASE_URL } from '../../App/config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        `${API_BASE_URL}/api/trucks/fleet`,
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return '#10B981';
      case 'maintenance':
        return '#F59E0B';
      case 'inactive':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return '✅';
      case 'maintenance':
        return '🔧';
      case 'inactive':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const TruckCard = ({ truck }) => (
    <View style={styles.truckCard}>
      <View style={styles.truckHeader}>
        <View style={styles.truckTitleRow}>
          <Text style={styles.plateNumber}>{truck.plate_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(truck.truckStatus) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(truck.truckStatus)}</Text>
            <Text style={styles.statusText}>{truck.truckStatus.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.truckModel}>{truck.truckModel}</Text>
      </View>

      <View style={styles.truckDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Capacity:</Text>
          <Text style={styles.detailValue}>{truck.truckCapacity} tons</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Assignment History:</Text>
          <Text style={styles.detailValue}>
            {truck.assignment_history?.length || 0} assignments
          </Text>
        </View>

        {truck.assignment_history && truck.assignment_history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Assignments:</Text>
            {truck.assignment_history.slice(0, 3).map((assignment, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {formatDate(assignment.logged_at)}
                </Text>
                <Text style={styles.historyInfo}>
                  Route: {assignment.route || 'N/A'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.truckFooter}>
        <Text style={styles.createdDate}>
          Created: {formatDate(truck.created_at)}
        </Text>
        <Text style={styles.updatedDate}>
          Updated: {formatDate(truck.updated_at)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading trucks...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{trucks.length}</Text>
            <Text style={styles.statLabel}>Total Trucks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {trucks.filter(t => t.truckStatus === 'operational').length}
            </Text>
            <Text style={styles.statLabel}>Operational</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {trucks.filter(t => t.truckStatus === 'maintenance').length}
            </Text>
            <Text style={styles.statLabel}>Maintenance</Text>
          </View>
        </View>

        {/* Trucks List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Trucks</Text>
            <Text style={styles.sectionSubtitle}>
              {trucks.length} truck{trucks.length !== 1 ? 's' : ''} in fleet
            </Text>
          </View>

          {trucks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🚛</Text>
              <Text style={styles.emptyTitle}>No Trucks Found</Text>
              <Text style={styles.emptyMessage}>
                No trucks have been added to the fleet yet. Create your first truck to get started.
              </Text>
            </View>
          ) : (
            trucks.map((truck) => (
              <TruckCard key={truck._id} truck={truck} />
            ))
          )}
        </View>

        {/* Action Button */}
        {trucks.length > 0 && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Text style={styles.refreshButtonText}>🔄 Refresh Data</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E8B57',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  truckCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  truckHeader: {
    marginBottom: 12,
  },
  truckTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  plateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  truckModel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  truckDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  historySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#64748B',
  },
  historyInfo: {
    fontSize: 12,
    color: '#374151',
  },
  truckFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  createdDate: {
    fontSize: 12,
    color: '#64748B',
  },
  updatedDate: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
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
  },
  actionContainer: {
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
});

export default ViewTrucks;