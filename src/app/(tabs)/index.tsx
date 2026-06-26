import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { CalendarModal } from "@/components/CalendarModal";
import { Header } from "@/components/Header";
import { AnimatedIconBadge } from "@/components/ui/AnimatedIconBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useDashboard } from "@/hooks/useDashboard";
import { useSaleMutations } from "@/hooks/useSales";
import { formatCurrency } from "@/utils/currency";
import { formatDateLabel, isToday } from "@/utils/date";
import { PAYMENT_BAR_COLORS, PAYMENT_ICONS, paymentLabel } from "@/utils/payment";
import type { PaymentMethod } from "@/types/database";

export default function DashboardScreen() {
  const { profile } = useAuth();
  const { logout } = useAuthActions();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [saleDetailId, setSaleDetailId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const dashboard = useDashboard(profile?.empresa_id, selectedDate);
  const saleMutations = useSaleMutations(profile?.empresa_id, profile?.id);

  function goToPreviousDay() {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  }

  function goToNextDay() {
    if (!isToday(selectedDate)) {
      setSelectedDate(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 1);
        return d;
      });
    }
  }
  const data = dashboard.data;

  const paymentRows = Object.entries(data?.byPayment ?? {});
  const maxPayment = Math.max(...paymentRows.map(([, total]) => total), 1);
  const expenseRows = Object.entries(data?.byExpenseCategory ?? {});
  const maxExpense = Math.max(...expenseRows.map(([, total]) => total), 1);
  const productRows = data?.productSales ?? [];
  const maxProduct = Math.max(...productRows.map((product) => product.total), 1);
  const saleDetails = data?.saleDetails ?? [];
  const totalSales = data?.totalSales ?? 0;
  const totalExpenses = data?.totalExpenses ?? 0;
  const profit = data?.profit ?? 0;
  const salesCount = data?.salesCount ?? 0;
  const averageTicket = totalSales / Math.max(salesCount, 1);
  const maxSalesOrExpenses = Math.max(totalSales, totalExpenses, 1);
  const salesBarWidth = (totalSales / maxSalesOrExpenses) * 100;
  const expenseBarWidth = (totalExpenses / maxSalesOrExpenses) * 100;
  const profitPercent = totalSales > 0 ? Math.max((profit / totalSales) * 100, 0) : 0;
  const bestProduct = productRows[0];
  const selectedSale = saleDetails.find((sale) => sale.id === saleDetailId) ?? null;
  const canDeleteSelectedSale =
    !!selectedSale && (profile?.role === "gerente" || ("usuario_id" in selectedSale && selectedSale.usuario_id === profile?.id));
  const insight =
    salesCount === 0
      ? "Comece pela primeira venda e deixe o lucro aparecer automaticamente."
      : profit <= 0
        ? "Os gastos ja encostaram nas vendas. Registre cada saida antes de comprar mais insumo."
        : `Voce esta ficando com ${profitPercent.toFixed(0)}% do que entrou hoje.`;

  if (profile && profile.role === "colaborador") {
    return <Redirect href="/venda" />;
  }

  return (
    <Screen>
      <Header
        title="Painel do dia"
        subtitle={profile ? `Olá, ${profile.nome}` : "Resumo do movimento"}
        onLogout={() => logout.mutate()}
      />

      <View className="flex-row items-center justify-between rounded-2xl border border-line bg-white px-1.5 py-0.5">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-xl"
          onPress={goToPreviousDay}
        >
          <Ionicons name="chevron-back" size={18} color="#0F172A" />
        </Pressable>

        <Pressable onPress={() => setSelectedDate(new Date())} className="flex-1 items-center">
          <Text className="text-[13px] font-semibold text-ink">{formatDateLabel(selectedDate)}</Text>
          {!isToday(selectedDate) && (
            <Text className="text-[11px] font-medium text-brand-600">toque para voltar ao hoje</Text>
          )}
        </Pressable>

        <Pressable
          className={`h-9 w-9 items-center justify-center rounded-xl ${isToday(selectedDate) ? "opacity-30" : ""}`}
          onPress={goToNextDay}
          disabled={isToday(selectedDate)}
        >
          <Ionicons name="chevron-forward" size={18} color="#0F172A" />
        </Pressable>

        <Pressable
          className="ml-1 h-9 w-9 items-center justify-center rounded-xl border border-line"
          onPress={() => setCalendarVisible(true)}
        >
          <Ionicons name="calendar-outline" size={17} color="#0F172A" />
        </Pressable>
      </View>

      <CalendarModal
        visible={calendarVisible}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setCalendarVisible(false)}
      />

      <LinearGradient
        colors={profit >= 0 ? ["#101828", "#0F766E", "#10B981"] : ["#101828", "#7F1D1D", "#EF4444"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="overflow-hidden rounded-2xl p-4"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-emerald-50">Dinheiro no bolso hoje</Text>
            <Text className="mt-1 text-3xl font-bold tracking-tight text-white">{formatCurrency(profit)}</Text>
            <Text className="mt-1.5 text-[13px] leading-5 text-emerald-50">{insight}</Text>
          </View>
          <AnimatedIconBadge
            icon={profit >= 0 ? "trending-up-outline" : "alert-circle-outline"}
            size="md"
            colors={profit >= 0 ? ["#ECFDF5", "#10B981", "#064E3B"] : ["#FEE2E2", "#EF4444", "#7F1D1D"]}
          />
        </View>
        <View className="mt-4 gap-2.5 rounded-xl bg-white/10 p-2.5">
          <View>
            <View className="mb-1 flex-row justify-between">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-white">Vendeu</Text>
              <Text className="text-[13px] font-bold text-white">{formatCurrency(totalSales)}</Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-white/20">
              <View className="h-full rounded-full bg-white" style={{ width: `${Math.max(6, salesBarWidth)}%` }} />
            </View>
          </View>
          <View>
            <View className="mb-1 flex-row justify-between">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-red-200">Gastou</Text>
              <Text className="text-[13px] font-bold text-red-200">{formatCurrency(totalExpenses)}</Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-white/20">
              <View className="h-full rounded-full bg-red-400" style={{ width: `${Math.max(6, expenseBarWidth)}%` }} />
            </View>
          </View>
        </View>
      </LinearGradient>

      <View className="flex-row gap-2">
        <MetricCard label="Entradas" value={formatCurrency(totalSales)} tone="brand" icon="wallet-outline" />
        <MetricCard label="Saídas" value={formatCurrency(totalExpenses)} tone="warning" icon="receipt-outline" />
      </View>

      <View className="flex-row gap-2">
        <MetricCard label="Ticket médio" value={formatCurrency(averageTicket)} tone="neutral" icon="analytics-outline" />
        <MetricCard label="Atendimentos" value={String(salesCount)} icon="people-outline" />
      </View>

      <Pressable
        className="flex-row items-center justify-between rounded-2xl border border-line bg-white px-3.5 py-3"
        onPress={() => setDetailsOpen((v) => !v)}
      >
        <Text className="text-[13px] font-semibold text-ink">{detailsOpen ? "Ocultar detalhes do dia" : "Ver detalhes do dia"}</Text>
        <Ionicons name={detailsOpen ? "chevron-up" : "chevron-down"} size={18} color="#0F172A" />
      </Pressable>

      {detailsOpen ? (
        <>
          <View className="rounded-2xl border border-line bg-white p-3.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[13px] font-semibold text-ink">Proximo movimento</Text>
                <Text className="mt-0.5 text-[13px] leading-5 text-muted">
                  {bestProduct
                    ? `${bestProduct.nome} esta puxando o caixa. Deixe esse item facil na hora da venda.`
                    : "Cadastre os produtos mais vendidos para acelerar o atendimento no horario de pico."}
                </Text>
              </View>
              <AnimatedIconBadge icon="bulb-outline" size="sm" colors={["#FDE68A", "#F59E0B", "#78350F"]} />
            </View>
          </View>

          <View className="rounded-2xl border border-line bg-white p-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-semibold text-ink">Como o dinheiro entrou</Text>
              <AnimatedIconBadge icon="card-outline" size="sm" colors={["#CBD5E1", "#475569", "#0F172A"]} />
            </View>
            {paymentRows.length === 0 ? (
              <EmptyState title="Sem vendas hoje" description="As formas de pagamento aparecem assim que a primeira venda entrar." />
            ) : (
              <View className="mt-3 gap-2.5">
                {paymentRows.map(([method, total]) => {
                  const barColor = PAYMENT_BAR_COLORS[method as PaymentMethod] ?? "bg-slate-400";
                  const label = paymentLabel(method);
                  return (
                    <View key={method}>
                      <View className="mb-1.5 flex-row justify-between">
                        <Text className="text-[13px] font-medium text-ink">{label}</Text>
                        <Text className="text-[13px] font-bold text-ink">{formatCurrency(total)}</Text>
                      </View>
                      <View className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <View className={`h-full rounded-full ${barColor}`} style={{ width: `${(total / maxPayment) * 100}%` }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View className="rounded-2xl border border-line bg-white p-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-semibold text-ink">Gastos por categoria</Text>
              <AnimatedIconBadge icon="pie-chart-outline" size="sm" colors={["#FECACA", "#EF4444", "#7F1D1D"]} />
            </View>
            {expenseRows.length === 0 ? (
              <EmptyState title="Sem gastos hoje" description="Os gastos lançados no dia aparecem aqui por categoria." />
            ) : (
              <View className="mt-3 gap-2.5">
                {expenseRows.map(([categoria, total]) => (
                  <View key={categoria}>
                    <View className="mb-1.5 flex-row justify-between">
                      <Text className="text-[13px] font-medium text-ink">{categoria}</Text>
                      <Text className="text-[13px] font-bold text-ink">{formatCurrency(total)}</Text>
                    </View>
                    <View className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <View className="h-full rounded-full bg-red-400" style={{ width: `${(total / maxExpense) * 100}%` }} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="rounded-2xl border border-line bg-white p-3.5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[13px] font-semibold text-ink">Mais vendidos</Text>
                <Text className="mt-0.5 text-[11px] text-muted">O que vale repor primeiro</Text>
              </View>
              <AnimatedIconBadge icon="podium-outline" size="sm" colors={["#FDE68A", "#10B981", "#064E3B"]} />
            </View>

            <View className="mt-3 gap-2.5">
              {productRows.map((product, index) => (
                <View key={product.produto_id}>
                  <View className="mb-1.5 flex-row items-center justify-between gap-2">
                    <View className="flex-1 flex-row items-center gap-2">
                      <View className="h-7 w-7 items-center justify-center rounded-xl bg-slate-100">
                        <Text className="text-[11px] font-bold text-ink">{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13px] font-medium text-ink">{product.nome}</Text>
                        <Text className="text-[11px] text-muted">{product.quantidade} unidades vendidas</Text>
                      </View>
                    </View>
                    <Text className="text-[13px] font-bold text-ink">{formatCurrency(product.total)}</Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <LinearGradient
                      colors={["#10B981", "#22D3EE"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="h-full rounded-full"
                      style={{ width: `${(product.total / maxProduct) * 100}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="mb-20 rounded-2xl border border-line bg-white p-3.5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[13px] font-semibold text-ink">Ultimos atendimentos</Text>
                <Text className="mt-0.5 text-[11px] text-muted">Conferencia rapida do caixa</Text>
              </View>
              <AnimatedIconBadge icon="list-outline" size="sm" colors={["#A5B4FC", "#4F46E5", "#1E1B4B"]} />
            </View>

            <View className="mt-2.5 gap-1.5">
              {saleDetails.map((sale) => (
                <Pressable
                  key={sale.id}
                  className="flex-row items-center justify-between rounded-xl bg-slate-50 p-2"
                  onPress={() => {
                    setConfirmingDelete(false);
                    setSaleDetailId(sale.id);
                  }}
                >
                  <View className="mr-2 h-8 w-8 items-center justify-center rounded-xl bg-white">
                    <Ionicons
                      name={(PAYMENT_ICONS[sale.forma_pagamento as PaymentMethod] ?? "card-outline") as any}
                      size={15}
                      color="#0F172A"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] font-medium text-ink">{sale.label}</Text>
                    <Text className="mt-0.5 text-[11px] text-muted">{sale.items}</Text>
                  </View>
                  <Text className="text-[13px] font-bold text-brand-700">{formatCurrency(sale.valor_total)}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 6 }} />
                </Pressable>
              ))}
            </View>
          </View>
        </>
      ) : (
        <View className="mb-20" />
      )}

      <Modal
        visible={Boolean(selectedSale)}
        animationType="slide"
        transparent
        onRequestClose={() => setSaleDetailId(null)}
      >
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setSaleDetailId(null)}>
          <Pressable className="gap-3 rounded-t-3xl bg-white p-4 pb-8" onPress={() => {}}>
            <View className="mb-1 items-center">
              <View className="h-1.5 w-12 rounded-full bg-slate-200" />
            </View>

            {selectedSale ? (
              <>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[15px] font-semibold text-ink">{selectedSale.label}</Text>
                  <Text className="text-[15px] font-bold text-brand-700">{formatCurrency(selectedSale.valor_total)}</Text>
                </View>

                <View className="gap-1.5 rounded-xl bg-slate-50 p-3">
                  {"itemsDetail" in selectedSale && selectedSale.itemsDetail.length ? (
                    selectedSale.itemsDetail.map((item) => (
                      <View key={item.produto_id} className="flex-row items-center justify-between">
                        <Text className="text-[13px] text-ink">
                          {item.quantidade}x {item.nome}
                        </Text>
                        <Text className="text-[13px] font-medium text-ink">{formatCurrency(item.valor)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-[13px] text-muted">{selectedSale.items}</Text>
                  )}
                </View>

                {canDeleteSelectedSale ? (
                  <Pressable
                    className={`flex-row items-center justify-center gap-2 rounded-xl p-3 ${confirmingDelete ? "bg-red-500" : "bg-red-50"}`}
                    onPress={() => {
                      if (confirmingDelete) {
                        saleMutations.remove.mutate(selectedSale.id, { onSuccess: () => setSaleDetailId(null) });
                      } else {
                        setConfirmingDelete(true);
                        setTimeout(() => setConfirmingDelete(false), 3000);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={confirmingDelete ? "#FFFFFF" : "#EF4444"} />
                    <Text className={`text-[13px] font-semibold ${confirmingDelete ? "text-white" : "text-red-600"}`}>
                      {confirmingDelete ? "Toque novamente para excluir" : "Excluir venda (lancei errado)"}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
