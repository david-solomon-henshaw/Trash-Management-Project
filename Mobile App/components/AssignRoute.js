import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
// import { API_BASE_URL } from '../config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RouteAndTruckSelection from './RouteAndTruckSelection';
import TeamMemberSelection from './TeamMemberSelection';
import { Ionicons } from '@expo/vector-icons';

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
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [trucksRes, staffRes, streetsRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/trucks`, { headers }),
        axios.get(`${API_BASE_URL}/api/staff`, { headers }),
        axios.get(`${API_BASE_URL}/api/street/all`, { headers })
      ]);

      console.log(streetsRes)

      if (trucksRes.status === 'fulfilled') {
        setTrucks(trucksRes.value.data.trucks || []);
      } else {
        Alert.alert('Warning', 'Could not load trucks data');
      }

      if (staffRes.status === 'fulfilled') {
        setStaff(staffRes.value.data || []);
      } else {
        Alert.alert('Warning', 'Could not load staff data');
      }

      if (streetsRes.status === 'fulfilled') {
        setStreets(streetsRes.value.data.streets || []);
      } else {
        Alert.alert('Warning', 'Could not load streets data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setFetching(false);
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
    const hasSupervisor = formData.team_members.some(member => member.role === 'supervisor' || member.role === 'admin');
    if (!hasSupervisor) {
      Alert.alert('Error', 'Team must have a supervisor or admin');
      return false;
    }
    
    const invalidMembers = formData.team_members.some(
      member => !member.user || !['supervisor', 'driver', 'field_agent', 'admin'].includes(member.role)
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

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading assignment data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="car-sport" size={20} color="#6366f1" />
            </View>
            <Text style={styles.statValue}>{trucks.length}</Text>
            <Text style={styles.statLabel}>Available Trucks</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="people" size={20} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{staff.length}</Text>
            <Text style={styles.statLabel}>Team Members</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Ionicons name="map" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.statValue}>{streets.length}</Text>
            <Text style={styles.statLabel}>Streets</Text>
          </View>
        </View>

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
            <View style={styles.sectionIcon}>
              <Ionicons name="location" size={20} color="#8b5cf6" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Route Streets</Text>
              <Text style={styles.sectionSubtitle}>Select streets for this route</Text>
            </View>
          </View>
          
          <View style={styles.selectionSummary}>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryText}>
                {formData.street_ids.length} street{formData.street_ids.length !== 1 ? 's' : ''} selected
              </Text>
            </View>
          </View>

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
                <Ionicons 
                  name={formData.street_ids.includes(street._id) ? "checkmark-circle" : "location-outline"} 
                  size={16} 
                  color={formData.street_ids.includes(street._id) ? "white" : "#64748B"} 
                />
                <Text
                  style={[
                    styles.streetChipText,
                    formData.street_ids.includes(street._id) && styles.selectedStreetChipText,
                  ]}
                >
                  {street.streetName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.sectionContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.assignButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
              accessible={true}
              accessibilityLabel="Assign Route"
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.assignButtonText}>Assign Route</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={resetForm}
              accessible={true}
              accessibilityLabel="Clear Form"
            >
              <Ionicons name="refresh" size={20} color="#64748B" />
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  form: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
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
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  selectionSummary: {
    marginBottom: 16,
  },
  summaryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  summaryText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  streetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  streetChip: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedStreetChip: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
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
  assignButton: {
    backgroundColor: '#10b981',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  assignButtonText: {
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
});

export default AssignRoute;