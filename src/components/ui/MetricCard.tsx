import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import { AnimatedIconBadge } from "@/components/ui/AnimatedIconBadge";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

type MetricCardProps = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: "brand" | "warning" | "danger" | "neutral";
};

const tones = {
  brand: { bg: "bg-brand-50", bar: "bg-brand-500", colors: ["#34D399", "#059669", "#064E3B"] as const },
  warning: { bg: "bg-amber-50", bar: "bg-warning", colors: ["#FCD34D", "#F59E0B", "#92400E"] as const },
  danger: { bg: "bg-red-50", bar: "bg-danger", colors: ["#FCA5A5", "#EF4444", "#7F1D1D"] as const },
  neutral: { bg: "bg-slate-100", bar: "bg-ink", colors: ["#94A3B8", "#334155", "#0F172A"] as const }
};

export function MetricCard({ label, value, icon, tone = "neutral" }: MetricCardProps) {
  const currentTone = tones[tone];

  return (
    <AnimatedPressable className="flex-1 rounded-xl border border-line bg-white p-2.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</Text>
        {icon ? <AnimatedIconBadge icon={icon} size="sm" colors={currentTone.colors} /> : null}
      </View>
      <Text className="mt-1 text-base font-bold tracking-tight text-ink">{value}</Text>
      <View className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
        <View className={`h-full w-2/3 rounded-full ${currentTone.bar}`} />
      </View>
    </AnimatedPressable>
  );
}
