import React, { useState } from 'react';
import {
    Alert, StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import appClient from '../hooks/services/client'
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setUser } from '@/hooks/store/slices/authSlice';


const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

export default function Index() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch()

    const handleLogin = async (email, password) => {
        try {
            if (!email || !password) {
                Alert.alert('Error', 'Please fill in all fields');
                return;
            }

            const response = await appClient.post('/staff/signin', { email, password });

            const { token } = response.data;

            // Decode token to get the role
            let userRole;
            try {
                const decoded = jwtDecode(token);
                userRole = decoded.user?.role;
                dispatch(setUser({
                    id: decoded.user.id,
                    role: decoded.user.role,
                    full_name: decoded.user.full_name,
                    companyId: decoded.user.companyId,
                    companyName: decoded.user.CompanyName
                }));

            } catch (decodeError) {
                // console.log('Token decode error:', decodeError);
                Alert.alert('Error', 'Failed to read login token');
                return;
            }

            if (!userRole) {
                // console.log('Role is missing from token');
                Alert.alert('Error', 'User role not found in token');
                return;
            }

            // Store the token
            await AsyncStorage.setItem('userToken', token);


            // Map only valid login roles to routes
            const roleRouteMap = {
                'admin': '/admin',
                'supervisor': '/supervisor',
                'csr': '/csr'
            };

            const route = roleRouteMap[userRole];

            if (!route) {
                Alert.alert('Access Denied', `Role "${userRole}" is not authorized to access this app`);
                return;
            }

            // console.log('Navigating to:', route);
            router.replace(route);

        } catch (error) {
            // console.log("--- LOGIN ERROR DEBUG --");
            // console.log("Full error:", error);

            if (error.response) {
                // console.log("Status Data:", error.response.data);
                // console.log("Status Code:", error.response.status);
                Alert.alert('Login Failed', error.response.data.message || error.response.data);
            } else if (error.request) {
                // console.log("No response received:", error.request);
                Alert.alert('Error', 'Server is unreachable. Check your connection.');
            } else {
                // console.log("Error Message:", error.message);
            }
            // console.log("---------"
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            {/* --- BACKGROUND BLOBS (Replicating the CSS Blobs) --- */}
            <View style={[styles.blob, styles.blob1]} />
            <View style={[styles.blob, styles.blob2]} />

            <View style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    {/* --- MAIN GLASS CARD --- */}
                    <BlurView intensity={60} tint="light" style={styles.glassCard}>

                        {/* Header: Logo + Brand */}
                        <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                            <View style={styles.headerRow}>
                                <View style={styles.logoContainer}>
                                    <View style={styles.logoCircle}>
                                        <FontAwesome5 name="recycle" size={isTablet ? 22 : 18} color="white" />
                                    </View>
                                    <Text style={styles.brandName}>CleanHaul</Text>
                                </View>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>B2B • WASTE</Text>
                                </View>
                            </View>
                        </View>

                        {/* Welcome Text */}
                        <View style={styles.welcomeSection}>
                            <Text style={styles.title}>Welcome back</Text>
                            <Text style={styles.subtitle}>Sign in to your company dashboard.</Text>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.form}>
                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <FontAwesome5 name="user" size={isTablet ? 18 : 14} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email or username"
                                    placeholderTextColor="#94a3b8"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <FontAwesome5 name="lock" size={isTablet ? 18 : 14} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <FontAwesome5
                                        name={showPassword ? "eye" : "eye-slash"}
                                        size={isTablet ? 18 : 14}
                                        color="#94a3b8"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Options: Remember & Forgot */}
                            <View style={styles.optionsRow}>
                                <TouchableOpacity style={styles.checkboxRow}>
                                    <View style={[styles.checkbox, isTablet && { width: 20, height: 20 }]} />
                                    <Text style={styles.optionText}>Remember me</Text>
                                </TouchableOpacity>
                                <TouchableOpacity>
                                    <Text style={[styles.optionText, { color: '#16A085', fontWeight: '600' }]}>
                                        Forgot password?
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Sign In Button */}
                            <TouchableOpacity
                                style={styles.signInButton}
                                onPress={() => handleLogin(email, password)}
                            >
                                <Text style={styles.signInButtonText}>Sign In</Text>
                                <FontAwesome5 name="arrow-right" size={isTablet ? 16 : 14} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Create Account Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>New to CleanHaul?</Text>
                            <TouchableOpacity onPress={() => router.push('/register')}>
                                <Text style={styles.linkText}> Create company account →</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Tagline */}
                        <Text style={styles.tagline}>CLEAN • SMART • RELIABLE</Text>
                        <Text style={styles.copyright}>© 2026 CleanHaul • B2B Waste Operations</Text>

                    </BlurView>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Blobs to match your HTML floatBlob animation
    blob: {
        position: 'absolute',
        width: isTablet ? 500 : 350,
        height: isTablet ? 500 : 350,
        borderRadius: isTablet ? 250 : 175,
        opacity: 0.4,
    },
    blob1: {
        top: isTablet ? -150 : -100,
        left: isTablet ? -150 : -100,
        backgroundColor: '#16A085', // Teal
    },
    blob2: {
        bottom: isTablet ? -150 : -100,
        right: isTablet ? -150 : -100,
        backgroundColor: '#f59e0b', // Amber
    },
    safeArea: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    keyboardView: {
        width: '90%',
        maxWidth: isTablet ? 600 : 400,
    },
    glassCard: {
        padding: isTablet ? 32 : 24,
        borderRadius: isTablet ? 40 : 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        overflow: 'hidden', // Required for border radius with BlurView
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoCircle: {
        width: isTablet ? 44 : 36,
        height: isTablet ? 44 : 36,
        borderRadius: isTablet ? 22 : 18,
        backgroundColor: '#16A085',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    brandName: {
        fontSize: isTablet ? 24 : 20,
        fontWeight: '700',
        color: '#1e293b',
        marginLeft: 8,
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        paddingHorizontal: isTablet ? 14 : 12,
        paddingVertical: isTablet ? 6 : 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: isTablet ? 12 : 10,
        fontWeight: '800',
        color: '#64748b',
    },
    welcomeSection: {
        marginBottom: isTablet ? 32 : 24,
    },
    title: {
        fontSize: isTablet ? 32 : 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: isTablet ? 16 : 14,
        color: '#64748b',
        marginTop: 4,
    },
    form: {
        gap: isTablet ? 20 : 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: isTablet ? 16 : 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: isTablet ? 20 : 16,
        height: isTablet ? 64 : 56,
    },
    inputIcon: {
        marginRight: isTablet ? 14 : 12,
    },
    input: {
        flex: 1,
        fontSize: isTablet ? 18 : 16,
        color: '#1e293b',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: isTablet ? 8 : 4,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: isTablet ? 18 : 16,
        height: isTablet ? 18 : 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        marginRight: isTablet ? 10 : 8,
    },
    optionText: {
        fontSize: isTablet ? 14 : 12,
        color: '#64748b',
    },
    signInButton: {
        backgroundColor: '#16A085',
        height: isTablet ? 64 : 56,
        borderRadius: isTablet ? 32 : 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isTablet ? 12 : 10,
        marginTop: isTablet ? 15 : 10,
        shadowColor: '#16A085',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    signInButtonText: {
        color: 'white',
        fontSize: isTablet ? 18 : 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: isTablet ? 30 : 24,
    },
    footerText: {
        fontSize: isTablet ? 14 : 12,
        color: '#64748b',
    },
    linkText: {
        fontSize: isTablet ? 14 : 12,
        color: '#16A085',
        fontWeight: 'bold',
    },
    tagline: {
        textAlign: 'center',
        fontSize: isTablet ? 12 : 10,
        color: '#94a3b8',
        letterSpacing: 2,
        marginTop: isTablet ? 30 : 24,
    },
    copyright: {
        textAlign: 'center',
        fontSize: isTablet ? 10 : 9,
        color: '#cbd5e1',
        marginTop: 8,
    },
});