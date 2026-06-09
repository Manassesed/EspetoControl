import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

import { Header } from "@/components/Header";
import { AnimatedIconBadge } from "@/components/ui/AnimatedIconBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/utils/currency";

export default function DashboardScreen() {
  const { profile } = useAuth();
  const { logout } = useAuthActions();
  const dashboard = useDashboard(profile?.empresa_id);
  const data = dashboard.data;

  const paymentRows = Object.entries(data?.byPayment ?? {});
  const maxPayment = Math.max(...paymentRows.map(([, total]) => total), 1);
  const productRows = data?.productSales ?? [];
  const maxProduct = Math.max(...productRows.map((product) => product.total), 1);
  const saleDetails = data?.saleDetails ?? [];
  const totalSales = data?.totalSales ?? 0;
  const totalExpenses = data?.totalExpenses ?? 0;
  const profit = data?.profit ?? 0;
  const salesCount = data?.salesCount ?? 0;
  const averageTicket = totalSales / Math.max(salesCount, 1);
  const expensePercent = totalSales > 0 ? Math.min((totalExpenses / totalSales) * 100, 100) : 0;
  const profitPercent = totalSales > 0 ? Math.max((profit / totalSales) * 100, 0) : 0;
  const bestProduct = productRows[0];
  const insight =
    salesCount === 0
      ? "Comece pela primeira venda e deixe o lucro aparecer automaticamente."
      : profit <= 0
        ? "Os gastos ja encostaram nas vendas. Registre cada saida antes de comprar mais insumo."
        : `Voce esta ficando com ${profitPercent.toFixed(0)}% do que entrou hoje.`;

  return (
    <Screen>
      <Header
        title="Painel do dia"
        subtitle={profile ? `Ola, ${profile.nome}` : "Resumo do movimento"}
        onLogout={() => logout.mutate()}
      />

      <LinearGradient
        colors={profit >= 0 ? ["#101828", "#0F766E", "#10B981"] : ["#101828", "#7F1D1D", "#EF4444"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="overflow-hidden rounded-3xl p-5 shadow-sm"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-xs font-bold uppercase text-emerald-50">Dinheiro no bolso hoje</Text>
            <Text className="mt-1 text-4xl font-black text-white">{formatCurrency(profit)}</Text>
            <Text className="mt-2 text-sm leading-5 text-emerald-50">{insight}</Text>
          </View>
          <AnimatedIconBadge
            icon={profit >= 0 ? "trending-up-outline" : "alert-circle-outline"}
            size="lg"
            colors={profit >= 0 ? ["#ECFDF5", "#10B981", "#064E3B"] : ["#FEE2E2", "#EF4444", "#7F1D1D"]}
          />
        </View>
        <View className="mt-5 rounded-2xl bg-white/10 p-3">
          <View className="mb-2 flex-row justify-between">
            <Text className="text-xs font-bold uppercase text-white">Vendeu</Text>
            <Text className="text-xs font-bold uppercase text-amber-100">Gastou</Text>
          </View>
          <View className="h-3 overflow-hidden rounded-full bg-white/20">
            <View className="h-full rounded-full bg-white" style={{ width: `${Math.max(8, 100 - expensePercent)}%` }} />
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-sm font-black text-white">{formatCurrency(totalSales)}</Text>
            <Text className="text-sm font-black text-amber-100">{formatCurrency(totalExpenses)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View className="flex-row gap-2">
        <MetricCard label="Entradas" value={formatCurrency(totalSales)} tone="brand" icon="wallet-outline" />
        <MetricCard label="Saidas" value={formatCurrency(totalExpenses)} tone="warning" icon="receipt-outline" />
      </View>

      <View className="flex-row gap-2">
        <MetricCard label="Ticket medio" value={formatCurrency(averageTicket)} tone="neutral" icon="analytics-outline" />
        <MetricCard label="Atendimentos" value={String(salesCount)} icon="flash-outline" />
      </View>

      <View className="rounded-3xl border border-line bg-white p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-black text-ink">Proximo movimento</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              {bestProduct
                ? `${bestProduct.nome} esta puxando o caixa. Deixe esse item facil na hora da venda.`
                : "Cadastre os produtos mais vendidos para acelerar o atendimento no horario de pico."}
            </Text>
          </View>
          <AnimatedIconBadge icon="bulb-outline" size="sm" colors={["#FDE68A", "#F59E0B", "#78350F"]} />
        </View>
      </View>

      <View className="rounded-3xl border border-line bg-white p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
            <Text className="text-base font-black text-ink">Como o dinheiro entrou</Text>
          <AnimatedIconBadge icon="card-outline" size="sm" colors={["#CBD5E1", "#475569", "#0F172A"]} />
        </View>
        {paymentRows.length === 0 ? (
          <EmptyState title="Sem vendas hoje" description="As formas de pagamento aparecem assim que a primeira venda entrar." />
        ) : (
          <View className="mt-4 gap-3">
            {paymentRows.map(([method, total]) => (
              <View key={method}>
                <View className="mb-2 flex-row justify-between">
                  <Text className="text-sm font-bold capitalize text-ink">{method}</Text>
                  <Text className="text-sm font-black text-ink">{formatCurrency(total)}</Text>
                </View>
                <View className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <View className="h-full rounded-full bg-ink" style={{ width: `${(total / maxPayment) * 100}%` }} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="rounded-3xl border border-line bg-white p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-black text-ink">Mais vendidos</Text>
            <Text className="mt-0.5 text-xs text-muted">O que vale repor primeiro</Text>
          </View>
          <AnimatedIconBadge icon="podium-outline" size="sm" colors={["#FDE68A", "#10B981", "#064E3B"]} />
        </View>

        <View className="mt-4 gap-3">
          {productRows.map((product, index) => (
            <View key={product.produto_id}>
              <View className="mb-2 flex-row items-center justify-between gap-2">
                <View className="flex-1 flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-2xl bg-slate-100">
                    <Text className="text-xs font-black text-ink">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-ink">{product.nome}</Text>
                    <Text className="text-xs text-muted">{product.quantidade} unidades vendidas</Text>
                  </View>
                </View>
                <Text className="text-sm font-black text-ink">{formatCurrency(product.total)}</Text>
              </View>
              <View className="h-2.5 overflow-hidden rounded-full bg-slate-100">
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

      <View className="mb-24 rounded-3xl border border-line bg-white p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-black text-ink">Ultimos atendimentos</Text>
            <Text className="mt-0.5 text-xs text-muted">Conferencia rapida do caixa</Text>
          </View>
          <AnimatedIconBadge icon="list-outline" size="sm" colors={["#A5B4FC", "#4F46E5", "#1E1B4B"]} />
        </View>

        <View className="mt-3 gap-2">
          {saleDetails.map((sale) => (
            <View key={sale.id} className="flex-row items-center justify-between rounded-2xl bg-slate-50 p-2.5">
              <View className="mr-2 h-9 w-9 items-center justify-center rounded-2xl bg-white">
                <Ionicons
                  name={sale.forma_pagamento === "pix" ? "qr-code-outline" : sale.forma_pagamento === "dinheiro" ? "cash-outline" : "card-outline"}
                  size={17}
                  color="#0F172A"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-ink">{sale.label}</Text>
                <Text className="mt-1 text-xs text-muted">{sale.items}</Text>
              </View>
              <Text className="text-sm font-black text-brand-700">{formatCurrency(sale.valor_total)}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
