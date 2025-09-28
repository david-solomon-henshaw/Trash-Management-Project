import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  FlatList,
} from 'react-native';
import { API_BASE_URL } from '../../App/config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AssignRoute = () => {
  const [formData, setFormData] = useState({
    route_name: '',
    truck_id: '',
    scheduled_date: '',
    team_members: [],
    street_ids: [],
  });

  const [showTruckOptions, setShowTruckOptions] = useState(false);
  const [showStaffOptions, setShowStaffOptions] = useState(false);
  const [showStreetOptions, setShowStreetOptions] = useState(false);
  
  const [trucks, setTrucks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [streets, setStreets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Role options
  const roles = [
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Driver', value: 'driver' },
    { label: 'Field Agent', value: 'field_agent' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch trucks, staff, and streets in parallel
      const [trucksRes, staffRes, streetsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/trucks`, { headers }),
        axios.get(`${API_BASE_URL}/api/staff`, { headers }), // Assuming this endpoint exists
        axios.get(`${API_BASE_URL}/api/streets`, { headers }), // Assuming this endpoint exists
      ]);

      setTrucks(trucksRes.data.trucks || []);
      setStaff(staffRes.data.staff || []);
      setStreets(streetsRes.data.streets || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const getTruckLabel = (truckId) => {
    const truck = trucks.find(t => t._id === truckId);
    return truck ? `${truck.plate_number} - ${truck.truckModel}` : 'Select Truck';
  };

  const addTeamMember = () => {
    const newMember = { user: '', role: '', tempId: Date.now() };
    setFormData({
      ...formData,
      team_members: [...formData.team_members, newMember]
    });
  };

  const removeTeamMember = (tempId) => {
    setFormData({
      ...formData,
      team_members: formData.team_members.filter(member => member.tempId !== tempId)
    });
  };

  const updateTeamMember = (tempId, field, value) => {
    const updatedMembers = formData.team_members.map(member =>
      member.tempId === tempId ? { ...member, [field]: value } : member
    );
    setFormData({ ...formData, team_members: updatedMembers });
  };

  const toggleStreet = (streetId) => {
    const isSelected = formData.street_ids.includes(streetId);
    const updatedStreets = isSelected
      ? formData.street_ids.filter(id => id !== streetId)
      : [...formData.street_ids, streetId];
    
    setFormData({ ...formData, street_ids: updatedStreets });
  };

  const validateForm = () => {
    if (!formData.route_name.trim()) {
      Alert.alert('Error', 'Route name is required');
      return false;
    }
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

    // Check if team has supervisor
    const hasSupervisor = formData.team_members.some(member => member.role === 'supervisor');
    if (!hasSupervisor) {
      Alert.alert('Error', 'Team must have a supervisor');
      return false;
    }

    // Check if all team members are complete
    const incompleteMembers = formData.team_members.some(member => !member.user || !member.role);
    if (incompleteMembers) {
      Alert.alert('Error', 'All team members must have a user and role selected');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Remove tempId from team members before sending
      const cleanTeamMembers = formData.team_members.map(({ tempId, ...member }) => member);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/trucks/assign-route`,
        {
          truck_id: formData.truck_id,
          team_members: cleanTeamMembers,
          street_ids: formData.street_ids,
          scheduled_date: formData.scheduled_date,
          route_name: formData.route_name,
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
      route_name: '',
      truck_id: '',
      scheduled_date: '',
      team_members: [],
      street_ids: [],
    });
    setShowTruckOptions(false);
    setShowStaffOptions(false);
    setShowStreetOptions(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* ROUTE DETAILS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Route Details</Text>
            <Text style={styles.sectionSubtitle}>Basic route information</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Route Name *</Text>
            <View style={styles.outlineInput}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter route name"
                placeholderTextColor="#9CA3AF"
                value={formData.route_name}
                onChangeText={(text) => handleInputChange('route_name', text)}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Scheduled Date *</Text>
            <View style={styles.outlineInput}>
              <Text style={styles.inputIcon}>📅</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                value={formData.scheduled_date}
                onChangeText={(text) => handleInputChange('scheduled_date', text)}
              />
            </View>
          </View>
        </View>

        {/* TRUCK SELECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Truck Selection</Text>
            <Text style={styles.sectionSubtitle}>Choose truck for this route</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Truck *</Text>
            <TouchableOpacity
              style={styles.outlineInput}
              onPress={() => setShowTruckOptions(!showTruckOptions)}
            >
              <Text style={styles.inputIcon}>🚛</Text>
              <Text style={[
                styles.inputText,
                !formData.truck_id && styles.placeholderText
              ]}>
                {getTruckLabel(formData.truck_id)}
              </Text>
              <Text style={styles.dropdownArrow}>
                {showTruckOptions ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showTruckOptions && (
              <View style={styles.optionsContainer}>
                {trucks.map((truck) => (
                  <TouchableOpacity
                    key={truck._id}
                    style={[
                      styles.optionItem,
                      formData.truck_id === truck._id && styles.selectedOption
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, truck_id: truck._id });
                      setShowTruckOptions(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.truck_id === truck._id && styles.selectedOptionText
                    ]}>
                      {truck.plate_number} - {truck.truckModel} ({truck.truckCapacity}t)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* TEAM MEMBERS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Team Members</Text>
            <Text style={styles.sectionSubtitle}>Assign team to this route</Text>
          </View>

          {formData.team_members.map((member) => (
            <View key={member.tempId} style={styles.teamMemberCard}>
              <View style={styles.teamMemberRow}>
                <View style={styles.teamMemberSelect}>
                  <Text style={styles.smallLabel}>Staff Member</Text>
                  <View style={styles.smallInput}>
                    <Text>👤</Text>
                    <Text style={styles.inputText}>
                      {staff.find(s => s._id === member.user)?.full_name || 'Select Staff'}
                    </Text>
                  </View>
                </View>
                <View style={styles.teamMemberSelect}>
                  <Text style={styles.smallLabel}>Role</Text>
                  <View style={styles.smallInput}>
                    <Text>👔</Text>
                    <Text style={styles.inputText}>
                      {roles.find(r => r.value === member.role)?.label || 'Select Role'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeTeamMember(member.tempId)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={addTeamMember}
          >
            <Text style={styles.addButtonText}>+ Add Team Member</Text>
          </TouchableOpacity>
        </View>

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
                  formData.street_ids.includes(street._id) && styles.selectedStreetChip
                ]}
                onPress={() => toggleStreet(street._id)}
              >
                <Text style={[
                  styles.streetChipText,
                  formData.street_ids.includes(street._id) && styles.selectedStreetChipText
                ]}>
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
            >
              <Text style={styles.assignButtonText}>
                {loading ? 'Assigning...' : 'Assign Route'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={resetForm}
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  outlineInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  smallInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    flex: 1,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  optionsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedOption: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedOptionText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  teamMemberCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teamMemberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  teamMemberSelect: {
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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