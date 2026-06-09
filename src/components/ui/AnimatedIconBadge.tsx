import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";

type AnimatedIconBadgeProps = {
  icon: keyof typeof Ionicons.glyphMap;
  size?: "sm" | "md" | "lg";
  colors?: readonly [string, string, ...string[]];
};

const sizes = {
  sm: { box: "h-9 w-9 rounded-2xl", icon: 17, glow: "h-6 w-6" },
  md: { box: "h-11 w-11 rounded-2xl", icon: 21, glow: "h-8 w-8" },
  lg: { box: "h-14 w-14 rounded-3xl", icon: 27, glow: "h-10 w-10" }
};

export function AnimatedIconBadge({
  icon,
  size = "md",
  colors = ["#34D399", "#0F766E", "#0F172A"]
}: AnimatedIconBadgeProps) {
  const float = useSharedValue(0);
  const currentSize = sizes[size];

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [float]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -2 * float.value },
      { rotate: `${-4 + float.value * 8}deg` }
    ]
  }));

  return (
    <View className="relative">
      <View className={`absolute left-2 top-3 ${currentSize.glow} rounded-full bg-emerald-300 opacity-40`} />
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={`${currentSize.box} items-center justify-center shadow-sm`}
        >
          <View className="absolute left-2 top-2 h-3 w-3 rounded-full bg-white/40" />
          <Ionicons name={icon} size={currentSize.icon} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
