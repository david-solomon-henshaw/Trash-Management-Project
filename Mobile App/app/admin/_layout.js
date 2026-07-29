import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function CeoTabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Active tab color = primary teal
        tabBarActiveTintColor: '#16A085',
        // Inactive tabs = softer gray
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          // Thin border at the top (matching card borders)
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          // Subtle shadow for depth (like the cards)
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
          // Slightly taller tab bar for better touch target
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        // Optional: adjust label style
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        // Header styling (if any screen shows it)
        headerStyle: {
          backgroundColor: '#16A085',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false, // Cleaner look
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Operations',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}