import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, type ScrollViewProps } from "react-native";

type ScreenProps = ScrollViewProps & {
  scroll?: boolean;
};

export function Screen({ children, scroll = true, className = "", ...props }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top"]}>
      {scroll ? (
        <ScrollView
          className={`flex-1 ${className}`}
          contentContainerStyle={{ padding: 20, paddingBottom: 118, gap: 16 }}
          showsVerticalScrollIndicator={false}
          {...props}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}
