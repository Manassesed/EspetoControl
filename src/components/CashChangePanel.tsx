import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { formatCurrency } from "@/utils/currency";

type CashChangePanelProps = {
  total: number;
  received: number;
  onChange: (value: number) => void;
  onOpenKeypad: () => void;
};

/** Sugestões de cédulas arredondadas para cima a partir do total. */
function buildSuggestions(total: number): number[] {
  if (total <= 0) return [];
  const values = new Set<number>();
  for (const step of [5, 10, 20, 50, 100]) {
    const v = Math.ceil(total / step) * step;
    if (v > total) values.add(v);
  }
  return Array.from(values)
    .sort((a, b) => a - b)
    .slice(0, 3);
}

export function CashChangePanel({ total, received, onChange, onOpenKeypad }: CashChangePanelProps) {
  const suggestions = useMemo(() => buildSuggestions(total), [total]);
  const change = received - total;
  const hasReceived = received > 0;
  const isShort = hasReceived && change < 0;

  return (
    <View className="rounded-2xl border border-line bg-white p-3.5">
      <View className="mb-2.5 flex-row items-center justify-between">
        <Text className="text-[13px] font-semibold text-ink">Recebido em dinheiro</Text>
        <Ionicons name="cash-outline" size={17} color="#2563EB" />
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Pressable
          className={`rounded-xl border px-3 py-1.5 ${
            received === total && hasReceived ? "border-blue-500 bg-blue-50" : "border-line bg-slate-50"
          }`}
          onPress={() => onChange(total)}
        >
          <Text className="text-[11px] font-semibold text-ink">Valor exato</Text>
        </Pressable>

        {suggestions.map((value) => {
          const selected = received === value;
          return (
            <Pressable
              key={value}
              className={`rounded-xl border px-3 py-1.5 ${
                selected ? "border-blue-500 bg-blue-50" : "border-line bg-slate-50"
              }`}
              onPress={() => onChange(value)}
            >
              <Text className="text-[11px] font-semibold text-ink">{formatCurrency(value)}</Text>
            </Pressable>
          );
        })}

        <Pressable
          className="flex-row items-center gap-1 rounded-xl border border-line bg-slate-50 px-3 py-1.5"
          onPress={onOpenKeypad}
        >
          <Ionicons name="keypad-outline" size={13} color="#0F172A" />
          <Text className="text-[11px] font-semibold text-ink">Outro</Text>
        </Pressable>
      </View>

      {hasReceived ? (
        <View
          className={`mt-2.5 flex-row items-center justify-between rounded-xl px-3.5 py-2.5 ${
            isShort ? "bg-amber-50" : "bg-emerald-50"
          }`}
        >
          <View>
            <Text className={`text-[11px] font-semibold uppercase tracking-wide ${isShort ? "text-amber-700" : "text-emerald-700"}`}>
              {isShort ? "Falta receber" : "Troco"}
            </Text>
            <Text className="mt-0.5 text-[11px] text-muted">Recebido {formatCurrency(received)}</Text>
          </View>
          <Text className={`text-xl font-bold ${isShort ? "text-amber-700" : "text-emerald-700"}`}>
            {formatCurrency(Math.abs(change))}
          </Text>
        </View>
      ) : (
        <Text className="mt-2.5 text-[11px] text-muted">
          Toque em um valor para calcular o troco na hora.
        </Text>
      )}
    </View>
  );
}
