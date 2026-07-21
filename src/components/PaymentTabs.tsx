import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import type { PaymentMethod } from "@/types/database";

type PaymentTabsProps = {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
};

type Category = "pix" | "dinheiro" | "cartao";

const categories: { value: Category; label: string; icon: string; activeBg: string }[] = [
  { value: "pix", label: "PIX", icon: "phone-portrait-outline", activeBg: "bg-emerald-500" },
  { value: "dinheiro", label: "Dinheiro", icon: "cash-outline", activeBg: "bg-blue-500" },
  { value: "cartao", label: "Cartão", icon: "card-outline", activeBg: "bg-violet-500" }
];

function categoryOf(value: PaymentMethod): Category {
  return value === "cartao_credito" || value === "cartao_debito" ? "cartao" : value;
}

export function PaymentTabs({ value, onChange }: PaymentTabsProps) {
  const category = categoryOf(value);

  return (
    <View>
      <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Forma de pagamento</Text>
      <View className="flex-row gap-2">
        {categories.map((cat) => {
          const selected = cat.value === category;
          return (
            <AnimatedPressable
              key={cat.value}
              className={`flex-1 items-center justify-center gap-1 rounded-xl py-2.5 ${selected ? cat.activeBg : "bg-slate-100"}`}
              onPress={() => {
                if (cat.value === "cartao") {
                  onChange(value === "cartao_credito" || value === "cartao_debito" ? value : "cartao_credito");
                } else {
                  onChange(cat.value);
                }
              }}
            >
              <Ionicons name={cat.icon as any} size={18} color={selected ? "#FFFFFF" : "#64748B"} />
              <Text className={`text-[11px] font-semibold ${selected ? "text-white" : "text-muted"}`}>{cat.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {category === "cartao" ? (
        <View className="mt-2 flex-row gap-2">
          <AnimatedPressable
            className={`flex-1 items-center justify-center rounded-xl py-2 ${value === "cartao_credito" ? "bg-violet-100 border border-violet-300" : "bg-slate-50 border border-line"}`}
            onPress={() => onChange("cartao_credito")}
          >
            <Text className={`text-[12px] font-semibold ${value === "cartao_credito" ? "text-violet-700" : "text-muted"}`}>
              Crédito
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            className={`flex-1 items-center justify-center rounded-xl py-2 ${value === "cartao_debito" ? "bg-violet-100 border border-violet-300" : "bg-slate-50 border border-line"}`}
            onPress={() => onChange("cartao_debito")}
          >
            <Text className={`text-[12px] font-semibold ${value === "cartao_debito" ? "text-violet-700" : "text-muted"}`}>
              Débito
            </Text>
          </AnimatedPressable>
        </View>
      ) : null}
    </View>
  );
}
