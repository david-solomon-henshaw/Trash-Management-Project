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
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appClient from '../../../hooks/services/client';

// Theme constants
const COLORS = {
  primary: '#16A085',
  secondary: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

export default function ApartmentTypesScreen() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);

  const [showApartmentModal, setShowApartmentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apartmentTypes, setApartmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apartmentForm, setApartmentForm] = useState({
    name: '',
    base_fee: '',
  });

  useEffect(() => {
    fetchApartmentTypes();
  }, []);

  const fetchApartmentTypes = async () => {
    try {
      const response = await appClient.get('/apartment-types');
      setApartmentTypes(response.data.apartmentTypes || []);
    } catch (error) {
      console.error('Error fetching apartment types:', error);
      Alert.alert('Error', 'Failed to fetch apartment types. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApartmentSubmit = async () => {
    if (!apartmentForm.name.trim() || !apartmentForm.base_fee.trim()) {
      Alert.alert('Validation Error', 'Name and base fee are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await appClient.post('/apartment-types', apartmentForm);
      Alert.alert('Success', `Apartment Type "${apartmentForm.name}" added successfully!`);
      setShowApartmentModal(false);
      setApartmentForm({ name: '', base_fee: '' });
      fetchApartmentTypes();
    } catch (error) {
      console.error('Error adding apartment type:', error);
      Alert.alert('Error', 'Failed to add apartment type. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderApartmentType = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemFee}>Base Fee: ₦{item.base_fee?.toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              accessible
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.logoGradient}
              >
                <Ionicons name="business" size={18} color="white" />
              </LinearGradient>
              <Text style={styles.logoText}>CleanHaul</Text>
            </View>
            <View style={styles.userInfoRight}>
              {user?.companyName && (
                <Text style={styles.companyName}>{user.companyName}</Text>
              )}
              <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'ADMIN'}</Text>
              <Text style={styles.staffName}>{user?.full_name || 'User'}</Text>
            </View>
          </View>
          <Text style={styles.headline}>Apartment Types</Text>
          <Text style={styles.subheadline}>Manage apartment categories and pricing</Text>
        </View>

        {/* Add Button Card */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowApartmentModal(true)}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.addButtonText}>Add Apartment Type</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* List Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Apartment Types List</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loadingIndicator} />
          ) : apartmentTypes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color={COLORS.gray[300]} />
              <Text style={styles.emptyTitle}>No apartment types found</Text>
              <Text style={styles.emptyText}>Tap the button above to add your first type.</Text>
            </View>
          ) : (
            <FlatList
              data={apartmentTypes}
              renderItem={renderApartmentType}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.tagline}>CLEAN • SMART • RELIABLE</Text>
          <Text style={styles.copyright}>© 2026 CleanHaul • B2B Waste Operations</Text>
        </View>
      </ScrollView>

      {/* Add Apartment Type Modal */}
      <Modal
        visible={showApartmentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApartmentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Apartment Type</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowApartmentModal(false);
                  setApartmentForm({ name: '', base_fee: '' });
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.gray[500]} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name (e.g., Studio, 1 Bedroom)"
              placeholderTextColor={COLORS.gray[400]}
              value={apartmentForm.name}
              onChangeText={(text) => setApartmentForm({ ...apartmentForm, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Base Fee (e.g., 1000)"
              placeholderTextColor={COLORS.gray[400]}
              value={apartmentForm.base_fee}
              onChangeText={(text) => setApartmentForm({ ...apartmentForm, base_fee: text })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowApartmentModal(false);
                  setApartmentForm({ name: '', base_fee: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleApartmentSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
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
    backgroundColor: '#ffffff',
  },
  blob: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.15,
  },
  blob1: {
    top: -150,
    left: -150,
    backgroundColor: COLORS.primary,
  },
  blob2: {
    bottom: -150,
    right: -150,
    backgroundColor: COLORS.secondary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'column',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  logoGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginLeft: 10,
  },
  companyName: {
    fontSize: 11,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  staffName: {
    fontSize: 11,
    color: COLORS.gray[800],
    fontWeight: '600',
  },
  userInfoRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[800],
    letterSpacing: -0.3,
    marginTop: 12,
  },
  subheadline: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginLeft: 8,
  },
  addButton: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listItem: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  itemInfo: {
    flexDirection: 'column',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  itemFee: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  loadingIndicator: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray[400],
    letterSpacing: 2,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 9,
    color: COLORS.gray[300],
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.gray[800],
    backgroundColor: COLORS.gray[50],
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[100],
  },
  cancelButtonText: {
    color: COLORS.gray[600],
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});