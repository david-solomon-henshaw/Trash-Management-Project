import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  // REPLACE 192.168.1.XX with your computer's actual IP address
  // Use 'http' not 'https' for local dev unless you have a certificate
  baseURL: process.env.EXPO_PUBLIC_API_URL, 
  timeout: 10000,
});

// REQUEST INTERCEPTOR: Inject the token into every call
apiClient.interceptors.request.use(
  async (config) => {
    // This looks into the phone's storage for the string we saved during login
    const token = await AsyncStorage.getItem('userToken'); 

    if (token) {
      // If the string exists, we attach it
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// RESPONSE INTERCEPTOR: Catch the 401 (Expired) errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Logic to redirect to Login or Refresh Token lives here
      console.log("Token expired or unauthorized");
    }
    return Promise.reject(error);
  }
);

export default apiClient;