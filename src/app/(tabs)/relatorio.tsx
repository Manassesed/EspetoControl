import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { CalendarModal } from "@/components/CalendarModal";
import { Header } from "@/components/Header";
import { AnimatedIconBadge } from "@/components/ui/AnimatedIconBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useReport } from "@/hooks/useReport";
import { addDays, addMonths, dayKey, monthKey, type ReportPeriod } from "@/utils/date";
import { exportXlsx } from "@/utils/export";
import { formatCurrency } from "@/utils/currency";
import { PAYMENT_BAR_COLORS, paymentLabel } from "@/utils/payment";
import type { PaymentMethod } from "@/types/database";

const periods: { value: ReportPeriod; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" }
];

/** Rótulo curto pro topo das barras: 1234 -> "1,2k", senão valor inteiro arredondado. */
function formatBarLabel(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "").replace(".", ",")}k`;
  return String(Math.round(value));
}

export default function ReportScreen() {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<{ key: string; label: string } | null>(null);
  const report = useReport(profile?.empresa_id, period, referenceDate);
  const data = report.data;

  const keyForBucket = period === "month" ? monthKey : dayKey;

  // Quando o usuário toca numa barra, os cards acima passam a refletir só aquele dia/mês.
  const filteredSales = selectedBucket
    ? (data?.sales ?? []).filter((s) => keyForBucket(new Date(s.created_at)) === selectedBucket.key)
    : data?.sales ?? [];
  const filteredExpenses = selectedBucket
    ? (data?.expenses ?? []).filter((e) => keyForBucket(new Date(e.created_at)) === selectedBucket.key)
    : data?.expenses ?? [];

  const totalSales = selectedBucket
    ? filteredSales.reduce((sum, s) => sum + Number(s.valor_total), 0)
    : data?.totalSales ?? 0;
  const totalExpenses = selectedBucket
    ? filteredExpenses.reduce((sum, e) => sum + Number(e.valor), 0)
    : data?.totalExpenses ?? 0;
  const profit = selectedBucket ? totalSales - totalExpenses : data?.profit ?? 0;
  const salesCount = selectedBucket ? filteredSales.length : data?.salesCount ?? 0;
  const averageTicket = selectedBucket ? totalSales / Math.max(salesCount, 1) : data?.averageTicket ?? 0;
  const perDay = data?.perDay ?? [];
  const bestDay = data?.bestDay ?? null;
  const productRows = (data?.productSales ?? []).slice(0, 5);
  const paymentRows = selectedBucket
    ? Object.entries(
        filteredSales.reduce<Record<string, number>>((acc, s) => {
          acc[s.forma_pagamento] = (acc[s.forma_pagamento] || 0) + Number(s.valor_total);
          return acc;
        }, {})
      )
    : Object.entries(data?.byPayment ?? {});

  const maxDay = Math.max(...perDay.map((d) => Math.max(d.sales, d.expenses)), 1);
  const maxPayment = Math.max(...paymentRows.map(([, total]) => total), 1);
  const maxProduct = Math.max(...productRows.map((p) => p.total), 1);
  const today = new Date();
  const nextRef = period === "week" ? addDays(referenceDate, 7) : addMonths(referenceDate, 1);
  const isCurrentPeriod = nextRef > today;

  function goPrev() {
    setSelectedBucket(null);
    setReferenceDate(d => period === "week" ? addDays(d, -7) : addMonths(d, -1));
  }
  function goNext() {
    if (!isCurrentPeriod) {
      setSelectedBucket(null);
      setReferenceDate(d => period === "week" ? addDays(d, 7) : addMonths(d, 1));
    }
  }

  const fmtShort = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const periodNavLabel = data
    ? period === "week"
      ? `${fmtShort(data.startDate)} – ${fmtShort(data.endDate)}`
      : referenceDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "...";

  const periodLabel = selectedBucket
    ? selectedBucket.label
    : period === "week" ? periodNavLabel : "Últimos 6 meses";
  const bestBucketLabel = period === "week" ? "Melhor dia" : "Melhor mês";
  const bestProduct = productRows[0];
  const expensePercent = totalSales > 0 ? (totalExpenses / totalSales) * 100 : 0;

  const profitPercent = totalSales > 0 ? Math.max(0, (profit / totalSales) * 100) : 0;

  const insight =
    salesCount === 0
      ? "Sem vendas no período. Use a divulgação ou promoções para aquecer o caixa."
      : profit <= 0
        ? "Os gastos consumiram tudo que entrou no período. Revise custos antes de comprar mais insumo."
        : expensePercent > 50
          ? `Os gastos já tomam ${expensePercent.toFixed(0)}% do faturamento. Vale renegociar fornecedores ou cortar custo fixo.`
          : bestProduct
            ? `${bestProduct.nome} lidera as vendas (${formatCurrency(bestProduct.total)}). Mantenha estoque garantido desse item.`
            : bestDay && bestDay.sales > 0
              ? `${bestDay.label} foi o(a) ${bestBucketLabel.toLowerCase().replace("melhor ", "")} com mais venda (${formatCurrency(bestDay.sales)}).`
              : `Lucro de ${formatCurrency(profit)} no período, ${profitPercent.toFixed(0)}% de margem.`;

  function handleExport() {
    if (!data) return;
    const money = (v: number) => Number(v.toFixed(2));

    const resumo: (string | number)[][] = [
      ["EspetoControl - Relatório", periodLabel],
      ["Período", `${data.startDate.toLocaleDateString("pt-BR")} a ${data.endDate.toLocaleDateString("pt-BR")}`],
      [],
      ["Faturamento", money(totalSales)],
      ["Gastos", money(totalExpenses)],
      ["Lucro", money(profit)],
      ["Atendimentos", salesCount],
      ["Ticket médio", money(averageTicket)],
      [],
      ["Insight", insight]
    ];
    const porDia: (string | number)[][] = [
      ["Dia", "Vendas (R$)", "Atendimentos"],
      ...perDay.map((d) => [d.label, money(d.sales), d.count])
    ];
    const produtos: (string | number)[][] = [
      ["Produto", "Categoria", "Qtd", "Total (R$)"],
      ...(data.productSales ?? []).map((p) => [p.nome, p.categoria, p.quantidade, money(p.total)])
    ];
    const pagamentos: (string | number)[][] = [
      ["Forma de pagamento", "Total (R$)"],
      ...paymentRows.map(([method, total]) => [paymentLabel(method), money(total)])
    ];

    exportXlsx(`relatorio-${period}-${dayKey(data.endDate)}.xlsx`, [
      { name: "Resumo", rows: resumo },
      { name: "Vendas por dia", rows: porDia },
      { name: "Produtos", rows: produtos },
      { name: "Pagamentos", rows: pagamentos }
    ]);
  }

  if (profile && profile.role === "colaborador") {
    return <Redirect href="/venda" />;
  }

  return (
    <Screen>
      <CalendarModal
        visible={calendarVisible}
        selectedDate={referenceDate}
        onSelect={(d) => { setReferenceDate(d); setSelectedBucket(null); }}
        onClose={() => setCalendarVisible(false)}
      />
      <Header title="Relatório" subtitle="O resultado do período, com exportação em Excel" />

      {report.isError ? (
        <View className="items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-5">
          <Ionicons name="cloud-offline-outline" size={26} color="#EF4444" />
          <Text className="text-center text-[13px] font-semibold text-red-700">Não foi possível carregar o relatório</Text>
          <Button title="Tentar novamente" icon="refresh-outline" variant="ghost" onPress={() => report.refetch()} />
        </View>
      ) : null}

      <LinearGradient
        colors={profit >= 0 ? ["#101828", "#0F766E", "#10B981"] : ["#101828", "#7F1D1D", "#EF4444"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="overflow-hidden rounded-2xl p-4"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-emerald-50">Lucro · {periodLabel}</Text>
            <Text className="mt-1 text-3xl font-bold tracking-tight text-white">{formatCurrency(profit)}</Text>
            <Text className="mt-1.5 text-[13px] text-emerald-50">
              {salesCount > 0
                ? `${salesCount} atendimentos · ticket médio ${formatCurrency(averageTicket)}`
                : "Sem vendas no período."}
            </Text>
          </View>
          <AnimatedIconBadge icon="stats-chart-outline" size="md" colors={["#ECFDF5", "#10B981", "#064E3B"]} />
        </View>
        <View className="mt-4 rounded-xl bg-white/10 p-2.5">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-white">Insight para o gestor</Text>
          <Text className="mt-1 text-[13px] leading-5 text-white">{insight}</Text>
        </View>
      </LinearGradient>

      <View className="flex-row gap-2">
        <MetricCard label="Faturamento" value={formatCurrency(totalSales)} tone="brand" icon="wallet-outline" />
        <MetricCard label="Gastos" value={formatCurrency(totalExpenses)} tone="warning" icon="receipt-outline" />
      </View>

      <View className="rounded-2xl border border-line bg-white p-3.5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[13px] font-semibold text-ink">{period === "week" ? "Vendas por dia" : "Vendas por mês"}</Text>
            {selectedBucket ? (
              <Text className="mt-0.5 text-[11px] text-muted">Toque na barra de novo pra tirar o filtro</Text>
            ) : bestDay && bestDay.sales > 0 ? (
              <Text className="mt-0.5 text-[11px] text-muted">
                {bestBucketLabel}: {bestDay.label} ({formatCurrency(bestDay.sales)})
              </Text>
            ) : (
              <Text className="mt-0.5 text-[11px] text-muted">Movimento do período</Text>
            )}
          </View>
          <AnimatedIconBadge icon="bar-chart-outline" size="sm" colors={["#A5B4FC", "#4F46E5", "#1E1B4B"]} />
        </View>

        <View className="mt-3 flex-row items-center gap-2">
          <Pressable
            className="h-8 w-8 items-center justify-center rounded-xl bg-slate-100"
            onPress={goPrev}
          >
            <Ionicons name="chevron-back" size={16} color="#0F172A" />
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-1.5"
            onPress={() => setCalendarVisible(true)}
          >
            <Ionicons name="calendar-outline" size={13} color="#64748B" />
            <Text className="text-[12px] font-semibold text-ink">{periodNavLabel}</Text>
          </Pressable>
          <Pressable
            className={`h-8 w-8 items-center justify-center rounded-xl bg-slate-100 ${isCurrentPeriod ? "opacity-30" : ""}`}
            onPress={goNext}
            disabled={isCurrentPeriod}
          >
            <Ionicons name="chevron-forward" size={16} color="#0F172A" />
          </Pressable>
        </View>

        {report.isLoading ? (
          <View className="items-center py-10">
            <Ionicons name="sync-outline" size={26} color="#94A3B8" />
            <Text className="mt-2 text-[13px] text-muted">Carregando relatório...</Text>
          </View>
        ) : (
          <>
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1.5">
                  <View className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <Text className="text-[11px] text-muted">Vendas</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <Text className="text-[11px] text-muted">Gastos</Text>
                </View>
              </View>

              {selectedBucket ? (
                <Pressable
                  className="flex-row items-center gap-1 rounded-full bg-slate-100 px-2 py-1"
                  onPress={() => setSelectedBucket(null)}
                >
                  <Text className="text-[11px] font-semibold text-ink">{selectedBucket.label}</Text>
                  <Ionicons name="close-circle" size={13} color="#0F172A" />
                </Pressable>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
              <View>
                <View className="flex-row items-end gap-3" style={{ height: 150 }}>
                  {perDay.map((bar) => {
                    // Escala em raiz quadrada (não linear): comprime a diferença entre o maior
                    // e os menores valores, então um mês/dia bem menor que o maior ainda fica visível.
                    const salesH = bar.sales > 0 ? Math.max(12, Math.sqrt(bar.sales / maxDay) * 85) : 0;
                    const expensesH = bar.expenses > 0 ? Math.max(12, Math.sqrt(bar.expenses / maxDay) * 85) : 0;
                    const isBest = bestDay?.key === bar.key && bar.sales > 0;
                    const isSelected = selectedBucket?.key === bar.key;
                    return (
                      <Pressable
                        key={bar.key}
                        className={`flex-row items-end gap-1 rounded-lg ${isSelected ? "bg-slate-100" : ""}`}
                        style={{ width: 44, height: "100%" }}
                        onPress={() =>
                          setSelectedBucket((current) => (current?.key === bar.key ? null : { key: bar.key, label: bar.label }))
                        }
                      >
                        <View className="flex-1 items-center justify-end" style={{ height: "100%" }}>
                          {bar.sales > 0 ? (
                            <Text className="mb-0.5 text-[8px] font-bold text-emerald-700" numberOfLines={1}>
                              {formatBarLabel(bar.sales)}
                            </Text>
                          ) : null}
                          <View
                            className={`w-4 rounded-t-lg ${isBest ? "bg-emerald-500" : "bg-brand-500"}`}
                            style={{ height: `${salesH}%` }}
                          />
                        </View>
                        <View className="flex-1 items-center justify-end" style={{ height: "100%" }}>
                          {bar.expenses > 0 ? (
                            <Text className="mb-0.5 text-[8px] font-bold text-red-500" numberOfLines={1}>
                              {formatBarLabel(bar.expenses)}
                            </Text>
                          ) : null}
                          <View className="w-4 rounded-t-lg bg-red-400" style={{ height: `${expensesH}%` }} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <View className="mt-1 flex-row gap-3">
                  {perDay.map((bar) => (
                    <Text key={bar.key} className="text-center text-[9px] text-muted" style={{ width: 44 }}>
                      {bar.label}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View className="mt-3 flex-row gap-1.5">
              {periods.map((p) => {
                const selected = p.value === period;
                return (
                  <Pressable
                    key={p.value}
                    className={`rounded-full px-3 py-1 ${selected ? "bg-ink" : "bg-slate-100"}`}
                    onPress={() => {
                      setPeriod(p.value);
                      setSelectedBucket(null);
                    }}
                  >
                    <Text className={`text-[11px] font-semibold ${selected ? "text-white" : "text-muted"}`}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>

      <View className="flex-row gap-2">
        <MetricCard label="Atendimentos" value={String(salesCount)} icon="people-outline" />
        <MetricCard label="Ticket médio" value={formatCurrency(averageTicket)} tone="neutral" icon="analytics-outline" />
      </View>

      <View className="rounded-2xl border border-line bg-white p-3.5">
        <Text className="text-[13px] font-semibold text-ink">Como o dinheiro entrou</Text>
        {paymentRows.length === 0 ? (
          <EmptyState title="Sem vendas no período" description="As formas de pagamento aparecem quando houver venda." />
        ) : (
          <View className="mt-3 gap-2.5">
            {paymentRows.map(([method, total]) => {
              const barColor = PAYMENT_BAR_COLORS[method as PaymentMethod] ?? "bg-slate-400";
              return (
                <View key={method}>
                  <View className="mb-1.5 flex-row justify-between">
                    <Text className="text-[13px] font-medium text-ink">{paymentLabel(method)}</Text>
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
        <Text className="text-[13px] font-semibold text-ink">Mais vendidos no período</Text>
        {productRows.length === 0 ? (
          <EmptyState title="Sem produtos vendidos" description="Os campeões de venda aparecem aqui." />
        ) : (
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
                      <Text className="text-[11px] text-muted">{product.quantidade} unidades</Text>
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
        )}
      </View>

      <View className="mb-20">
        <Button
          title="Exportar relatório (Excel)"
          icon="download-outline"
          variant="secondary"
          disabled={!data || salesCount === 0}
          onPress={handleExport}
        />
      </View>
    </Screen>
  );
}
