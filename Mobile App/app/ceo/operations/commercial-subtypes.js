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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../config';

export default function CommercialSubtypesScreen() {
  const [showCommercialModal, setShowCommercialModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commercialSubtypes, setCommercialSubtypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commercialForm, setCommercialForm] = useState({
    name: '',
    base_fee: '',
  });

  // Fetch commercial subtypes on screen load
  useEffect(() => {
    fetchCommercialSubtypes();
  }, []);

  const fetchCommercialSubtypes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(
        `${API_BASE_URL}/api/commercial-subtypes`,
        { headers }
      );

      setCommercialSubtypes(response.data.commercialSubtypes || []);
      console.log(response)
    } catch (error) {
      console.error('Error fetching commercial subtypes:', error);
      Alert.alert('Error', 'Failed to fetch commercial subtypes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommercialSubmit = async () => {
    if (!commercialForm.name.trim() || !commercialForm.base_fee.trim()) {
      Alert.alert('Validation Error', 'Name and base fee are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(
        `${API_BASE_URL}/api/commercial-subtypes`,
        commercialForm,
        { headers }
      );

      Alert.alert('Success', `Commercial Subtype "${commercialForm.name}" added successfully!`);
      setShowCommercialModal(false);
      setCommercialForm({ name: '', base_fee: '' });
      fetchCommercialSubtypes(); // Refresh the list after adding a new type
    } catch (error) {
      console.error('Error adding commercial subtype:', error);
      Alert.alert('Error', 'Failed to add commercial subtype. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCommercialSubtype = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemFee}>Base Fee: ${item.base_fee}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commercial Subtypes</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCommercialModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Commercial Subtype</Text>
        </TouchableOpacity>

        <Text style={styles.listTitle}>Commercial Subtypes List</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2E8B57" style={styles.loadingIndicator} />
        ) : commercialSubtypes.length === 0 ? (
          <Text style={styles.emptyText}>No commercial subtypes found.</Text>
        ) : (
          <FlatList
            data={commercialSubtypes}
            renderItem={renderCommercialSubtype}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Commercial Subtype Modal */}
      <Modal
        visible={showCommercialModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommercialModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Commercial Subtype</Text>

            <TextInput
              style={styles.input}
              placeholder="Name (e.g., Restaurant, Office)"
              value={commercialForm.name}
              onChangeText={(text) => setCommercialForm({ ...commercialForm, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Base Fee (e.g., 2000)"
              value={commercialForm.base_fee}
              onChangeText={(text) => setCommercialForm({ ...commercialForm, base_fee: text })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCommercialModal(false);
                  setCommercialForm({ name: '', base_fee: '' });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCommercialSubmit}
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
    backgroundColor: '#2E8B57',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 20,
  },
  addButton: {
    backgroundColor: '#2E8B57',
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
    color: '#2E8B57',
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
  loadingIndicator: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#64748B',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2E8B57',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#2E8B57',
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
