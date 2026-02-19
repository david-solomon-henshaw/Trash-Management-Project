import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { API_BASE_URL } from '../../config';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AddCustomerForm() {
  const router = useRouter();
  const [streets, setStreets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apartmentTypes, setApartmentTypes] = useState([]);
  const [commercialSubtypes, setCommercialSubtypes] = useState([]);
  const [institutionalSubtypes, setInstitutionalSubtypes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    house_number: '',
    street: '',
    customer_type: '',
    apartment_type: '',
    commercial_subtype: '',
    institutional_subtype: '',
    status: 'active'
  });

  const [showDropdown, setShowDropdown] = useState({
    street: false,
    customer_type: false,
    apartment_type: false,
    commercial_subtype: false,
    institutional_subtype: false,
    status: false
  });

  useEffect(() => {
    checkAuth();
    fetchData();
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

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch streets
      const streetData = await axios.get(`${API_BASE_URL}/api/street/all`, { headers });
      setStreets(streetData.data.streets || []);

      // Fetch apartment types
      const apartmentTypeData = await axios.get(`${API_BASE_URL}/api/apartment-types`, { headers });
      setApartmentTypes(apartmentTypeData.data.apartmentTypes || []);

      // Fetch commercial subtypes
      const commercialSubtypeData = await axios.get(`${API_BASE_URL}/api/commercial-subtypes`, { headers });
      setCommercialSubtypes(commercialSubtypeData.data.commercialSubtypes || []);

      // Fetch institutional subtypes
      const institutionalSubtypeData = await axios.get(`${API_BASE_URL}/api/institutional-subtypes`, { headers });
      setInstitutionalSubtypes(institutionalSubtypeData.data.institutionalSubtypes || []);

    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const customerTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'institutional', label: 'Institutional' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'non-active', label: 'Non-Active' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value,
      };
      // Update address if house_number or street_label changes
      if (field === 'house_number') {
        newFormData.address = `${value} ${prev.street_label || ''}`.trim();
      }
      return newFormData;
    });
  };

  const toggleDropdown = (field) => {
    setShowDropdown(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [field]: !prev[field]
    }));
  };

  const handleSelect = (field, value, label) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value,
        [`${field}_label`]: label,
      };
      // Update address if street is selected
      if (field === 'street') {
        newFormData.address = `${prev.house_number} ${label || ''}`.trim();
      }
      return newFormData;
    });
    setShowDropdown(prev => ({ ...prev, [field]: false }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return false;
    }
    if (!formData.street) {
      Alert.alert('Validation Error', 'Street is required');
      return false;
    }
    if (!formData.house_number.trim()) {
      Alert.alert('Validation Error', 'House number is required');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Validation Error', 'Full address is required');
      return false;
    }
    if (!formData.customer_type) {
      Alert.alert('Validation Error', 'Customer type is required');
      return false;
    }
    if (formData.customer_type === 'residential' && !formData.apartment_type) {
      Alert.alert('Validation Error', 'Apartment type is required for residential customers');
      return false;
    }
    if (formData.customer_type === 'commercial' && !formData.commercial_subtype) {
      Alert.alert('Validation Error', 'Business type is required for commercial customers');
      return false;
    }
    if (formData.customer_type === 'institutional' && !formData.institutional_subtype) {
      Alert.alert('Validation Error', 'Institutional type is required for institutional customers');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        house_number: formData.house_number,
        street: formData.street,
        customer_type: formData.customer_type,
        apartment_type: formData.apartment_type,
        commercial_subtype: formData.commercial_subtype,
        institutional_subtype: formData.institutional_subtype,
        status: formData.status,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/customers/create`,
        payload,
        { headers }
      );

      Alert.alert('Success', 'Customer created successfully!');
      router.back();

    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    const hasData = Object.values(formData).some(value =>
      value !== '' && value !== 'active'
    );

    if (hasData) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', onPress: () => router.back(), style: 'destructive' },
        ]
      );
    } else {
      router.back();
    }
  };

  const DropdownModal = ({ visible, onClose, options, field, title }) => (
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
            {options.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyStateText}>No options available</Text>
              </View>
            ) : (
              options.map(option => (
                <TouchableOpacity
                  key={option.id || option._id || option.value}
                  style={styles.modalItem}
                  onPress={() => handleSelect(
                    field,
                    option.id || option._id || option.value,
                    option.name || option.streetName || option.label
                  )}
                >
                  <Text style={styles.modalItemText}>
                    {option.name || option.streetName || option.label}
                  </Text>
                  {formData[field] === (option.id || option._id || option.value) && (
                    <Ionicons name="checkmark" size={20} color="#10b981" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#10b981" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading form data...</Text>
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
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Add New Customer</Text>
            <Text style={styles.headerSubtitle}>Register a new customer account</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="person-add" size={24} color="white" />
          </View>
        </View>
      </View>

      {/* Form */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Personal Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="person-outline" size={16} color="#64748b" />
                <Text style={styles.label}>
                  Full Name <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="mail-outline" size={16} color="#64748b" />
                <Text style={styles.label}>Email Address</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="call-outline" size={16} color="#64748b" />
                <Text style={styles.label}>
                  Phone Number <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Address Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Address Information</Text>
            </View>

            {/* Street Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="pin" size={16} color="#64748b" />
                <Text style={styles.label}>
                  Street <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => toggleDropdown('street')}
              >
                <Text style={[styles.dropdownText, formData.street_label && styles.dropdownTextSelected]}>
                  {formData.street_label || 'Select street'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* House Number */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="home-outline" size={16} color="#64748b" />
                <Text style={styles.label}>
                  House Number <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter house number"
                value={formData.house_number}
                onChangeText={(value) => handleInputChange('house_number', value)}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Full Address */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="business-outline" size={16} color="#64748b" />
                <Text style={styles.label}>
                  Full Address <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Full address will be generated automatically"
                value={formData.address}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#94a3b8"
                editable={false}
              />
            </View>
          </View>

          {/* Customer Type Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Customer Type</Text>
            </View>

            {/* Customer Type Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="layers-outline" size={16} color="#64748b" />
                <Text style={styles.label}>
                  Type <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => toggleDropdown('customer_type')}
              >
                <Text style={[styles.dropdownText, formData.customer_type_label && styles.dropdownTextSelected]}>
                  {formData.customer_type_label || 'Select customer type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Apartment Type - Only for Residential */}
            {formData.customer_type === 'residential' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="bed-outline" size={16} color="#64748b" />
                  <Text style={styles.label}>
                    Apartment Type <Text style={styles.required}>*</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => toggleDropdown('apartment_type')}
                >
                  <Text style={[styles.dropdownText, formData.apartment_type_label && styles.dropdownTextSelected]}>
                    {formData.apartment_type_label || 'Select apartment type'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            )}

            {/* Commercial Subtype - Only for Commercial */}
            {formData.customer_type === 'commercial' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="storefront-outline" size={16} color="#64748b" />
                  <Text style={styles.label}>
                    Business Type <Text style={styles.required}>*</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => toggleDropdown('commercial_subtype')}
                >
                  <Text style={[styles.dropdownText, formData.commercial_subtype_label && styles.dropdownTextSelected]}>
                    {formData.commercial_subtype_label || 'Select business type'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            )}

            {/* Institutional Subtype - Only for Institutional */}
            {formData.customer_type === 'institutional' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="school-outline" size={16} color="#64748b" />
                  <Text style={styles.label}>
                    Institutional Type <Text style={styles.required}>*</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => toggleDropdown('institutional_subtype')}
                >
                  <Text style={[styles.dropdownText, formData.institutional_subtype_label && styles.dropdownTextSelected]}>
                    {formData.institutional_subtype_label || 'Select institutional type'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            )}

            {/* Status Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="flag-outline" size={16} color="#64748b" />
                <Text style={styles.label}>
                  Status <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => toggleDropdown('status')}
              >
                <Text style={[styles.dropdownText, styles.dropdownTextSelected]}>
                  {formData.status_label || 'Active'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={submitting}
        >
          <Ionicons name="close" size={20} color="#64748b" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.submitButtonText}>Create Customer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Dropdown Modals */}
      <DropdownModal
        visible={showDropdown.street}
        onClose={() => toggleDropdown('street')}
        options={streets}
        field="street"
        title="Select Street"
      />
      <DropdownModal
        visible={showDropdown.customer_type}
        onClose={() => toggleDropdown('customer_type')}
        options={customerTypes}
        field="customer_type"
        title="Select Customer Type"
      />
      <DropdownModal
        visible={showDropdown.apartment_type}
        onClose={() => toggleDropdown('apartment_type')}
        options={apartmentTypes}
        field="apartment_type"
        title="Select Apartment Type"
      />
      <DropdownModal
        visible={showDropdown.commercial_subtype}
        onClose={() => toggleDropdown('commercial_subtype')}
        options={commercialSubtypes}
        field="commercial_subtype"
        title="Select Business Type"
      />
      <DropdownModal
        visible={showDropdown.institutional_subtype}
        onClose={() => toggleDropdown('institutional_subtype')}
        options={institutionalSubtypes}
        field="institutional_subtype"
        title="Select Institutional Type"
      />
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
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  inputGroup: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  dropdownText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  dropdownTextSelected: {
    color: '#1e293b',
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
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
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
});