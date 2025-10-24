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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../config';
import { useRouter } from 'expo-router';

export default function AddCustomerForm() {
  const router = useRouter();
  const [streets, setStreets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apartmentTypes, setApartmentTypes] = useState([]);
  const [commercialSubtypes, setCommercialSubtypes] = useState([]);
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
    status: 'active'
  });

  const [showDropdown, setShowDropdown] = useState({
    street: false,
    customer_type: false,
    apartment_type: false,
    commercial_subtype: false,
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
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {options.map(option => (
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
          <Text style={styles.loadingText}>Loading form data...</Text>
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
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>New Customer</Text>
            <Text style={styles.headerSubtitle}>Register a new customer account</Text>
          </View>
        </View>
      </View>

      {/* Form */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
          </View>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={[styles.inputGroup, styles.lastInput]}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Address Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ADDRESS INFORMATION</Text>
          </View>

          {/* Street Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Street <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => toggleDropdown('street')}
            >
              <Ionicons name="location-outline" size={20} color="#999" style={styles.inputIcon} />
              <Text style={[styles.dropdownText, formData.street_label && styles.dropdownTextSelected]}>
                {formData.street_label || 'Select street'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* House Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              House Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="home-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter house number"
                value={formData.house_number}
                onChangeText={(value) => handleInputChange('house_number', value)}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Full Address */}
          <View style={[styles.inputGroup, styles.lastInput]}>
            <Text style={styles.label}>
              Full Address <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textareaContainer]}>
              <Ionicons name="business-outline" size={20} color="#999" style={[styles.inputIcon, styles.textareaIcon]} />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Enter full address"
                value={formData.address}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#999"
                editable={false}
              />
            </View>
          </View>
        </View>

        {/* Customer Type Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CUSTOMER TYPE</Text>
          </View>

          {/* Customer Type Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Type <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => toggleDropdown('customer_type')}
            >
              <Text style={[styles.dropdownText, formData.customer_type_label && styles.dropdownTextSelected]}>
                {formData.customer_type_label || 'Select customer type'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Apartment Type - Only for Residential */}
          {formData.customer_type === 'residential' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Apartment Type <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => toggleDropdown('apartment_type')}
              >
                <Text style={[styles.dropdownText, formData.apartment_type_label && styles.dropdownTextSelected]}>
                  {formData.apartment_type_label || 'Select apartment type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          )}

          {/* Commercial Subtype - Only for Commercial */}
          {formData.customer_type === 'commercial' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Business Type <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => toggleDropdown('commercial_subtype')}
              >
                <Text style={[styles.dropdownText, formData.commercial_subtype_label && styles.dropdownTextSelected]}>
                  {formData.commercial_subtype_label || 'Select business type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          )}

          {/* Status Dropdown */}
          <View style={[styles.inputGroup, styles.lastInput]}>
            <Text style={styles.label}>
              Status <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => toggleDropdown('status')}
            >
              <Text style={[styles.dropdownText, styles.dropdownTextSelected]}>
                {formData.status_label || 'Active'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Creating...' : 'Create Customer'}
          </Text>
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
    backgroundColor: '#f0f0f0',
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
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
  },
  inputGroup: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastInput: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#dc3545',
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
  textareaContainer: {
    alignItems: 'flex-start',
  },
  textareaIcon: {
    marginTop: 2,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  bottomButtons: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2E8B57',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});