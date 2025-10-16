import { Stack } from 'expo-router';

export default function OperationsLayout() {
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
          title: 'Operations',
        }}
      />
      <Stack.Screen
        name="staffs"
        options={{
          title: 'Staff Management',
        }}
      />
      <Stack.Screen
        name="fleet"
        options={{
          title: 'Fleet Management',
        }}
      />
      <Stack.Screen
        name="apartment-types"
        options={{
          title: 'Apartment Types',
        }}
      />
      <Stack.Screen
        name="commercial-subtypes"
        options={{
          title: 'Commercial Subtypes',
        }}
      />
    </Stack>
  );
}
