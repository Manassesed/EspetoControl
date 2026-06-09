import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { paymentMethods } from "@/constants/theme";
import type { PaymentMethod } from "@/types/database";

type PaymentTabsProps = {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
};

export function PaymentTabs({ value, onChange }: PaymentTabsProps) {
  return (
    <View className="flex-row rounded-2xl border border-line bg-white p-1 shadow-sm">
      {paymentMethods.map((method) => {
        const selected = method.value === value;
        const icon = method.value === "pix" ? "qr-code-outline" : method.value === "dinheiro" ? "cash-outline" : "card-outline";

        return (
          <Pressable
            key={method.value}
            className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl ${selected ? "bg-ink" : ""}`}
            onPress={() => onChange(method.value)}
          >
            <Ionicons name={icon} size={16} color={selected ? "#FFFFFF" : "#64748B"} />
            <Text className={`font-bold ${selected ? "text-white" : "text-muted"}`}>{method.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
