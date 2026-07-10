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

/** "week" = semana atual (Seg–Dom). "month" = todos os dias do mês selecionado. */
export function rangeFor(period: ReportPeriod, reference: Date = new Date()) {
  if (period === "month") {
    const startDate = startOfMonth(reference);
    const endDate = endOfDay(new Date(reference.getFullYear(), reference.getMonth() + 1, 0));
    return {
      startDate,
      endDate,
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
  }

  // Sempre começa na segunda-feira da semana atual (0=Dom → recua 6 dias; 1=Seg → 0 dias, etc.)
  const dow = reference.getDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const startDate = startOfDay(addDays(reference, -daysFromMonday));
  const endDate = endOfDay(addDays(startDate, 6));
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

const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTH_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/** "Jan", "Fev", ... — tabela fixa para evitar inconsistências do Hermes com toLocaleDateString. */
export function formatMonthLabel(date: Date) {
  return MONTH_SHORT[date.getMonth()];
}

/** "Janeiro 2026", "Fevereiro 2026", ... — tabela fixa para evitar inconsistências do Hermes. */
export function formatMonthYear(date: Date) {
  return `${MONTH_FULL[date.getMonth()]} ${date.getFullYear()}`;
}

/** "1", "2", ... — número do dia do mês, para o eixo X do gráfico mensal. */
export function formatDayNumber(date: Date) {
  return String(date.getDate());
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

const WEEKDAY_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

/** "Segunda-feira 19". Usa tabela fixa em vez de Intl: o motor JS do app
 * (Hermes) não lida bem com o nome do dia da semana via toLocaleDateString em pt-BR. */
export function formatShortDay(date: Date) {
  return `${WEEKDAY_FULL[date.getDay()]} ${String(date.getDate()).padStart(2, "0")}`;
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
