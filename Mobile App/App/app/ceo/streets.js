import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useRouter } from 'expo-router'


export default function StreetForm({ navigation }) {
  const [formData, setFormData] = useState({
    streetName: '',
    details: '',
  });
  const [loading, setLoading] = useState(false);
    const router = useRouter()


  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('Login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('Login');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    if (!formData.streetName.trim()) {
      Alert.alert('Validation Error', 'Street name is required');
      return false;
    }
    if (formData.streetName.trim().length < 2) {
      Alert.alert('Validation Error', 'Street name must be at least 2 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/street/create`,
        {
          streetName: formData.streetName.trim(),
          details: formData.details.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert(
        'Success',
        `Street "${formData.streetName}" has been added successfully!`,
        [
          {
            text: 'Add Another',
            onPress: resetForm,
            style: 'default',
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add street. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      streetName: '',
      details: '',
    });
  };

  const handleCancel = () => {
    if (formData.streetName.trim() || formData.details.trim()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', onPress: () => navigation.goBack(), style: 'destructive' },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Add Street</Text>
            <Text style={styles.headerSubtitle}>Register a new street location</Text>
          </View>
        </View>
      </View>

      {/* Form Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* SECTION 1: STREET INFORMATION */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Street Information</Text>
              <Text style={styles.sectionSubtitle}>Enter the basic details of the street</Text>
            </View>

            {/* Street Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Street Name *</Text>
              <View style={[
                styles.outlineInput,
                formData.streetName.trim() && styles.inputWithValue
              ]}>
                <Text style={styles.inputIcon}>🛣️</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter street name (e.g., Main Street, Oak Avenue)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.streetName}
                  onChangeText={(text) => handleInputChange('streetName', text)}
                  accessibilityLabel="Street name input"
                  maxLength={100}
                  autoCapitalize="words"
                />
              </View>
              <Text style={styles.helperText}>
                {formData.streetName.length}/100 characters
              </Text>
            </View>

            {/* Details */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Additional Details</Text>
              <View style={[
                styles.outlineInput,
                styles.textAreaInput,
                formData.details.trim() && styles.inputWithValue
              ]}>
                <Text style={[styles.inputIcon, styles.textAreaIcon]}>📝</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter additional details (e.g., landmarks, special instructions)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.details}
                  onChangeText={(text) => handleInputChange('details', text)}
                  accessibilityLabel="Street details input"
                  maxLength={500}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              <Text style={styles.helperText}>
                {formData.details.length}/500 characters • Optional
              </Text>
            </View>
          </View>

          {/* SECTION 2: PREVIEW */}
          {(formData.streetName.trim() || formData.details.trim()) && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Preview</Text>
                <Text style={styles.sectionSubtitle}>How this street will appear</Text>
              </View>

              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>
                    {formData.streetName.trim() || 'Street Name'}
                  </Text>
                  <Text style={styles.previewBadge}>NEW</Text>
                </View>
                {formData.details.trim() && (
                  <Text style={styles.previewDetails}>{formData.details}</Text>
                )}
                <Text style={styles.previewFooter}>
                  Created on {new Date().toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}

          {/* SECTION 3: ACTION BUTTONS */}
          <View style={styles.sectionContainer}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                  loading && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={loading}
                accessibilityLabel="Add street"
              >
                <Text style={[
                  styles.primaryButtonText,
                  loading && styles.disabledButtonText
                ]}>
                  {loading ? 'Adding Street...' : '+ Add Street'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={resetForm}
                disabled={loading}
                accessibilityLabel="Clear form"
              >
                <Text style={styles.secondaryButtonText}>Clear Form</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>💡 Tips</Text>
            <Text style={styles.helpText}>
              • Use clear, recognizable street names{'\n'}
              • Include landmarks or notable features in details{'\n'}
              • Double-check spelling before submitting
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  content: {
    flex: 1,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  outlineInput: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputWithValue: {
    borderColor: '#2E8B57',
    backgroundColor: '#F0FDF4',
  },
  textAreaInput: {
    minHeight: 120,
    alignItems: 'flex-start',
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 20,
    marginTop: 2,
  },
  textAreaIcon: {
    marginTop: 0,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  previewBadge: {
    backgroundColor: '#2E8B57',
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  previewDetails: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  previewFooter: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2E8B57',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#F3F4F6',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#075985',
    lineHeight: 18,
  },
});