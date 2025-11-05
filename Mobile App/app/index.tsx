import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setIsLoading(true);
        console.log('login button pressed', username, password);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/staff/signin`, {
                username: username,
                password: password
            });

            if (response.status === 200) {
                await AsyncStorage.setItem('token', response.data.token);
                const decode = jwtDecode(response.data.token);
                const role = decode.user.role;
                router.replace(`/${role}`);
            } else {
                console.log(response);
            }
        } catch (error) {
            console.log('Error status:', error.response?.status);
            console.log('Error message:', error.response?.data);
            console.log('Full error:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <StatusBar barStyle="light-content" backgroundColor="#16A085" />

                {/* Decorative Background Elements */}
                <View style={styles.backgroundCircle1} />
                <View style={styles.backgroundCircle2} />

                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>♻️</Text>
                        </View>
                    </View>
                    <Text style={styles.appName}>EcoHaul</Text>
                    <Text style={styles.tagline}>Clean • Smart • Reliable</Text>
                    <View style={styles.taglineUnderline} />
                </View>

                {/* Login Form */}
                <View style={styles.loginForm}>
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeText}>Welcome back!</Text>
                        <Text style={styles.welcomeSubtext}>Sign in to continue managing waste collection</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.inputWrapper}>
                            <View style={styles.inputIconContainer}>
                                <Text style={styles.inputIcon}>👤</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                placeholderTextColor="#94a3b8"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <View style={styles.inputIconContainer}>
                                <Text style={styles.inputIcon}>🔒</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]} 
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <View style={styles.loginBtnContent}>
                            {isLoading ? (
                                <Text style={styles.loginBtnText}>Signing in...</Text>
                            ) : (
                                <>
                                    <Text style={styles.loginBtnText}>Sign In</Text>
                                    <Text style={styles.loginBtnArrow}>→</Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Feature Highlights */}
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🚛</Text>
                            <Text style={styles.featureText}>Real-time Tracking</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>📊</Text>
                            <Text style={styles.featureText}>Analytics Dashboard</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>⚡</Text>
                            <Text style={styles.featureText}>Instant Updates</Text>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16A085',
    },
    keyboardView: {
        flex: 1,
    },
    
    // Background decorations
    backgroundCircle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        top: -100,
        right: -100,
    },
    backgroundCircle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        top: 100,
        left: -50,
    },

    // Header styles
    header: {
        flex: 0.35,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
        zIndex: 1,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    logoEmoji: {
        fontSize: 40,
    },
    appName: {
        fontSize: 42,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 15,
        color: '#E6FFFA',
        fontWeight: '500',
        letterSpacing: 2,
    },
    taglineUnderline: {
        width: 60,
        height: 3,
        backgroundColor: '#f59e0b',
        marginTop: 12,
        borderRadius: 2,
    },

    // Login form styles
    loginForm: {
        flex: 0.65,
        backgroundColor: '#f8fafc',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    welcomeSection: {
        marginBottom: 32,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    welcomeSubtext: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '400',
    },

    // Input styles
    inputGroup: {
        marginBottom: 24,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        shadowColor: '#16A085',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputIconContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    inputIcon: {
        fontSize: 20,
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500',
    },

    // Button styles
    loginBtn: {
        backgroundColor: '#16A085',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#16A085',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 32,
    },
    loginBtnDisabled: {
        backgroundColor: '#94a3b8',
        shadowOpacity: 0.1,
    },
    loginBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    loginBtnArrow: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '600',
        marginLeft: 8,
    },

    // Features section
    featuresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    featureItem: {
        alignItems: 'center',
        flex: 1,
    },
    featureIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    featureText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
        textAlign: 'center',
    },
});