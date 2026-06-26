import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

type TabIconProps = {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

function TabIcon({ focused, icon, label }: TabIconProps) {
  return (
    <View className="h-14 w-[62px] items-center justify-center">
      <View
        className={`h-12 w-[58px] items-center justify-center rounded-2xl ${
          focused ? "bg-ink" : "bg-transparent"
        }`}
      >
        <Ionicons name={icon} color={focused ? "#FFFFFF" : "#64748B"} size={18} />
        <Text
          numberOfLines={1}
          className={`mt-0.5 text-[9px] font-semibold ${focused ? "text-white" : "text-muted"}`}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { session, profile, loading, demoMode } = useAuth();
  const insets = useSafeAreaInsets();

  if (!loading && !session && !demoMode) {
    return <Redirect href="/auth/login" />;
  }

  // Convite aceito mas senha ainda não definida: trava tudo até concluir o onboarding.
  if (profile?.status === "pendente") {
    return <Redirect href="/auth/set-password" />;
  }

  // Colaborador só vê o caixa; gerente vê tudo, incluindo a equipe.
  const isManager = profile?.role === "gerente";
  const managerHref = isManager ? undefined : null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#64748B",
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: 62,
          alignItems: "center",
          justifyContent: "center"
        },
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
          paddingHorizontal: 4,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTopWidth: 0,
          backgroundColor: "#FFFFFF",
          shadowColor: "#0F172A",
          shadowOpacity: 0.12,
          shadowRadius: 18,
          elevation: 8
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          href: managerHref,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="grid-outline" label="Hoje" />
        }}
      />
      <Tabs.Screen
        name="relatorio"
        options={{
          title: "Relatório",
          href: managerHref,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="stats-chart-outline" label="Relatório" />
        }}
      />
      <Tabs.Screen
        name="produtos"
        options={{
          title: "Produtos",
          href: managerHref,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="fast-food-outline" label="Itens" />
        }}
      />
      <Tabs.Screen
        name="venda"
        options={{
          title: "Venda",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="add-circle-outline" label="Venda" />
        }}
      />
      <Tabs.Screen
        name="gastos"
        options={{
          title: "Gastos",
          href: managerHref,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="receipt-outline" label="Gastos" />
        }}
      />
      <Tabs.Screen
        name="equipe"
        options={{
          title: "Equipe",
          href: managerHref,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="people-outline" label="Equipe" />
        }}
      />
    </Tabs>
  );
}
