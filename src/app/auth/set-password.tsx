import { zodResolver } from "@hookform/resolvers/zod";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Platform, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { type SetPasswordForm, setPasswordSchema } from "@/lib/schemas";
import { supabase } from "@/services/supabase";

/** Lê o token do deep link (espetocontrol://...#access_token=...) e abre a sessão. Só roda no nativo — no web o supabase-js já faz isso via detectSessionInUrl. */
function useNativeInviteSession() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    async function consumeUrl(url: string | null) {
      if (!url) return;
      const hash = url.split("#")[1];
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    }

    Linking.getInitialURL().then(consumeUrl);
    const subscription = Linking.addEventListener("url", (event) => consumeUrl(event.url));
    return () => subscription.remove();
  }, []);
}

export default function SetPasswordScreen() {
  const { profile, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useNativeInviteSession();

  const form = useForm<SetPasswordForm>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { nome: profile?.nome ?? "", password: "", confirmPassword: "" }
  });

  async function onSubmit(data: SetPasswordForm) {
    setSubmitting(true);
    setError(null);
    try {
      const { error: passwordError } = await supabase.auth.updateUser({ password: data.password });
      if (passwordError) throw passwordError;

      const { error: profileError } = await supabase.rpc("accept_invite_profile", { p_nome: data.nome });
      if (profileError) throw profileError;

      await refreshProfile();
      router.replace("/(tabs)");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível concluir seu acesso.";
      setError(message);
      Alert.alert("Algo deu errado", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-6">
        <View>
          <Text className="text-xl font-bold tracking-tight text-ink">Bem-vindo à equipe</Text>
          <Text className="mt-1 text-[13px] text-muted">
            Confirme seu nome e crie uma senha. Ela é só sua — nem o gerente consegue ver.
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={form.control}
            name="nome"
            render={({ field, fieldState }) => (
              <Input label="Seu nome" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Input
                label="Crie uma senha"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Input
                label="Confirme a senha"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          {error ? (
            <View className="rounded-xl bg-red-50 p-2.5">
              <Text className="text-[13px] font-medium text-red-600">{error}</Text>
            </View>
          ) : null}

          <Button title="Começar a usar" icon="checkmark-circle-outline" loading={submitting} onPress={form.handleSubmit(onSubmit)} />
        </View>
      </View>
    </Screen>
  );
}
