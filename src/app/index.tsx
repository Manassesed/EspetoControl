import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { session, loading, demoMode } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  return <Redirect href={session || demoMode ? "/(tabs)" : "/auth/login"} />;
}
