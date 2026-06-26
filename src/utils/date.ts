export function todayRange() {
  return dateRange(new Date());
}

export function dateRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function isToday(date: Date) {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export type ReportPeriod = "week" | "month";

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** "week" = últimos 7 dias. "month" = últimos 6 meses civis (Jan, Fev...), incluindo o mês atual. */
export function rangeFor(period: ReportPeriod, reference: Date = new Date()) {
  if (period === "month") {
    const startDate = startOfMonth(addMonths(reference, -5));
    const endDate = endOfDay(reference);
    return {
      startDate,
      endDate,
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
  }

  const startDate = startOfDay(addDays(reference, -6));
  const endDate = endOfDay(reference);
  return {
    startDate,
    endDate,
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}

/** Lista do 1º dia de cada mês entre start e end, inclusive. */
export function eachMonth(startDate: Date, endDate: Date) {
  const months: Date[] = [];
  let cursor = startOfMonth(startDate);
  const last = startOfMonth(endDate);
  while (cursor <= last) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return months;
}

/** Chave AAAA-MM, usada pra agrupar vendas/gastos por mês civil. */
export function monthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** "jan", "fev", ... capitalizado: "Jan", "Fev". */
export function formatMonthLabel(date: Date) {
  const label = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Lista de dias (início do dia) entre start e end, inclusive. */
export function eachDay(startDate: Date, endDate: Date) {
  const days: Date[] = [];
  let cursor = startOfDay(startDate);
  const last = startOfDay(endDate);
  while (cursor <= last) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

/** Chave local AAAA-MM-DD (evita o deslocamento de fuso do toISOString). */
export function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** "Sex 19". Usa tabela fixa em vez de Intl: o motor JS do app (Hermes) não
 * lida bem com o nome do dia da semana via toLocaleDateString em pt-BR. */
export function formatShortDay(date: Date) {
  return `${WEEKDAY_SHORT[date.getDay()]} ${String(date.getDate()).padStart(2, "0")}`;
}

/** dd/mm, usado quando o período é longo e o nome do dia da semana se repete demais. */
export function formatShortDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function formatDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isToday(date)) return "Hoje";

  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) return "Ontem";

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
