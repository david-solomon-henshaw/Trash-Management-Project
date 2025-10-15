import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RouteAndTruckSelection from './RouteAndTruckSelection';
import TeamMemberSelection from './TeamMemberSelection';

const AssignRoute = () => {
  const [formData, setFormData] = useState({
    truck_id: '',
    scheduled_date: '',
    team_members: [],
    street_ids: [],
  });

  const [showTruckOptions, setShowTruckOptions] = useState(false);
  const [streets, setStreets] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const trucksRes = await axios.get(`${API_BASE_URL}/api/trucks`, { headers });
        setTrucks(trucksRes.data.trucks || []);
      } catch (trucksError) {
        Alert.alert('Error', 'Failed to load trucks data');
      }
      try {
        const staffRes = await axios.get(`${API_BASE_URL}/api/staff`, { headers });
        setStaff(staffRes.data || []);
      } catch (staffError) {
        Alert.alert('Error', 'Failed to load staff data');
      }
      try {
        const streetsRes = await axios.get(`${API_BASE_URL}/api/street`, { headers });
        setStreets(streetsRes.data.streets || []);
      } catch (streetsError) {
        Alert.alert('Error', 'Failed to load streets data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleStreet = (streetId) => {
    const isSelected = formData.street_ids.includes(streetId);
    const updatedStreets = isSelected
      ? formData.street_ids.filter(id => id !== streetId)
      : [...formData.street_ids, streetId];
    
    setFormData({ ...formData, street_ids: updatedStreets });
  };

  const validateForm = () => {
    if (!formData.truck_id) {
      Alert.alert('Error', 'Please select a truck');
      return false;
    }
    if (!formData.scheduled_date) {
      Alert.alert('Error', 'Scheduled date is required');
      return false;
    }
    if (formData.team_members.length === 0) {
      Alert.alert('Error', 'At least one team member is required');
      return false;
    }
    if (formData.street_ids.length === 0) {
      Alert.alert('Error', 'At least one street must be selected');
      return false;
    }
    const hasSupervisor = formData.team_members.some(member => member.role === 'supervisor');
    if (!hasSupervisor) {
      Alert.alert('Error', 'Team must have a supervisor');
      return false;
    }
    // Ensure all members have valid user and role
    const invalidMembers = formData.team_members.some(
      member => !member.user || !['supervisor', 'driver', 'field_agent'].includes(member.role)
    );
    if (invalidMembers) {
      Alert.alert('Error', 'All team members must have a valid user and role');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const cleanTeamMembers = formData.team_members.map(({ tempId, ...member }) => member);
      const response = await axios.post(
        `${API_BASE_URL}/api/trucks/assign-route`,
        {
          truck_id: formData.truck_id,
          team_members: cleanTeamMembers,
          street_ids: formData.street_ids,
          scheduled_date: formData.scheduled_date,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 201) {
        Alert.alert('Success', 'Route assigned successfully!', [
          { text: 'OK', onPress: resetForm },
        ]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to assign route';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      truck_id: '',
      scheduled_date: '',
      team_members: [],
      street_ids: [],
    });
    setShowTruckOptions(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* ROUTE AND TRUCK SELECTION */}
        <RouteAndTruckSelection
          formData={formData}
          handleInputChange={handleInputChange}
          trucks={trucks}
          showTruckOptions={showTruckOptions}
          setShowTruckOptions={setShowTruckOptions}
        />

        {/* TEAM MEMBERS */}
        <TeamMemberSelection
          formData={formData}
          setFormData={setFormData}
          staff={staff}
        />

        {/* STREETS SELECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Streets</Text>
            <Text style={styles.sectionSubtitle}>Select streets for this route</Text>
          </View>
          <Text style={styles.label}>Selected: {formData.street_ids.length} streets</Text>
          <View style={styles.streetsContainer}>
            {streets.map((street) => (
              <TouchableOpacity
                key={street._id}
                style={[
                  styles.streetChip,
                  formData.street_ids.includes(street._id) && styles.selectedStreetChip,
                ]}
                onPress={() => toggleStreet(street._id)}
                accessible={true}
                accessibilityLabel={`Toggle ${street.name}`}
              >
                <Text
                  style={[
                    styles.streetChipText,
                    formData.street_ids.includes(street._id) && styles.selectedStreetChipText,
                  ]}
                >
                  {street.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.sectionContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.assignButton]}
              onPress={handleSubmit}
              disabled={loading}
              accessible={true}
              accessibilityLabel="Assign Route"
            >
              <Text style={styles.assignButtonText}>
                {loading ? 'Assigning...' : 'Assign Route'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={resetForm}
              accessible={true}
              accessibilityLabel="Clear Form"
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
    shadowOffset: { width: 0, height: 2 },
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  streetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  streetChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedStreetChip: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  streetChipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  selectedStreetChipText: {
    color: 'white',
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
  assignButton: {
    backgroundColor: '#2E8B57',
  },
  assignButtonText: {
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

export default AssignRoute;