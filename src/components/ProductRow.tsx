import { Text, View } from "react-native";
import type { ReactNode } from "react";

import { AnimatedIconBadge } from "@/components/ui/AnimatedIconBadge";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import type { Produto } from "@/types/database";
import { formatCurrency } from "@/utils/currency";

type ProductRowProps = {
  product: Produto;
  onPress?: () => void;
  right?: ReactNode;
};

export function ProductRow({ product, onPress, right }: ProductRowProps) {
  return (
    <AnimatedPressable
      className="flex-row items-center justify-between rounded-2xl border border-line bg-white p-3 shadow-sm"
      onPress={onPress}
    >
      <View className="mr-3">
        <AnimatedIconBadge
          icon={product.categoria.toLowerCase().includes("bebida") ? "cafe-outline" : "flame-outline"}
          size="sm"
          colors={product.categoria.toLowerCase().includes("bebida") ? ["#38BDF8", "#0284C7", "#0F172A"] : ["#FDBA74", "#F97316", "#7C2D12"]}
        />
      </View>
      <View className="mr-3 flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-bold text-ink">{product.nome}</Text>
          {!product.ativo ? (
            <Text className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-muted">Inativo</Text>
          ) : null}
        </View>
        <Text className="mt-0.5 text-xs text-muted">{product.categoria}</Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-black text-brand-700">{formatCurrency(product.preco)}</Text>
        {right}
      </View>
    </AnimatedPressable>
  );
}
