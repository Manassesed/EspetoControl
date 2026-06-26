import { useMemo, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, TextInput, View } from "react-native";

import { CashChangePanel } from "@/components/CashChangePanel";
import { Header } from "@/components/Header";
import { PaymentTabs } from "@/components/PaymentTabs";
import { ProductRow } from "@/components/ProductRow";
import { AnimatedIconBadge } from "@/components/ui/AnimatedIconBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { NumericKeypad } from "@/components/ui/NumericKeypad";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useProducts } from "@/hooks/useProducts";
import { useSaleMutations } from "@/hooks/useSales";
import { useSaleCart } from "@/store/saleStore";
import type { PaymentMethod, Produto } from "@/types/database";
import { formatCurrency } from "@/utils/currency";

type KeypadTarget = { kind: "qty"; product: Produto } | { kind: "cash" };

/** Normaliza para busca: minúsculas e sem acentos. */
function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export default function SaleScreen() {
  const { profile } = useAuth();
  const { logout } = useAuthActions();
  const products = useProducts(profile?.empresa_id, true);
  const sale = useSaleMutations(profile?.empresa_id, profile?.id);
  const cart = useSaleCart();
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [received, setReceived] = useState(0);
  const [keypadTarget, setKeypadTarget] = useState<KeypadTarget | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [emptyHint, setEmptyHint] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccess, setSaleSuccess] = useState(false);
  const shake = useSharedValue(0);
  const activeProducts = products.data ?? [];

  const categories = useMemo(
    () => Array.from(new Set(activeProducts.map((p) => p.categoria).filter(Boolean))).sort(),
    [activeProducts]
  );

  const filteredProducts = useMemo(() => {
    const term = normalizeText(search);
    return activeProducts.filter((product) => {
      const matchesCategory = !selectedCategory || product.categoria === selectedCategory;
      const matchesSearch = !term || normalizeText(product.nome).includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [activeProducts, search, selectedCategory]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }]
  }));

  function showEmptyHint() {
    setEmptyHint(true);
    shake.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
    setTimeout(() => setEmptyHint(false), 2500);
  }

  function handlePaymentChange(method: PaymentMethod) {
    setPayment(method);
    if (method !== "dinheiro") setReceived(0);
  }

  function handleKeypadConfirm(value: number) {
    if (!keypadTarget) return;
    if (keypadTarget.kind === "qty") {
      cart.setProductQuantity(keypadTarget.product, value);
    } else {
      setReceived(value);
    }
  }

  const keypadInitialValue =
    keypadTarget?.kind === "qty"
      ? cart.items.find((item) => item.produto.id === keypadTarget.product.id)?.quantidade ?? 0
      : received;

  async function finishSale() {
    setSaleError(null);
    setSaleSuccess(false);

    if (!cart.items.length) {
      showEmptyHint();
      return;
    }

    try {
      await sale.create.mutateAsync({ formaPagamento: payment, items: cart.items, total: cart.total });
      cart.clear();
      setReceived(0);
      setSaleSuccess(true);
      setTimeout(() => setSaleSuccess(false), 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setSaleError(msg || "Erro ao registrar. Tente novamente.");
    }
  }

  return (
    <Screen>
      <Header
        title="Balcão"
        subtitle={profile?.role === "colaborador" ? `Olá, ${profile.nome}` : "Venda em poucos toques, sem perder o valor do pedido"}
        onLogout={profile?.role === "colaborador" ? () => logout.mutate() : undefined}
      />

      <LinearGradient
        colors={["#111827", "#1E3A8A", "#10B981"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl p-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-emerald-50">Pedido atual</Text>
            <Text className="mt-1 text-3xl font-bold tracking-tight text-white">{formatCurrency(cart.total)}</Text>
            <Text className="mt-1 text-[13px] text-emerald-50">
              {cart.items.length ? `${cart.items.length} item(ns) no pedido` : "Toque nos produtos para montar a venda"}
            </Text>
          </View>
          <AnimatedIconBadge icon="bag-check-outline" size="md" colors={["#ECFDF5", "#10B981", "#064E3B"]} />
        </View>
        {cart.items.length ? (
          <View className="mt-3 gap-1.5">
            {cart.items.map((item) => (
              <View key={item.produto.id} className="flex-row items-center justify-between rounded-xl bg-white/10 px-2.5 py-1.5">
                <Pressable
                  className="flex-1 flex-row items-center gap-1"
                  onPress={() => setKeypadTarget({ kind: "qty", product: item.produto })}
                >
                  <Text className="text-[11px] font-medium text-white">
                    {item.quantidade}x {item.produto.nome}
                  </Text>
                  <Ionicons name="create-outline" size={12} color="#A7F3D0" />
                </Pressable>
                <View className="flex-row items-center gap-2">
                  <Pressable onPress={() => cart.decrementProduct(item.produto.id)}>
                    <Ionicons name="remove-circle-outline" size={20} color="#FCA5A5" />
                  </Pressable>
                  <Pressable onPress={() => cart.removeProduct(item.produto.id)} hitSlop={6}>
                    <Ionicons name="trash-outline" size={16} color="#FCA5A5" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </LinearGradient>

      <View className="gap-2.5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[13px] font-semibold text-ink">Toque para adicionar</Text>
            <Text className="mt-0.5 text-[11px] text-muted">Os itens ativos ficam prontos para o horário de pico</Text>
          </View>
          <Text className="text-[13px] font-medium text-muted">{filteredProducts.length} itens</Text>
        </View>

        {activeProducts.length ? (
          <View className="flex-row items-center gap-2 rounded-xl border border-line bg-white px-3">
            <Ionicons name="search-outline" size={17} color="#94A3B8" />
            <TextInput
              className="h-11 flex-1 text-[14px] text-ink"
              placeholder="Buscar produto..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={17} color="#CBD5E1" />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {categories.length > 1 ? (
          <View className="flex-row flex-wrap gap-2">
            {[null, ...categories].map((cat) => {
              const selected = cat === selectedCategory;
              return (
                <Pressable
                  key={cat ?? "todos"}
                  className={`rounded-full px-3 py-1 ${selected ? "bg-ink" : "bg-slate-100"}`}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text className={`text-[11px] font-semibold ${selected ? "text-white" : "text-muted"}`}>
                    {cat ?? "Todos"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {!activeProducts.length ? (
          <EmptyState title="Sem produtos ativos" description="Ative ou cadastre produtos para iniciar uma venda." />
        ) : filteredProducts.length ? (
          filteredProducts.map((product) => {
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
                        className="h-8 w-8 items-center justify-center rounded-full bg-red-50"
                        onPress={() => cart.decrementProduct(product.id)}
                      >
                        <Ionicons name="remove" size={16} color="#EF4444" />
                      </Pressable>
                    ) : null}
                    {cartItem ? (
                      <Pressable
                        className="min-w-8 items-center rounded-lg bg-slate-100 px-2 py-1"
                        onPress={() => setKeypadTarget({ kind: "qty", product })}
                      >
                        <Text className="text-[13px] font-bold text-ink">{cartItem.quantidade}</Text>
                      </Pressable>
                    ) : null}
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-600">
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                    </View>
                  </View>
                }
              />
            );
          })
        ) : (
          <EmptyState
            title="Nenhum produto encontrado"
            description={search ? `Nada para "${search}". Tente outro nome ou categoria.` : "Nenhum item nesta categoria."}
          />
        )}
      </View>

      <PaymentTabs value={payment} onChange={handlePaymentChange} />

      {payment === "dinheiro" ? (
        <CashChangePanel
          total={cart.total}
          received={received}
          onChange={setReceived}
          onOpenKeypad={() => setKeypadTarget({ kind: "cash" })}
        />
      ) : null}

      <View className="flex-row gap-2">
        <View className="flex-1 rounded-2xl border border-line bg-white p-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted">Itens</Text>
          <Text className="mt-1 text-base font-bold text-ink">{cart.items.reduce((sum, item) => sum + item.quantidade, 0)} unid.</Text>
        </View>
        <View className="flex-1 rounded-2xl border border-line bg-white p-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted">Pagamento</Text>
          <Text className="mt-1 text-base font-bold text-ink">
            {payment === "pix" ? "PIX" : payment === "dinheiro" ? "Dinheiro" : "Cartão"}
          </Text>
        </View>
      </View>

      <Animated.View style={shakeStyle} className="mb-20">
        <Button
          title="Registrar"
          icon="checkmark-circle-outline"
          loading={sale.create.isPending}
          onPress={finishSale}
        />
        {emptyHint ? (
          <View className="mt-2 rounded-xl bg-amber-50 px-4 py-2">
            <Text className="text-center text-[13px] font-medium text-amber-700">
              Toque em um produto acima para montar o pedido
            </Text>
          </View>
        ) : null}
        {saleError ? (
          <View className="mt-2 rounded-xl bg-red-50 px-4 py-2.5">
            <Text className="text-center text-[13px] font-semibold text-red-600">Erro: {saleError}</Text>
          </View>
        ) : null}
        {saleSuccess ? (
          <View className="mt-2 rounded-xl bg-emerald-50 px-4 py-2.5">
            <Text className="text-center text-[13px] font-semibold text-emerald-700">
              Venda registrada! Dashboard atualizado.
            </Text>
          </View>
        ) : null}
      </Animated.View>

      <NumericKeypad
        visible={keypadTarget !== null}
        mode={keypadTarget?.kind === "cash" ? "currency" : "integer"}
        title={keypadTarget?.kind === "cash" ? "Valor recebido" : `Quantidade · ${keypadTarget?.product.nome ?? ""}`}
        subtitle={keypadTarget?.kind === "cash" ? `Total ${formatCurrency(cart.total)}` : undefined}
        initialValue={keypadInitialValue}
        confirmLabel={keypadTarget?.kind === "cash" ? "Calcular troco" : "Definir quantidade"}
        onConfirm={handleKeypadConfirm}
        onClose={() => setKeypadTarget(null)}
      />
    </Screen>
  );
}
