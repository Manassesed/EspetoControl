import { Text, View } from "react-native";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="items-center rounded-lg border border-dashed border-line bg-white p-6">
      <Text className="text-base font-bold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-sm text-muted">{description}</Text>
    </View>
  );
}
