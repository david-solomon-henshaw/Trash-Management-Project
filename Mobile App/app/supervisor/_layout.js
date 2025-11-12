import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SupervisorTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16A085',
        tabBarInactiveTintColor: '#4B5563',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
        },
        headerShown: false, // Remove all headers globally
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payment-history"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-new-customer"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person-add" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recordService"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="save" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}