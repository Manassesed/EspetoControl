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
import { type RegisterForm, registerSchema } from "@/lib/schemas";

export default function RegisterScreen() {
  const { register } = useAuthActions();
  const { startDemo, session, demoMode } = useAuth();
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: "", empresa: "", email: "", password: "" }
  });

  useEffect(() => {
    if (session || demoMode) {
      router.replace("/(tabs)");
    }
  }, [session, demoMode]);

  async function onSubmit(data: RegisterForm) {
    try {
      const result = await register.mutateAsync(data);

      if (result.needsEmailConfirmation) {
        Alert.alert(
          "Confirme seu email",
          "Enviamos um link de confirmacao para seu email. Toque no link recebido e depois faca login no app."
        );
        router.replace("/auth/login");
      }
    } catch (error) {
      Alert.alert("Nao foi possivel cadastrar", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  function openDemo() {
    startDemo();
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <LinearGradient
          colors={["#0F172A", "#065F46", "#10B981"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mb-6 rounded-2xl p-5"
        >
          <View className="mb-4">
            <AnimatedIconBadge icon="storefront-outline" size="md" colors={["#A7F3D0", "#10B981", "#064E3B"]} />
          </View>
          <Text className="text-[24px] font-bold tracking-tight text-white">Criar conta</Text>
          <Text className="mt-1.5 text-[14px] text-slate-300">Configure sua empresa e comece a vender hoje.</Text>
        </LinearGradient>

        <View className="gap-4">
          <Controller
            control={form.control}
            name="nome"
            render={({ field, fieldState }) => (
              <Input label="Nome" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
            )}
          />
          <Controller
            control={form.control}
            name="empresa"
            render={({ field, fieldState }) => (
              <Input label="Empresa" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
            )}
          />
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

          <Button title="Cadastrar" icon="person-add-outline" loading={register.isPending} onPress={form.handleSubmit(onSubmit)} />
          {env.enableDemo ? (
            <Button title="Ver demo sem cadastro" icon="sparkles-outline" variant="ghost" onPress={openDemo} />
          ) : null}

          <Link href="/auth/login" asChild>
            <Text className="py-2.5 text-center text-[14px] font-semibold text-brand-700">Ja tenho conta</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
