import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../config';

export default function CommercialSubtypesScreen() {
  const [showCommercialModal, setShowCommercialModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commercialForm, setCommercialForm] = useState({
    name: '',
    base_fee: '',
  });

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

    } catch (error) {
      console.error('Error adding commercial subtype:', error);
      Alert.alert('Error', 'Failed to add commercial subtype. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Add your list of commercial subtypes here */}
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
