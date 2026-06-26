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
  showMargin?: boolean;
};

export function ProductRow({ product, onPress, right, showMargin }: ProductRowProps) {
  const custo = product.custo ?? 0;
  const lucro = product.preco - custo;
  const margem = product.preco > 0 ? (lucro / product.preco) * 100 : 0;
  const lucroPositivo = lucro >= 0;

  return (
    <AnimatedPressable
      className="flex-row items-center justify-between rounded-2xl border border-line bg-white p-2.5"
      onPress={onPress}
    >
      <View className="mr-2.5">
        <AnimatedIconBadge
          icon={product.categoria.toLowerCase().includes("bebida") ? "cafe-outline" : "flame-outline"}
          size="sm"
          colors={product.categoria.toLowerCase().includes("bebida") ? ["#38BDF8", "#0284C7", "#0F172A"] : ["#FDBA74", "#F97316", "#7C2D12"]}
        />
      </View>
      <View className="mr-2.5 flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[13px] font-medium text-ink">{product.nome}</Text>
          {!product.ativo ? (
            <Text className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted">Inativo</Text>
          ) : null}
        </View>
        <Text className="mt-0.5 text-[11px] text-muted">{product.categoria}</Text>
        {showMargin && custo > 0 ? (
          <View className="mt-1 flex-row items-center gap-1">
            <Text className="text-[11px] text-muted">custo {formatCurrency(custo)}</Text>
            <Text className={`text-[11px] font-semibold ${lucroPositivo ? "text-emerald-600" : "text-danger"}`}>
              · lucro {formatCurrency(lucro)} ({margem.toFixed(0)}%)
            </Text>
          </View>
        ) : null}
      </View>
      <View className="items-end">
        <Text className="text-[13px] font-bold text-brand-700">{formatCurrency(product.preco)}</Text>
        {right}
      </View>
    </AnimatedPressable>
  );
}
