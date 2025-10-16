import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ViewCustomers() {
  const [customers, setCustomers] = useState([]);
  const [streets, setStreets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    house_number: '',
    street: '',
    customer_type: '',
    apartment_type: '',
    commercial_subtype: '',
    status: 'active'
  });

  const [showDropdown, setShowDropdown] = useState({
    street: false,
    customer_type: false,
    apartment_type: false,
    commercial_subtype: false,
    status: false
  });

  const apartmentTypes = [
    { id: '1', name: 'Studio' },
    { id: '2', name: '1 Bedroom' },
    { id: '3', name: '2 Bedroom' },
    { id: '4', name: '3 Bedroom' },
    { id: '5', name: 'Penthouse' }
  ];

  const commercialSubtypes = [
    { id: '1', name: 'Restaurant' },
    { id: '2', name: 'Retail Store' },
    { id: '3', name: 'Office' },
    { id: '4', name: 'Hotel' },
    { id: '5', name: 'Warehouse' }
  ];

  const customerTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'non-active', label: 'Non-Active' }
  ];

  useEffect(() => {
    checkAuth();
    fetchCustomers();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/Login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/Login');
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch customers and streets
      const [customersRes, streetsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/customer/all`, { headers }),
        axios.get(`${API_BASE_URL}/api/street/all`, { headers })
      ]);
      
      setCustomers(customersRes.data.customers || []);
      setStreets(streetsRes.data.streets || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch customers');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setEditFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      address: customer.address,
      house_number: customer.house_number,
      street: customer.street._id || customer.street,
      street_label: customer.street.streetName || customer.street.name,
      customer_type: customer.customer_type,
      customer_type_label: customer.customer_type.charAt(0).toUpperCase() + customer.customer_type.slice(1),
      apartment_type: customer.apartment_type || '',
      apartment_type_label: customer.apartment_type?.name || '',
      commercial_subtype: customer.commercial_subtype || '',
      commercial_subtype_label: customer.commercial_subtype?.name || '',
      status: customer.status,
      status_label: customer.status.charAt(0).toUpperCase() + customer.status.slice(1)
    });
    setEditModalVisible(true);
  };

  const handleCloseModal = () => {
    if (selectedCustomer && hasChanges()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: resetModal
          },
        ]
      );
    } else {
      resetModal();
    }
  };

  const resetModal = () => {
    setEditModalVisible(false);
    setSelectedCustomer(null);
    setEditFormData({
      name: '', email: '', phone: '', address: '', house_number: '',
      street: '', customer_type: '', apartment_type: '',
      commercial_subtype: '', status: 'active'
    });
    setShowDropdown({
      street: false, customer_type: false, apartment_type: false,
      commercial_subtype: false, status: false
    });
  };

  const handleInputChange = (field, value) => {
    setEditFormData({ ...editFormData, [field]: value });
  };

  const toggleDropdown = (field) => {
    setShowDropdown(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [field]: !prev[field]
    }));
  };

  const handleSelect = (field, value, label) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
      [`${field}_label`]: label
    }));
    setShowDropdown(prev => ({ ...prev, [field]: false }));
  };

  const hasChanges = () => {
    if (!selectedCustomer) return false;
    return (
      editFormData.name !== selectedCustomer.name ||
      editFormData.email !== (selectedCustomer.email || '') ||
      editFormData.phone !== selectedCustomer.phone ||
      editFormData.address !== selectedCustomer.address ||
      editFormData.house_number !== selectedCustomer.house_number ||
      editFormData.street !== (selectedCustomer.street._id || selectedCustomer.street) ||
      editFormData.status !== selectedCustomer.status
    );
  };

  const handleSaveEdit = async () => {
    if (!hasChanges()) {
      Alert.alert('No Changes', 'No changes were made to the customer');
      return;
    }

    setSaving(true);
    
    // TODO: API call will be added here
    setTimeout(() => {
      Alert.alert('Ready', 'API integration pending - edit functionality ready');
      setSaving(false);
    }, 1000);
  };

  const handleDeleteCustomer = (customer) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete "${customer.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(customer._id),
        },
      ]
    );
  };

  const confirmDelete = async (customerId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/customer/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Success', 'Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete customer');
      console.error('Delete error:', error);
    }
  };

  const DropdownModal = ({ visible, onClose, options, field, title }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.dropdownContent}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.dropdownList}>
            {options.map(option => (
              <TouchableOpacity
                key={option.id || option._id || option.value}
                style={styles.dropdownItem}
                onPress={() => handleSelect(
                  field,
                  option.id || option._id || option.value,
                  option.name || option.streetName || option.label
                )}
              >
                <Text style={styles.dropdownItemText}>
                  {option.name || option.streetName || option.label}
                </Text>
                {editFormData[field] === (option.id || option._id || option.value) && (
                  <Ionicons name="checkmark" size={20} color="#2E8B57" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>All Customers</Text>
            <Text style={styles.headerSubtitle}>
              {customers.length} customer{customers.length !== 1 ? 's' : ''} registered
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E8B57']} />
        }
      >
        <View style={styles.customersContainer}>
          {customers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No customers found</Text>
              <Text style={styles.emptyText}>Add your first customer to get started</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/ceo/customer/add-customer')}
              >
                <Text style={styles.emptyButtonText}>+ Add Customer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            customers.map((customer) => (
              <View key={customer._id} style={styles.customerCard}>
                <View style={styles.customerHeader}>
                  <View style={styles.customerIcon}>
                    <Ionicons 
                      name={customer.customer_type === 'residential' ? 'home' : 'business'} 
                      size={24} 
                      color="#2E8B57" 
                    />
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <View style={styles.customerDetails}>
                      <Ionicons name="call-outline" size={14} color="#64748B" />
                      <Text style={styles.customerPhone}>{customer.phone}</Text>
                    </View>
                    <View style={styles.customerDetails}>
                      <Ionicons name="location-outline" size={14} color="#64748B" />
                      <Text style={styles.customerAddress}>
                        {customer.house_number}, {customer.street?.streetName || customer.street?.name}
                      </Text>
                    </View>
                    <View style={styles.badgeContainer}>
                      <View style={[
                        styles.badge,
                        customer.customer_type === 'residential' ? styles.residentialBadge : styles.commercialBadge
                      ]}>
                        <Text style={styles.badgeText}>
                          {customer.customer_type.charAt(0).toUpperCase() + customer.customer_type.slice(1)}
                        </Text>
                      </View>
                      <View style={[
                        styles.badge,
                        customer.status === 'active' ? styles.activeBadge : styles.inactiveBadge
                      ]}>
                        <Text style={styles.badgeText}>
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleEditCustomer(customer)}
                  >
                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteCustomer(customer)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/ceo/customer/add-customer')}
        accessibilityLabel="Add new customer"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Customer</Text>
                <Text style={styles.modalSubtitle}>Update customer information</Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Change Indicator */}
            {hasChanges() && (
              <View style={styles.changeIndicator}>
                <Ionicons name="alert-circle" size={16} color="#92400E" />
                <Text style={styles.changeIndicatorText}>Unsaved changes</Text>
              </View>
            )}

            {/* Modal Content */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    value={editFormData.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* Phone Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    value={editFormData.phone}
                    onChangeText={(text) => handleInputChange('phone', text)}
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* Status Dropdown */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Status *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => toggleDropdown('status')}
                >
                  <Text style={[styles.dropdownText, styles.dropdownTextSelected]}>
                    {editFormData.status_label || 'Active'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  (saving || !hasChanges()) && styles.disabledButton
                ]}
                onPress={handleSaveEdit}
                disabled={saving || !hasChanges()}
              >
                <Text style={[
                  styles.saveButtonText,
                  (saving || !hasChanges()) && styles.disabledButtonText
                ]}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Dropdown Modals for Edit */}
      <DropdownModal
        visible={showDropdown.status}
        onClose={() => toggleDropdown('status')}
        options={statusOptions}
        field="status"
        title="Select Status"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingBottom: 24,
  },
  headerContent: {
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
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
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
  content: {
    flex: 1,
  },
  customersContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  customerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  customerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  customerPhone: {
    fontSize: 13,
    color: '#64748B',
  },
  customerAddress: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  residentialBadge: {
    backgroundColor: '#DBEAFE',
  },
  commercialBadge: {
    backgroundColor: '#FCE7F3',
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editBtnText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeIndicator: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  changeIndicatorText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    maxHeight: '50%',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
  dropdownTextSelected: {
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2E8B57',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#F3F4F6',
  },
  // Dropdown Modal Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dropdownContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
});