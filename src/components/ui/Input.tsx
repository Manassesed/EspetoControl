import { Text, TextInput, type TextInputProps, View } from "react-native";

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-medium text-ink">{label}</Text>
      <TextInput
        className={`h-12 rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink ${className}`}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error ? <Text className="text-[12px] text-danger">{error}</Text> : null}
    </View>
  );
}
