import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { isDemoCompany } from "@/constants/demo";
import { useAuth } from "@/context/AuthContext";
import { useComanda, useComandaMutations } from "@/hooks/useComanda";
import { useProducts } from "@/hooks/useProducts";
import type { PaymentMethod, Produto } from "@/types/database";
import { formatCurrency } from "@/utils/currency";

type KeypadTarget = { kind: "qty"; produtoId: string; nome: string } | { kind: "cash" };

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export default function MesaAtendimentoScreen() {
  const { id: mesaId, nome: mesaNome } = useLocalSearchParams<{ id: string; nome?: string }>();
  const { profile, session, demoMode, loading: authLoading } = useAuth();
  const empresaId = profile?.empresa_id;

  const [comandaId, setComandaId] = useState<string | null>(null);
  const [abrirTentado, setAbrirTentado] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [received, setReceived] = useState(0);
  const [keypadTarget, setKeypadTarget] = useState<KeypadTarget | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const { abrir, incrementar, definir, fechar, cancelar } = useComandaMutations(empresaId);
  const comanda = useComanda(comandaId ?? undefined);
  const products = useProducts(empresaId, true);

  useEffect(() => {
    if (!mesaId || comandaId || abrirTentado) return;
    setAbrirTentado(true);
    abrir.mutate(mesaId, {
      onSuccess: (data) => setComandaId(data.id)
    });
  }, [mesaId, comandaId, abrirTentado, abrir]);

  const itens = comanda.data?.comanda_itens ?? [];
  const total = itens.reduce((sum, item) => sum + Number(item.valor_unitario) * item.quantidade, 0);

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

  function qtyOf(produtoId: string) {
    return itens.find((item) => item.produto_id === produtoId)?.quantidade ?? 0;
  }

  function handleAdd(product: Produto) {
    if (!comandaId) return;
    incrementar.mutate({ comandaId, produtoId: product.id, delta: 1 });
  }

  function handleDecrement(produtoId: string) {
    if (!comandaId) return;
    incrementar.mutate({ comandaId, produtoId, delta: -1 });
  }

  function handlePaymentChange(method: PaymentMethod) {
    setPayment(method);
    if (method !== "dinheiro") setReceived(0);
  }

  function handleKeypadConfirm(value: number) {
    if (!keypadTarget || !comandaId) return;
    if (keypadTarget.kind === "qty") {
      definir.mutate({ comandaId, produtoId: keypadTarget.produtoId, quantidade: value });
    } else {
      setReceived(value);
    }
  }

  function handleClose() {
    if (!comandaId) return;
    setCloseError(null);
    fechar.mutate(
      { comandaId, formaPagamento: payment },
      {
        onSuccess: () => router.back(),
        onError: (error) => setCloseError(error instanceof Error ? error.message : String(error))
      }
    );
  }

  function handleCancel() {
    if (!comandaId) return;
    if (confirmingCancel) {
      cancelar.mutate(comandaId, { onSuccess: () => router.back() });
    } else {
      setConfirmingCancel(true);
      setTimeout(() => setConfirmingCancel(false), 3000);
    }
  }

  if (!authLoading && !session && !demoMode) {
    return <Redirect href="/auth/login" />;
  }

  if (isDemoCompany(empresaId)) {
    return <Redirect href="/(tabs)/mesas" />;
  }

  if (abrir.isPending || (!comandaId && !abrir.isError)) {
    return (
      <Screen>
        <Header title={mesaNome ?? "Mesa"} subtitle="Abrindo a conta..." />
        <View className="items-center gap-2 py-16">
          <Ionicons name="sync-outline" size={28} color="#94A3B8" />
        </View>
      </Screen>
    );
  }

  if (abrir.isError) {
    return (
      <Screen>
        <Header title={mesaNome ?? "Mesa"} />
        <View className="items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-6">
          <Ionicons name="wifi-outline" size={28} color="#EF4444" />
          <Text className="text-center text-[13px] font-semibold text-red-700">
            {abrir.error instanceof Error ? abrir.error.message : "Não foi possível abrir a mesa"}
          </Text>
          <Button title="Voltar" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const keypadInitialValue =
    keypadTarget?.kind === "qty" ? qtyOf(keypadTarget.produtoId) : received;

  return (
    <Screen>
      <Header title={mesaNome ?? "Mesa"} subtitle="Adicione itens conforme o cliente for pedindo" />

      <LinearGradient
        colors={["#111827", "#1E3A8A", "#10B981"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl p-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-emerald-50">Conta da mesa</Text>
            <Text className="mt-1 text-3xl font-bold tracking-tight text-white">{formatCurrency(total)}</Text>
            <Text className="mt-1 text-[13px] text-emerald-50">
              {itens.length ? `${itens.length} item(ns) na conta` : "Toque nos produtos para começar o pedido"}
            </Text>
          </View>
          <AnimatedIconBadge icon="restaurant-outline" size="md" colors={["#ECFDF5", "#10B981", "#064E3B"]} />
        </View>
        {itens.length ? (
          <View className="mt-3 gap-1.5">
            {itens.map((item) => (
              <View key={item.id} className="flex-row items-center justify-between rounded-xl bg-white/10 px-2.5 py-1.5">
                <Pressable
                  className="flex-1 flex-row items-center gap-1"
                  onPress={() => setKeypadTarget({ kind: "qty", produtoId: item.produto_id, nome: item.produtos?.nome ?? "" })}
                >
                  <Text className="text-[11px] font-medium text-white">
                    {item.quantidade}x {item.produtos?.nome ?? "Produto"}
                  </Text>
                  <Ionicons name="create-outline" size={12} color="#A7F3D0" />
                </Pressable>
                <Pressable onPress={() => handleDecrement(item.produto_id)} hitSlop={6}>
                  <Ionicons name="remove-circle-outline" size={20} color="#FCA5A5" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </LinearGradient>

      <View className="gap-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[13px] font-semibold text-ink">Toque para adicionar</Text>
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
                  <Text className={`text-[11px] font-semibold ${selected ? "text-white" : "text-muted"}`}>{cat ?? "Todos"}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {!activeProducts.length ? (
          <EmptyState title="Sem produtos ativos" description="Ative ou cadastre produtos para atender esta mesa." />
        ) : filteredProducts.length ? (
          filteredProducts.map((product) => {
            const qty = qtyOf(product.id);
            return (
              <ProductRow
                key={product.id}
                product={product}
                onPress={() => handleAdd(product)}
                right={
                  <View className="mt-1 flex-row items-center gap-2">
                    {qty ? (
                      <Pressable
                        className="h-8 w-8 items-center justify-center rounded-full bg-red-50"
                        onPress={() => handleDecrement(product.id)}
                      >
                        <Ionicons name="remove" size={16} color="#EF4444" />
                      </Pressable>
                    ) : null}
                    {qty ? (
                      <Pressable
                        className="min-w-8 items-center rounded-lg bg-slate-100 px-2 py-1"
                        onPress={() => setKeypadTarget({ kind: "qty", produtoId: product.id, nome: product.nome })}
                      >
                        <Text className="text-[13px] font-bold text-ink">{qty}</Text>
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
          total={total}
          received={received}
          onChange={setReceived}
          onOpenKeypad={() => setKeypadTarget({ kind: "cash" })}
        />
      ) : null}

      {closeError ? (
        <View className="rounded-xl bg-red-50 px-4 py-2.5">
          <Text className="text-center text-[13px] font-semibold text-red-600">Erro: {closeError}</Text>
        </View>
      ) : null}

      <Button
        title="Fechar comanda"
        icon="checkmark-circle-outline"
        loading={fechar.isPending}
        disabled={!itens.length}
        onPress={handleClose}
      />

      <Pressable
        className={`flex-row items-center justify-center gap-2 rounded-xl p-3 ${confirmingCancel ? "bg-red-500" : "bg-red-50"}`}
        onPress={handleCancel}
      >
        <Ionicons name="close-circle-outline" size={16} color={confirmingCancel ? "#FFFFFF" : "#EF4444"} />
        <Text className={`text-[13px] font-semibold ${confirmingCancel ? "text-white" : "text-red-600"}`}>
          {confirmingCancel ? "Toque novamente para cancelar a mesa" : "Cancelar mesa (sem venda)"}
        </Text>
      </Pressable>

      <View className="mb-20" />

      <NumericKeypad
        visible={keypadTarget !== null}
        mode={keypadTarget?.kind === "cash" ? "currency" : "integer"}
        title={keypadTarget?.kind === "cash" ? "Valor recebido" : `Quantidade · ${keypadTarget?.nome ?? ""}`}
        subtitle={keypadTarget?.kind === "cash" ? `Total ${formatCurrency(total)}` : undefined}
        initialValue={keypadInitialValue}
        confirmLabel={keypadTarget?.kind === "cash" ? "Calcular troco" : "Definir quantidade"}
        onConfirm={handleKeypadConfirm}
        onClose={() => setKeypadTarget(null)}
      />
    </Screen>
  );
}
