import { useQuery } from "@tanstack/react-query";

import { demoExpenses, demoProductSales, demoSaleDetails, demoSales, isDemoCompany } from "@/constants/demo";
import { listTodayExpenses } from "@/services/expenseService";
import { listTodayProductSales, listTodaySales } from "@/services/saleService";
import { todayRange } from "@/utils/date";

export function useDashboard(empresaId?: string) {
  const range = todayRange();

  return useQuery({
    queryKey: ["dashboard", empresaId, range.start],
    enabled: Boolean(empresaId),
    queryFn: async () => {
      const sales = isDemoCompany(empresaId) ? demoSales : await listTodaySales(empresaId!, range.start, range.end);
      const expenses = isDemoCompany(empresaId)
        ? demoExpenses
        : await listTodayExpenses(empresaId!, range.start, range.end);

      const totalSales = sales.reduce((sum, sale) => sum + sale.valor_total, 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.valor, 0);
      const byPayment = sales.reduce<Record<string, number>>((acc, sale) => {
        acc[sale.forma_pagamento] = (acc[sale.forma_pagamento] || 0) + sale.valor_total;
        return acc;
      }, {});
      const productSales = isDemoCompany(empresaId)
        ? demoProductSales
        : await listTodayProductSales(empresaId!, range.start, range.end);
      const saleDetails = isDemoCompany(empresaId)
        ? demoSaleDetails
        : sales.slice(0, 5).map((sale, index) => ({
            id: sale.id,
            label: `Venda #${String(index + 1).padStart(3, "0")}`,
            items: "Detalhes disponiveis ao consultar itens",
            forma_pagamento: sale.forma_pagamento,
            valor_total: sale.valor_total
          }));

      return {
        sales,
        expenses,
        totalSales,
        totalExpenses,
        profit: totalSales - totalExpenses,
        salesCount: sales.length,
        byPayment,
        productSales,
        saleDetails
      };
    }
  });
}
