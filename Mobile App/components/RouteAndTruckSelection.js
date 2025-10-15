import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const RouteAndTruckSelection = ({
  formData,
  handleInputChange,
  trucks,
  showTruckOptions,
  setShowTruckOptions,
}) => {
  // Helper function to get truck display label
  const getTruckLabel = (truckId) => {
    const truck = trucks.find(t => t._id === truckId);
    return truck ? `${truck.plate_number} - ${truck.truckModel}` : 'Select Truck';
  };

  return (
    <>
      {/* ROUTE DETAILS */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <Text style={styles.sectionSubtitle}>Basic route information</Text>
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
              accessible={true}
              accessibilityLabel="Scheduled Date"
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
            accessible={true}
            accessibilityLabel="Select Truck"
          >
            <Text style={styles.inputIcon}>🚛</Text>
            <Text
              style={[
                styles.inputText,
                !formData.truck_id && styles.placeholderText,
              ]}
            >
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
                    formData.truck_id === truck._id && styles.selectedOption,
                  ]}
                  onPress={() => {
                    handleInputChange('truck_id', truck._id);
                    setShowTruckOptions(false);
                  }}
                  accessible={true}
                  accessibilityLabel={`Select ${truck.plate_number} - ${truck.truckModel}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.truck_id === truck._id && styles.selectedOptionText,
                    ]}
                  >
                    {truck.plate_number} - {truck.truckModel} ({truck.truckCapacity}t)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default RouteAndTruckSelection;