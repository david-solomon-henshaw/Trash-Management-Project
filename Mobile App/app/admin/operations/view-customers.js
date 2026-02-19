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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// import { API_BASE_URL } from '../../../config';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ViewCustomers() {
  const [customers, setCustomers] = useState([]);
  const [streets, setStreets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    customer_type: '',
    status: '',
    street: ''
  });
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
      
      const [customersRes, streetsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/customers/all`, { headers }),
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

  // Filter customers based on search and filters
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery) ||
                         customer.street?.streetName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !filters.customer_type || customer.customer_type === filters.customer_type;
    const matchesStatus = !filters.status || customer.status === filters.status;
    const matchesStreet = !filters.street || customer.street?._id === filters.street;

    return matchesSearch && matchesType && matchesStatus && matchesStreet;
  });

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

  const handleFilterSelect = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
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

  const clearFilters = () => {
    setFilters({
      customer_type: '',
      status: '',
      street: ''
    });
    setFilterModalVisible(false);
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
  };

  const DropdownModal = ({ visible, onClose, options, field, title }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.dropdownContent}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
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
                  <Ionicons name="checkmark" size={20} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const FilterOption = ({ title, options, field, selectedValue }) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <View style={styles.filterOptions}>
        {options.map(option => (
          <TouchableOpacity
            key={option.value || option._id}
            style={[
              styles.filterOption,
              selectedValue === (option.value || option._id) && styles.filterOptionSelected
            ]}
            onPress={() => handleFilterSelect(field, option.value || option._id)}
          >
            <Text style={[
              styles.filterOptionText,
              selectedValue === (option.value || option._id) && styles.filterOptionTextSelected
            ]}>
              {option.label || option.streetName || option.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#10b981" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10b981" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Customer Directory</Text>
            <Text style={styles.headerSubtitle}>
              {filteredCustomers.length} of {customers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color="white" />
            {(filters.customer_type || filters.status || filters.street) && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers by name, phone, or street..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Active Filters */}
      {(filters.customer_type || filters.status || filters.street) && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersRow}>
              {filters.customer_type && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>
                    Type: {customerTypes.find(t => t.value === filters.customer_type)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, customer_type: '' }))}>
                    <Ionicons name="close" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.status && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>
                    Status: {statusOptions.find(s => s.value === filters.status)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, status: '' }))}>
                    <Ionicons name="close" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.street && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>
                    Street: {streets.find(s => s._id === filters.street)?.streetName}
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, street: '' }))}>
                    <Ionicons name="close" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        <View style={styles.customersContainer}>
          {filteredCustomers.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No customers found</Text>
              <Text style={styles.emptyText}>
                {searchQuery || filters.customer_type || filters.status || filters.street 
                  ? 'Try adjusting your search or filters' 
                  : 'Add your first customer to get started'
                }
              </Text>
              {(searchQuery || filters.customer_type || filters.status || filters.street) ? (
                <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
                  <Text style={styles.emptyButtonText}>Clear Search & Filters</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/admin/operations/add-customer')}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.emptyButtonText}>Add Customer</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredCustomers.map((customer) => (
              <TouchableOpacity 
                key={customer._id} 
                style={styles.customerCard}
                onPress={() => handleEditCustomer(customer)}
              >
                <View style={styles.customerHeader}>
                  <View style={styles.customerAvatar}>
                    <Ionicons 
                      name={customer.customer_type === 'residential' ? 'home' : 'business'} 
                      size={24} 
                      color="white" 
                    />
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.customerPhone}>{customer.phone}</Text>
                  </View>
                  <View style={[
                    styles.statusIndicator,
                    customer.status === 'active' ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Ionicons 
                      name={customer.status === 'active' ? 'checkmark' : 'close'} 
                      size={16} 
                      color="white" 
                    />
                  </View>
                </View>

                <View style={styles.customerDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#64748b" />
                    <Text style={styles.detailText}>
                      {customer.house_number}, {customer.street?.streetName || customer.street?.name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="business-outline" size={16} color="#64748b" />
                    <Text style={styles.detailText}>
                      {customer.customer_type === 'residential' 
                        ? customer.apartment_type?.name || 'Residential'
                        : customer.commercial_subtype?.name || 'Commercial'
                      }
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={[
                    styles.typeBadge,
                    customer.customer_type === 'residential' ? styles.typeResidential : styles.typeCommercial
                  ]}>
                    <Text style={styles.typeBadgeText}>
                      {customer.customer_type.charAt(0).toUpperCase() + customer.customer_type.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.actionIcons}>
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditCustomer(customer);
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(customer);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/admin/customer/add-customer')}
      >
        <Ionicons name="add" size={24} color="white" />
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
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Customer</Text>
                <Text style={styles.modalSubtitle}>Update customer information</Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {hasChanges() && (
              <View style={styles.changeIndicator}>
                <Ionicons name="alert-circle" size={16} color="#92400E" />
                <Text style={styles.changeIndicatorText}>Unsaved changes</Text>
              </View>
            )}

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    value={editFormData.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    value={editFormData.phone}
                    onChangeText={(text) => handleInputChange('phone', text)}
                    keyboardType="phone-pad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => toggleDropdown('status')}
                >
                  <Text style={styles.dropdownTextSelected}>
                    {editFormData.status_label || 'Select Status'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </ScrollView>

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
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="white" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Dropdown Modals */}
      <DropdownModal
        visible={showDropdown.status}
        onClose={() => toggleDropdown('status')}
        options={statusOptions}
        field="status"
        title="Select Status"
      />

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Customers</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <FilterOption
                title="Customer Type"
                options={customerTypes}
                field="customer_type"
                selectedValue={filters.customer_type}
              />

              <FilterOption
                title="Status"
                options={statusOptions}
                field="status"
                selectedValue={filters.status}
              />

              <FilterOption
                title="Street"
                options={streets}
                field="street"
                selectedValue={filters.street}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={clearFilters}>
                <Text style={styles.cancelButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={applyFilters}>
                <Text style={styles.saveButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#10b981',
    paddingBottom: 16,
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
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginHorizontal: 12,
  },
  activeFilters: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  clearFiltersButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFiltersText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  customersContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  // New Card Design
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#64748b',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: '#10b981',
  },
  statusInactive: {
    backgroundColor: '#ef4444',
  },
  customerDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeResidential: {
    backgroundColor: '#dbeafe',
  },
  typeCommercial: {
    backgroundColor: '#fce7f3',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
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
  filterModalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeIndicator: {
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  changeIndicatorText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
  },
  modalContent: {
    padding: 24,
  },
  // Filter Styles
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: 'white',
  },
  formGroup: {
    marginBottom: 20,
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
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownTextSelected: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.5,
  },
  // Dropdown Modal Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dropdownContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1e293b',
  },
});