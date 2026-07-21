import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { Modal, Pressable, RefreshControl, Text, View } from "react-native";

import { Header } from "@/components/Header";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { isDemoCompany } from "@/constants/demo";
import { useAuth } from "@/context/AuthContext";
import { useMesaMutations, useMesasComComandas, type MesaComStatus } from "@/hooks/useMesas";
import { mesaSchema, type MesaForm } from "@/lib/schemas";
import type { Mesa } from "@/types/database";
import { formatCurrency } from "@/utils/currency";

function MesaTile({
  item,
  isManager,
  onEdit
}: {
  item: MesaComStatus;
  isManager: boolean;
  onEdit: (mesa: Mesa) => void;
}) {
  const ocupada = item.comandaId !== null;

  return (
    <AnimatedPressable
      className={`w-[31%] rounded-2xl p-3 ${ocupada ? "bg-brand-600" : "border border-line bg-white"}`}
      onPress={() => router.push({ pathname: "/mesa/[id]", params: { id: item.mesa.id, nome: item.mesa.nome } })}
    >
      <View className="flex-row items-center justify-between">
        <Text className={`flex-1 text-[13px] font-bold ${ocupada ? "text-white" : "text-ink"}`} numberOfLines={1}>
          {item.mesa.nome}
        </Text>
        {isManager ? (
          <Pressable hitSlop={8} onPress={() => onEdit(item.mesa)}>
            <Ionicons name="pencil-outline" size={13} color={ocupada ? "#ECFDF5" : "#94A3B8"} />
          </Pressable>
        ) : null}
      </View>

      {ocupada ? (
        <>
          <Text className="mt-2 text-base font-bold text-white">{formatCurrency(item.total)}</Text>
          <Text className="text-[11px] text-emerald-50">
            {item.itemCount} {item.itemCount === 1 ? "item" : "itens"}
          </Text>
        </>
      ) : (
        <Text className="mt-2 text-[11px] text-muted">Livre</Text>
      )}
    </AnimatedPressable>
  );
}

export default function MesasScreen() {
  const { profile } = useAuth();
  const isManager = profile?.role === "gerente";
  const demo = isDemoCompany(profile?.empresa_id);

  const { mesas, isLoading, isFetching, isError, refetch } = useMesasComComandas(profile?.empresa_id);
  const mutations = useMesaMutations(profile?.empresa_id);

  const [editing, setEditing] = useState<Mesa | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<MesaForm>({
    resolver: zodResolver(mesaSchema),
    defaultValues: { nome: "" }
  });

  function openCreate() {
    setEditing(null);
    setSubmitError(null);
    setDeleteError(null);
    form.reset({ nome: "" });
    setModalVisible(true);
  }

  function openEdit(mesa: Mesa) {
    setEditing(mesa);
    setSubmitError(null);
    setDeleteError(null);
    form.reset({ nome: mesa.nome });
    setModalVisible(true);
  }

  function handleDeletePress(id: string) {
    if (confirmingId === id) {
      setDeleteError(null);
      mutations.remove.mutate(
        { id },
        {
          onSuccess: () => setModalVisible(false),
          onError: (error) => {
            const msg = error instanceof Error ? error.message : String(error);
            const isReferenced = msg.toLowerCase().includes("foreign key") || msg.toLowerCase().includes("violat");
            setDeleteError(
              isReferenced
                ? 'Essa mesa já teve comandas registradas e não pode ser excluída. Use "Pausar" pra ela sumir da grade.'
                : msg || "Não foi possível excluir a mesa."
            );
          }
        }
      );
      setConfirmingId(null);
    } else {
      setDeleteError(null);
      setConfirmingId(id);
      setTimeout(() => setConfirmingId(null), 3000);
    }
  }

  async function onSubmit(data: MesaForm) {
    setSubmitError(null);
    try {
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, data });
      } else {
        await mutations.create.mutateAsync(data);
      }
      setModalVisible(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setSubmitError(msg || "Erro desconhecido");
    }
  }

  if (demo) {
    return (
      <Screen>
        <Header title="Mesas" subtitle="Contas abertas por mesa, com fechamento no final do atendimento" />
        <EmptyState
          title="Disponível só na conta real"
          description="O modo demo não simula mesas/comandas. Crie sua conta pra testar esse recurso."
        />
      </Screen>
    );
  }

  const mesasAtivas = mesas.filter((item) => item.mesa.ativa);
  const mesasPausadas = mesas.filter((item) => !item.mesa.ativa);

  const isFirstLoad = isLoading && !mesas.length;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isFirstLoad}
          onRefresh={() => refetch()}
          tintColor="#10B981"
          colors={["#10B981"]}
        />
      }
    >
      <Header
        title="Mesas"
        subtitle="Toque numa mesa livre pra abrir a conta"
        actionLabel={isManager ? "Nova mesa" : undefined}
        onAction={isManager ? openCreate : undefined}
      />

      {isFirstLoad ? (
        <View className="flex-row flex-wrap gap-3">
          <Skeleton className="h-[92px] w-[31%]" />
          <Skeleton className="h-[92px] w-[31%]" />
          <Skeleton className="h-[92px] w-[31%]" />
          <Skeleton className="h-[92px] w-[31%]" />
          <Skeleton className="h-[92px] w-[31%]" />
          <Skeleton className="h-[92px] w-[31%]" />
        </View>
      ) : isError ? (
        <View className="items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-6">
          <Ionicons name="wifi-outline" size={28} color="#EF4444" />
          <Text className="text-center text-[13px] font-semibold text-red-700">Não foi possível carregar as mesas</Text>
          <Button title="Tentar novamente" icon="refresh-outline" variant="ghost" onPress={() => refetch()} />
        </View>
      ) : mesasAtivas.length ? (
        <View className="flex-row flex-wrap gap-3">
          {mesasAtivas.map((item) => (
            <MesaTile key={item.mesa.id} item={item} isManager={isManager} onEdit={openEdit} />
          ))}
        </View>
      ) : (
        <View className="items-center gap-3 rounded-2xl border border-line bg-white p-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <Ionicons name="restaurant-outline" size={30} color="#92400E" />
          </View>
          <Text className="text-center text-[15px] font-semibold text-ink">Nenhuma mesa cadastrada</Text>
          <Text className="text-center text-[13px] text-muted">
            {isManager
              ? 'Toque em "Nova mesa" pra cadastrar as mesas do seu espaço.'
              : "Peça pro gerente cadastrar as mesas do seu espaço."}
          </Text>
          {isManager ? <Button title="Cadastrar primeira mesa" icon="add-circle-outline" onPress={openCreate} /> : null}
        </View>
      )}

      {isManager && mesasPausadas.length ? (
        <View className="rounded-2xl border border-line bg-white p-3">
          <Text className="text-[13px] font-semibold text-ink">Mesas pausadas</Text>
          <View className="mt-2 gap-2">
            {mesasPausadas.map((item) => (
              <View key={item.mesa.id} className="flex-row items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <Text className="text-[13px] text-ink">{item.mesa.nome}</Text>
                <AnimatedPressable
                  className="flex-row items-center gap-1 rounded-full bg-white px-2 py-1.5"
                  onPress={() => mutations.toggle.mutate({ id: item.mesa.id, ativa: true })}
                >
                  <Ionicons name="play-outline" size={12} color="#0F172A" />
                  <Text className="text-[11px] font-semibold text-ink">Reativar</Text>
                </AnimatedPressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <Header
            title={editing ? "Editar mesa" : "Nova mesa"}
            subtitle={editing ? "Altere o nome ou remova a mesa" : "Dê um nome fácil de identificar"}
          />
          <View className="gap-4">
            <Controller
              control={form.control}
              name="nome"
              render={({ field, fieldState }) => (
                <Input
                  label="Nome da mesa (ex: Mesa 1)"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            {submitError ? (
              <View className="rounded-xl bg-red-50 p-2.5">
                <Text className="text-[13px] font-medium text-red-600">{submitError}</Text>
              </View>
            ) : null}

            <Button
              title="Salvar mesa"
              icon="save-outline"
              loading={mutations.create.isPending || mutations.update.isPending}
              onPress={form.handleSubmit(onSubmit)}
            />

            {editing ? (
              <>
                {deleteError ? (
                  <View className="rounded-xl bg-red-50 p-2.5">
                    <Text className="text-[13px] font-medium text-red-600">{deleteError}</Text>
                  </View>
                ) : null}
                <AnimatedPressable
                  className="flex-row items-center justify-center gap-2 rounded-xl bg-slate-100 p-3"
                  onPress={() => mutations.toggle.mutate({ id: editing.id, ativa: !editing.ativa })}
                >
                  <Ionicons name={editing.ativa ? "pause-outline" : "play-outline"} size={16} color="#0F172A" />
                  <Text className="text-[13px] font-semibold text-ink">
                    {editing.ativa ? "Pausar mesa" : "Reativar mesa"}
                  </Text>
                </AnimatedPressable>
                <Button
                  title={confirmingId === editing.id ? "Toque para confirmar exclusão" : "Excluir mesa"}
                  icon="trash-outline"
                  variant="danger"
                  loading={mutations.remove.isPending}
                  onPress={() => handleDeletePress(editing.id)}
                />
              </>
            ) : null}

            <Button title="Cancelar" variant="secondary" onPress={() => setModalVisible(false)} />
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}
