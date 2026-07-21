import "@/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppQueryProvider } from "@/context/QueryProvider";
import { useComandasRealtime } from "@/hooks/useComandasRealtime";
import { useEmpresaRealtime } from "@/hooks/useEmpresaRealtime";
import { useSalesRealtime } from "@/hooks/useSalesRealtime";

/** Liga a sincronização em tempo real assim que o perfil da empresa é conhecido. */
function SalesRealtimeSync() {
  const { profile, refreshEmpresaSubscription } = useAuth();
  useSalesRealtime(profile?.empresa_id);
  useComandasRealtime(profile?.empresa_id);
  useEmpresaRealtime(profile?.empresa_id, refreshEmpresaSubscription);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AppQueryProvider>
          <AuthProvider>
            <SalesRealtimeSync />
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="mesa/[id]" options={{ presentation: "modal" }} />
              <Stack.Screen name="assinatura" />
            </Stack>
          </AuthProvider>
        </AppQueryProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
