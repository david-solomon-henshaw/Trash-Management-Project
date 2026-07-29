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
import { useRouter } from 'expo-router';
import appClient from '../../../hooks/services/client';
import { useSelector } from 'react-redux';
import TrialModal from '../../../components/modals/TrialModal';

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
  brown: '#8B4513',
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

const Staffs = () => {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);

   const [isTrialModalVisible, setIsTrialModalVisible] = useState(false);

  // 👇 Determine if user is on trial
  const isTrial = user?.subStatus === 'trial';

  // 👇 Show modal on mount if trial
  useEffect(() => {
    if (isTrial) {
      setIsTrialModalVisible(true);
    }
  }, [isTrial]);

  const [formData, setFormData] = useState({
    role: '',
    full_name: '',
    tel: '',
    email: '',
    username: '',
    password: '',
  });

  const [showLoginFields, setShowLoginFields] = useState(true);
  const [showRoleOptions, setShowRoleOptions] = useState(false);

  const roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Customer Care', value: 'customer care' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Field Agent', value: 'field_agent' },
    { label: 'Driver', value: 'driver' },
  ];

  const roleDescriptions = {
    admin: 'Full system access including all management functions and reports.',
    'customer care': 'Access to customer management, payment tracking, and support functions.',
    supervisor: 'Access to fleet management, route assignments, and staff oversight.',
    driver: 'This role does not require app login access. Driver will follow truck assignments without needing username/password.',
    field_agent: 'This role does not require app login access. Field agent will work in the field without needing username/password.',
  };

  const getRoleLabel = (roleValue) => {
    const role = roles.find((r) => r.value === roleValue);
    return role ? role.label : 'Select Role';
  };

  const handleRoleChange = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
    if (selectedRole === 'driver' || selectedRole === 'field_agent') {
      setShowLoginFields(false);
      setFormData((prev) => ({
        ...prev,
        role: selectedRole,
        email: '',
        username: '',
        password: '',
      }));
    } else {
      setShowLoginFields(true);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    if (!formData.role || !formData.full_name || !formData.tel) {
      Alert.alert('Error', 'Please fill in all required fields (Role, Full Name, Phone)');
      return false;
    }
    if (showLoginFields && (!formData.email || !formData.username || !formData.password)) {
      Alert.alert('Error', 'Please fill in all login credentials (Email, Username, Password)');
      return false;
    }
    if (formData.tel.length < 11) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    if (showLoginFields && !formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const response = await appClient.post('/staff/signup', formData);
      if (response.status === 201) {
        Alert.alert('Success', response.data.message || 'Staff account created successfully!', [
          { text: 'OK', onPress: resetForm },
        ]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
      Alert.alert('Error', errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      role: '',
      full_name: '',
      tel: '',
      email: '',
      username: '',
      password: '',
    });
    setShowLoginFields(true);
    setShowRoleOptions(false);
  };

  const handleBackPress = () => {
    router.push('/admin/operations');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - matches other admin screens */}
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
                <Ionicons name="person-add" size={18} color="white" />
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
          <Text style={styles.headline}>Create Staff Account</Text>
          <Text style={styles.subheadline}>Add new team members to the system</Text>
        </View>

        {/* Form Content */}
        <View style={styles.form}>

          {/* SECTION 1: ROLE SELECTION */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Role Selection</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Choose staff position</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Staff Role *</Text>
              <TouchableOpacity
                style={styles.outlineInput}
                onPress={() => setShowRoleOptions(!showRoleOptions)}
              >
                <Ionicons name="person" size={18} color={COLORS.gray[500]} style={styles.inputIcon} />
                <Text
                  style={[
                    styles.inputText,
                    !formData.role && styles.placeholderText,
                  ]}
                >
                  {getRoleLabel(formData.role)}
                </Text>
                <Ionicons
                  name={showRoleOptions ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.gray[500]}
                />
              </TouchableOpacity>

              {showRoleOptions && (
                <View style={styles.roleOptions}>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      style={[
                        styles.roleOption,
                        formData.role === role.value && styles.selectedRole,
                      ]}
                      onPress={() => {
                        handleRoleChange(role.value);
                        setShowRoleOptions(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          formData.role === role.value && styles.selectedRoleText,
                        ]}
                      >
                        {role.label}
                      </Text>
                      {formData.role === role.value && (
                        <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {formData.role && (
              <View style={styles.roleInfo}>
                <Text style={styles.roleInfoTitle}>
                  {formData.role === 'admin' && 'Admin Role'}
                  {formData.role === 'customer care' && 'Customer Care Role'}
                  {formData.role === 'supervisor' && 'Supervisor Role'}
                  {formData.role === 'driver' && 'Driver Role'}
                  {formData.role === 'field_agent' && 'Field Agent Role'}
                </Text>
                <Text style={styles.roleInfoText}>
                  {roleDescriptions[formData.role]}
                </Text>
              </View>
            )}
          </View>

          {/* SECTION 2: PERSONAL INFORMATION */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="id-card" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Basic details</Text>

            <View style={styles.inputRow}>
              <View style={[styles.formGroup, { flex: 2 }]}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.outlineInput}>
                  <Ionicons name="person" size={18} color={COLORS.gray[500]} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter full name"
                    placeholderTextColor={COLORS.gray[400]}
                    value={formData.full_name}
                    onChangeText={(text) => handleInputChange('full_name', text)}
                    editable={!isTrial}  
                />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1.2, marginLeft: 12 }]}>
                <Text style={styles.label}>Phone Number *</Text>
                <View style={styles.outlineInput}>
                  <Ionicons name="call" size={18} color={COLORS.gray[500]} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Phone"
                    placeholderTextColor={COLORS.gray[400]}
                    value={formData.tel}
                    onChangeText={(text) => handleInputChange('tel', text)}
                    keyboardType="phone-pad"
                      editable={!isTrial}  
                  />
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 3: LOGIN CREDENTIALS */}
          {showLoginFields && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Login Credentials</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Account access details</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <View style={styles.outlineInput}>
                  <Ionicons name="mail" size={18} color={COLORS.gray[500]} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter email address"
                    placeholderTextColor={COLORS.gray[400]}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                      editable={!isTrial}  
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Username *</Text>
                  <View style={styles.outlineInput}>
                    <Ionicons name="person" size={18} color={COLORS.gray[500]} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Username"
                      placeholderTextColor={COLORS.gray[400]}
                      value={formData.username}
                      onChangeText={(text) => handleInputChange('username', text)}
                      autoCapitalize="none"
                        editable={!isTrial}  
                    />
                  </View>
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.label}>Initial Password *</Text>
                  <View style={styles.outlineInput}>
                    <Ionicons name="key" size={18} color={COLORS.gray[500]} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Password"
                      placeholderTextColor={COLORS.gray[400]}
                      value={formData.password}
                      onChangeText={(text) => handleInputChange('password', text)}
                      secureTextEntry
                        editable={!isTrial}  
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* SECTION 4: ACTION BUTTONS */}
          <View style={styles.sectionCard}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
              style={[styles.actionButton, styles.createButton, isTrial && styles.disabledButton]}
                onPress={isTrial ? () => setIsTrialModalVisible(true) : handleSubmit}
                disabled={isTrial}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.createButtonText}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                  style={[styles.actionButton, styles.clearButton, isTrial && styles.disabledButton]}
                onPress={isTrial ? () => setIsTrialModalVisible(true) : resetForm}
                disabled={isTrial}
              >
                <Text style={styles.clearButtonText}>Clear Form</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.tagline}>CLEAN • SMART • RELIABLE</Text>
            <Text style={styles.copyright}>© 2026 CleanHaul • B2B Waste Operations</Text>
          </View>
        </View>
      </ScrollView>

        {/* 👇 Trial Modal */}
      <TrialModal
        visible={isTrialModalVisible}
        onClose={() => setIsTrialModalVisible(false)}
        onSubscribe={() => {
          // Navigate to subscription screen later
          setIsTrialModalVisible(false);
          // e.g., router.push('/subscription');
        }}
      />
    </SafeAreaView>
  );
};
 
const styles = StyleSheet.create({
    
    disabledInput: {
    backgroundColor: COLORS.gray[100],
    opacity: 0.7,
  },
  disabledButton: {
    opacity: 0.5,
  },
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
  form: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 4,
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
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 16,
    marginLeft: 28,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  outlineInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    backgroundColor: COLORS.gray[50],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[800],
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[800],
  },
  placeholderText: {
    color: COLORS.gray[400],
  },
  roleOptions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  selectedRole: {
    backgroundColor: `${COLORS.primary}10`,
  },
  roleOptionText: {
    fontSize: 16,
    color: COLORS.gray[700],
  },
  selectedRoleText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  roleInfo: {
    backgroundColor: COLORS.gray[50],
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  roleInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  roleInfoText: {
    fontSize: 13,
    color: COLORS.gray[600],
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: COLORS.gray[600],
    fontSize: 16,
    fontWeight: '600',
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
});

export default Staffs;