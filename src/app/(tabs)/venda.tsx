import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Alert, Pressable, Text, View } from "react-native";

import { Header } from "@/components/Header";
import { PaymentTabs } from "@/components/PaymentTabs";
import { ProductRow } from "@/components/ProductRow";
import { AnimatedIconBadge } from "@/components/ui/AnimatedIconBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useSaleMutations } from "@/hooks/useSales";
import { useSaleCart } from "@/store/saleStore";
import type { PaymentMethod } from "@/types/database";
import { formatCurrency } from "@/utils/currency";

export default function SaleScreen() {
  const { profile } = useAuth();
  const products = useProducts(profile?.empresa_id, true);
  const sale = useSaleMutations(profile?.empresa_id, profile?.id);
  const cart = useSaleCart();
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const activeProducts = products.data ?? [];

  async function finishSale() {
    if (!cart.items.length) {
      Alert.alert("Venda vazia", "Escolha pelo menos um produto.");
      return;
    }

    try {
      await sale.create.mutateAsync({ formaPagamento: payment, items: cart.items, total: cart.total });
      cart.clear();
      Alert.alert("Venda registrada", "Movimento atualizado no dashboard.");
    } catch (error) {
      Alert.alert("Erro ao vender", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  return (
    <Screen>
      <Header title="Balcao" subtitle="Venda em poucos toques, sem perder o valor do pedido" />

      <LinearGradient
        colors={["#111827", "#1E3A8A", "#10B981"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl p-5 shadow-sm"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-xs font-bold uppercase text-emerald-50">Pedido atual</Text>
            <Text className="mt-1 text-4xl font-black text-white">{formatCurrency(cart.total)}</Text>
            <Text className="mt-1 text-sm text-emerald-50">
              {cart.items.length ? `${cart.items.length} item(ns) no pedido` : "Toque nos produtos para montar a venda"}
            </Text>
          </View>
          <AnimatedIconBadge icon="bag-check-outline" size="lg" colors={["#ECFDF5", "#10B981", "#064E3B"]} />
        </View>
        {cart.items.length ? (
          <View className="mt-4 gap-2">
            {cart.items.map((item) => (
              <View key={item.produto.id} className="flex-row items-center justify-between rounded-2xl bg-white/10 px-3 py-1.5">
                <Text className="text-xs font-semibold text-white">
                  {item.quantidade}x {item.produto.nome}
                </Text>
                <Pressable onPress={() => cart.decrementProduct(item.produto.id)}>
                  <Ionicons name="remove-circle-outline" size={22} color="#FCA5A5" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </LinearGradient>

      <PaymentTabs value={payment} onChange={setPayment} />

      <Button
        title="Receber e registrar"
        icon="checkmark-circle-outline"
        loading={sale.create.isPending}
        onPress={finishSale}
        disabled={!cart.items.length}
      />

      <View className="flex-row gap-2">
        <View className="flex-1 rounded-2xl border border-line bg-white p-3 shadow-sm">
          <Text className="text-xs font-bold uppercase text-muted">Atendimento</Text>
          <Text className="mt-1 text-lg font-black text-ink">{cart.items.reduce((sum, item) => sum + item.quantidade, 0)} unidades</Text>
        </View>
        <View className="flex-1 rounded-2xl border border-line bg-white p-3 shadow-sm">
          <Text className="text-xs font-bold uppercase text-muted">Pagamento</Text>
          <Text className="mt-1 text-lg font-black capitalize text-ink">{payment}</Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-black text-ink">Toque para adicionar</Text>
            <Text className="mt-0.5 text-xs text-muted">Os itens ativos ficam prontos para o horario de pico</Text>
          </View>
          <Text className="text-sm font-semibold text-muted">{activeProducts.length} itens</Text>
        </View>
        {activeProducts.length ? (
          activeProducts.map((product) => {
            const cartItem = cart.items.find((item) => item.produto.id === product.id);

            return (
              <ProductRow
                key={product.id}
                product={product}
                onPress={() => cart.addProduct(product)}
                right={
                  <View className="mt-1 flex-row items-center gap-2">
                    {cartItem ? (
                      <Pressable
                        className="h-9 w-9 items-center justify-center rounded-full bg-red-50"
                        onPress={() => cart.decrementProduct(product.id)}
                      >
                        <Ionicons name="remove" size={18} color="#EF4444" />
                      </Pressable>
                    ) : null}
                    {cartItem ? <Text className="min-w-5 text-center text-base font-black text-ink">{cartItem.quantidade}</Text> : null}
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-600">
                      <Ionicons name="add" size={20} color="#FFFFFF" />
                    </View>
                  </View>
                }
              />
            );
          })
        ) : (
          <EmptyState title="Sem produtos ativos" description="Ative ou cadastre produtos para iniciar uma venda." />
        )}
      </View>
    </Screen>
  );
}
