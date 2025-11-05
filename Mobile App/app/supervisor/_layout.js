import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SupervisorTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16A085', // EcoHaul green
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
        name="payment-history"
        options={{
          title: 'Payment History',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
          headerShown: false
        }}
      />
    
      <Tabs.Screen
        name="add-new-customer"
        options={{
          title: 'New Customer',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-add" size={size} color={color} />,
          headerShown: false
        }}
      />
<Tabs.Screen
  name="payments"
  options={{
    title: 'Payments',
    tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} />,
    headerShown: false
  }}
/>
    </Tabs>
  );
} 