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

export default function ViewStreets() {
  const [streets, setStreets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [editFormData, setEditFormData] = useState({
    streetName: '',
    details: '',
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchStreets();
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

  const fetchStreets = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/street/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStreets(response.data.streets || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch streets');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStreets();
  };

  const handleEditStreet = (street) => {
    setSelectedStreet(street);
    setEditFormData({
      streetName: street.streetName,
      details: street.details || '',
    });
    setEditModalVisible(true);
  };

  const handleCloseModal = () => {
    // Check if there are unsaved changes
    if (selectedStreet) {
      const hasChanges =
        editFormData.streetName.trim() !== selectedStreet.streetName ||
        editFormData.details.trim() !== (selectedStreet.details || '');

      if (hasChanges) {
        Alert.alert(
          'Discard Changes?',
          'You have unsaved changes. Are you sure you want to close?',
          [
            { text: 'Keep Editing', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => {
                setEditModalVisible(false);
                setSelectedStreet(null);
                setEditFormData({ streetName: '', details: '' });
              }
            },
          ]
        );
      } else {
        setEditModalVisible(false);
        setSelectedStreet(null);
        setEditFormData({ streetName: '', details: '' });
      }
    } else {
      setEditModalVisible(false);
      setSelectedStreet(null);
      setEditFormData({ streetName: '', details: '' });
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData({ ...editFormData, [field]: value });
  };

  const validateEditForm = () => {
    if (!editFormData.streetName.trim()) {
      Alert.alert('Validation Error', 'Street name is required');
      return false;
    }
    if (editFormData.streetName.trim().length < 2) {
      Alert.alert('Validation Error', 'Street name must be at least 2 characters long');
      return false;
    }
    return true;
  };

  const hasChanges = () => {
    if (!selectedStreet) return false;
    return (
      editFormData.streetName.trim() !== selectedStreet.streetName ||
      editFormData.details.trim() !== (selectedStreet.details || '')
    );
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) return;

    if (!hasChanges()) {
      Alert.alert('No Changes', 'No changes were made to the street');
      return;
    }

    setSaving(true);

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/street/${selectedStreet._id}`,
        {
          streetName: editFormData.streetName.trim(),
          details: editFormData.details.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Success', 'Street updated successfully!');
      setEditModalVisible(false);
      setSelectedStreet(null);
      setEditFormData({ streetName: '', details: '' });
      fetchStreets(); // Refresh the list
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update street';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStreet = (street) => {
    Alert.alert(
      'Delete Street',
      `Are you sure you want to delete "${street.streetName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(street._id),
        },
      ]
    );
  };

  const confirmDelete = async (streetId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/street/${streetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Success', 'Street deleted successfully');
      fetchStreets();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete street');
      console.error('Delete error:', error);
    }
  };

  const filteredStreets = streets.filter((street) =>
    street.streetName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading streets...</Text>
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
            <Text style={styles.headerTitle}>All Streets</Text>
            <Text style={styles.headerSubtitle}>
              {filteredStreets.length} street{filteredStreets.length !== 1 ? 's' : ''} registered
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
        <View style={styles.streetsContainer}>
          {filteredStreets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No streets found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try a different search' : 'Add your first street to get started'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/ceo/streets/add-street')}
                >
                  <Text style={styles.emptyButtonText}>+ Add Street</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredStreets.map((street) => (
              <View key={street._id} style={styles.streetCard}>
                <View style={styles.streetHeader}>
                  <View style={styles.streetIcon}>
                    <Ionicons name="location" size={24} color="#2E8B57" />
                  </View>
                  <View style={styles.streetInfo}>
                    <Text style={styles.streetName}>{street.streetName}</Text>
                    {street.details && (
                      <Text style={styles.streetDetails} numberOfLines={2}>
                        {street.details}
                      </Text>
                    )}
                    <Text style={styles.streetDate}>
                      Added {new Date(street.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleEditStreet(street)}
                  >
                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteStreet(street)}
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
        onPress={() => router.push('/ceo/streets/add-street')}
        accessibilityLabel="Add new street"
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
                <Text style={styles.modalTitle}>Edit Street</Text>
                <Text style={styles.modalSubtitle}>Update street information</Text>
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
              {/* Street Name Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Street Name *</Text>
                <View style={[
                  styles.outlineInput,
                  editFormData.streetName.trim() && styles.inputWithValue
                ]}>
                  <Text style={styles.inputIcon}>🛣️</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter street name"
                    placeholderTextColor="#9CA3AF"
                    value={editFormData.streetName}
                    onChangeText={(text) => handleInputChange('streetName', text)}
                    maxLength={100}
                    autoCapitalize="words"
                  />
                </View>
                <Text style={styles.helperText}>
                  {editFormData.streetName.length}/100 characters
                </Text>
              </View>

              {/* Details Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Additional Details</Text>
                <View style={[
                  styles.outlineInput,
                  styles.textAreaInput,
                  editFormData.details.trim() && styles.inputWithValue
                ]}>
                  <Text style={[styles.inputIcon, styles.textAreaIcon]}>📝</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Enter additional details"
                    placeholderTextColor="#9CA3AF"
                    value={editFormData.details}
                    onChangeText={(text) => handleInputChange('details', text)}
                    maxLength={500}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                <Text style={styles.helperText}>
                  {editFormData.details.length}/500 characters • Optional
                </Text>
              </View>

              {/* Preview */}
              {(editFormData.streetName.trim() || editFormData.details.trim()) && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewTitle}>Preview</Text>
                  <View style={styles.previewCard}>
                    <Text style={styles.previewStreetName}>
                      {editFormData.streetName.trim() || 'Street Name'}
                    </Text>
                    {editFormData.details.trim() && (
                      <Text style={styles.previewDetails}>{editFormData.details}</Text>
                    )}
                  </View>
                </View>
              )}
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
  streetsContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  streetCard: {
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
  streetHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  streetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streetInfo: {
    flex: 1,
  },
  streetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  streetDetails: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 4,
  },
  streetDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
    maxHeight: '90%',
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
    maxHeight: '60%',
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
  outlineInput: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputWithValue: {
    borderColor: '#2E8B57',
    backgroundColor: '#F0FDF4',
  },
  textAreaInput: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 20,
    marginTop: 2,
  },
  textAreaIcon: {
    marginTop: 0,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 70,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
  },
  previewSection: {
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewStreetName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  previewDetails: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
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
});