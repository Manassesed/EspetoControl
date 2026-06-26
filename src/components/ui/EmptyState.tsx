import { Text, View } from "react-native";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="items-center rounded-xl border border-dashed border-line bg-white p-5">
      <Text className="text-[14px] font-semibold text-ink">{title}</Text>
      <Text className="mt-1.5 text-center text-[13px] text-muted">{description}</Text>
    </View>
  );
}
