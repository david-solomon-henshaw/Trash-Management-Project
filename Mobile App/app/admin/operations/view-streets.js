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
import apiClient from '../../../hooks/services/client';


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
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/');
    }
  };

  const fetchStreets = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await apiClient.get(`/street/all`);
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
      const token = await AsyncStorage.getItem('userToken');
      await apiClient.put(
        `/street/${selectedStreet._id}`,
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
      fetchStreets();
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
      const token = await AsyncStorage.getItem('userToken');
      await apiClient.delete(`/street/${streetId}`, {
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
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A085" />
          <Text style={styles.loadingText}>Loading streets...</Text>
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>All Streets</Text>
            <Text style={styles.headerSubtitle}>
              {filteredStreets.length} street{filteredStreets.length !== 1 ? 's' : ''} registered
            </Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search streets by name..."
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

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A085']} tintColor="#16A085" />
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
                  onPress={() => router.push('/admin/streets/add-street')}
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
                    <Ionicons name="location" size={24} color="#16A085" />
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
        onPress={() => router.push('/admin/streets/add-street')}
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
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Street</Text>
                <Text style={styles.modalSubtitle}>Update street information</Text>
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
                <Text style={styles.label}>Street Name *</Text>
                <View style={[styles.inputContainer, editFormData.streetName.trim() && styles.inputWithValue]}>
                  <Ionicons name="location" size={20} color="#64748b" style={styles.inputIcon} />
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

              <View style={styles.formGroup}>
                <Text style={styles.label}>Additional Details</Text>
                <View style={[styles.inputContainer, editFormData.details.trim() && styles.inputWithValue]}>
                  <Ionicons name="document-text" size={20} color="#64748b" style={styles.inputIcon} />
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
                <Text style={[styles.saveButtonText, (saving || !hasChanges()) && styles.disabledButtonText]}>
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
    color: '#64748B',
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
  searchContainer: {
    marginTop: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginHorizontal: 12,
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
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#16A085',
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
    fontSize: 18,
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
    backgroundColor: '#16A085',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
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
    backgroundColor: '#16A085',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWithValue: {
    borderColor: '#16A085',
    backgroundColor: '#F0FDF4',
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
    borderRadius: 12,
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
    backgroundColor: '#16A085',
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