import type { EmpresaSubscription } from "@/types/database";

/** true se a empresa não pode mais usar o app (trial vencido sem assinatura, ou pagamento em atraso/cancelado). */
export function isSubscriptionBlocked(sub: EmpresaSubscription | null | undefined): boolean {
  if (!sub) return false;

  if (sub.subscription_status === "active" || sub.subscription_status === "lifetime") {
    return false;
  }

  if (sub.subscription_status === "trial") {
    return new Date(sub.trial_ends_at).getTime() < Date.now();
  }

  // "past_due" ou "canceled"
  return true;
}

/** Dias restantes de trial (0 se já venceu ou se não estiver em trial). */
export function daysLeftInTrial(sub: EmpresaSubscription | null | undefined): number {
  if (!sub || sub.subscription_status !== "trial") return 0;
  const diffMs = new Date(sub.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
