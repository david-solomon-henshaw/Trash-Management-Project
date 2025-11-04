import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../../config'
import axios from 'axios'

const Staffs = () => {
    const navigation = useNavigation();
    
    // State variables to store form data
    const [formData, setFormData] = useState({
        role: '',
        full_name: '',
        tel: '',
        email: '',
        username: '',
        password: '',
    });

    // State to show/hide fields based on role selection
    const [showLoginFields, setShowLoginFields] = useState(true);

    // State to control role selection dropdown visibility
    const [showRoleOptions, setShowRoleOptions] = useState(false);

    // Available roles list
    const roles = [
        { label: 'CEO', value: 'ceo' },
        { label: 'Customer Care', value: 'c_care' },
        { label: 'Supervisor', value: 'supervisor' },
        { label: 'Field Agent', value: 'field_agent' },
        { label: 'Driver', value: 'driver' },
    ];

    // Function to get role display name
    const getRoleLabel = (roleValue) => {
        const role = roles.find(r => r.value === roleValue);
        return role ? role.label : 'Select Role';
    };

    const roleDescriptions = {
        ceo: 'Full system access including all management functions and reports.',
        c_care: 'Access to customer management, payment tracking, and support functions.',
        supervisor: 'Access to fleet management, route assignments, and staff oversight.',
        driver: 'This role does not require app login access. Driver will follow truck assignments without needing username/password.',
        field_agent: 'This role does not require app login access. Field agent will work in the field without needing username/password.',
    };

    // Function to handle role selection changes
    const handleRoleChange = (selectedRole) => {
        setFormData({ ...formData, role: selectedRole });

        // Hide login fields for driver and field agent
        if (selectedRole === 'driver' || selectedRole === 'field_agent') {
            setShowLoginFields(false);
            // Clear login-related fields when hidden
            setFormData(prev => ({
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

    // Function to handle form input changes
    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    // Function to validate form before submission
    const validateForm = () => {
        // Check required fields
        if (!formData.role || !formData.full_name || !formData.tel) {
            Alert.alert('Error', 'Please fill in all required fields (Role, Full Name, Phone)');
            return false;
        }

        // Check login fields if they should be visible
        if (showLoginFields && (!formData.email || !formData.username || !formData.password)) {
            Alert.alert('Error', 'Please fill in all login credentials (Email, Username, Password)');
            return false;
        }

        // Basic phone number validation
        if (formData.tel.length < 11) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return false;
        }

        // Basic email validation if email is required
        if (showLoginFields && !formData.email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }

        return true;
    };

    // Function to handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/staff/signup`,
                formData
            )
            if (response.status === 201) {
                console.log(response)
                Alert.alert('Success', response.data.message || 'Staff account created successfully!', [
                    { text: 'OK', onPress: () => resetForm() }
                ]);
            }
        } 
        catch (error) {
            console.log(error)
            const errorMessage = error.response?.data?.message || error.message || 'Network error';
            Alert.alert('Error', errorMessage);
        }
    };

    // Function to reset the form
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

    // Function to handle back navigation
    const handleBackPress = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />

            {/* Header with Back Button */}
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={handleBackPress}
                        accessible={true}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Create Staff Account</Text>
                        <Text style={styles.headerSubtitle}>Add new team members to the system</Text>
                    </View>
                </View>
            </View>

            {/* Form Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>

                    {/* SECTION 1: ROLE SELECTION */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Role Selection</Text>
                            <Text style={styles.sectionSubtitle}>Choose staff position</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Staff Role *</Text>

                            {/* Current Selection Display */}
                            <TouchableOpacity
                                style={styles.outlineInput}
                                onPress={() => setShowRoleOptions(!showRoleOptions)}
                            >
                                <Text style={styles.inputIcon}>👤</Text>
                                <Text style={[
                                    styles.inputText,
                                    !formData.role && styles.placeholderText
                                ]}>
                                    {getRoleLabel(formData.role)}
                                </Text>
                                <Text style={styles.dropdownArrow}>
                                    {showRoleOptions ? '▲' : '▼'}
                                </Text>
                            </TouchableOpacity>

                            {/* Role Options */}
                            {showRoleOptions && (
                                <View style={styles.roleOptions}>
                                    {roles.map((role) => (
                                        <TouchableOpacity
                                            key={role.value}
                                            style={[
                                                styles.roleOption,
                                                formData.role === role.value && styles.selectedRole
                                            ]}
                                            onPress={() => {
                                                handleRoleChange(role.value);
                                                setShowRoleOptions(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.roleOptionText,
                                                formData.role === role.value && styles.selectedRoleText
                                            ]}>
                                                {role.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Role Information Display */}
                        {formData.role && (
                            <View style={styles.roleInfo}>
                                <Text style={styles.roleInfoTitle}>
                                    {formData.role === 'ceo' && 'CEO Role'}
                                    {formData.role === 'c_care' && 'Customer Care Role'}
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
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Personal Information</Text>
                            <Text style={styles.sectionSubtitle}>Basic details</Text>
                        </View>

                        {/* Full Name and Phone Row */}
                        <View style={styles.inputRow}>
                            <View style={[styles.formGroup, { flex: 2 }]}>
                                <Text style={styles.label}>Full Name *</Text>
                                <View style={styles.outlineInput}>
                                    <Text style={styles.inputIcon}>👤</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Enter full name"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.full_name}
                                        onChangeText={(text) => handleInputChange('full_name', text)}
                                    />
                                </View>
                            </View>

                            <View style={[styles.formGroup, { flex: 1.2, marginLeft: 12 }]}>
                                <Text style={styles.label}>Phone Number *</Text>
                                <View style={styles.outlineInput}>
                                    <Text style={styles.inputIcon}>📱</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Tel"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.tel}
                                        onChangeText={(text) => handleInputChange('tel', text)}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* SECTION 3: LOGIN CREDENTIALS (Hidden for driver and field_agent) */}
                    {showLoginFields && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Login Credentials</Text>
                                <Text style={styles.sectionSubtitle}>Account access details</Text>
                            </View>

                            {/* Email Address */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Email Address *</Text>
                                <View style={styles.outlineInput}>
                                    <Text style={styles.inputIcon}>✉️</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Enter email address"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.email}
                                        onChangeText={(text) => handleInputChange('email', text)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            {/* Username and Password Row */}
                            <View style={styles.inputRow}>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Username *</Text>
                                    <View style={styles.outlineInput}>
                                        <Text style={styles.inputIcon}>👤</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Username"
                                            placeholderTextColor="#9CA3AF"
                                            value={formData.username}
                                            onChangeText={(text) => handleInputChange('username', text)}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                                    <Text style={styles.label}>Initial Password *</Text>
                                    <View style={styles.outlineInput}>
                                        <Text style={styles.inputIcon}>🔒</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Password"
                                            placeholderTextColor="#9CA3AF"
                                            value={formData.password}
                                            onChangeText={(text) => handleInputChange('password', text)}
                                            secureTextEntry
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* SECTION 4: ACTION BUTTONS */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.createButton]}
                                onPress={handleSubmit}
                            >
                                <Text style={styles.createButtonText}>Create Account</Text>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // Main container
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    // Header styles
    header: {
        backgroundColor: '#2E8B57',
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 4,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '400',
    },

    // Content and form styles
    content: {
        flex: 1,
    },
    form: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },

    // Section containers
    sectionContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },

    // Section headers
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

    // Form group and input styles
    formGroup: {
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },

    // Outlined input styles
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
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 8,
    },

    // Role selector styles
    roleOptions: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
    },
    roleOption: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    selectedRole: {
        backgroundColor: '#EFF6FF',
    },
    roleOptionText: {
        fontSize: 16,
        color: '#374151',
    },
    selectedRoleText: {
        color: '#2563EB',
        fontWeight: '600',
    },

    // Role information styles
    roleInfo: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 8,
        marginTop: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2E8B57',
    },
    roleInfoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E8B57',
        marginBottom: 6,
    },
    roleInfoText: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },

    // Button styles
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
    createButton: {
        backgroundColor: '#2E8B57',
    },
    createButtonText: {
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

export default Staffs;