import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function AssignmentDetailsModal({ 
  visible, 
  assignment, 
  onClose,
  onStartAssignment,
  onUpdateAssignmentStatus,
  startingAssignment,
  updatingStatus
}) {
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!assignment) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      scheduled: { color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' },
      in_progress: { color: '#10B981', bg: '#D1FAE5', icon: 'play-circle' },
      paused: { color: '#EF4444', bg: '#FEE2E2', icon: 'pause-circle' },
      at_dumpsite: { color: '#8B5CF6', bg: '#EDE9FE', icon: 'location' },
      completed: { color: '#16A085', bg: '#D1F2EB', icon: 'checkmark-circle' },
      cancelled: { color: '#6B7280', bg: '#F3F4F6', icon: 'close-circle' },
    };
    return configs[status] || configs.scheduled;
  };

  const getStatusText = (status) => {
    const texts = {
      scheduled: assignment.is_today ? 'Ready to Start' : 'Scheduled',
      in_progress: 'In Progress',
      paused: 'Paused',
      at_dumpsite: 'At Dumpsite',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return texts[status] || status;
  };

  // Status update handler
// In AssignmentDetailsModal.js - Update the handleStatusUpdate function
const handleStatusUpdate = async (newStatus) => {
  if (updatingStatus) return;
  
  let notes = '';
  
  // For certain statuses, you might want to prompt for notes
  if (newStatus === 'paused') {
    notes = 'Assignment paused by supervisor';
  } else if (newStatus === 'at_dumpsite') {
    notes = 'Arrived at dumpsite';
  } else if (newStatus === 'completed') {
    notes = 'Assignment completed successfully';
  } else if (newStatus === 'in_progress' && assignment.status === 'paused') {
    notes = 'Assignment resumed by supervisor';
  }
  
  try {
    await onUpdateAssignmentStatus(assignment, newStatus, notes);
  } catch (error) {
    Alert.alert('Error', 'Failed to update assignment status');
  }
};

  // Get available actions based on current status
// In AssignmentDetailsModal.js - Fix the getAvailableActions function
const getAvailableActions = () => {
  if (!assignment) return [];
  
  const actions = [];
  
  switch (assignment.status) {
    case 'in_progress':
      actions.push(
        { type: 'paused', label: 'Pause Assignment', icon: 'pause-circle', color: '#F59E0B' },
        { type: 'at_dumpsite', label: 'Arrive at Dumpsite', icon: 'location', color: '#8B5CF6' },
        { type: 'completed', label: 'Complete Assignment', icon: 'checkmark-circle', color: '#10B981' }
      );
      break;
      
    case 'paused':
      actions.push(
        { type: 'in_progress', label: 'Resume Assignment', icon: 'play-circle', color: '#10B981' } // This is correct
      );
      break;
      
    case 'at_dumpsite':
      actions.push(
        { type: 'in_progress', label: 'Leave Dumpsite', icon: 'play-circle', color: '#10B981' },
        { type: 'completed', label: 'Complete Assignment', icon: 'checkmark-circle', color: '#10B981' }
      );
      break;
  }
  
  return actions;
};

  const statusConfig = getStatusConfig(assignment.status);
  const canStartAssignment = assignment.is_today && assignment.status === 'scheduled';
  const availableActions = getAvailableActions();

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View 
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.modalContent}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header with Status */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                  <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {getStatusText(assignment.status)}
                  </Text>
                </View>
                {assignment.is_today && (
                  <View style={styles.todayPill}>
                    <Ionicons name="today" size={14} color="#16A085" />
                    <Text style={styles.todayText}>Today</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={26} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.headerTitle}>Assignment Details</Text>
            <Text style={styles.headerSubtitle}>
              {formatDate(assignment.scheduled_date)}
            </Text>
          </View>

          <ScrollView 
            style={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
              {assignment.assigned_truck && (
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="car-sport" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.statLabel}>Truck</Text>
                  <Text style={styles.statValue}>{assignment.assigned_truck.plate_number}</Text>
                  <Text style={styles.statSubtext}>{assignment.assigned_truck.truckModel}</Text>
                </View>
              )}
              
              {assignment.assigned_team && (
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="people" size={24} color="#8B5CF6" />
                  </View>
                  <Text style={styles.statLabel}>Team</Text>
                  <Text style={styles.statValue}>
                    {assignment.assigned_team.team_members?.length || 0}
                  </Text>
                  <Text style={styles.statSubtext}>Members</Text>
                </View>
              )}
              
              {assignment.streets && (
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="map" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.statLabel}>Routes</Text>
                  <Text style={styles.statValue}>{assignment.streets.length}</Text>
                  <Text style={styles.statSubtext}>Streets</Text>
                </View>
              )}
            </View>

            {/* Truck Details */}
            {assignment.assigned_truck && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="car-sport-outline" size={22} color="#1E293B" />
                  <Text style={styles.cardTitle}>Truck Information</Text>
                </View>
                <View style={styles.cardContent}>
                  <DetailRow 
                    icon="speedometer-outline" 
                    label="Capacity" 
                    value={`${assignment.assigned_truck.truckCapacity} kg`} 
                  />
                  <DetailRow 
                    icon="hardware-chip-outline" 
                    label="Status" 
                    value={assignment.assigned_truck.truckStatus.charAt(0).toUpperCase() + assignment.assigned_truck.truckStatus.slice(1)}
                    valueColor={
                      assignment.assigned_truck.truckStatus === 'operational' ? '#10B981' : 
                      assignment.assigned_truck.truckStatus === 'maintenance' ? '#F59E0B' : '#EF4444'
                    }
                  />
                </View>
              </View>
            )}

            {/* Team Members */}
            {assignment.assigned_team?.team_members && assignment.assigned_team.team_members.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="people-outline" size={22} color="#1E293B" />
                  <Text style={styles.cardTitle}>Team Members</Text>
                </View>
                <View style={styles.cardContent}>
                  {assignment.assigned_team.team_members.map((member, index) => (
                    <View key={index} style={styles.memberCard}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberInitial}>
                          {(member.user?.full_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName}>
                          {member.user?.full_name || 'Unknown Member'}
                        </Text>
                        <Text style={styles.memberRole}>
                          {member.role?.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                      {member.role === 'supervisor' && (
                        <View style={styles.supervisorBadge}>
                          <Ionicons name="star" size={14} color="#F59E0B" />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Routes */}
            {assignment.streets && assignment.streets.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="map-outline" size={22} color="#1E293B" />
                  <Text style={styles.cardTitle}>Assigned Routes</Text>
                </View>
                <View style={styles.cardContent}>
                  {assignment.streets.map((street, index) => (
                    <View key={street._id} style={styles.routeCard}>
                      <View style={styles.routeNumber}>
                        <Text style={styles.routeNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.routeDetails}>
                        <Text style={styles.routeName}>{street.name}</Text>
                        {street.location && (
                          <Text style={styles.routeLocation}>{street.location}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Progress Timeline */}
            {assignment.assignment_lifecycle?.checkpoints && assignment.assignment_lifecycle.checkpoints.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="time-outline" size={22} color="#1E293B" />
                  <Text style={styles.cardTitle}>Progress Timeline</Text>
                </View>
                <View style={styles.cardContent}>
                  {assignment.assignment_lifecycle.checkpoints.map((checkpoint, index) => (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineDot}>
                        <Ionicons 
                          name={
                            checkpoint.type === 'start' ? 'play' :
                            checkpoint.type === 'pause' ? 'pause' :
                            checkpoint.type === 'resume' ? 'play' :
                            checkpoint.type === 'dumpsite' ? 'trash' :
                            checkpoint.type === 'end' ? 'flag' : 'location'
                          } 
                          size={14} 
                          color="white" 
                        />
                      </View>
                      {index < assignment.assignment_lifecycle.checkpoints.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineType}>
                          {checkpoint.type.charAt(0).toUpperCase() + checkpoint.type.slice(1)}
                        </Text>
                        <Text style={styles.timelineTime}>{formatTime(checkpoint.timestamp)}</Text>
                        {checkpoint.notes && (
                          <Text style={styles.timelineNotes}>{checkpoint.notes}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Current Location */}
            {assignment.assignment_lifecycle?.current_location && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="navigate-outline" size={22} color="#1E293B" />
                  <Text style={styles.cardTitle}>Live Location</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.locationCard}>
                    <DetailRow 
                      icon="location-outline" 
                      label="Coordinates" 
                      value={`${assignment.assignment_lifecycle.current_location.latitude.toFixed(4)}, ${assignment.assignment_lifecycle.current_location.longitude.toFixed(4)}`}
                      small
                    />
                    {assignment.assignment_lifecycle.current_location.speed && (
                      <DetailRow 
                        icon="speedometer-outline" 
                        label="Speed" 
                        value={`${assignment.assignment_lifecycle.current_location.speed} km/h`}
                        small
                      />
                    )}
                    {assignment.assignment_lifecycle.current_location.battery_level && (
                      <DetailRow 
                        icon="battery-charging-outline" 
                        label="Battery" 
                        value={`${assignment.assignment_lifecycle.current_location.battery_level}%`}
                        small
                      />
                    )}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Updated Action Footer */}
          <View style={styles.footer}>
            {canStartAssignment ? (
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => onStartAssignment(assignment)}
                disabled={startingAssignment}
                activeOpacity={0.8}
              >
                {startingAssignment ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="play-circle" size={24} color="white" />
                    <Text style={styles.primaryButtonText}>Start Assignment</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : availableActions.length > 0 ? (
              <View style={styles.actionButtonsContainer}>
                {availableActions.map((action, index) => (
                  <TouchableOpacity
                    key={action.type}
                    style={[
                      styles.statusActionButton,
                      { backgroundColor: action.color }
                    ]}
                    onPress={() => handleStatusUpdate(action.type)}
                    disabled={updatingStatus}
                    activeOpacity={0.8}
                  >
                    {updatingStatus ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name={action.icon} size={24} color="white" />
                        <Text style={styles.primaryButtonText}>{action.label}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const DetailRow = ({ icon, label, value, valueColor, small }) => (
  <View style={small ? styles.detailRowSmall : styles.detailRow}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon} size={small ? 16 : 18} color="#94A3B8" />
      <Text style={small ? styles.detailLabelSmall : styles.detailLabel}>{label}</Text>
    </View>
    <Text style={[
      small ? styles.detailValueSmall : styles.detailValue, 
      valueColor && { color: valueColor }
    ]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.92,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    gap: 4,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A085',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  detailLabelSmall: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  detailValueSmall: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  supervisorBadge: {
    backgroundColor: '#FEF3C7',
    padding: 6,
    borderRadius: 8,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 8,
  },
  routeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16A085',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  routeDetails: {
    flex: 1,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  routeLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 6,
    position: 'relative',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A085',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 13,
    top: 28,
    bottom: -6,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  locationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
  },
  bottomSpacer: {
    height: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButtonsContainer: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statusActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
});