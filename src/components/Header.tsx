import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

type HeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  onLogout?: () => void;
};

export function Header({ title, subtitle, actionLabel, onAction, onLogout }: HeaderProps) {
  return (
    <View className="flex-row items-start justify-between pb-1">
      <View className="flex-1 pr-4">
        <Text className="text-xl font-bold tracking-tight text-ink">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[13px] text-muted">{subtitle}</Text> : null}
      </View>
      <View className="flex-row gap-2">
        {onAction && actionLabel ? (
          <AnimatedPressable className="h-10 flex-row items-center justify-center gap-1.5 rounded-full bg-ink px-3.5" onPress={onAction}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text className="text-[13px] font-semibold text-white">{actionLabel}</Text>
          </AnimatedPressable>
        ) : null}
        {onLogout ? (
          <AnimatedPressable className="h-10 w-10 items-center justify-center rounded-full border border-line bg-white" onPress={onLogout}>
            <Ionicons name="log-out-outline" size={18} color="#0F172A" />
          </AnimatedPressable>
        ) : null}
      </View>
    </View>
  );
}
