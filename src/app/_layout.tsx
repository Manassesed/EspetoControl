import "@/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppQueryProvider } from "@/context/QueryProvider";
import { useSalesRealtime } from "@/hooks/useSalesRealtime";

/** Liga a sincronização em tempo real assim que o perfil da empresa é conhecido. */
function SalesRealtimeSync() {
  const { profile } = useAuth();
  useSalesRealtime(profile?.empresa_id);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppQueryProvider>
        <AuthProvider>
          <SalesRealtimeSync />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthProvider>
      </AppQueryProvider>
    </GestureHandlerRootView>
  );
}
