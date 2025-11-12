import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const CreateTruck = () => {
  const [formData, setFormData] = useState({
    plate_number: '',
    truckModel: '', // Changed from truckmodel
    truckCapacity: '',
    truckStatus: '',
  });

  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const statuses = [
    { label: 'Operational', value: 'operational', icon: 'checkmark-circle', color: '#10b981' },
    { label: 'Maintenance', value: 'maintenance', icon: 'build', color: '#f59e0b' },
    { label: 'Inactive', value: 'inactive', icon: 'close-circle', color: '#ef4444' },
  ];

  const getStatusLabel = (statusValue) => {
    const status = statuses.find(s => s.value === statusValue);
    return status ? status.label : 'Select Status';
  };

  const getStatusDisplay = (statusValue) => {
    const status = statuses.find(s => s.value === statusValue);
    if (!status) return null;
    
    return (
      <View style={styles.statusDisplay}>
        <Ionicons name={status.icon} size={16} color={status.color} />
        <Text style={[styles.statusDisplayText, { color: status.color }]}>
          {status.label}
        </Text>
      </View>
    );
  };

  const handleStatusChange = (selectedStatus) => {
    setFormData({ ...formData, truckStatus: selectedStatus });
    setShowStatusOptions(false);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    if (!formData.plate_number || !formData.truckModel || !formData.truckCapacity || !formData.truckStatus) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    const truckCapacityNum = parseFloat(formData.truckCapacity);
    if (isNaN(truckCapacityNum) || truckCapacityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid truckCapacity (positive number)');
      return false;
    }

    if (formData.plate_number.length < 3) {
      Alert.alert('Error', 'Plate number must be at least 3 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    console.log('Submitting form data:', formData);
    if (!validateForm()) return;
    
    setSubmitting(true);
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/trucks/create`,
        {
          ...formData,
          truckCapacity: parseFloat(formData.truckCapacity),
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
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      plate_number: '',
      truckModel: '', // Changed from truckmodel
      truckCapacity: '',
      truckStatus: '',
    });
    setShowStatusOptions(false);
  };

  const isFormValid = formData.plate_number && formData.truckModel && formData.truckCapacity && formData.truckStatus;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <Ionicons name="car-sport" size={32} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Add New Truck</Text>
              <Text style={styles.headerSubtitle}>Register a new vehicle to your fleet</Text>
            </View>
          </View>

          {/* TRUCK DETAILS */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#6366f1" />
              <Text style={styles.sectionTitle}>Truck Details</Text>
            </View>

            {/* Plate_number and truckModel Row */}
            <View style={styles.inputRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Plate Number *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="receipt" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="ABC-123"
                    placeholderTextColor="#94a3b8"
                    value={formData.plate_number}
                    onChangeText={(text) => handleInputChange('plate_number', text)}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Truck Model *</Text> {/* Updated label */}
                <View style={styles.inputContainer}>
                  <Ionicons name="construct" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Truck model"
                    placeholderTextColor="#94a3b8"
                    value={formData.truckModel} // Changed from truckmodel
                    onChangeText={(text) => handleInputChange('truckModel', text)} // Changed from truckmodel
                  />
                </View>
              </View>
            </View>

            {/* truckCapacity */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Truck Capacity (tons) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="scale" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  value={formData.truckCapacity}
                  onChangeText={(text) => handleInputChange('truckCapacity', text)}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputSuffix}>tons</Text>
              </View>
            </View>
          </View>

          {/* STATUS */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pin" size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Truck Status</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status *</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setShowStatusOptions(!showStatusOptions)}
              >
                <Ionicons name="stats-chart" size={20} color="#94a3b8" style={styles.inputIcon} />
                {formData.truckStatus ? (
                  getStatusDisplay(formData.truckStatus)
                ) : (
                  <Text style={styles.placeholderText}>Select truck status</Text>
                )}
                <Ionicons 
                  name={showStatusOptions ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#64748B" 
                />
              </TouchableOpacity>

              {showStatusOptions && (
                <View style={styles.dropdownOptions}>
                  {statuses.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.dropdownOption,
                        formData.truckStatus === status.value && styles.selectedOption
                      ]}
                      onPress={() => handleStatusChange(status.value)}
                    >
                      <Ionicons name={status.icon} size={18} color={status.color} />
                      <Text style={[
                        styles.dropdownOptionText,
                        formData.truckStatus === status.value && styles.selectedOptionText
                      ]}>
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.sectionContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  styles.createButton,
                  !isFormValid && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.createButtonText}>Create Truck</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={resetForm}
              >
                <Ionicons name="refresh" size={20} color="#64748B" />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Status */}
          <View style={styles.formStatus}>
            <Text style={styles.formStatusText}>
              {isFormValid ? '✅ All fields completed' : 'Fill all required fields to continue'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  form: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    height: '100%',
  },
  inputSuffix: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 8,
  },
  dropdownTrigger: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: '#94a3b8',
    marginLeft: 8,
  },
  statusDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDisplayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownOptions: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownOption: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectedOption: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButton: {
    backgroundColor: '#6366f1',
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  clearButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  formStatus: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  formStatusText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default CreateTruck;