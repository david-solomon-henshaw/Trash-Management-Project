import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import axios from 'axios'
import {API_BASE_URL} from '../config'
import {useRouter} from 'expo-router'


export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter()


    const handleLogin = async () => {

        console.log('login button pressed', username, password)

        router.replace('ceo')

//         try {
//             const response = await axios.post(`${API_BASE_URL}/api/staff/signin`,
//                 {
//                     username: username,
//                     password: password
//                 }
//             )
//             console.log('success', response.data)
//         }
//        catch (error) {
//     console.log('Error status:', error.response?.status);
//     console.log('Error message:', error.response?.data);
//     console.log('Full error:', error.message);
// }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#16A085" />

            <View style={styles.header}>
                <Text style={styles.appName}>EcoHaul</Text>
                <Text style={styles.tagline}>Clean • Smart • Reliable</Text>
            </View>

            <View style={styles.loginForm}>
                <Text style={styles.welcomeText}>Welcome back!</Text>

                <View style={styles.inputGroup}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your username"
                        placeholderTextColor="#9CA3AF"
                        value={username}
                        onChangeText={setUsername}
                        keyboardType="username"
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16A085',
    },
    header: {
        flex: 0.4,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    appName: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: '#E6FFFA',
        fontWeight: '300',
    },
    loginForm: {
        flex: 0.6,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 30,
        paddingTop: 50,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 40,
    },
    inputGroup: {
        marginBottom: 30,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    loginBtn: {
        backgroundColor: '#16A085',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});