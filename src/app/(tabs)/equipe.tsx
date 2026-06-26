import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal, Pressable, Text, View } from "react-native";

import { Header } from "@/components/Header";
import { ManagerGate } from "@/components/ManagerGate";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useTeam, useTeamMutations } from "@/hooks/useTeam";
import { type InviteForm, inviteSchema } from "@/lib/schemas";
import type { AccessRole, Usuario } from "@/types/database";

const statusLabel: Record<Usuario["status"], string> = {
  ativo: "Ativo",
  pendente: "Pendente",
  inativo: "Inativo"
};

const statusTone: Record<Usuario["status"], string> = {
  ativo: "bg-emerald-50 text-emerald-700",
  pendente: "bg-amber-50 text-amber-700",
  inativo: "bg-slate-100 text-slate-500"
};

const roleLabel: Record<AccessRole, string> = {
  gerente: "Gerente",
  colaborador: "Colaborador"
};

function StatusBadge({ status }: { status: Usuario["status"] }) {
  return (
    <View className={`rounded-full px-2 py-0.5 ${statusTone[status]}`}>
      <Text className={`text-[11px] font-semibold ${statusTone[status].split(" ")[1]}`}>{statusLabel[status]}</Text>
    </View>
  );
}

function MemberRow({
  member,
  isSelf,
  onPressMenu
}: {
  member: Usuario;
  isSelf: boolean;
  onPressMenu: () => void;
}) {
  const initials = member.nome.trim().slice(0, 2).toUpperCase();
  const dimmed = member.status === "inativo";

  return (
    <View className={`flex-row items-center gap-3 rounded-2xl border border-line bg-white p-3 ${dimmed ? "opacity-60" : ""}`}>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <Text className="text-[13px] font-bold text-ink">{initials}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[13px] font-semibold text-ink">{member.nome}</Text>
          {isSelf ? <Text className="text-[11px] text-muted">(você)</Text> : null}
        </View>
        <Text className="text-[11px] text-muted">{member.email}</Text>
        <View className="mt-1.5 flex-row items-center gap-1.5">
          <View className="rounded-full bg-slate-50 px-2 py-0.5">
            <Text className="text-[11px] font-medium text-ink">{roleLabel[member.role]}</Text>
          </View>
          <StatusBadge status={member.status} />
        </View>
      </View>
      {!isSelf ? (
        <Pressable className="h-8 w-8 items-center justify-center rounded-full bg-slate-50" onPress={onPressMenu}>
          <Ionicons name="ellipsis-vertical" size={16} color="#0F172A" />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function TeamScreen() {
  const { profile } = useAuth();
  const team = useTeam(profile?.empresa_id);
  const mutations = useTeamMutations(profile?.empresa_id);

  const [inviteModal, setInviteModal] = useState(false);
  const [actionsFor, setActionsFor] = useState<Usuario | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "colaborador" }
  });

  function openInvite() {
    form.reset({ email: "", role: "colaborador" });
    setInviteError(null);
    setInviteSuccess(null);
    setInviteModal(true);
  }

  async function onInvite(data: InviteForm) {
    setInviteError(null);
    try {
      const result = await mutations.invite.mutateAsync(data);
      setInviteSuccess(
        "resent" in result && result.resent
          ? "Essa pessoa já tem conta. Reenviamos um link para ela definir uma nova senha."
          : "Convite enviado! A pessoa recebe um email para criar a senha."
      );
      form.reset({ email: "", role: "colaborador" });
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Não foi possível enviar o convite");
    }
  }

  function handleResetPassword(member: Usuario) {
    mutations.resetPassword.mutate({ email: member.email });
    setActionsFor(null);
  }

  function handleToggleStatus(member: Usuario) {
    mutations.changeStatus.mutate({
      userId: member.id,
      status: member.status === "ativo" ? "inativo" : "ativo"
    });
    setActionsFor(null);
  }

  function handleToggleRole(member: Usuario) {
    mutations.changeRole.mutate({
      userId: member.id,
      role: member.role === "gerente" ? "colaborador" : "gerente"
    });
    setActionsFor(null);
  }

  return (
    <ManagerGate>
      <Screen>
        <Header title="Minha equipe" subtitle="Convide e gerencie quem acessa o app" actionLabel="Convidar" onAction={openInvite} />

        <View className="gap-2">
          {team.isLoading ? (
            <View className="items-center gap-2 py-10">
              <Ionicons name="sync-outline" size={28} color="#94A3B8" />
              <Text className="text-sm text-muted">Carregando equipe...</Text>
            </View>
          ) : team.data?.length ? (
            team.data.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isSelf={member.id === profile?.id}
                onPressMenu={() => setActionsFor(member)}
              />
            ))
          ) : (
            <View className="items-center gap-3 rounded-2xl border border-line bg-white p-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <Ionicons name="people-outline" size={30} color="#92400E" />
              </View>
              <Text className="text-center text-[15px] font-semibold text-ink">Equipe vazia</Text>
              <Text className="text-center text-[13px] text-muted">Convide quem vai te ajudar no caixa.</Text>
              <Button title="Convidar primeiro membro" icon="person-add-outline" onPress={openInvite} />
            </View>
          )}
        </View>

        {/* Modal de convite */}
        <Modal visible={inviteModal} animationType="slide" presentationStyle="pageSheet">
          <Screen>
            <Header title="Convidar membro" subtitle="A pessoa recebe um email para criar a própria senha" />
            <View className="gap-4">
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Input
                    label="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <View className="gap-1.5">
                <Text className="text-[13px] font-medium text-ink">Nível de acesso</Text>
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <View className="flex-row gap-2">
                      {(["colaborador", "gerente"] as const).map((value) => {
                        const selected = field.value === value;
                        return (
                          <Pressable
                            key={value}
                            className={`flex-1 rounded-xl border p-3 ${
                              selected ? "border-ink bg-ink" : "border-line bg-white"
                            }`}
                            onPress={() => field.onChange(value)}
                          >
                            <Text className={`text-[13px] font-semibold ${selected ? "text-white" : "text-ink"}`}>
                              {roleLabel[value]}
                            </Text>
                            <Text className={`mt-0.5 text-[11px] ${selected ? "text-slate-200" : "text-muted"}`}>
                              {value === "gerente" ? "Vê tudo: vendas, gastos e relatórios" : "Só registra vendas no caixa"}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                />
              </View>

              {inviteError ? (
                <View className="rounded-xl bg-red-50 p-2.5">
                  <Text className="text-[13px] font-medium text-red-600">{inviteError}</Text>
                </View>
              ) : null}
              {inviteSuccess ? (
                <View className="rounded-xl bg-emerald-50 p-2.5">
                  <Text className="text-[13px] font-medium text-emerald-700">{inviteSuccess}</Text>
                </View>
              ) : null}

              <Button
                title="Enviar convite"
                icon="mail-outline"
                loading={mutations.invite.isPending}
                onPress={form.handleSubmit(onInvite)}
              />
              <Button title="Fechar" variant="secondary" onPress={() => setInviteModal(false)} />
            </View>
          </Screen>
        </Modal>

        {/* Menu de ações de um membro */}
        <Modal visible={Boolean(actionsFor)} animationType="slide" transparent onRequestClose={() => setActionsFor(null)}>
          <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setActionsFor(null)}>
            <Pressable className="gap-2 rounded-t-3xl bg-white p-4 pb-8" onPress={() => {}}>
              <View className="mb-1 items-center">
                <View className="h-1.5 w-12 rounded-full bg-slate-200" />
              </View>
              <Text className="mb-2 text-[15px] font-semibold text-ink">{actionsFor?.nome}</Text>

              {actionsFor ? (
                <>
                  <Pressable
                    className="flex-row items-center gap-3 rounded-xl bg-slate-50 p-3"
                    onPress={() => handleToggleRole(actionsFor)}
                  >
                    <Ionicons name="swap-horizontal-outline" size={18} color="#0F172A" />
                    <Text className="text-[13px] font-medium text-ink">
                      {actionsFor.role === "gerente" ? "Tornar colaborador" : "Tornar gerente"}
                    </Text>
                  </Pressable>

                  <Pressable
                    className="flex-row items-center gap-3 rounded-xl bg-slate-50 p-3"
                    onPress={() => handleResetPassword(actionsFor)}
                  >
                    <Ionicons name="key-outline" size={18} color="#0F172A" />
                    <Text className="text-[13px] font-medium text-ink">Redefinir senha</Text>
                  </Pressable>

                  <Pressable
                    className="flex-row items-center gap-3 rounded-xl bg-red-50 p-3"
                    onPress={() => handleToggleStatus(actionsFor)}
                  >
                    <Ionicons
                      name={actionsFor.status === "ativo" ? "person-remove-outline" : "person-add-outline"}
                      size={18}
                      color="#EF4444"
                    />
                    <Text className="text-[13px] font-medium text-red-600">
                      {actionsFor.status === "ativo" ? "Desativar acesso" : "Reativar acesso"}
                    </Text>
                  </Pressable>
                </>
              ) : null}

              <Button title="Fechar" variant="secondary" onPress={() => setActionsFor(null)} />
            </Pressable>
          </Pressable>
        </Modal>
      </Screen>
    </ManagerGate>
  );
}
