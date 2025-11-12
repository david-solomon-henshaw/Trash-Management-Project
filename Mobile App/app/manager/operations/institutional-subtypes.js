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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../config';

export default function InstitutionalSubtypesScreen() {
  const navigation = useNavigation();
  const [showInstitutionalModal, setShowInstitutionalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [institutionalSubtypes, setInstitutionalSubtypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [institutionalForm, setInstitutionalForm] = useState({
    name: '',
    base_fee: '',
  });

  // Fetch institutional subtypes on screen load
  useEffect(() => {
    fetchInstitutionalSubtypes();
  }, []);

  const fetchInstitutionalSubtypes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(
        `${API_BASE_URL}/api/institutional-subtypes`,
        { headers }
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

    // Validate base fee is a positive number
    const baseFee = parseFloat(institutionalForm.base_fee);
    if (isNaN(baseFee) || baseFee < 0) {
      Alert.alert('Validation Error', 'Base fee must be a positive number');
      return;
    }

    // Validate name length
    if (institutionalForm.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
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
      fetchInstitutionalSubtypes(); // Refresh the list after adding a new type
    } catch (error) {
      console.error('Error adding institutional subtype:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add institutional subtype. Please try again.';
      
      if (error.response?.status === 400) {
        Alert.alert('Error', errorMessage);
      } else if (error.response?.status === 403) {
        Alert.alert('Permission Denied', 'Only managers can create institutional subtypes');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const resetForm = () => {
    setInstitutionalForm({ name: '', base_fee: '' });
    setShowInstitutionalModal(false);
  };

  const renderInstitutionalSubtype = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemFee}>Base Fee: ${item.base_fee.toLocaleString()}</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#8B4513" />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Institutional Subtypes</Text>
            <Text style={styles.headerSubtitle}>Manage institutional categories and pricing</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B4513']}
            tintColor="#8B4513"
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
          <ActivityIndicator size="large" color="#8B4513" style={styles.loadingIndicator} />
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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Institutional Subtype</Text>
              <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name (e.g., School, Hospital, Government)"
              value={institutionalForm.name}
              onChangeText={(text) => setInstitutionalForm({ ...institutionalForm, name: text })}
              autoCapitalize="words"
              maxLength={50}
            />

            <TextInput
              style={styles.input}
              placeholder="Base Fee (e.g., 3000)"
              value={institutionalForm.base_fee}
              onChangeText={(text) => setInstitutionalForm({ ...institutionalForm, base_fee: text.replace(/[^0-9.]/g, '') })}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    backgroundColor: '#8B4513',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#8B4513',
  },
  listItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#8B4513',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
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