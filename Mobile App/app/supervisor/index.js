import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { API_BASE_URL } from '../../config';
import AssignmentDetailsModal from '../../components/AssignmentDetailModal';
import PaymentModal from '../../components/PaymentModal';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

export default function SupervisorHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [supervisorStats, setSupervisorStats] = useState({
    todayCollections: 0
  });
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [startingAssignment, setStartingAssignment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const {
    locationPermission,
    isLoading: locationLoading,
    requestLocationPermission,
    showPermissionAlert,
  } = useLocationPermission();

  const quickActions = [
    {
      title: 'Record Payment',
      description: 'Collect customer payments',
      icon: 'cash',
      color: '#10B981',
      action: () => setShowPaymentModal(true)
    },
    {
      title: 'Payment History',
      description: 'View payment records',
      icon: 'receipt',
      color: '#F59E0B',
      screen: 'payment-history'
    }
  ];

  useEffect(() => {
    if (!locationLoading && locationPermission === null) {
      const timer = setTimeout(() => {
        showPermissionAlert();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [locationLoading, locationPermission]);

  const fetchDashboardData = async () => {
    try {
      console.log('Starting to fetch dashboard data...');
      const token = await AsyncStorage.getItem('token');
      console.log('Token retrieved:', token ? 'Token exists' : 'No token found');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch supervisor-specific data
      console.log('Making API calls to fetch supervisor data...');
      const [allAssignments, paymentsToday] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/trucks/all-assignments`, { headers }),
        axios.get(`${API_BASE_URL}/api/payments/today-collections`, { headers })
      ]);

      console.log('All Assignments Response:', allAssignments.data);
      console.log('Today Collections Response:', paymentsToday.data);

      // Set supervisor-specific stats
      setSupervisorStats({
        todayCollections: paymentsToday.data.amount || 0
      });

      // Set ALL assignments data (today + future)
      if (allAssignments.data.success) {
        setDashboardData({
          assignments: allAssignments.data.assignments || [], // Show ALL assignments
          allAssignments: allAssignments.data.assignments
        });
      }

    } catch (error) {
      console.error('Dashboard data error:', error.message);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('Dashboard data fetch completed');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleAssignmentPress = (assignment) => {
    setSelectedAssignment(assignment);
    setShowAssignmentModal(true);
  };

  const handleCloseModal = () => {
    setShowAssignmentModal(false);
    setSelectedAssignment(null);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  // Handle starting assignment
  const handleStartAssignment = async (assignment) => {
    if (startingAssignment) return;
    
    setStartingAssignment(true);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Get current location if permission is granted
      let locationData = null;
      if (locationPermission === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          };
          console.log(locationData, 'location DATA ')
        } catch (locationError) {
          console.log('Could not get location:', locationError);
        }
      }

      const requestBody = {
        assignment_id: assignment._id,
        start_location: locationData // Include location data
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/trucks/start-assignment`,
        requestBody,
        { headers }
      );

      if (response.data.success) {
        Alert.alert('Success', response.data.message);
        fetchDashboardData();
        handleCloseModal();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to start assignment');
      }
    } catch (error) {
      console.error('Start assignment error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to start assignment';
      Alert.alert('Error', errorMessage);
    } finally {
      setStartingAssignment(false);
    }
  };

  // Handle updating assignment status (pause, resume, at_dumpsite, completed)
  const handleUpdateAssignmentStatus = async (assignment, newStatus, notes = '') => {
    if (updatingStatus) return;
    
    setUpdatingStatus(true);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Get current location if permission is granted
      let locationData = null;
      if (locationPermission === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          };
        } catch (locationError) {
          console.log('Could not get location:', locationError);
        }
      }

      const requestBody = {
        assignment_id: assignment._id,
        status: newStatus,
        notes: notes,
        location: locationData
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/trucks/update-assignment-status`,
        requestBody,
        { headers }
      );

      if (response.data.success) {
        Alert.alert('Success', response.data.message);
        fetchDashboardData(); // Refresh data
        if (newStatus === 'completed') {
          handleCloseModal(); // Close modal if completed
        }
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update assignment status');
      }
    } catch (error) {
      console.error('Update assignment status error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update assignment status';
      Alert.alert('Error', errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₦0';
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Group assignments by date status
  const getGroupedAssignments = () => {
    if (!dashboardData?.assignments) return { today: [], upcoming: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAssignments = [];
    const upcomingAssignments = [];

    dashboardData.assignments.forEach(assignment => {
      const assignmentDate = new Date(assignment.scheduled_date);
      assignmentDate.setHours(0, 0, 0, 0);
      
      // Compare dates properly
      if (assignmentDate.getTime() === today.getTime()) {
        todayAssignments.push(assignment);
      } else if (assignmentDate > today) {
        upcomingAssignments.push(assignment);
      }
    });

    return {
      today: todayAssignments,
      upcoming: upcomingAssignments
    };
  };

  const groupedAssignments = getGroupedAssignments();

  // TEMPORARY DEBUG - Remove after testing
  console.log('=== ASSIGNMENT DEBUG INFO ===');
  console.log('All assignments:', dashboardData?.assignments?.length || 0);
  console.log('Today assignments:', groupedAssignments.today.length);
  console.log('Upcoming assignments:', groupedAssignments.upcoming.length);

  if (dashboardData?.assignments) {
    dashboardData.assignments.forEach((assignment, index) => {
      const assignmentDate = new Date(assignment.scheduled_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      assignmentDate.setHours(0, 0, 0, 0);
      
      console.log(`Assignment ${index + 1}:`, {
        date: assignment.scheduled_date,
        formattedDate: formatDate(assignment.scheduled_date),
        status: assignment.status,
        isToday: assignmentDate.getTime() === today.getTime(),
        canStart: assignment.status === 'scheduled' && assignmentDate.getTime() === today.getTime()
      });
    });
  }

  // Add location permission status to your UI (optional)
  const renderLocationPermissionStatus = () => {
    if (locationLoading) return null;

    return (
      <View style={styles.locationPermissionBanner}>
        <Ionicons 
          name={locationPermission === 'granted' ? 'location' : 'location-outline'} 
          size={16} 
          color={locationPermission === 'granted' ? '#10B981' : '#F59E0B'} 
        />
        <Text style={[
          styles.locationPermissionText,
          { color: locationPermission === 'granted' ? '#10B981' : '#F59E0B' }
        ]}>
          Location {locationPermission === 'granted' ? 'Enabled' : 'Required'}
        </Text>
        {locationPermission !== 'granted' && (
          <TouchableOpacity onPress={showPermissionAlert} style={styles.enableLocationButton}>
            <Text style={styles.enableLocationText}>Enable</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleQuickAction = (action) => {
    if (action.action) {
      action.action(); // Execute the action function
    } else if (action.screen) {
      router.push(`/supervisor/${action.screen}`); // Navigate to screen
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome, Supervisor!</Text>
          <Text style={styles.subtitle}>Manage your collections and routes</Text>
          {renderLocationPermissionStatus()}
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle" size={32} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A085']} />
        }
      >
        {/* Supervisor Stats - Only Today's Collections */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="cash" size={24} color="#6366F1" />
            </View>
            <Text style={styles.statNumber}>
              {formatCurrency(supervisorStats.todayCollections)}
            </Text>
            <Text style={styles.statLabel}>Today's Collections</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => handleQuickAction(action)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={24} color="white" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Assignments */}
        {groupedAssignments.today.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Assignments</Text>
              <TouchableOpacity onPress={() => router.push('/supervisor/routes')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.assignmentsList}>
              {groupedAssignments.today.slice(0, 3).map((assignment, index) => {
                const canStart = assignment.status === 'scheduled';
                return (
                  <TouchableOpacity 
                    key={assignment._id} 
                    style={styles.assignmentCard}
                    onPress={() => handleAssignmentPress(assignment)}
                  >
                    <View style={styles.assignmentHeader}>
                      <View style={styles.assignmentInfo}>
                        <Text style={styles.assignmentTitle}>
                          {assignment.assigned_truck?.truckModel} - {assignment.assigned_truck?.plate_number}
                        </Text>
                        <Text style={styles.assignmentDate}>
                          {formatDate(assignment.scheduled_date)}
                        </Text>
                      </View>
                      <View style={styles.assignmentActions}>
                        <View style={[
                          styles.assignmentStatus,
                          { 
                            backgroundColor: assignment.status === 'scheduled' ? '#F59E0B' : 
                                            assignment.status === 'in_progress' ? '#10B981' :
                                            assignment.status === 'completed' ? '#6366F1' :
                                            assignment.status === 'paused' ? '#EF4444' :
                                            assignment.status === 'at_dumpsite' ? '#8B5CF6' : '#6B7280'
                          }
                        ]}>
                          <Text style={styles.assignmentStatusText}>
                            {assignment.status === 'scheduled' ? 'Ready to Start' : 
                              assignment.status === 'in_progress' ? 'In Progress' :
                              assignment.status === 'completed' ? 'Completed' :
                              assignment.status === 'paused' ? 'Paused' :
                              assignment.status === 'at_dumpsite' ? 'At Dumpsite' : assignment.status}
                          </Text>
                        </View>
                        {canStart && (
                          <TouchableOpacity 
                            style={styles.startButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleStartAssignment(assignment);
                            }}
                            disabled={startingAssignment}
                          >
                            {startingAssignment ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Ionicons name="play" size={16} color="white" />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <Text style={styles.assignmentStreets}>
                      {assignment.streets?.slice(0, 2).map(street => street.name).join(', ')}
                      {assignment.streets?.length > 2 && '...'}
                    </Text>
                    <Text style={styles.teamInfo}>
                      Team: {assignment.assigned_team?.team_members?.length || 0} members
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Assignments Today</Text>
              <Text style={styles.emptyText}>You have no assignments scheduled for today</Text>
            </View>
          </View>
        )}

        {/* Upcoming Assignments */}
        {groupedAssignments.upcoming.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Assignments</Text>
              <TouchableOpacity onPress={() => router.push('/supervisor/routes')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.assignmentsList}>
              {groupedAssignments.upcoming.slice(0, 3).map((assignment, index) => (
                <TouchableOpacity 
                  key={assignment._id} 
                  style={styles.assignmentCard}
                  onPress={() => handleAssignmentPress(assignment)}
                >
                  <View style={styles.assignmentHeader}>
                    <View style={styles.assignmentInfo}>
                      <Text style={styles.assignmentTitle}>
                        {assignment.assigned_truck?.truckModel} - {assignment.assigned_truck?.plate_number}
                      </Text>
                      <Text style={styles.assignmentDate}>
                        {formatDate(assignment.scheduled_date)}
                      </Text>
                    </View>
                    <View style={[
                      styles.assignmentStatus,
                      { 
                        backgroundColor: '#F59E0B'
                      }
                    ]}>
                      <Text style={styles.assignmentStatusText}>
                        Upcoming
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.assignmentStreets}>
                    {assignment.streets?.slice(0, 2).map(street => street.name).join(', ')}
                    {assignment.streets?.length > 2 && '...'}
                  </Text>
                  <Text style={styles.teamInfo}>
                    Team: {assignment.assigned_team?.team_members?.length || 0} members
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Today's Performance - Simplified */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Performance</Text>
          <View style={styles.revenueCard}>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Collections Made:</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(supervisorStats.todayCollections)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Assignment Details Modal */}
      <AssignmentDetailsModal
        visible={showAssignmentModal}
        assignment={selectedAssignment}
        onClose={handleCloseModal}
        onStartAssignment={handleStartAssignment}
        onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
        startingAssignment={startingAssignment}
        updatingStatus={updatingStatus}
      />

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={handleClosePaymentModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  locationPermissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  locationPermissionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    marginRight: 8,
  },
  enableLocationButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  enableLocationText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#16A085',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  viewAllText: {
    fontSize: 14,
    color: '#16A085',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  assignmentsList: {
    gap: 12,
  },
  assignmentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  assignmentDate: {
    fontSize: 14,
    color: '#64748B',
  },
  assignmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assignmentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  startButton: {
    backgroundColor: '#10B981',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentStreets: {
    fontSize: 14,
    color: '#64748B',
  },
  teamInfo: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  revenueCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  revenueRowHighlight: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});