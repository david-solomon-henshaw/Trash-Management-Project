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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ServiceHistory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [streets, setStreets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  
  // Selection states
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Dropdown states
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // DUMMY DATA - Replace with actual API calls
  const dummyStreets = [
    { _id: 'street001', name: 'Lagos Street', details: 'Main commercial street' },
    { _id: 'street002', name: 'Ikeja Avenue', details: 'Residential area' },
    { _id: 'street003', name: 'Victoria Island Road', details: 'Business district' },
    { _id: 'street004', name: 'Abuja Close', details: 'Quiet residential' },
  ];

  const dummyCustomers = [
    {
      _id: 'cust001', name: 'John Smith', phone: '08012345678', 
      address: '12A Lagos Street', house_number: '12A', 
      customer_type: 'residential', street: 'street001',
      status: 'active'
    },
    {
      _id: 'cust002', name: 'Sarah Johnson', phone: '08087654321', 
      address: '15B Lagos Street', house_number: '15B', 
      customer_type: 'commercial', street: 'street001',
      status: 'active'
    },
    {
      _id: 'cust003', name: 'Mike Wilson', phone: '08011111111', 
      address: '20 Ikeja Avenue', house_number: '20', 
      customer_type: 'residential', street: 'street002',
      status: 'active'
    },
    {
      _id: 'cust004', name: 'Emily Davis', phone: '08022222222', 
      address: '25C Ikeja Avenue', house_number: '25C', 
      customer_type: 'commercial', street: 'street002',
      status: 'active'
    },
    {
      _id: 'cust005', name: 'David Brown', phone: '08033333333', 
      address: '30 Victoria Island Road', house_number: '30', 
      customer_type: 'institutional', street: 'street003',
      status: 'active'
    },
  ];

  const dummyServices = [
    {
      _id: 'service001', customer: 'cust001', 
      route: { _id: 'route001', name: 'Central Route' },
      supervisor: { _id: 'super001', name: 'James Wilson' },
      service_date: new Date('2024-01-15T09:30:00Z'),
      service_month: new Date('2024-01-01T00:00:00Z'),
      before_photo: 'https://via.placeholder.com/300x200/06b6d4/ffffff?text=Before',
      after_photo: 'https://via.placeholder.com/300x200/10b981/ffffff?text=After',
      service_notes: 'Regular service completed. Area was clean before service.',
      service_status: 'serviced'
    },
    {
      _id: 'service002', customer: 'cust001',
      route: { _id: 'route001', name: 'Central Route' },
      supervisor: { _id: 'super001', name: 'James Wilson' },
      service_date: new Date('2024-01-08T10:15:00Z'),
      service_month: new Date('2024-01-01T00:00:00Z'),
      before_photo: 'https://via.placeholder.com/300x200/06b6d4/ffffff?text=Before',
      after_photo: null,
      service_notes: 'Customer was not available at time of service.',
      service_status: 'not_home'
    },
    {
      _id: 'service003', customer: 'cust002',
      route: { _id: 'route001', name: 'Central Route' },
      supervisor: { _id: 'super002', name: 'Maria Garcia' },
      service_date: new Date('2024-01-15T11:00:00Z'),
      service_month: new Date('2024-01-01T00:00:00Z'),
      before_photo: 'https://via.placeholder.com/300x200/06b6d4/ffffff?text=Before',
      after_photo: 'https://via.placeholder.com/300x200/10b981/ffffff?text=After',
      service_notes: 'Business premises serviced efficiently.',
      service_status: 'serviced'
    },
    {
      _id: 'service004', customer: 'cust003',
      route: { _id: 'route002', name: 'West Route' },
      supervisor: { _id: 'super001', name: 'James Wilson' },
      service_date: new Date('2024-01-14T14:20:00Z'),
      service_month: new Date('2024-01-01T00:00:00Z'),
      before_photo: 'https://via.placeholder.com/300x200/06b6d4/ffffff?text=Before',
      after_photo: null,
      service_notes: 'Customer refused service.',
      service_status: 'refused'
    },
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/Login');
        return;
      }
      // Simulate API calls
      setTimeout(() => {
        setStreets(dummyStreets);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/Login');
    }
  };

  const handleStreetSelect = (street) => {
    setSelectedStreet(street);
    setSelectedCustomer(null);
    setServices([]);
    setShowStreetDropdown(false);
    
    // Filter customers for selected street
    const streetCustomers = dummyCustomers.filter(customer => 
      customer.street === street._id
    );
    setCustomers(streetCustomers);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    
    // Filter services for selected customer
    const customerServices = dummyServices.filter(service =>
      service.customer === customer._id
    );
    setServices(customerServices);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowServiceDetails(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'serviced': return '#10b981';
      case 'not_home': return '#f59e0b';
      case 'refused': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'serviced': return 'checkmark-circle';
      case 'not_home': return 'home-outline';
      case 'refused': return 'close-circle';
      default: return 'help-circle';
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

  const handleBackPress = () => {
    router.back();
  };

  const DropdownModal = ({ visible, onClose, title, children }) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {children}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const ServiceDetailsModal = () => (
    <Modal
      visible={showServiceDetails}
      transparent
      animationType="slide"
      onRequestClose={() => setShowServiceDetails(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.detailsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Service Details</Text>
            <TouchableOpacity onPress={() => setShowServiceDetails(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedService && (
            <ScrollView style={styles.detailsContent}>
              {/* Service Status */}
              <View style={styles.detailSection}>
                <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedService.service_status) }]}>
                  <Ionicons name={getStatusIcon(selectedService.service_status)} size={24} color="white" />
                  <Text style={styles.statusBadgeTextLarge}>
                    {selectedService.service_status === 'serviced' ? 'Serviced' :
                     selectedService.service_status === 'not_home' ? 'Not Home' : 'Refused Service'}
                  </Text>
                </View>
              </View>

              {/* Service Information */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Service Information</Text>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={20} color="#64748b" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Service Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedService.service_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time" size={20} color="#64748b" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Service Time</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedService.service_date).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="person" size={20} color="#64748b" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Supervisor</Text>
                    <Text style={styles.detailValue}>{selectedService.supervisor.name}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="map" size={20} color="#64748b" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Route</Text>
                    <Text style={styles.detailValue}>{selectedService.route.name}</Text>
                  </View>
                </View>
              </View>

              {/* Photos */}
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
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#06b6d4" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06b6d4" />
          <Text style={styles.loadingText}>Loading service history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06b6d4" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service History</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
          {/* Selection Instructions */}
          <View style={styles.instructions}>
            <Ionicons name="information-circle" size={20} color="#06b6d4" />
            <Text style={styles.instructionsText}>
              Select a street and customer to view their service history
            </Text>
          </View>

          {/* Street Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Street</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowStreetDropdown(true)}
            >
              <Text style={selectedStreet ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                {selectedStreet ? selectedStreet.name : 'Choose a street'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Customer Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Customer</Text>
            <TouchableOpacity 
              style={[styles.dropdownButton, !selectedStreet && styles.dropdownDisabled]}
              onPress={() => selectedStreet && setShowCustomerDropdown(true)}
              disabled={!selectedStreet}
            >
              <Text style={selectedCustomer ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.house_number})` : 'Choose a customer'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={selectedStreet ? "#64748b" : "#cbd5e1"} />
            </TouchableOpacity>
          </View>

          {/* Selected Customer Info */}
          {selectedCustomer && (
            <View style={styles.customerInfoCard}>
              <View style={styles.customerHeader}>
                <Ionicons name="person-circle" size={24} color="#06b6d4" />
                <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                <View style={[styles.typeBadge, { backgroundColor: getCustomerTypeColor(selectedCustomer.customer_type) }]}>
                  <Text style={styles.typeBadgeText}>{selectedCustomer.customer_type}</Text>
                </View>
              </View>
              <View style={styles.customerDetails}>
                <Text style={styles.customerDetail}>📞 {selectedCustomer.phone}</Text>
                <Text style={styles.customerDetail}>🏠 {selectedCustomer.address}</Text>
                <Text style={styles.customerDetail}>📅 Active Customer</Text>
              </View>
            </View>
          )}

          {/* Service History List */}
          {selectedCustomer && (
            <View style={styles.servicesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Service History</Text>
                <Text style={styles.serviceCount}>{services.length} services found</Text>
              </View>

              {services.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyStateText}>No service history found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    This customer hasn't had any services recorded yet.
                  </Text>
                </View>
              ) : (
                <View style={styles.servicesList}>
                  {services.map((service) => (
                    <TouchableOpacity
                      key={service._id}
                      style={styles.serviceCard}
                      onPress={() => handleServiceSelect(service)}
                    >
                      <View style={styles.serviceHeader}>
                        <View style={styles.serviceDate}>
                          <Text style={styles.serviceDay}>
                            {new Date(service.service_date).getDate()}
                          </Text>
                          <Text style={styles.serviceMonth}>
                            {new Date(service.service_date).toLocaleDateString('en', { month: 'short' })}
                          </Text>
                        </View>
                        <View style={styles.serviceInfo}>
                          <Text style={styles.serviceTime}>
                            {new Date(service.service_date).toLocaleTimeString()}
                          </Text>
                          <Text style={styles.serviceSupervisor}>
                            By {service.supervisor.name}
                          </Text>
                        </View>
                        <View style={[styles.serviceStatus, { backgroundColor: getStatusColor(service.service_status) }]}>
                          <Ionicons name={getStatusIcon(service.service_status)} size={16} color="white" />
                        </View>
                      </View>
                      
                      <View style={styles.serviceDetails}>
                        <Text style={styles.serviceRoute}>{service.route.name}</Text>
                        {service.service_notes && (
                          <Text style={styles.serviceNotes} numberOfLines={2}>
                            {service.service_notes}
                          </Text>
                        )}
                      </View>

                      <View style={styles.servicePhotos}>
                        <View style={styles.photoBadge}>
                          <Ionicons name="camera" size={12} color="#64748b" />
                          <Text style={styles.photoBadgeText}>Before</Text>
                        </View>
                        {service.after_photo && (
                          <View style={styles.photoBadge}>
                            <Ionicons name="camera" size={12} color="#64748b" />
                            <Text style={styles.photoBadgeText}>After</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dropdown Modals */}
      <DropdownModal
        visible={showStreetDropdown}
        onClose={() => setShowStreetDropdown(false)}
        title="Select Street"
      >
        {streets.map((street) => (
          <TouchableOpacity
            key={street._id}
            style={styles.modalItem}
            onPress={() => handleStreetSelect(street)}
          >
            <View style={styles.streetItem}>
              <Ionicons name="location" size={20} color="#06b6d4" />
              <View style={styles.streetInfo}>
                <Text style={styles.modalItemText}>{street.name}</Text>
                <Text style={styles.modalItemSubtext}>{street.details}</Text>
              </View>
            </View>
            {selectedStreet?._id === street._id && (
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            )}
          </TouchableOpacity>
        ))}
      </DropdownModal>

      <DropdownModal
        visible={showCustomerDropdown}
        onClose={() => setShowCustomerDropdown(false)}
        title="Select Customer"
      >
        {customers.map((customer) => (
          <TouchableOpacity
            key={customer._id}
            style={styles.modalItem}
            onPress={() => handleCustomerSelect(customer)}
          >
            <View style={styles.customerModalItem}>
              <Ionicons 
                name={customer.customer_type === 'commercial' ? 'business' : 'home'} 
                size={20} 
                color="#06b6d4" 
              />
              <View style={styles.customerModalInfo}>
                <Text style={styles.modalItemText}>
                  {customer.name} • House {customer.house_number}
                </Text>
                <Text style={styles.modalItemSubtext}>
                  {customer.phone} • {customer.customer_type}
                </Text>
              </View>
            </View>
            {selectedCustomer?._id === customer._id && (
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            )}
          </TouchableOpacity>
        ))}
      </DropdownModal>

      <ServiceDetailsModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#06b6d4',
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  dropdownButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dropdownDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  dropdownTextSelected: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  dropdownTextPlaceholder: {
    fontSize: 16,
    color: '#64748b',
  },
  customerInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  customerDetails: {
    gap: 8,
  },
  customerDetail: {
    fontSize: 14,
    color: '#64748b',
  },
  servicesSection: {
    marginTop: 8,
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
    color: '#1e293b',
  },
  serviceCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  serviceDate: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 8,
    minWidth: 50,
  },
  serviceDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06b6d4',
  },
  serviceMonth: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  serviceSupervisor: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  serviceStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceDetails: {
    marginBottom: 12,
  },
  serviceRoute: {
    fontSize: 14,
    color: '#06b6d4',
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceNotes: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  servicePhotos: {
    flexDirection: 'row',
    gap: 8,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  photoBadgeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  streetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  streetInfo: {
    flex: 1,
  },
  customerModalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  customerModalInfo: {
    flex: 1,
  },
  // Service Details Modal
  detailsModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    maxHeight: '80%',
  },
  detailsContent: {
    padding: 24,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusBadgeTextLarge: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
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
});