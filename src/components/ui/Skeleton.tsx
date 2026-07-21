import { useEffect } from "react";
import { type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

type SkeletonProps = {
  className?: string;
  style?: ViewStyle;
};

export function Skeleton({ className = "", style }: SkeletonProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.25
  }));

  return <Animated.View className={`rounded-xl bg-slate-200 ${className}`} style={[style, animatedStyle]} />;
}
