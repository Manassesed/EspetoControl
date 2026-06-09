import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { Alert, Modal, Text, View } from "react-native";
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

export default function ExpensesScreen() {
  const { profile } = useAuth();
  const expenses = useExpenses(profile?.empresa_id);
  const mutations = useExpenseMutations(profile?.empresa_id);
  const [modalVisible, setModalVisible] = useState(false);

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { descricao: "", categoria: "", valor: 0 }
  });

  async function onSubmit(data: ExpenseForm) {
    try {
      await mutations.create.mutateAsync(data);
      form.reset({ descricao: "", categoria: "", valor: 0 });
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Erro ao salvar gasto", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  return (
    <Screen>
      <Header title="Saidas" subtitle="Tudo que diminui o lucro do dia" actionLabel="Novo" onAction={() => setModalVisible(true)} />

      <View className="rounded-3xl border border-line bg-white p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-black text-ink">Lucro sem chute</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              Carvao, embalagem, taxa e compra pequena entram aqui para o painel mostrar o dinheiro real no bolso.
            </Text>
          </View>
          <AnimatedIconBadge icon="calculator-outline" size="sm" colors={["#BAE6FD", "#0284C7", "#0C4A6E"]} />
        </View>
      </View>

      <View className="gap-2">
        {expenses.data?.length ? (
          expenses.data.map((expense) => (
            <View key={expense.id} className="rounded-2xl border border-line bg-white p-3 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="mr-3">
                  <AnimatedIconBadge icon="arrow-down-circle-outline" size="sm" colors={["#FCA5A5", "#EF4444", "#7F1D1D"]} />
                </View>
                <View className="mr-4 flex-1">
                  <Text className="text-sm font-bold text-ink">{expense.descricao}</Text>
                  <Text className="mt-0.5 text-xs text-muted">{expense.categoria}</Text>
                </View>
                <Text className="text-sm font-black text-danger">{formatCurrency(expense.valor)}</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="Nenhum gasto" description="Registre compras, taxas e custos para estimar seu lucro real." />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <Header title="Novo gasto" subtitle="Registre uma saida simples" />
          <View className="gap-4">
            <Controller
              control={form.control}
              name="descricao"
              render={({ field, fieldState }) => (
                <Input label="Descricao" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              control={form.control}
              name="categoria"
              render={({ field, fieldState }) => (
                <Input label="Categoria" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              control={form.control}
              name="valor"
              render={({ field, fieldState }) => (
                <Input
                  label="Valor"
                  keyboardType="decimal-pad"
                  value={String(field.value)}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button title="Salvar gasto" icon="save-outline" loading={mutations.create.isPending} onPress={form.handleSubmit(onSubmit)} />
            <Button title="Cancelar" variant="secondary" onPress={() => setModalVisible(false)} />
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}
