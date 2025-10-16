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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

const CEODashboard = () => {
  const [showApartmentModal, setShowApartmentModal] = useState(false);
  const [showCommercialModal, setShowCommercialModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [apartmentForm, setApartmentForm] = useState({
    name: '',
    base_fee: '',
  });

  const [commercialForm, setCommercialForm] = useState({
    name: '',
    base_fee: '',
  });

  // Handle Apartment Type Submission
  const handleApartmentSubmit = async () => {
    if (!apartmentForm.name.trim() || !apartmentForm.base_fee.trim()) {
      Alert.alert('Validation Error', 'Name and base fee are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(
        `${API_BASE_URL}/api/apartment-types`,
        apartmentForm,
        { headers }
      );

      Alert.alert('Success', `Apartment Type "${apartmentForm.name}" added successfully!`);
      setShowApartmentModal(false);
      setApartmentForm({ name: '', base_fee: '' });

    } catch (error) {
      console.error('Error adding apartment type:', error);
      Alert.alert('Error', 'Failed to add apartment type. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Commercial Subtype Submission
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>CEO Dashboard</Text>

        {/* Menu Cards */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => setShowApartmentModal(true)}
          >
            <Ionicons name="home-outline" size={40} color="#2E8B57" />
            <Text style={styles.cardTitle}>Add Apartment Type</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => setShowCommercialModal(true)}
          >
            <Ionicons name="business-outline" size={40} color="#2E8B57" />
            <Text style={styles.cardTitle}>Add Commercial Subtype</Text>
          </TouchableOpacity>
        </View>

        {/* Apartment Type Modal */}
        <Modal
          visible={showApartmentModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowApartmentModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Apartment Type</Text>

              <TextInput
                style={styles.input}
                placeholder="Name (e.g., Studio, 1 Bedroom)"
                value={apartmentForm.name}
                onChangeText={(text) => setApartmentForm({ ...apartmentForm, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Base Fee (e.g., 1000)"
                value={apartmentForm.base_fee}
                onChangeText={(text) => setApartmentForm({ ...apartmentForm, base_fee: text })}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowApartmentModal(false);
                    setApartmentForm({ name: '', base_fee: '' });
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleApartmentSubmit}
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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

export default CEODashboard;
