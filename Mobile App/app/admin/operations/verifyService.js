import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

export default function VerifyServices() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    status: 'pending', // pending, verified, rejected
    serviceType: 'all'
  });

  // DUMMY DATA - Replace with actual API calls
  const dummyServices = [
    {
      _id: 'service001',
      customer: {
        _id: 'cust001',
        name: 'John Smith',
        phone: '08012345678',
        address: '12A Lagos Street',
        house_number: '12A',
        customer_type: 'residential'
      },
      route: {
        _id: 'route001',
        name: 'Central Business District'
      },
      supervisor: {
        _id: 'super001',
        name: 'James Wilson'
      },
      service_date: new Date('2024-01-15T09:30:00Z'),
      service_month: new Date('2024-01-01T00:00:00Z'),
      before_photo: 'https://via.placeholder.com/400x300/16A085/ffffff?text=Before+Service',
      after_photo: 'https://via.placeholder.com/400x300/10b981/ffffff?text=After+Service',
      service_notes: 'Regular service completed. Area was clean before service. All waste properly collected.',
      service_status: 'serviced',
      verification: {
        status: 'pending', // pending, verified, rejected
        verified_by: null,
        verified_date: null,
        notes: ''
      },
      created_at: new Date('2024-01-15T09:35:00Z')
    },
    {
      _id: 'service002',
      customer: {
        _id: 'cust002',
        name: 'Sarah Johnson',
        phone: '08087654321',
        address: '15B Lagos Street',
        house_number: '15B',
        customer_type: 'commercial'
      },
      route: {
        _id: 'route001',
        name: 'Central Business District'
      },
      supervisor: {
        _id: 'super001',
        name: 'James Wilson'
      },
      service_date: new Date('2024-01-15T10:15:00Z'),
      service_month: new Date('2024-01-01T00:00:00Z'),
      before_photo: 'https://via.placeholder.com/400x300/16A085/ffffff?text=Before+Service',
      after_photo: null,
      service_notes: 'Customer was not available at time of service. Attempted contact but no response.',
      service_status: 'not_home',
      verification: {
        status: 'pending',
        verified_by: null,
        verified_date: null,
        notes: ''
      },
      created_at: new Date('2024-01-15T10:20:00Z')
    },
    {
      _id: 'service003',
      customer: {
        _id: 'cust003',
        name: 'Mike Wilson',
        phone: '08011111111',
        address: '20 Ikeja Avenue',
        house_number: '20',
        customer_type: 'residential'
      },
      route: {
        _id: 'route001',
        name: 'Central Business District'
      },
      supervisor: {
        _id: 'super002',
        name: 'Maria Garcia'
      },
      service_date: new Date('2024-01-14T14:20:00Z'),
      service_month: new Date('2024-01-01T00:00:00Z'),
      before_photo: 'https://via.placeholder.com/400x300/16A085/ffffff?text=Before+Service',
      after_photo: null,
      service_notes: 'Customer refused service due to personal reasons. Was polite but declined service.',
      service_status: 'refused',
      verification: {
        status: 'pending',
        verified_by: null,
        verified_date: null,
        notes: ''
      },
      created_at: new Date('2024-01-14T14:25:00Z')
    },
    {
      _id: 'service004',
      customer: {
        _id: 'cust004',
        name: 'Emily Davis',
        phone: '08022222222',
        address: '25C Ikeja Avenue',
        house_number: '25C',
        customer_type: 'commercial'
      },
      route: {
        _id: 'route001',
        name: 'Central Business District'
      },
      supervisor: {
        _id: 'super002',
        name: 'Maria Garcia'
      },
      service_date: new Date('2024-01-14T11:45:00Z'),
      service_month: new Date('2024-01-01T00:00:00Z'),
      before_photo: 'https://via.placeholder.com/400x300/16A085/ffffff?text=Before+Service',
      after_photo: 'https://via.placeholder.com/400x300/10b981/ffffff?text=After+Service',
      service_notes: 'Business premises serviced. All waste collected efficiently. Photos show proper completion.',
      service_status: 'serviced',
      verification: {
        status: 'verified',
        verified_by: { _id: 'admin001', name: 'Admin User' },
        verified_date: new Date('2024-01-14T16:30:00Z'),
        notes: 'Service properly completed. Photos clearly show before and after state.'
      },
      created_at: new Date('2024-01-14T11:50:00Z')
    },
    {
      _id: 'service005',
      customer: {
        _id: 'cust005',
        name: 'David Brown',
        phone: '08033333333',
        address: '30 Victoria Island Road',
        house_number: '30',
        customer_type: 'institutional'
      },
      route: {
        _id: 'route001',
        name: 'Central Business District'
      },
      supervisor: {
        _id: 'super001',
        name: 'James Wilson'
      },
      service_date: new Date('2024-01-13T16:30:00Z'),
      service_month: new Date('2024-01-01T00:00:00Z'),
      before_photo: 'https://via.placeholder.com/400x300/16A085/ffffff?text=Before+Service',
      after_photo: 'https://via.placeholder.com/400x300/ef4444/ffffff?text=Incomplete+Service',
      service_notes: 'Institutional service completed but area not properly cleaned.',
      service_status: 'serviced',
      verification: {
        status: 'rejected',
        verified_by: { _id: 'admin001', name: 'Admin User' },
        verified_date: new Date('2024-01-13T17:45:00Z'),
        notes: 'After photo shows incomplete service. Area not properly cleaned. Requires re-service.'
      },
      created_at: new Date('2024-01-13T16:35:00Z')
    }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterServices();
  }, [filters]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/');
        return;
      }
      setTimeout(() => {
        setServices(dummyServices);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/');
    }
  };

  const filterServices = () => {
    let filtered = [...dummyServices];

    if (filters.status !== 'all') {
      filtered = filtered.filter(service =>
        service.verification.status === filters.status
      );
    }

    if (filters.serviceType !== 'all') {
      filtered = filtered.filter(service =>
        service.service_status === filters.serviceType
      );
    }

    setServices(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getVerificationColor = (status) => {
    switch (status) {
      case 'verified': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getVerificationIcon = (status) => {
    switch (status) {
      case 'verified': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  const getServiceStatusColor = (status) => {
    switch (status) {
      case 'serviced': return '#10b981';
      case 'not_home': return '#f59e0b';
      case 'refused': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getCustomerTypeColor = (type) => {
    switch (type) {
      case 'residential': return '#3b82f6';
      case 'commercial': return '#8b5cf6';
      case 'institutional': return '#ec4899';
      default: return '#64748b';
    }
  };

  const handleVerifyService = async (status) => {
    setVerifying(true);

    try {
      setTimeout(() => {
        const updatedServices = services.map(service =>
          service._id === selectedService._id
            ? {
                ...service,
                verification: {
                  status,
                  verified_by: { _id: 'currentUser', name: user?.full_name || 'Current User' },
                  verified_date: new Date(),
                  notes: verificationNotes
                }
              }
            : service
        );

        setServices(updatedServices);
        setVerifying(false);
        setShowVerifyModal(false);
        setVerificationNotes('');

        Alert.alert(
          'Verification Complete',
          `Service has been ${status === 'verified' ? 'verified' : 'rejected'} successfully.`
        );
      }, 1000);

    } catch (error) {
      setVerifying(false);
      Alert.alert('Error', 'Failed to verify service');
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const ServiceCard = ({ service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => {
        setSelectedService(service);
        setShowDetails(true);
      }}
    >
      {/* Verification Status Badge */}
      <View style={[styles.verificationBadge, { backgroundColor: getVerificationColor(service.verification.status) }]}>
        <Ionicons name={getVerificationIcon(service.verification.status)} size={16} color="white" />
        <Text style={styles.verificationBadgeText}>
          {service.verification.status === 'verified' ? 'Verified' :
           service.verification.status === 'rejected' ? 'Rejected' : 'Pending Review'}
        </Text>
      </View>

      {/* Customer Header */}
      <View style={styles.cardHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{service.customer.name}</Text>
          <View style={styles.customerMeta}>
            <Text style={styles.customerPhone}>{service.customer.phone}</Text>
            <View style={[styles.typeBadge, { backgroundColor: getCustomerTypeColor(service.customer.customer_type) }]}>
              <Text style={styles.typeBadgeText}>{service.customer.customer_type}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.serviceStatusBadge, { backgroundColor: getServiceStatusColor(service.service_status) }]}>
          <Text style={styles.serviceStatusText}>
            {service.service_status === 'serviced' ? 'Serviced' :
             service.service_status === 'not_home' ? 'Not Home' : 'Refused'}
          </Text>
        </View>
      </View>

      {/* Service Details */}
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#64748b" />
          <Text style={styles.detailText}>{service.customer.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {new Date(service.service_date).toLocaleDateString()} •
            {new Date(service.service_date).toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color="#64748b" />
          <Text style={styles.detailText}>By: {service.supervisor.name}</Text>
        </View>
      </View>

      {/* Photos Preview */}
      <View style={styles.photosPreview}>
        <View style={styles.photoItem}>
          <Image source={{ uri: service.before_photo }} style={styles.photoThumbnail} />
          <Text style={styles.photoLabel}>Before</Text>
        </View>
        {service.after_photo && (
          <View style={styles.photoItem}>
            <Image source={{ uri: service.after_photo }} style={styles.photoThumbnail} />
            <Text style={styles.photoLabel}>After</Text>
          </View>
        )}
      </View>

      {/* Action Button for Pending Services */}
      {service.verification.status === 'pending' && (
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={() => {
            setSelectedService(service);
            setShowVerifyModal(true);
          }}
        >
          <Ionicons name="shield-checkmark" size={16} color="white" />
          <Text style={styles.verifyButtonText}>Verify Service</Text>
        </TouchableOpacity>
      )}

      {/* Verification Info for Verified/Rejected */}
      {service.verification.status !== 'pending' && service.verification.verified_by && (
        <View style={styles.verificationInfo}>
          <Text style={styles.verificationText}>
            {service.verification.status === 'verified' ? '✅ Verified' : '❌ Rejected'} by {service.verification.verified_by.name}
          </Text>
          <Text style={styles.verificationDate}>
            {new Date(service.verification.verified_date).toLocaleString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const ServiceDetailsModal = () => (
    <Modal
      visible={showDetails}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDetails(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.detailsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Service Details</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedService && (
            <ScrollView style={styles.detailsContent}>
              {/* Verification Status */}
              <View style={styles.detailSection}>
                <View style={[styles.verificationBadgeLarge, { backgroundColor: getVerificationColor(selectedService.verification.status) }]}>
                  <Ionicons name={getVerificationIcon(selectedService.verification.status)} size={24} color="white" />
                  <Text style={styles.verificationBadgeTextLarge}>
                    {selectedService.verification.status === 'verified' ? 'Service Verified' :
                     selectedService.verification.status === 'rejected' ? 'Service Rejected' : 'Pending Verification'}
                  </Text>
                </View>
              </View>

              {/* Customer Information */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Customer Information</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>{selectedService.customer.name}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{selectedService.customer.phone}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>{selectedService.customer.address}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <View style={[styles.typeBadge, { backgroundColor: getCustomerTypeColor(selectedService.customer.customer_type) }]}>
                      <Text style={styles.typeBadgeText}>{selectedService.customer.customer_type}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Service Information */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Service Information</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.serviceStatusBadge, { backgroundColor: getServiceStatusColor(selectedService.service_status) }]}>
                      <Text style={styles.serviceStatusText}>
                        {selectedService.service_status === 'serviced' ? 'Serviced' :
                         selectedService.service_status === 'not_home' ? 'Not Home' : 'Refused'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedService.service_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedService.service_date).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Supervisor</Text>
                    <Text style={styles.detailValue}>{selectedService.supervisor.name}</Text>
                  </View>
                </View>
              </View>

              {/* Service Photos */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Service Photos</Text>
                <View style={styles.photosSection}>
                  <View style={styles.photoContainer}>
                    <Text style={styles.photoLabel}>Before Service</Text>
                    <Image source={{ uri: selectedService.before_photo }} style={styles.photoLarge} />
                  </View>
                  {selectedService.after_photo && (
                    <View style={styles.photoContainer}>
                      <Text style={styles.photoLabel}>After Service</Text>
                      <Image source={{ uri: selectedService.after_photo }} style={styles.photoLarge} />
                    </View>
                  )}
                </View>
              </View>

              {/* Service Notes */}
              {selectedService.service_notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Service Notes</Text>
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesText}>{selectedService.service_notes}</Text>
                  </View>
                </View>
              )}

              {/* Verification Details */}
              {selectedService.verification.status !== 'pending' && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Verification Details</Text>
                  <View style={styles.verificationDetails}>
                    <View style={styles.verificationItem}>
                      <Text style={styles.verificationLabel}>Verified by:</Text>
                      <Text style={styles.verificationValue}>{selectedService.verification.verified_by.name}</Text>
                    </View>
                    <View style={styles.verificationItem}>
                      <Text style={styles.verificationLabel}>Verified on:</Text>
                      <Text style={styles.verificationValue}>
                        {new Date(selectedService.verification.verified_date).toLocaleString()}
                      </Text>
                    </View>
                    {selectedService.verification.notes && (
                      <View style={styles.verificationItem}>
                        <Text style={styles.verificationLabel}>Notes:</Text>
                        <Text style={styles.verificationValue}>{selectedService.verification.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Verify Action for Pending Services */}
              {selectedService.verification.status === 'pending' && (
                <View style={styles.detailSection}>
                  <TouchableOpacity
                    style={styles.verifyActionButton}
                    onPress={() => {
                      setShowDetails(false);
                      setShowVerifyModal(true);
                    }}
                  >
                    <Ionicons name="shield-checkmark" size={20} color="white" />
                    <Text style={styles.verifyActionButtonText}>Verify This Service</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const VerifyModal = () => (
    <Modal
      visible={showVerifyModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowVerifyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.verifyModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Verify Service</Text>
            <TouchableOpacity onPress={() => setShowVerifyModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedService && (
            <ScrollView style={styles.verifyContent}>
              <Text style={styles.verifyDescription}>
                Review the service details and photos to verify this service record.
              </Text>

              <View style={styles.customerSummary}>
                <Text style={styles.customerSummaryText}>
                  {selectedService.customer.name} • {selectedService.customer.address}
                </Text>
                <Text style={styles.serviceSummaryText}>
                  {selectedService.service_status === 'serviced' ? 'Serviced' :
                   selectedService.service_status === 'not_home' ? 'Not Home' : 'Refused'} •
                  {new Date(selectedService.service_date).toLocaleDateString()}
                </Text>
              </View>

              {/* Verification Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes about your verification decision..."
                  value={verificationNotes}
                  onChangeText={setVerificationNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Verification Actions */}
              <View style={styles.verificationActions}>
                <TouchableOpacity
                  style={[styles.verifyAction, styles.rejectAction]}
                  onPress={() => handleVerifyService('rejected')}
                  disabled={verifying}
                >
                  {verifying ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                      <Text style={styles.rejectActionText}>Reject Service</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.verifyAction, styles.approveAction]}
                  onPress={() => handleVerifyService('verified')}
                  disabled={verifying}
                >
                  {verifying ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.approveActionText}>Approve Service</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A085" />
          <Text style={styles.loadingText}>Loading services for verification...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Verify Services</Text>
            <Text style={styles.headerSubtitle}>Review and validate service records</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Stats Bar */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {services.filter(s => s.verification.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {services.filter(s => s.verification.status === 'verified').length}
            </Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {services.filter(s => s.verification.status === 'rejected').length}
            </Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filters}>
            {/* Verification Status Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterOptions}>
                {['all', 'pending', 'verified', 'rejected'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterOption, filters.status === status && styles.filterOptionSelected]}
                    onPress={() => handleFilterChange('status', status)}
                  >
                    <Text style={[styles.filterOptionText, filters.status === status && styles.filterOptionTextSelected]}>
                      {status === 'all' ? 'All' :
                       status === 'pending' ? 'Pending' :
                       status === 'verified' ? 'Verified' : 'Rejected'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Service Type Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Service Type</Text>
              <View style={styles.filterOptions}>
                {['all', 'serviced', 'not_home', 'refused'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterOption, filters.serviceType === type && styles.filterOptionSelected]}
                    onPress={() => handleFilterChange('serviceType', type)}
                  >
                    <Text style={[styles.filterOptionText, filters.serviceType === type && styles.filterOptionTextSelected]}>
                      {type === 'all' ? 'All' :
                       type === 'serviced' ? 'Serviced' :
                       type === 'not_home' ? 'Not Home' : 'Refused'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Services List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done" size={64} color="#cbd5e1" />
              <Text style={styles.emptyStateTitle}>No Services Found</Text>
              <Text style={styles.emptyStateText}>
                {filters.status === 'pending' ? 'All services have been verified!' :
                 'No services match your current filters.'}
              </Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <ServiceCard key={service._id} service={service} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <ServiceDetailsModal />
      <VerifyModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  // Header
  header: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  headerPlaceholder: {
    width: 40,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22,160,133,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16A085',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filters: {
    flexDirection: 'row',
    gap: 24,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionSelected: {
    backgroundColor: '#16A085',
    borderColor: '#16A085',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterOptionTextSelected: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    backgroundColor: 'white',
    borderRadius: 24,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  servicesList: {
    gap: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
  },
  verificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerPhone: {
    fontSize: 14,
    color: '#64748b',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  serviceStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  cardDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
  },
  photosPreview: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoItem: {
    alignItems: 'center',
  },
  photoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginBottom: 4,
  },
  photoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: '#16A085',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationInfo: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16A085',
  },
  verificationText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: 2,
  },
  verificationDate: {
    fontSize: 12,
    color: '#64748b',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 24,
    maxHeight: '85%',
  },
  verifyModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  detailsContent: {
    padding: 24,
  },
  verifyContent: {
    padding: 24,
  },
  detailSection: {
    marginBottom: 24,
  },
  verificationBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  verificationBadgeTextLarge: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  detailGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  photosSection: {
    gap: 16,
  },
  photoContainer: {
    gap: 8,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  photoLarge: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  notesContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  verificationDetails: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  verificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  verificationLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  verificationValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  verifyActionButton: {
    backgroundColor: '#16A085',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  verifyActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Verify Modal Styles
  verifyDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  customerSummary: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  customerSummaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  serviceSummaryText: {
    fontSize: 14,
    color: '#64748b',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  verificationActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  verifyAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  rejectAction: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  approveAction: {
    backgroundColor: '#16A085',
  },
  rejectActionText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  approveActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});