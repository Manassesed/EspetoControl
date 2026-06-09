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
import { type RegisterForm, registerSchema } from "@/lib/schemas";

export default function RegisterScreen() {
  const { register } = useAuthActions();
  const { startDemo } = useAuth();
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: "", empresa: "", email: "", password: "" }
  });

  async function onSubmit(data: RegisterForm) {
    try {
      const result = await register.mutateAsync(data);

      if (result.needsEmailConfirmation) {
        Alert.alert(
          "Confirme seu email",
          "Enviamos um link de confirmacao para seu email. Toque no link recebido e depois faca login no app."
        );
        router.replace("/auth/login");
        return;
      }

      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Nao foi possivel cadastrar", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  function openDemo() {
    startDemo();
    router.replace("/(tabs)");
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <LinearGradient
          colors={["#0F172A", "#065F46", "#10B981"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mb-6 rounded-3xl p-6 shadow-sm"
        >
          <View className="mb-5">
            <AnimatedIconBadge icon="storefront-outline" size="lg" colors={["#A7F3D0", "#10B981", "#064E3B"]} />
          </View>
          <Text className="text-3xl font-black text-white">Criar conta</Text>
          <Text className="mt-2 text-base text-slate-300">Configure sua empresa e comece a vender hoje.</Text>
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
            <Text className="py-3 text-center font-bold text-brand-700">Ja tenho conta</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
