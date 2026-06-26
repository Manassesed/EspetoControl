import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/currency";

type NumericKeypadProps = {
  visible: boolean;
  mode?: "integer" | "currency";
  title: string;
  subtitle?: string;
  /** valor inicial (inteiro p/ quantidade, reais p/ moeda) */
  initialValue?: number;
  confirmLabel?: string;
  onConfirm: (value: number) => void;
  onClose: () => void;
};

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

/**
 * Teclado numérico em folha (bottom sheet). No modo "currency" os dígitos
 * preenchem os centavos, igual maquininha (digite 5000 -> R$ 50,00).
 */
export function NumericKeypad({
  visible,
  mode = "integer",
  title,
  subtitle,
  initialValue = 0,
  confirmLabel = "Confirmar",
  onConfirm,
  onClose
}: NumericKeypadProps) {
  const [buffer, setBuffer] = useState("");

  useEffect(() => {
    if (visible) {
      if (!initialValue) {
        setBuffer("");
      } else if (mode === "currency") {
        setBuffer(String(Math.round(initialValue * 100)));
      } else {
        setBuffer(String(Math.floor(initialValue)));
      }
    }
  }, [visible, initialValue, mode]);

  const numericValue = mode === "currency" ? Number(buffer || "0") / 100 : Number(buffer || "0");
  const display = mode === "currency" ? formatCurrency(numericValue) : String(numericValue);

  function press(key: string) {
    if (key === "clear") {
      setBuffer("");
      return;
    }
    if (key === "back") {
      setBuffer((b) => b.slice(0, -1));
      return;
    }
    setBuffer((b) => {
      const next = (b + key).replace(/^0+(?=\d)/, "");
      return next.length > 9 ? b : next;
    });
  }

  function confirm() {
    onConfirm(numericValue);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-3xl bg-white px-5 pb-8 pt-4" onPress={() => {}}>
          <View className="mb-3 items-center">
            <View className="h-1.5 w-12 rounded-full bg-slate-200" />
          </View>

          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[15px] font-semibold text-ink">{title}</Text>
              {subtitle ? <Text className="mt-0.5 text-[12px] text-muted">{subtitle}</Text> : null}
            </View>
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              onPress={onClose}
            >
              <Ionicons name="close" size={16} color="#0F172A" />
            </Pressable>
          </View>

          <View className="mb-4 items-center rounded-xl bg-slate-50 py-4">
            <Text className="text-3xl font-bold tracking-tight text-ink">{display}</Text>
          </View>

          <View className="flex-row flex-wrap">
            {keys.map((key) => (
              <View key={key} className="w-1/3 p-1.5">
                <Pressable
                  className={`h-14 items-center justify-center rounded-xl ${
                    key === "clear" || key === "back" ? "bg-slate-100" : "bg-slate-50 border border-line"
                  }`}
                  onPress={() => press(key)}
                >
                  {key === "back" ? (
                    <Ionicons name="backspace-outline" size={22} color="#0F172A" />
                  ) : key === "clear" ? (
                    <Text className="text-[15px] font-semibold text-muted">C</Text>
                  ) : (
                    <Text className="text-xl font-bold text-ink">{key}</Text>
                  )}
                </Pressable>
              </View>
            ))}
          </View>

          <View className="mt-3">
            <Button title={confirmLabel} icon="checkmark-circle-outline" onPress={confirm} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
