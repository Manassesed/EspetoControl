import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { demoExpenses, demoProductSales, demoSaleDetails, demoSales, isDemoCompany } from "@/constants/demo";
import { listTodayExpenses } from "@/services/expenseService";
import { listSaleItems, listTodayProductSales, listTodaySales } from "@/services/saleService";
import { dateRange } from "@/utils/date";

export function useDashboard(empresaId?: string, date: Date = new Date()) {
  const range = dateRange(date);

  return useQuery({
    queryKey: ["dashboard", empresaId, range.start, range.end],
    enabled: Boolean(empresaId),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const sales = isDemoCompany(empresaId) ? demoSales : await listTodaySales(empresaId!, range.start, range.end);
      const expenses = isDemoCompany(empresaId)
        ? demoExpenses
        : await listTodayExpenses(empresaId!, range.start, range.end);

      // Numeric do Postgres pode chegar como string via PostgREST: Number(...) evita
      // que "+=" vire concatenação de texto (e a conta dê NaN silenciosamente).
      const totalSales = sales.reduce((sum, sale) => sum + Number(sale.valor_total), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.valor), 0);
      const byPayment = sales.reduce<Record<string, number>>((acc, sale) => {
        acc[sale.forma_pagamento] = (acc[sale.forma_pagamento] || 0) + Number(sale.valor_total);
        return acc;
      }, {});
      const byExpenseCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
        acc[expense.categoria] = (acc[expense.categoria] || 0) + Number(expense.valor);
        return acc;
      }, {});
      const productSales = isDemoCompany(empresaId)
        ? demoProductSales
        : await listTodayProductSales(empresaId!, range.start, range.end);
      const recentSales = sales.slice(0, 5);
      const itemsBySale = isDemoCompany(empresaId) ? {} : await listSaleItems(recentSales.map((s) => s.id));
      const saleDetails = isDemoCompany(empresaId)
        ? demoSaleDetails
        : recentSales.map((sale, index) => {
            const items = itemsBySale[sale.id] ?? [];
            return {
              id: sale.id,
              label: `Venda #${String(index + 1).padStart(3, "0")}`,
              items: items.length
                ? items.map((item) => `${item.quantidade}x ${item.nome}`).join(", ")
                : "Sem itens registrados",
              itemsDetail: items,
              forma_pagamento: sale.forma_pagamento,
              valor_total: sale.valor_total,
              usuario_id: sale.usuario_id
            };
          });

      return {
        sales,
        expenses,
        totalSales,
        totalExpenses,
        profit: totalSales - totalExpenses,
        salesCount: sales.length,
        byPayment,
        byExpenseCategory,
        productSales,
        saleDetails
      };
    }
  });
}
