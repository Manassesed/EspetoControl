import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { AnimatedIconBadge } from "@/components/ui/AnimatedIconBadge";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { env } from "@/constants/env";
import { useAuth } from "@/context/AuthContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { type LoginForm, loginSchema } from "@/lib/schemas";

export default function LoginScreen() {
  const { login } = useAuthActions();
  const { startDemo } = useAuth();
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  async function onSubmit(data: LoginForm) {
    try {
      await login.mutateAsync(data);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Nao foi possivel entrar", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  function openDemo() {
    startDemo();
    router.replace("/(tabs)");
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-center">
        <LinearGradient
          colors={["#0F172A", "#065F46", "#10B981"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mb-8 rounded-3xl p-6 shadow-sm"
        >
          <View className="mb-5">
            <AnimatedIconBadge icon="flame-outline" size="lg" colors={["#FDBA74", "#F97316", "#7C2D12"]} />
          </View>
          <Text className="text-4xl font-black text-white">EspetoControl</Text>
          <Text className="mt-3 text-base text-slate-300">Vendas, gastos e lucro do dia em poucos toques.</Text>
          <View className="mt-6 flex-row gap-2">
            <View className="h-2 flex-1 rounded-full bg-brand-500" />
            <View className="h-2 flex-[0.65] rounded-full bg-amber-400" />
            <View className="h-2 flex-[0.45] rounded-full bg-sky-400" />
          </View>
        </LinearGradient>

        <View className="gap-4">
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Input
                label="Senha"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Button title="Entrar" icon="log-in-outline" loading={login.isPending} onPress={form.handleSubmit(onSubmit)} />
          {env.enableDemo ? (
            <Button title="Ver demo sem cadastro" icon="sparkles-outline" variant="ghost" onPress={openDemo} />
          ) : null}

          <Link href="/auth/register" asChild>
            <Text className="py-3 text-center font-bold text-brand-700">Criar minha conta</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
