import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { Alert, Modal, Pressable, Text, View } from "react-native";

import { Header } from "@/components/Header";
import { ProductRow } from "@/components/ProductRow";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useProductMutations, useProducts } from "@/hooks/useProducts";
import { type ProductForm, productSchema } from "@/lib/schemas";
import type { Produto } from "@/types/database";
import { useState } from "react";

export default function ProductsScreen() {
  const { profile } = useAuth();
  const products = useProducts(profile?.empresa_id);
  const mutations = useProductMutations(profile?.empresa_id);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { nome: "", categoria: "", preco: 0 }
  });

  function openCreate() {
    setEditing(null);
    form.reset({ nome: "", categoria: "", preco: 0 });
    setModalVisible(true);
  }

  function openEdit(product: Produto) {
    setEditing(product);
    form.reset({ nome: product.nome, categoria: product.categoria, preco: product.preco });
    setModalVisible(true);
  }

  async function onSubmit(data: ProductForm) {
    try {
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, data });
      } else {
        await mutations.create.mutateAsync(data);
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Erro ao salvar produto", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  return (
    <Screen>
      <Header title="Cardapio" subtitle="Deixe o que vende mais a um toque do caixa" actionLabel="Novo" onAction={openCreate} />

      <View className="rounded-3xl border border-line bg-white p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-black text-ink">Atalho para vender rapido</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              Mantenha ativo so o que esta disponivel hoje. O vendedor toca no item e o app calcula o total.
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
            <Ionicons name="flash-outline" size={22} color="#92400E" />
          </View>
        </View>
      </View>

      <View className="gap-2">
        {products.data?.length ? (
          products.data.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onPress={() => openEdit(product)}
              right={
                <Pressable
                  className="mt-1 flex-row items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5"
                  onPress={() => mutations.toggle.mutate({ id: product.id, ativo: !product.ativo })}
                >
                  <Ionicons name={product.ativo ? "pause-outline" : "play-outline"} size={13} color="#0F172A" />
                  <Text className="text-xs font-bold text-ink">{product.ativo ? "Inativar" : "Ativar"}</Text>
                </Pressable>
              }
            />
          ))
        ) : (
          <EmptyState title="Nenhum produto" description="Cadastre seus itens mais vendidos para acelerar o atendimento." />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <Header title={editing ? "Editar produto" : "Novo produto"} subtitle="Nome, categoria e preco" />
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
              name="categoria"
              render={({ field, fieldState }) => (
                <Input label="Categoria" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              control={form.control}
              name="preco"
              render={({ field, fieldState }) => (
                <Input
                  label="Preco"
                  keyboardType="decimal-pad"
                  value={String(field.value)}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button title="Salvar" icon="save-outline" loading={mutations.create.isPending || mutations.update.isPending} onPress={form.handleSubmit(onSubmit)} />
            <Button title="Cancelar" variant="secondary" onPress={() => setModalVisible(false)} />
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}
