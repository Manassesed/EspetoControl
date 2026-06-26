import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useEffect } from "react";
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
  const { startDemo, session, demoMode } = useAuth();
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  useEffect(() => {
    if (session || demoMode) {
      router.replace("/(tabs)");
    }
  }, [session, demoMode]);

  async function onSubmit(data: LoginForm) {
    try {
      await login.mutateAsync(data);
    } catch (error) {
      Alert.alert("Nao foi possivel entrar", error instanceof Error ? error.message : "Verifique seu email e senha e tente novamente.");
    }
  }

  function openDemo() {
    startDemo();
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-center">
        <LinearGradient
          colors={["#0F172A", "#065F46", "#10B981"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mb-7 rounded-2xl p-5"
        >
          <View className="mb-4">
            <AnimatedIconBadge icon="flame-outline" size="md" colors={["#FDBA74", "#F97316", "#7C2D12"]} />
          </View>
          <Text className="text-[28px] font-bold tracking-tight text-white">EspetoControl</Text>
          <Text className="mt-2 text-[14px] text-slate-300">Vendas, gastos e lucro do dia em poucos toques.</Text>
          <View className="mt-5 flex-row gap-2">
            <View className="h-1.5 flex-1 rounded-full bg-brand-500" />
            <View className="h-1.5 flex-[0.65] rounded-full bg-amber-400" />
            <View className="h-1.5 flex-[0.45] rounded-full bg-sky-400" />
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
            <Text className="py-2.5 text-center text-[14px] font-semibold text-brand-700">Criar minha conta</Text>
          </Link>
          <Text className="text-center text-[11px] text-muted">v1.3</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
