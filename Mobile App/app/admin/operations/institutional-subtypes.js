import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../hooks/services/client';
// import { API_BASE_URL } from '../../../config';

export default function InstitutionalSubtypesScreen() {
  const router = useRouter();
  const [showInstitutionalModal, setShowInstitutionalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [institutionalSubtypes, setInstitutionalSubtypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [institutionalForm, setInstitutionalForm] = useState({
    name: '',
    base_fee: '',
  });

  useEffect(() => {
    fetchInstitutionalSubtypes();
  }, []);

  const fetchInstitutionalSubtypes = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await apiClient.get(
        `/institutional-subtypes`
      );

      setInstitutionalSubtypes(response.data.institutionalSubtypes || []);
    } catch (error) {
      console.error('Error fetching institutional subtypes:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch institutional subtypes. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInstitutionalSubtypes();
  };

  const handleInstitutionalSubmit = async () => {
    if (!institutionalForm.name.trim() || !institutionalForm.base_fee.trim()) {
      Alert.alert('Validation Error', 'Name and base fee are required');
      return;
    }

    const baseFee = parseFloat(institutionalForm.base_fee);
    if (isNaN(baseFee) || baseFee < 0) {
      Alert.alert('Validation Error', 'Base fee must be a positive number');
      return;
    }

    if (institutionalForm.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(
        `${API_BASE_URL}/api/institutional-subtypes`,
        {
          name: institutionalForm.name.trim(),
          base_fee: baseFee
        },
        { headers }
      );

      Alert.alert('Success', response.data.message || `Institutional Subtype "${institutionalForm.name}" added successfully!`);
      setShowInstitutionalModal(false);
      setInstitutionalForm({ name: '', base_fee: '' });
      fetchInstitutionalSubtypes();
    } catch (error) {
      console.error('Error adding institutional subtype:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add institutional subtype. Please try again.';

      if (error.response?.status === 400) {
        Alert.alert('Error', errorMessage);
      } else if (error.response?.status === 403) {
        Alert.alert('Permission Denied', 'Only admins can create institutional subtypes');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setInstitutionalForm({ name: '', base_fee: '' });
    setShowInstitutionalModal(false);
  };

  const renderInstitutionalSubtype = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemFee}>Base Fee: ₦{item.base_fee.toLocaleString()}</Text>
        <Text style={styles.itemDate}>
          Created: {new Date(item.created_at).toLocaleDateString()}
        </Text>
        {item.updated_at !== item.created_at && (
          <Text style={styles.itemDate}>
            Updated: {new Date(item.updated_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );

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
            <Text style={styles.headerTitle}>Institutional Subtypes</Text>
            <Text style={styles.headerSubtitle}>Manage institutional categories and pricing</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#16A085']}
            tintColor="#16A085"
          />
        }
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowInstitutionalModal(true)}
          disabled={loading}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Institutional Subtype</Text>
        </TouchableOpacity>

        <Text style={styles.listTitle}>
          Institutional Subtypes List {institutionalSubtypes.length > 0 && `(${institutionalSubtypes.length})`}
        </Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#16A085" style={styles.loadingIndicator} />
        ) : institutionalSubtypes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No institutional subtypes found</Text>
            <Text style={styles.emptySubtext}>Add your first institutional subtype to get started</Text>
          </View>
        ) : (
          <FlatList
            data={institutionalSubtypes}
            renderItem={renderInstitutionalSubtype}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Institutional Subtype Modal */}
      <Modal
        visible={showInstitutionalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add New Institutional Subtype</Text>
                <Text style={styles.modalSubtitle}>Enter type details</Text>
              </View>
              <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., School, Hospital, Government"
                    value={institutionalForm.name}
                    onChangeText={(text) => setInstitutionalForm({ ...institutionalForm, name: text })}
                    autoCapitalize="words"
                    maxLength={50}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Base Fee (₦) *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 3000"
                    value={institutionalForm.base_fee}
                    onChangeText={(text) => setInstitutionalForm({ ...institutionalForm, base_fee: text.replace(/[^0-9.]/g, '') })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, isSubmitting && styles.disabledButton]}
                onPress={resetForm}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                onPress={handleInstitutionalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Add</Text>
                )}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  addButton: {
    backgroundColor: '#16A085',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e293b',
  },
  listItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#16A085',
  },
  itemInfo: {
    flexDirection: 'column',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  itemFee: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontStyle: 'italic',
  },
  loadingIndicator: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
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
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 24,
  },
  inputGroup: {
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
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16A085',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});