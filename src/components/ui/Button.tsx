import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Text, View, type PressableProps } from "react-native";

import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

type ButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

const variants = {
  primary: "bg-ink",
  secondary: "bg-white border border-line",
  danger: "bg-danger",
  ghost: "bg-brand-50"
};

const textVariants = {
  primary: "text-white",
  secondary: "text-ink",
  danger: "text-white",
  ghost: "text-brand-700"
};

const iconColors = {
  primary: "#FFFFFF",
  secondary: "#0F172A",
  danger: "#FFFFFF",
  ghost: "#047857"
};

export function Button({ title, loading, icon, variant = "primary", disabled, className = "", ...props }: ButtonProps) {
  return (
    <AnimatedPressable
      className={`h-12 flex-row items-center justify-center rounded-xl px-5 ${variants[variant]} ${
        disabled || loading ? "opacity-60" : "opacity-100"
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={iconColors[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Ionicons name={icon} size={17} color={iconColors[variant]} /> : null}
          <Text className={`text-[14px] font-semibold ${textVariants[variant]}`}>{title}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}
