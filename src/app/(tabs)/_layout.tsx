import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Text, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

type TabIconProps = {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

function TabIcon({ focused, icon, label }: TabIconProps) {
  return (
    <View className="h-14 w-[76px] items-center justify-center">
      <View
        className={`h-12 w-[72px] items-center justify-center rounded-2xl ${
          focused ? "bg-ink" : "bg-transparent"
        }`}
      >
        <Ionicons name={icon} color={focused ? "#FFFFFF" : "#64748B"} size={20} />
        <Text className={`mt-0.5 text-[10px] font-black ${focused ? "text-white" : "text-muted"}`}>{label}</Text>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { session, loading, demoMode } = useAuth();

  if (!loading && !session && !demoMode) {
    return <Redirect href="/auth/login" />;
  }

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
          left: 16,
          right: 16,
          bottom: 14,
          height: 72,
          paddingBottom: 6,
          paddingTop: 6,
          paddingHorizontal: 4,
          borderRadius: 22,
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
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="grid-outline" label="Hoje" />
        }}
      />
      <Tabs.Screen
        name="produtos"
        options={{
          title: "Produtos",
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
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="receipt-outline" label="Gastos" />
        }}
      />
    </Tabs>
  );
}
