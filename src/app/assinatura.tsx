import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

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
      <View className="flex-1 items-center justify-center gap-6">
        <LinearGradient
          colors={["#111827", "#1E3A8A", "#10B981"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-full rounded-2xl p-5"
        >
          <View className="items-center gap-2">
            <Ionicons name="lock-closed-outline" size={28} color="#FFFFFF" />
            <Text className="text-center text-lg font-bold text-white">
              {isTrialActive ? `Faltam ${daysLeft} dia(s) de teste grátis` : "Assinatura necessária"}
            </Text>
            <Text className="text-center text-[13px] text-emerald-50">
              {isTrialActive
                ? "Assine agora e continue usando sem interrupção quando o teste acabar."
                : "O teste grátis acabou ou a assinatura está em atraso. Assine pra continuar usando o EspetoControl."}
            </Text>
          </View>
        </LinearGradient>

        <View className="w-full items-center gap-1.5 rounded-2xl border border-line bg-white p-5">
          <Text className="text-[13px] font-semibold uppercase tracking-wide text-muted">Plano mensal</Text>
          <Text className="text-3xl font-bold text-ink">{MONTHLY_PRICE_LABEL}</Text>
          <Text className="text-center text-[13px] text-muted">Cancele quando quiser, direto pelo Mercado Pago.</Text>
        </View>

        {isManager ? (
          <View className="w-full gap-2">
            {checkout.isError ? (
              <View className="rounded-xl bg-red-50 px-4 py-2.5">
                <Text className="text-center text-[13px] font-semibold text-red-600">
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
          <View className="w-full items-center gap-2 rounded-xl bg-amber-50 p-4">
            <Ionicons name="information-circle-outline" size={20} color="#92400E" />
            <Text className="text-center text-[13px] font-medium text-amber-800">
              A assinatura da empresa venceu. Peça pro gerente renovar pra voltar a usar o app.
            </Text>
          </View>
        )}

        <Button title="Sair" variant="secondary" onPress={() => logout.mutate()} />
      </View>
    </Screen>
  );
}
