import { Pressable, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const AnimatedBase = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = PressableProps & {
  className?: string;
};

export function AnimatedPressable({ onPressIn, onPressOut, style, ...props }: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedBase
      onPressIn={(event) => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 260 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
        onPressOut?.(event);
      }}
      style={[animatedStyle, style]}
      {...props}
    />
  );
}
