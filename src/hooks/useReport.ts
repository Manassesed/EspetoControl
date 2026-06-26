import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { demoExpenses, demoProductSales, demoSales, isDemoCompany } from "@/constants/demo";
import { listTodayExpenses } from "@/services/expenseService";
import { listTodayProductSales, listTodaySales } from "@/services/saleService";
import {
  dayKey,
  eachDay,
  eachMonth,
  formatMonthLabel,
  formatShortDay,
  monthKey,
  rangeFor,
  type ReportPeriod
} from "@/utils/date";

export type DayBucket = {
  key: string;
  label: string;
  sales: number;
  expenses: number;
  count: number;
};

export function useReport(empresaId: string | undefined, period: ReportPeriod, referenceDate: Date = new Date()) {
  const range = rangeFor(period, referenceDate);

  return useQuery({
    queryKey: ["report", empresaId, period, range.start, range.end],
    enabled: Boolean(empresaId),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const demo = isDemoCompany(empresaId);
      const sales = demo ? demoSales : await listTodaySales(empresaId!, range.start, range.end);
      const expenses = demo ? demoExpenses : await listTodayExpenses(empresaId!, range.start, range.end);
      const productSales = demo
        ? demoProductSales
        : await listTodayProductSales(empresaId!, range.start, range.end);

      // Numeric do Postgres pode chegar como string via PostgREST: Number(...) evita
      // que "+=" vire concatenação de texto (e a conta dê NaN silenciosamente).
      const totalSales = sales.reduce((sum, s) => sum + Number(s.valor_total), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.valor), 0);
      const salesCount = sales.length;

      const byPayment = sales.reduce<Record<string, number>>((acc, s) => {
        acc[s.forma_pagamento] = (acc[s.forma_pagamento] || 0) + Number(s.valor_total);
        return acc;
      }, {});

      // Buckets por dia (semana) ou por mês civil (mês), zerando os que não tiveram venda
      // para o gráfico ficar contínuo.
      const isMonthly = period === "month";
      const keyFor = isMonthly ? monthKey : dayKey;
      const labelFor = isMonthly ? formatMonthLabel : formatShortDay;
      const bucketDates = isMonthly ? eachMonth(range.startDate, range.endDate) : eachDay(range.startDate, range.endDate);

      const buckets = new Map<string, DayBucket>();
      for (const bucketDate of bucketDates) {
        buckets.set(keyFor(bucketDate), { key: keyFor(bucketDate), label: labelFor(bucketDate), sales: 0, expenses: 0, count: 0 });
      }
      for (const sale of sales) {
        const key = keyFor(new Date(sale.created_at));
        const bucket = buckets.get(key);
        if (bucket) {
          bucket.sales += Number(sale.valor_total);
          bucket.count += 1;
        }
      }
      for (const expense of expenses) {
        const key = keyFor(new Date(expense.created_at));
        const bucket = buckets.get(key);
        if (bucket) {
          bucket.expenses += Number(expense.valor);
        }
      }
      const perDay = Array.from(buckets.values());
      const bestDay = perDay.reduce<DayBucket | null>(
        (best, b) => (!best || b.sales > best.sales ? b : best),
        null
      );

      return {
        startDate: range.startDate,
        endDate: range.endDate,
        sales,
        expenses,
        totalSales,
        totalExpenses,
        profit: totalSales - totalExpenses,
        salesCount,
        averageTicket: totalSales / Math.max(salesCount, 1),
        byPayment,
        productSales,
        perDay,
        bestDay
      };
    }
  });
}
