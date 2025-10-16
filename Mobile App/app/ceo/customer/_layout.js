import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Customer',
        }}
      />
      <Stack.Screen
        name="add-customer"
        options={{
          title: 'Add Customer',
          presentation: 'card',
        }}
      />
 <Stack.Screen
        name="view-customers"
        options={{
          title: 'Add Customer',
          presentation: 'card',
        }}
      />
    
     
    </Stack>
  );
}