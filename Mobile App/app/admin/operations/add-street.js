import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import appClient from '../../../hooks/services/client';

const COLORS = {
  primary: '#16A085',
  secondary: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
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

export default function AddStreetForm() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({ streetName: '', details: '' });
  const [loading, setLoading] = useState(false);

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
      await appClient.post('/street/create', {
        streetName: formData.streetName.trim(),
        details: formData.details.trim(),
      });
      Alert.alert(
        'Success',
        `Street "${formData.streetName}" has been added successfully!`,
        [
          { text: 'Add Another', onPress: resetForm },
          { text: 'Done', onPress: () => router.back(), style: 'cancel' },
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
    setFormData({ streetName: '', details: '' });
  };

  const handleCancel = () => {
    if (formData.streetName.trim() || formData.details.trim()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', onPress: () => router.back(), style: 'destructive' },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.logoGradient}>
                <Ionicons name="map" size={18} color="white" />
              </LinearGradient>
              <Text style={styles.logoText}>CleanHaul</Text>
            </View>
            <View style={styles.userInfoRight}>
              {user?.companyName && <Text style={styles.companyName}>{user.companyName}</Text>}
              <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'ADMIN'}</Text>
              <Text style={styles.staffName}>{user?.full_name || 'User'}</Text>
            </View>
          </View>
          <Text style={styles.headline}>Add Street</Text>
          <Text style={styles.subheadline}>Register a new street location</Text>
        </View>

        {/* Form Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Street Information</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Street Name *</Text>
            <View style={[styles.inputContainer, formData.streetName && styles.inputFilled]}>
              <Ionicons name="location" size={18} color={COLORS.gray[500]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter street name (e.g., Main Street)"
                placeholderTextColor={COLORS.gray[400]}
                value={formData.streetName}
                onChangeText={(text) => handleInputChange('streetName', text)}
                maxLength={100}
                autoCapitalize="words"
              />
            </View>
            <Text style={styles.helperText}>{formData.streetName.length}/100 characters</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Additional Details</Text>
            <View style={[styles.inputContainer, formData.details && styles.inputFilled]}>
              <Ionicons name="document-text" size={18} color={COLORS.gray[500]} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter additional details (e.g., landmarks)"
                placeholderTextColor={COLORS.gray[400]}
                value={formData.details}
                onChangeText={(text) => handleInputChange('details', text)}
                maxLength={500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.helperText}>{formData.details.length}/500 characters • Optional</Text>
          </View>

          {/* Preview */}
          {(formData.streetName.trim() || formData.details.trim()) && (
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>
                  {formData.streetName.trim() || 'Street Name'}
                </Text>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>NEW</Text>
                </View>
              </View>
              {formData.details.trim() && (
                <Text style={styles.previewDetails}>{formData.details}</Text>
              )}
              <Text style={styles.previewFooter}>
                Created on {new Date().toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.sectionCard}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Add Street</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={resetForm}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Clear Form</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb" size={20} color={COLORS.secondary} />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Tips</Text>
            <Text style={styles.tipsText}>
              • Use clear, recognizable street names{'\n'}
              • Include landmarks or notable features in details{'\n'}
              • Double-check spelling before submitting
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.tagline}>CLEAN • SMART • RELIABLE</Text>
          <Text style={styles.copyright}>© 2026 CleanHaul • B2B Waste Operations</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
  blob1: { top: -150, left: -150, backgroundColor: COLORS.primary },
  blob2: { bottom: -150, right: -150, backgroundColor: COLORS.secondary },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  header: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray[100], justifyContent: 'center', alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 8 },
  logoGradient: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 18, fontWeight: '700', color: COLORS.gray[800], marginLeft: 10 },
  companyName: { fontSize: 11, color: COLORS.gray[500], fontWeight: '500' },
  roleText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  staffName: { fontSize: 11, color: COLORS.gray[800], fontWeight: '600' },
  userInfoRight: { alignItems: 'flex-end', gap: 2 },
  headline: { fontSize: 18, fontWeight: '700', color: COLORS.gray[800], letterSpacing: -0.3, marginTop: 12 },
  subheadline: { fontSize: 14, color: COLORS.gray[500], marginTop: 2 },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[700], marginLeft: 8 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.gray[600], marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  inputFilled: { borderColor: COLORS.primary, backgroundColor: '#f0fdfa' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.gray[800] },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  helperText: { fontSize: 12, color: COLORS.gray[500], marginTop: 4, marginLeft: 4 },
  previewCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  previewTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray[800] },
  previewBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  previewBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  previewDetails: { fontSize: 14, color: COLORS.gray[600], marginBottom: 8, lineHeight: 20 },
  previewFooter: { fontSize: 12, color: COLORS.gray[400], fontStyle: 'italic' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
  primaryButton: { backgroundColor: COLORS.primary },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: 'white', borderWidth: 1, borderColor: COLORS.gray[200] },
  secondaryButtonText: { color: COLORS.gray[600], fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
  tipsCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  tipsContent: { flex: 1 },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: '#0369a1', marginBottom: 4 },
  tipsText: { fontSize: 13, color: '#075985', lineHeight: 18 },
  footer: { alignItems: 'center', paddingVertical: 16 },
  tagline: { fontSize: 10, fontWeight: '800', color: COLORS.gray[400], letterSpacing: 2, marginBottom: 4 },
  copyright: { fontSize: 9, color: COLORS.gray[300] },
});