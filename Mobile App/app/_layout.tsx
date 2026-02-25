import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";
import { Provider } from "react-redux";
import { store } from "../hooks/store/store";

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

    const inOnboarding = segments[0] === "Onboarding";

    if (isFirstLaunch && !inOnboarding) {
      router.replace("/Onboarding");
    } else if (!isFirstLaunch && inOnboarding) {
      router.replace("/");
    }
  }, [isFirstLaunch, segments]);

  if (isFirstLaunch === null) {
    return (
      <Provider store={store}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f8fafc' }}>
          <ActivityIndicator size="large" color="#16A085" />
        </View>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }} />
    </Provider>
  );
}