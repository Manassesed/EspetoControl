import { Text, TextInput, type TextInputProps, View } from "react-native";

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <TextInput
        className={`h-14 rounded-lg border border-line bg-white px-4 text-base text-ink ${className}`}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
