import { Ionicons } from "@expo/vector-icons";
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
    <View className="flex-row items-start justify-between">
      <View className="flex-1 pr-4">
        <Text className="text-2xl font-bold text-ink">{title}</Text>
        {subtitle ? <Text className="mt-1 text-sm text-muted">{subtitle}</Text> : null}
      </View>
      <View className="flex-row gap-2">
        {onAction && actionLabel ? (
          <AnimatedPressable className="h-11 flex-row items-center justify-center gap-2 rounded-full bg-ink px-4" onPress={onAction}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text className="font-bold text-white">{actionLabel}</Text>
          </AnimatedPressable>
        ) : null}
        {onLogout ? (
          <AnimatedPressable className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white" onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#0F172A" />
          </AnimatedPressable>
        ) : null}
      </View>
    </View>
  );
}
