import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

export default function RecordService() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Data state
  const [activeRoute, setActiveRoute] = useState(null);
  const [streets, setStreets] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Dropdown states
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    street: null,
    customer: null,
    service_status: '',
    before_photo: null,
    after_photo: null,
    service_notes: '',
  });

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
      await fetchActiveRoute();
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/Login');
    }
  };

  const fetchActiveRoute = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Call the supervisor assignments endpoint to get today's assignment
      const response = await axios.get(`${API_BASE_URL}/api/trucks/my-assignments`, { headers });
      
      if (response.data.assignment) {
        // Use the assignment data directly and set streets from populated data
        setActiveRoute(response.data.assignment);
        setStreets(response.data.assignment.streets || []);
      } else {
        setActiveRoute(null);
        setStreets([]);
      }
      
    } catch (error) {
      console.error('Fetch assignment error:', error);
      Alert.alert('Error', 'Failed to fetch today\'s assignment');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersForStreet = async (streetId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/api/customers/by-street/${streetId}`, { headers });
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Fetch customers error:', error);
      Alert.alert('Error', 'Failed to fetch customers');
    }
  };

  const handleStreetSelect = (street) => {
    setFormData(prev => ({ 
      ...prev, 
      street, 
      customer: null,
      service_status: ''
    }));
    setShowStreetDropdown(false);
    fetchCustomersForStreet(street._id);
  };

  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({ ...prev, customer }));
    setShowCustomerDropdown(false);
  };

  const handleStatusSelect = (status) => {
    setFormData(prev => ({ ...prev, service_status: status }));
    setShowStatusDropdown(false);
  };

  const pickImage = async (type) => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        if (type === 'before') {
          setFormData(prev => ({ ...prev, before_photo: result.assets[0].uri }));
        } else {
          setFormData(prev => ({ ...prev, after_photo: result.assets[0].uri }));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.street || !formData.customer || !formData.service_status) {
      Alert.alert('Missing Information', 'Please select street, customer, and service status');
      return;
    }

    if (!formData.before_photo) {
      Alert.alert('Missing Photo', 'Before photo is required');
      return;
    }

    if (formData.service_status === 'serviced' && !formData.after_photo) {
      Alert.alert('Missing Photo', 'After photo is required for serviced status');
      return;
    }

    setSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Prepare service data matching your schema
      const serviceData = {
        customer: formData.customer._id,
        route: activeRoute._id,
        service_date: new Date().toISOString(),
        service_month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        before_photo: formData.before_photo, // In real app, upload to server first
        after_photo: formData.after_photo,
        service_status: formData.service_status,
        service_notes: formData.service_notes,
      };

      // Submit service record
      await axios.post(`${API_BASE_URL}/api/services/create`, serviceData, { headers });
      
      setSubmitting(false);
      setShowSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          street: null,
          customer: null,
          service_status: '',
          before_photo: null,
          after_photo: null,
          service_notes: '',
        });
        setShowSuccess(false);
      }, 2000);
      
    } catch (error) {
      setSubmitting(false);
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to record service');
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#06b6d4" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06b6d4" />
          <Text style={styles.loadingText}>Loading today's assignment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeRoute) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#06b6d4" />
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Record Service</Text>
          </View>
        </View>
        <View style={styles.noRouteContainer}>
          <Ionicons name="map-outline" size={64} color="#64748b" />
          <Text style={styles.noRouteTitle}>No Assignment Today</Text>
          <Text style={styles.noRouteText}>
            You don't have any assignments scheduled for today.{'\n'}
            Please contact your manager.
          </Text>
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
          <Text style={styles.headerTitle}>Record Service</Text>
        </View>
        <View style={styles.activeRouteInfo}>
          <Text style={styles.activeRouteText}>Today's Assignment: {activeRoute.name || `Route #${activeRoute._id?.substring(0, 8)}`}</Text>
          <Text style={styles.activeRouteSubtext}>
            Truck: {activeRoute.assigned_truck?.plate_number} • 
            {activeRoute.scheduled_date ? ` Scheduled: ${new Date(activeRoute.scheduled_date).toLocaleDateString()}` : ''}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
          {/* Success Message */}
          {showSuccess && (
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.successText}>Service recorded successfully!</Text>
            </View>
          )}

          {/* Street Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Street *</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowStreetDropdown(true)}
            >
              <Text style={formData.street ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                {formData.street ? formData.street.name : 'Choose a street'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Customer Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Customer *</Text>
            <TouchableOpacity 
              style={[styles.dropdownButton, !formData.street && styles.dropdownDisabled]}
              onPress={() => formData.street && setShowCustomerDropdown(true)}
              disabled={!formData.street}
            >
              <Text style={formData.customer ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                {formData.customer ? `${formData.customer.name} (${formData.customer.house_number})` : 'Choose a customer'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={formData.street ? "#64748b" : "#cbd5e1"} />
            </TouchableOpacity>
          </View>

          {/* Service Status Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Status *</Text>
            <TouchableOpacity 
              style={[styles.dropdownButton, !formData.customer && styles.dropdownDisabled]}
              onPress={() => formData.customer && setShowStatusDropdown(true)}
              disabled={!formData.customer}
            >
              <Text style={formData.service_status ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                {formData.service_status ? 
                  formData.service_status === 'serviced' ? 'Serviced' :
                  formData.service_status === 'not_home' ? 'Not Home' : 'Refused Service'
                  : 'Select service status'
                }
              </Text>
              <Ionicons name="chevron-down" size={20} color={formData.customer ? "#64748b" : "#cbd5e1"} />
            </TouchableOpacity>
          </View>

          {/* Photos Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Before Photo *</Text>
            {formData.before_photo ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: formData.before_photo }} style={styles.photoImage} />
                <TouchableOpacity 
                  style={styles.photoRetake}
                  onPress={() => pickImage('before')}
                >
                  <Ionicons name="camera" size={16} color="white" />
                  <Text style={styles.photoRetakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={() => pickImage('before')}
              >
                <Ionicons name="camera" size={24} color="#06b6d4" />
                <Text style={styles.photoButtonText}>Take Before Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {formData.service_status === 'serviced' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>After Photo *</Text>
              {formData.after_photo ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: formData.after_photo }} style={styles.photoImage} />
                  <TouchableOpacity 
                    style={styles.photoRetake}
                    onPress={() => pickImage('after')}
                  >
                    <Ionicons name="camera" size={16} color="white" />
                    <Text style={styles.photoRetakeText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.photoButton}
                  onPress={() => pickImage('after')}
                >
                  <Ionicons name="camera" size={24} color="#06b6d4" />
                  <Text style={styles.photoButtonText}>Take After Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any additional notes..."
              value={formData.service_notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, service_notes: text }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="white" />
                <Text style={styles.submitButtonText}>Record Service</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Dropdown Modals */}
      <DropdownModal
        visible={showStreetDropdown}
        onClose={() => setShowStreetDropdown(false)}
        title="Select Street"
      >
        {streets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateText}>No streets available in this assignment</Text>
          </View>
        ) : (
          streets.map((street) => (
            <TouchableOpacity
              key={street._id}
              style={styles.modalItem}
              onPress={() => handleStreetSelect(street)}
            >
              <Text style={styles.modalItemText}>{street.name}</Text>
              {formData.street?._id === street._id && (
                <Ionicons name="checkmark" size={20} color="#10b981" />
              )}
            </TouchableOpacity>
          ))
        )}
      </DropdownModal>

      <DropdownModal
        visible={showCustomerDropdown}
        onClose={() => setShowCustomerDropdown(false)}
        title="Select Customer"
      >
        {customers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateText}>No customers on this street</Text>
          </View>
        ) : (
          customers.map((customer) => (
            <TouchableOpacity
              key={customer._id}
              style={styles.modalItem}
              onPress={() => handleCustomerSelect(customer)}
            >
              <View style={styles.customerItem}>
                <Text style={styles.modalItemText}>
                  {customer.name} • House #{customer.house_number}
                </Text>
                <Text style={styles.customerSubtext}>
                  {customer.phone} • {customer.customer_type}
                </Text>
              </View>
              {formData.customer?._id === customer._id && (
                <Ionicons name="checkmark" size={20} color="#10b981" />
              )}
            </TouchableOpacity>
          ))
        )}
      </DropdownModal>

      <DropdownModal
        visible={showStatusDropdown}
        onClose={() => setShowStatusDropdown(false)}
        title="Select Service Status"
      >
        {['serviced', 'not_home', 'refused'].map((status) => (
          <TouchableOpacity
            key={status}
            style={styles.modalItem}
            onPress={() => handleStatusSelect(status)}
          >
            <View style={styles.statusItem}>
              <Ionicons 
                name={
                  status === 'serviced' ? 'checkmark-circle' :
                  status === 'not_home' ? 'home-outline' : 'close-circle'
                } 
                size={20} 
                color={
                  status === 'serviced' ? '#10b981' :
                  status === 'not_home' ? '#f59e0b' : '#ef4444'
                }
              />
              <Text style={styles.modalItemText}>
                {status === 'serviced' ? 'Serviced' :
                 status === 'not_home' ? 'Not Home' : 'Refused Service'}
              </Text>
            </View>
            {formData.service_status === status && (
              <Ionicons name="checkmark" size={20} color="#10b981" />
            )}
          </TouchableOpacity>
        ))}
      </DropdownModal>
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
  activeRouteInfo: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  activeRouteText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeRouteSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
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
  noRouteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noRouteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  noRouteText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
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
  dropdownButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  photoButton: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#06b6d4',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06b6d4',
  },
  photoPreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  photoRetake: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  photoRetakeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#06b6d4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '600',
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
  customerItem: {
    flex: 1,
  },
  customerSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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