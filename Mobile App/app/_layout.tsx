import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";
import { Provider } from "react-redux";
import { store } from "../hooks/store/store";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // 1) Initial check on mount to set the initial route state
  useEffect(() => {
    async function initCheck() {
      setLoading(false);
    }
    initCheck();
  }, []);

  // 2) Handle routing whenever the active screen segment changes
  useEffect(() => {
    if (loading === true) return;

    async function evaluateNavigation() {
      const hasLaunched = await AsyncStorage.getItem("HAS_LAUNCHED");
      const isFirstLaunch = hasLaunched !== "true";
      const isOnboardingScreen = segments.includes("Onboarding");

      if (isFirstLaunch === true && isOnboardingScreen === false) {
        // First time user, not on onboarding -> Send to Onboarding
        router.replace("/Onboarding");
      } 
      
      if (isFirstLaunch === false && isOnboardingScreen === true) {
        // Returning user, currently on onboarding -> Send to Home
        router.replace("/");
      }
    }

    evaluateNavigation();
  }, [loading, segments]);

  // Show loading spinner while reading storage
  if (loading === true) {
    return (
      <Provider store={store}>
        <SafeAreaProvider>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
            <ActivityIndicator size="large" color="#16A085" />
          </View>
        </SafeAreaProvider>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </Provider>
  );
}