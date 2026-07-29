import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RouteAndTruckSelection = ({
  formData,
  handleInputChange,
  trucks,
  showTruckOptions,
  setShowTruckOptions,
}) => {
  const getTruckLabel = (truckId) => {
    const truck = trucks.find((t) => t._id === truckId);
    return truck ? `${truck.plate_number} - ${truck.truckModel}` : 'Select Truck';
  };

  const getTruckStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return { icon: 'checkmark-circle', color: '#10b981' };
      case 'maintenance':
        return { icon: 'build', color: '#f59e0b' };
      case 'inactive':
        return { icon: 'close-circle', color: '#ef4444' };
      default:
        return { icon: 'help-circle', color: '#6b7280' };
    }
  };

  return (
    <>
      {/* ROUTE DETAILS */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: 'rgba(22, 160, 133, 0.1)' }]}>
            <Ionicons name="calendar" size={20} color="#16A085" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Route Schedule</Text>
            <Text style={styles.sectionSubtitle}>Plan your delivery timeline</Text>
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Scheduled Date *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={formData.scheduled_date}
              onChangeText={(text) => handleInputChange('scheduled_date', text)}
            />
          </View>
          <Text style={styles.helperText}>Format: Year-Month-Day (2024-12-31)</Text>
        </View>
      </View>

      {/* TRUCK SELECTION */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="car-sport" size={20} color="#10b981" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Vehicle Assignment</Text>
            <Text style={styles.sectionSubtitle}>Choose truck for this route</Text>
          </View>
          <View style={styles.truckCount}>
            <Text style={styles.truckCountText}>{trucks.length} available</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Truck *</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setShowTruckOptions(!showTruckOptions)}
          >
            <Ionicons name="car-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <Text style={[styles.inputText, !formData.truck_id && styles.placeholderText]}>
              {getTruckLabel(formData.truck_id)}
            </Text>
            <Ionicons name={showTruckOptions ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
          </TouchableOpacity>

          {showTruckOptions && (
            <View style={styles.dropdownOptions}>
              <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                {trucks.map((truck) => {
                  const statusConfig = getTruckStatusIcon(truck.truckStatus);
                  return (
                    <TouchableOpacity
                      key={truck._id}
                      style={[styles.optionItem, formData.truck_id === truck._id && styles.selectedOption]}
                      onPress={() => {
                        handleInputChange('truck_id', truck._id);
                        setShowTruckOptions(false);
                      }}
                    >
                      <View style={styles.optionContent}>
                        <View style={styles.truckInfo}>
                          <Text style={styles.optionPlate}>{truck.plate_number}</Text>
                          <Text style={styles.optionModel}>{truck.truckModel}</Text>
                        </View>
                        <View style={styles.truckDetails}>
                          <View style={styles.capacityBadge}>
                            <Ionicons name="scale" size={12} color="#64748B" />
                            <Text style={styles.capacityText}>{truck.truckCapacity}t</Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}15` }]}>
                            <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                              {truck.truckStatus}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {formData.truck_id === truck._id && (
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {formData.truck_id && (
          <View style={styles.selectedTruckPreview}>
            <View style={styles.previewHeader}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.previewTitle}>Selected Vehicle</Text>
            </View>
            <Text style={styles.previewText}>{getTruckLabel(formData.truck_id)}</Text>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  truckCount: {
    marginLeft: 'auto',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  truckCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
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
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  inputContainer: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dropdownTrigger: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    height: '100%',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 8,
  },
  placeholderText: {
    color: '#94a3b8',
  },
  dropdownOptions: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
    maxHeight: 300,
  },
  dropdownScroll: {
    borderRadius: 12,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  optionContent: {
    flex: 1,
  },
  truckInfo: {
    marginBottom: 8,
  },
  optionPlate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  optionModel: {
    fontSize: 14,
    color: '#64748B',
  },
  truckDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  capacityText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedTruckPreview: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  previewText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
});

export default RouteAndTruckSelection;