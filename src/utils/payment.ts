import type { PaymentMethod } from "@/types/database";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Crédito",
  cartao_debito: "Débito"
};

export const PAYMENT_BAR_COLORS: Record<PaymentMethod, string> = {
  pix: "bg-emerald-500",
  dinheiro: "bg-blue-500",
  cartao_credito: "bg-violet-500",
  cartao_debito: "bg-fuchsia-500"
};

export const PAYMENT_ICONS: Record<PaymentMethod, string> = {
  pix: "phone-portrait-outline",
  dinheiro: "cash-outline",
  cartao_credito: "card-outline",
  cartao_debito: "card-outline"
};

export function paymentLabel(method: string) {
  return PAYMENT_LABELS[method as PaymentMethod] ?? method;
}
