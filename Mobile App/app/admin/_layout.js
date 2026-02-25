import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CeoTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16A085', // Clean Haul green
        tabBarInactiveTintColor: '#4B5563',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: '#16A085',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          headerShown: false

        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Operations',
          tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />,
          headerShown: false
        
        }}
      />
    
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
          headerShown: false

        }}
      />


      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
          headerShown: false

        }}
      />

    </Tabs>

    
    
  );
}