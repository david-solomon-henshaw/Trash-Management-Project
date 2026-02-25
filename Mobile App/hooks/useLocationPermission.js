// hooks/useLocationPermission.js
import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useLocationPermission = () => {
  const [locationPermission, setLocationPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const LOCATION_PERMISSION_KEY = 'location_permission_granted';

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      // Check if we already asked and user granted permission
      const storedPermission = await AsyncStorage.getItem(LOCATION_PERMISSION_KEY);
      
      if (storedPermission === 'granted') {
        setLocationPermission('granted');
        setIsLoading(false);
        return;
      }

      // Check current permission status
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'granted');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking location permission:', error);
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      setLocationPermission(status);
      
      if (status === 'granted') {
        await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'granted');
        
        // Get initial location to verify it works
        try {
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (locationError) {
          // console.log('Location fetch test:', locationError);
        }
      }
      
      setIsLoading(false);
      return status;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setIsLoading(false);
      return 'denied';
    }
  };

  const showPermissionAlert = () => {
    Alert.alert(
      'Location Permission Required',
      'This app needs access to your location to track routes and assignments. Location data helps us monitor progress and provide better service.',
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Allow Location',
          onPress: requestLocationPermission,
        },
      ]
    );
  };

  return {
    locationPermission,
    isLoading,
    requestLocationPermission,
    showPermissionAlert,
    checkLocationPermission,
  };
};