import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { AnimatedIconBadge } from "@/components/ui/AnimatedIconBadge";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useCreateCheckout } from "@/hooks/useBilling";
import { daysLeftInTrial } from "@/utils/subscription";

const MONTHLY_PRICE_LABEL = "R$ 29,90/mês";

export default function AssinaturaScreen() {
  const { profile, empresaSubscription } = useAuth();
  const { logout } = useAuthActions();
  const checkout = useCreateCheckout();

  const isManager = profile?.role === "gerente";
  const status = empresaSubscription?.subscription_status;
  const daysLeft = daysLeftInTrial(empresaSubscription);
  const isTrialActive = status === "trial" && daysLeft > 0;

  return (
    <Screen scroll={false}>
      <View className="flex-1 items-center justify-center gap-4 px-2">
        <AnimatedIconBadge icon="lock-closed-outline" size="lg" colors={["#0F172A", "#1E3A8A", "#10B981"]} />

        <View className="items-center gap-1">
          <Text className="text-center text-[16px] font-bold text-ink">
            {isTrialActive ? `Faltam ${daysLeft} dia(s) de teste grátis` : "Assinatura necessária"}
          </Text>
          <Text className="max-w-[260px] text-center text-[12.5px] text-muted">
            {isTrialActive
              ? "Assine agora e continue usando sem interrupção quando o teste acabar."
              : "O teste grátis acabou ou a assinatura está em atraso. Assine pra continuar usando o EspetoControl."}
          </Text>
        </View>

        <View className="w-full max-w-[280px] flex-row items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50">
            <Ionicons name="card-outline" size={16} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-muted">Plano mensal</Text>
            <Text className="text-lg font-bold text-ink">{MONTHLY_PRICE_LABEL}</Text>
          </View>
          <Text className="text-[10.5px] text-muted">Cancele{"\n"}quando quiser</Text>
        </View>

        {isManager ? (
          <View className="w-full max-w-[280px] gap-2">
            {checkout.isError ? (
              <View className="rounded-xl bg-red-50 px-3 py-2">
                <Text className="text-center text-[12px] font-semibold text-red-600">
                  {checkout.error instanceof Error ? checkout.error.message : "Não foi possível abrir o checkout."}
                </Text>
              </View>
            ) : null}
            <Button
              title="Assinar agora"
              icon="card-outline"
              loading={checkout.isPending}
              onPress={() => checkout.mutate()}
            />
          </View>
        ) : (
          <View className="w-full max-w-[280px] items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-3">
            <Ionicons name="information-circle-outline" size={18} color="#92400E" />
            <Text className="text-center text-[12px] font-medium text-amber-800">
              A assinatura da empresa venceu. Peça pro gerente renovar pra voltar a usar o app.
            </Text>
          </View>
        )}

        <Pressable onPress={() => logout.mutate()} className="py-1.5">
          <Text className="text-center text-[13px] font-semibold text-muted">Sair</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
