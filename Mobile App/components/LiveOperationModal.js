import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LiveOperationModal = ({ 
  visible, 
  operation, 
  onClose,
  onViewFullDetails 
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  if (!operation) return null;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      in_progress: { 
        color: '#10B981', 
        bg: '#D1FAE5', 
        icon: 'play-circle',
        label: 'In Progress' 
      },
      paused: { 
        color: '#F59E0B', 
        bg: '#FEF3C7', 
        icon: 'pause-circle',
        label: 'Paused' 
      },
      at_dumpsite: { 
        color: '#8B5CF6', 
        bg: '#EDE9FE', 
        icon: 'location',
        label: 'At Dumpsite' 
      },
      completed: { 
        color: '#6366F1', 
        bg: '#E0E7FF', 
        icon: 'checkmark-circle',
        label: 'Completed' 
      },
    };
    return configs[status] || configs.in_progress;
  };

  const statusConfig = getStatusConfig(operation.status);

  const getCheckpointIcon = (type) => {
    const icons = {
      start: 'play',
      pause: 'pause',
      resume: 'play',
      dumpsite: 'trash',
      end: 'flag',
    };
    return icons[type] || 'location';
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Modal Content */}
      <Animated.View 
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.modalContent}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <LinearGradient
                  colors={[statusConfig.color, statusConfig.color + 'DD']}
                  style={styles.headerIconGradient}
                >
                  <Ionicons name={statusConfig.icon} size={28} color="white" />
                </LinearGradient>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>Live Operation</Text>
                  <Text style={styles.headerSubtitle}>{operation.title}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={32} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            {/* Status Badge */}
            <View style={[styles.statusBadgeLarge, { backgroundColor: statusConfig.bg }]}>
              <View style={[styles.statusDotLarge, { backgroundColor: statusConfig.color }]} />
              <Text style={[styles.statusTextLarge, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* Quick Stats */}
            <View style={styles.quickStatsContainer}>
              <View style={styles.quickStat}>
                <View style={styles.quickStatIcon}>
                  <Ionicons name="map" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.quickStatValue}>
                  {operation.streets?.length || 0}
                </Text>
                <Text style={styles.quickStatLabel}>Streets</Text>
              </View>
              
              {operation.truck && (
                <View style={styles.quickStat}>
                  <View style={styles.quickStatIcon}>
                    <Ionicons name="speedometer" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.quickStatValue}>
                    {operation.truck.truckCapacity}
                  </Text>
                  <Text style={styles.quickStatLabel}>Capacity (kg)</Text>
                </View>
              )}

              {operation.assignment_lifecycle?.checkpoints && (
                <View style={styles.quickStat}>
                  <View style={styles.quickStatIcon}>
                    <Ionicons name="flag" size={20} color="#8B5CF6" />
                  </View>
                  <Text style={styles.quickStatValue}>
                    {operation.assignment_lifecycle.checkpoints.length}
                  </Text>
                  <Text style={styles.quickStatLabel}>Checkpoints</Text>
                </View>
              )}
            </View>

            {/* Supervisor Info */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle-outline" size={22} color="#0F172A" />
                <Text style={styles.cardTitle}>Supervisor</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.supervisorCard}>
                  <View style={styles.supervisorAvatar}>
                    <Text style={styles.supervisorInitial}>
                      {(operation.supervisor || 'N')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.supervisorInfo}>
                    <Text style={styles.supervisorName}>
                      {operation.supervisor || 'No supervisor assigned'}
                    </Text>
                    <Text style={styles.supervisorRole}>Team Lead</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Truck Details */}
            {operation.truck && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="car-sport-outline" size={22} color="#0F172A" />
                  <Text style={styles.cardTitle}>Vehicle Information</Text>
                </View>
                <View style={styles.cardContent}>
                  <DetailRow 
                    icon="car-sport" 
                    label="Model" 
                    value={operation.truck.truckModel}
                  />
                  <DetailRow 
                    icon="finger-print" 
                    label="Plate Number" 
                    value={operation.truck.plate_number}
                  />
                  <DetailRow 
                    icon="speedometer" 
                    label="Capacity" 
                    value={`${operation.truck.truckCapacity} kg`}
                  />
                  <DetailRow 
                    icon="hardware-chip" 
                    label="Status" 
                    value={operation.truck.truckStatus}
                    valueColor={
                      operation.truck.truckStatus === 'operational' ? '#10B981' : 
                      operation.truck.truckStatus === 'maintenance' ? '#F59E0B' : '#EF4444'
                    }
                  />
                </View>
              </View>
            )}

            {/* Route Information */}
            {operation.streets && operation.streets.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="map-outline" size={22} color="#0F172A" />
                  <Text style={styles.cardTitle}>Route Information</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.routeCount}>
                    {operation.streets.length} {operation.streets.length === 1 ? 'street' : 'streets'} assigned
                  </Text>
                  <View style={styles.streetsList}>
                    {operation.streets.slice(0, 5).map((street, index) => (
                      <View key={index} style={styles.streetItem}>
                        <View style={styles.streetNumber}>
                          <Text style={styles.streetNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.streetInfo}>
                          <Text style={styles.streetName}>{street.name}</Text>
                          {street.location && (
                            <Text style={styles.streetLocation}>{street.location}</Text>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                      </View>
                    ))}
                    {operation.streets.length > 5 && (
                      <View style={styles.moreStreetsCard}>
                        <Ionicons name="add-circle-outline" size={20} color="#64748B" />
                        <Text style={styles.moreStreetsText}>
                          +{operation.streets.length - 5} more streets
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Location & Timing */}
            {operation.assignment_lifecycle && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="time-outline" size={22} color="#0F172A" />
                  <Text style={styles.cardTitle}>Location & Timing</Text>
                </View>
                <View style={styles.cardContent}>
                  {operation.assignment_lifecycle.started_at && (
                    <DetailRow 
                      icon="play-circle" 
                      label="Started At" 
                      value={formatDateTime(operation.assignment_lifecycle.started_at)}
                    />
                  )}
                  {operation.assignment_lifecycle.current_location && (
                    <>
                      <DetailRow 
                        icon="navigate" 
                        label="Current Location" 
                        value={`${operation.assignment_lifecycle.current_location.latitude.toFixed(4)}, ${operation.assignment_lifecycle.current_location.longitude.toFixed(4)}`}
                      />
                      {operation.assignment_lifecycle.current_location.speed !== undefined && (
                        <DetailRow 
                          icon="speedometer" 
                          label="Speed" 
                          value={`${operation.assignment_lifecycle.current_location.speed} km/h`}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Activity Timeline */}
            {operation.assignment_lifecycle?.checkpoints && 
             operation.assignment_lifecycle.checkpoints.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="timer-outline" size={22} color="#0F172A" />
                  <Text style={styles.cardTitle}>Activity Timeline</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.timeline}>
                    {operation.assignment_lifecycle.checkpoints.map((checkpoint, index) => (
                      <View key={index} style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                          <View style={styles.timelineDot}>
                            <Ionicons 
                              name={getCheckpointIcon(checkpoint.type)} 
                              size={14} 
                              color="white" 
                            />
                          </View>
                          {index < operation.assignment_lifecycle.checkpoints.length - 1 && (
                            <View style={styles.timelineLine} />
                          )}
                        </View>
                        <View style={styles.timelineContent}>
                          <View style={styles.timelineHeader}>
                            <Text style={styles.timelineType}>
                              {checkpoint.type.charAt(0).toUpperCase() + checkpoint.type.slice(1)}
                            </Text>
                            <Text style={styles.timelineTime}>
                              {formatTime(checkpoint.timestamp)}
                            </Text>
                          </View>
                          {checkpoint.notes && (
                            <Text style={styles.timelineNotes}>{checkpoint.notes}</Text>
                          )}
                          {checkpoint.location && (
                            <View style={styles.timelineLocation}>
                              <Ionicons name="location" size={12} color="#94A3B8" />
                              <Text style={styles.timelineLocationText}>
                                {checkpoint.location.latitude?.toFixed(4)}, {checkpoint.location.longitude?.toFixed(4)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={onViewFullDetails}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="open-outline" size={20} color="white" />
                <Text style={styles.primaryButtonText}>View Full Details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

// Reusable DetailRow Component
const DetailRow = ({ icon, label, value, valueColor }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon} size={18} color="#94A3B8" />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouchable: {
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
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
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
    paddingBottom: 20,
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
    alignItems: 'center',
    flex: 1,
  },
  headerIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  statusDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickStat: {
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
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
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
  supervisorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  supervisorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supervisorInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  supervisorInfo: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  supervisorRole: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  routeCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 12,
  },
  streetsList: {
    gap: 8,
  },
  streetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  streetNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streetNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  streetInfo: {
    flex: 1,
  },
  streetName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  streetLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  moreStreetsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 8,
  },
  moreStreetsText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  timeline: {
    paddingTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineTime: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  timelineNotes: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 6,
  },
  timelineLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineLocationText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LiveOperationModal;