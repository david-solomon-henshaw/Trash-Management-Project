import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem("HAS_LAUNCHED");
        if (value === null) {
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        setIsFirstLaunch(false);
      }
    };
    checkFirstLaunch();
  }, []);

  useEffect(() => {
    if (isFirstLaunch === null) return;

    // Check if user is currently on the onboarding screen
    // Note: This must match your filename case exactly (Onboarding vs onboarding)
    const inOnboarding = segments[0] === "Onboarding";

    if (isFirstLaunch && !inOnboarding) {
      // If it's the first time and they aren't on onboarding, send them there
      router.replace("/Onboarding");
    } else if (!isFirstLaunch && inOnboarding) {
      // If they've already seen it but somehow landed back there, send to Login
      router.replace("/");
    }
  }, [isFirstLaunch, segments]);

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#16A085" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}