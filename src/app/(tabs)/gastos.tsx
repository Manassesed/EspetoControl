import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useState } from "react";

import { Header } from "@/components/Header";
import { AnimatedIconBadge } from "@/components/ui/AnimatedIconBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useExpenseMutations, useExpenses } from "@/hooks/useExpenses";
import { type ExpenseForm, expenseSchema } from "@/lib/schemas";
import { formatCurrency } from "@/utils/currency";
import { dayKey, formatDateLabel } from "@/utils/date";
import type { Gasto } from "@/types/database";

export default function ExpensesScreen() {
  const { profile } = useAuth();
  const expenses = useExpenses(profile?.empresa_id);
  const mutations = useExpenseMutations(profile?.empresa_id);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Gasto | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { descricao: "", categoria: "", valor: 0 }
  });

  function openCreate() {
    setEditing(null);
    setSubmitError(null);
    form.reset({ descricao: "", categoria: "", valor: 0 });
    setModalVisible(true);
  }

  function openEdit(expense: Gasto) {
    setEditing(expense);
    setSubmitError(null);
    form.reset({ descricao: expense.descricao, categoria: expense.categoria, valor: expense.valor });
    setModalVisible(true);
  }

  function handleDeletePress(id: string) {
    if (confirmingId === id) {
      mutations.remove.mutate({ id });
      setConfirmingId(null);
    } else {
      setConfirmingId(id);
      setTimeout(() => setConfirmingId(null), 3000);
    }
  }

  async function onSubmit(data: ExpenseForm) {
    if (!profile?.empresa_id) {
      Alert.alert("Sessão expirada", "Saia e entre novamente para continuar.");
      return;
    }
    setSubmitError(null);
    try {
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, data });
      } else {
        await mutations.create.mutateAsync(data);
      }
      form.reset({ descricao: "", categoria: "", valor: 0 });
      setModalVisible(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erro ao salvar. Tente novamente.");
    }
  }

  if (profile && profile.role === "colaborador") {
    return <Redirect href="/venda" />;
  }

  // Agrupa por dia (mais recente primeiro) pra ficar claro de qual dia é cada gasto.
  const groups: { key: string; label: string; total: number; items: Gasto[] }[] = [];
  for (const expense of expenses.data ?? []) {
    const date = new Date(expense.created_at);
    const key = dayKey(date);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: formatDateLabel(date), total: 0, items: [] };
      groups.push(group);
    }
    group.items.push(expense);
    group.total += Number(expense.valor);
  }

  return (
    <Screen>
      <Header title="Saídas" subtitle="Tudo que diminui o lucro do dia" actionLabel="Novo" onAction={openCreate} />

      <View className="rounded-2xl border border-line bg-white p-3.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[13px] font-semibold text-ink">Lucro sem chute</Text>
            <Text className="mt-0.5 text-[13px] leading-5 text-muted">
              Carvão, embalagem, taxa e compra pequena entram aqui para o painel mostrar o dinheiro real no bolso.
            </Text>
          </View>
          <AnimatedIconBadge icon="calculator-outline" size="sm" colors={["#BAE6FD", "#0284C7", "#0C4A6E"]} />
        </View>
      </View>

      <View className="gap-3">
        {groups.length ? (
          groups.map((group) => (
            <View key={group.key} className="gap-2">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted">{group.label}</Text>
                <Text className="text-[11px] font-semibold text-muted">{formatCurrency(group.total)}</Text>
              </View>
              {group.items.map((expense) => (
                <Pressable
                  key={expense.id}
                  className="rounded-2xl border border-line bg-white p-2.5"
                  onPress={() => openEdit(expense)}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="mr-2.5">
                      <AnimatedIconBadge icon="arrow-down-circle-outline" size="sm" colors={["#FCA5A5", "#EF4444", "#7F1D1D"]} />
                    </View>
                    <View className="mr-2.5 flex-1">
                      <Text className="text-[13px] font-medium text-ink">{expense.descricao}</Text>
                      <Text className="mt-0.5 text-[11px] text-muted">{expense.categoria}</Text>
                    </View>
                    <Text className="mr-2.5 text-[13px] font-bold text-danger">{formatCurrency(expense.valor)}</Text>
                    <Pressable
                      className={`h-8 w-8 items-center justify-center rounded-full ${confirmingId === expense.id ? "bg-red-500" : "bg-red-50"}`}
                      onPress={(e) => { e.stopPropagation?.(); handleDeletePress(expense.id); }}
                    >
                      <Ionicons
                        name={confirmingId === expense.id ? "checkmark" : "trash-outline"}
                        size={14}
                        color={confirmingId === expense.id ? "#FFFFFF" : "#EF4444"}
                      />
                    </Pressable>
                  </View>
                  {confirmingId === expense.id && (
                    <Text className="mt-2 text-center text-[11px] font-semibold text-red-500">
                      Toque novamente para confirmar exclusão
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))
        ) : (
          <EmptyState title="Nenhum gasto" description="Registre compras, taxas e custos para estimar seu lucro real." />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <Header
            title={editing ? "Editar gasto" : "Novo gasto"}
            subtitle={editing ? "Altere descrição, categoria ou valor" : "Registre uma saída simples"}
          />
          <View className="gap-4">
            <Controller
              control={form.control}
              name="descricao"
              render={({ field, fieldState }) => (
                <Input label="Descrição" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              control={form.control}
              name="categoria"
              render={({ field, fieldState }) => (
                <Input label="Categoria (ex: Insumos, Taxas)" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              control={form.control}
              name="valor"
              render={({ field, fieldState }) => (
                <Input
                  label="Valor (ex: 9,50)"
                  keyboardType="decimal-pad"
                  value={field.value === 0 ? "" : String(field.value)}
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
              title={editing ? "Salvar alterações" : "Salvar gasto"}
              icon="save-outline"
              loading={mutations.create.isPending || mutations.update.isPending}
              onPress={form.handleSubmit(onSubmit)}
            />
            <Button title="Cancelar" variant="secondary" onPress={() => setModalVisible(false)} />
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}
