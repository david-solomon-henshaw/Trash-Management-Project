import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { API_BASE_URL } from '../../App/config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateTruck = () => {
  // State for form data
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    capacity: '',
    status: '',
  });

  // State for status dropdown
  const [showStatusOptions, setShowStatusOptions] = useState(false);

  // Status options (from Trucks schema enum)
  const statuses = [
    { label: 'Operational', value: 'operational' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Inactive', value: 'inactive' },
  ];

  // Get display label for status
  const getStatusLabel = (statusValue) => {
    const status = statuses.find(s => s.value === statusValue);
    return status ? status.label : 'Select Status';
  };

  // Handle status change
  const handleStatusChange = (selectedStatus) => {
    setFormData({ ...formData, status: selectedStatus });
    setShowStatusOptions(false);
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Validate form
  const validateForm = () => {
    if (!formData.plate || !formData.model || !formData.capacity || !formData.status) {
      Alert.alert('Error', 'Please fill in all required fields (Plate, Model, Capacity, Status)');
      return false;
    }

    const capacityNum = parseFloat(formData.capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid capacity (positive number)');
      return false;
    }

    if (formData.plate.length < 3) {
      Alert.alert('Error', 'Plate number must be at least 3 characters');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/trucks/create`, // Updated endpoint
        {
          ...formData,
          capacity: parseFloat(formData.capacity),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 201) {
        Alert.alert('Success', 'Truck created successfully!', [
          { text: 'OK', onPress: () => resetForm() },
        ]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
      Alert.alert('Error', errorMessage);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      plate: '',
      model: '',
      capacity: '',
      status: '',
    });
    setShowStatusOptions(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* SECTION 1: TRUCK DETAILS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Truck Details</Text>
            <Text style={styles.sectionSubtitle}>Basic truck information</Text>
          </View>

          {/* Plate and Model Row */}
          <View style={styles.inputRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Plate Number *</Text>
              <View style={styles.outlineInput}>
                <Text style={styles.inputIcon}>🚛</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter plate number"
                  placeholderTextColor="#9CA3AF"
                  value={formData.plate}
                  onChangeText={(text) => handleInputChange('plate', text)}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Model *</Text>
              <View style={styles.outlineInput}>
                <Text style={styles.inputIcon}>🛠️</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter truck model"
                  placeholderTextColor="#9CA3AF"
                  value={formData.model}
                  onChangeText={(text) => handleInputChange('model', text)}
                />
              </View>
            </View>
          </View>

          {/* Capacity */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Capacity (tons) *</Text>
            <View style={styles.outlineInput}>
              <Text style={styles.inputIcon}>⚖️</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter capacity"
                placeholderTextColor="#9CA3AF"
                value={formData.capacity}
                onChangeText={(text) => handleInputChange('capacity', text)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* SECTION 2: STATUS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Status</Text>
            <Text style={styles.sectionSubtitle}>Set initial truck status</Text>
          </View>

          {/* Status Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Status *</Text>
            <TouchableOpacity
              style={styles.outlineInput}
              onPress={() => setShowStatusOptions(!showStatusOptions)}
            >
              <Text style={styles.inputIcon}>🔄</Text>
              <Text style={[
                styles.inputText,
                !formData.status && styles.placeholderText
              ]}>
                {getStatusLabel(formData.status)}
              </Text>
              <Text style={styles.dropdownArrow}>
                {showStatusOptions ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showStatusOptions && (
              <View style={styles.roleOptions}>
                {statuses.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.roleOption,
                      formData.status === status.value && styles.selectedRole
                    ]}
                    onPress={() => handleStatusChange(status.value)}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      formData.status === status.value && styles.selectedRoleText
                    ]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* SECTION 3: ACTION BUTTONS */}
        <View style={styles.sectionContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.createButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.createButtonText}>Create Truck</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={resetForm}
            >
              <Text style={styles.clearButtonText}>Clear Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  form: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  formGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  outlineInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  roleOptions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  roleOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedRole: {
    backgroundColor: '#EFF6FF',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedRoleText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#2E8B57',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateTruck;