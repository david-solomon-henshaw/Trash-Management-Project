import { Stack } from 'expo-router';

export default function StreetsLayout() {
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
          title: 'Streets',
        }}
      />
      <Stack.Screen
        name="add-street"
        options={{
          title: 'Add Street',
          presentation: 'card',
        }}
      />

      <Stack.Screen
        name="view-streets"
        options={{
          title: 'View Streets',
          presentation: 'card',
        }}
      />
     
    </Stack>
  );
}