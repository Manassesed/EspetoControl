import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Controller, useForm } from "react-hook-form";
import { Modal, Pressable, Text, View } from "react-native";
import { useState } from "react";

import { Redirect } from "expo-router";

import { Header } from "@/components/Header";
import { ProductRow } from "@/components/ProductRow";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useProductMutations, useProducts } from "@/hooks/useProducts";
import { type ProductForm, productSchema } from "@/lib/schemas";
import type { Produto } from "@/types/database";
import { formatCurrency, parseCurrencyInput } from "@/utils/currency";

function MarginHint({ preco, custo }: { preco: number; custo: number }) {
  if (!preco || !custo) {
    return (
      <View className="rounded-xl bg-slate-50 p-2.5">
        <Text className="text-[11px] text-muted">
          Informe preço e custo para ver o lucro por unidade.
        </Text>
      </View>
    );
  }
  const lucro = preco - custo;
  const margem = preco > 0 ? (lucro / preco) * 100 : 0;
  const positivo = lucro >= 0;
  return (
    <View className={`flex-row items-center justify-between rounded-xl p-2.5 ${positivo ? "bg-emerald-50" : "bg-red-50"}`}>
      <Text className={`text-[13px] font-medium ${positivo ? "text-emerald-700" : "text-danger"}`}>
        {positivo ? "Lucro por unidade" : "Prejuízo por unidade"}
      </Text>
      <Text className={`text-[13px] font-bold ${positivo ? "text-emerald-700" : "text-danger"}`}>
        {formatCurrency(lucro)} ({margem.toFixed(0)}%)
      </Text>
    </View>
  );
}

export default function ProductsScreen() {
  const { profile, profileError, refreshProfile, loading: authLoading } = useAuth();
  const products = useProducts(profile?.empresa_id);
  const mutations = useProductMutations(profile?.empresa_id);
  const [reloading, setReloading] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reloadError, setReloadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { nome: "", categoria: "", preco: 0, custo: 0 }
  });

  function openCreate() {
    setEditing(null);
    setSubmitError(null);
    setDeleteError(null);
    form.reset({ nome: "", categoria: "", preco: 0, custo: 0 });
    setModalVisible(true);
  }

  function openEdit(product: Produto) {
    setEditing(product);
    setSubmitError(null);
    setDeleteError(null);
    form.reset({
      nome: product.nome,
      categoria: product.categoria,
      preco: product.preco,
      custo: product.custo ?? 0
    });
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
                ? "Esse produto já tem vendas registradas e não pode ser excluído. Use \"Pausar\" para ele parar de aparecer nas vendas."
                : msg || "Não foi possível excluir o produto."
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

  async function handleReload() {
    setReloading(true);
    setReloadError(null);
    try {
      await refreshProfile();
    } catch (e) {
      setReloadError(e instanceof Error ? e.message : String(e));
    } finally {
      setReloading(false);
    }
  }

  async function onSubmit(data: ProductForm) {
    setSubmitError(null);
    try {
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, data });
      } else {
        await mutations.create.mutateAsync(data);
      }
      setModalVisible(false);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : JSON.stringify(error);
      setSubmitError(msg || "Erro desconhecido");
    }
  }

  if (profile && profile.role === "colaborador") {
    return <Redirect href="/venda" />;
  }

  if (authLoading && !profile) {
    return (
      <Screen>
        <Header title="Cardápio" subtitle="Deixe o que vende mais a um toque do caixa" />
        <View className="flex-1 items-center justify-center gap-3 rounded-2xl border border-line bg-white p-8">
          <Ionicons name="sync-outline" size={28} color="#94A3B8" />
          <Text className="text-[13px] text-muted">Carregando seu perfil...</Text>
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <Header title="Cardápio" subtitle="Deixe o que vende mais a um toque do caixa" />
        <View className="flex-1 items-center justify-center gap-4 rounded-2xl border border-line bg-white p-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Ionicons name="warning-outline" size={32} color="#92400E" />
          </View>
          <Text className="text-center text-[15px] font-semibold text-ink">Perfil não carregado</Text>
          <Text className="text-center text-[13px] text-muted">
            Não foi possível carregar os dados da sua conta.
          </Text>
          {(profileError || reloadError) ? (
            <View className="w-full rounded-xl bg-red-50 p-2.5">
              <Text className="text-center text-[11px] font-semibold text-red-700">
                Erro: {profileError ?? reloadError}
              </Text>
            </View>
          ) : null}
          <Button title="Reconectar" icon="refresh-outline" loading={reloading} onPress={handleReload} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Cardápio" subtitle="Deixe o que vende mais a um toque do caixa" actionLabel="Novo" onAction={openCreate} />

      <View className="rounded-2xl border border-line bg-white p-3.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[13px] font-semibold text-ink">Atalho para vender rápido</Text>
            <Text className="mt-0.5 text-[13px] leading-5 text-muted">
              Mantenha ativo só o que está disponível hoje. O vendedor toca no item e o app calcula o total.
            </Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Ionicons name="flash-outline" size={19} color="#92400E" />
          </View>
        </View>
      </View>

      {deleteError ? (
        <View className="rounded-xl bg-red-50 p-2.5">
          <Text className="text-[13px] font-medium text-red-600">{deleteError}</Text>
        </View>
      ) : null}

      <View className="gap-2">
        {products.isLoading ? (
          <View className="items-center gap-2 py-10">
            <Ionicons name="sync-outline" size={28} color="#94A3B8" />
            <Text className="text-sm text-muted">Buscando produtos...</Text>
          </View>
        ) : products.isError ? (
          <View className="items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-6">
            <Ionicons name="wifi-outline" size={28} color="#EF4444" />
            <Text className="text-center text-[13px] font-semibold text-red-700">
              Não foi possível carregar os produtos
            </Text>
            <Text className="text-center text-[11px] text-red-500">
              {products.error instanceof Error ? products.error.message : "Verifique sua conexão"}
            </Text>
            <Button title="Tentar novamente" icon="refresh-outline" variant="ghost" onPress={() => products.refetch()} />
          </View>
        ) : products.data?.length ? (
          products.data.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              showMargin
              onPress={() => openEdit(product)}
              right={
                <View className="mt-1 flex-row items-center gap-2">
                  <Pressable
                    className="flex-row items-center gap-1 rounded-full bg-brand-50 px-2 py-1"
                    onPress={() => openEdit(product)}
                  >
                    <Ionicons name="pencil-outline" size={12} color="#047857" />
                    <Text className="text-[11px] font-semibold text-brand-700">Editar</Text>
                  </Pressable>
                  <Pressable
                    className="flex-row items-center gap-1 rounded-full bg-slate-100 px-2 py-1"
                    onPress={() => mutations.toggle.mutate({ id: product.id, ativo: !product.ativo })}
                  >
                    <Ionicons name={product.ativo ? "pause-outline" : "play-outline"} size={12} color="#0F172A" />
                    <Text className="text-[11px] font-semibold text-ink">{product.ativo ? "Pausar" : "Ativar"}</Text>
                  </Pressable>
                  <Pressable
                    className={`h-7 w-7 items-center justify-center rounded-full ${confirmingId === product.id ? "bg-red-500" : "bg-red-50"}`}
                    onPress={() => handleDeletePress(product.id)}
                  >
                    <Ionicons
                      name={confirmingId === product.id ? "checkmark" : "trash-outline"}
                      size={14}
                      color={confirmingId === product.id ? "#FFFFFF" : "#EF4444"}
                    />
                  </Pressable>
                </View>
              }
            />
          ))
        ) : (
          <View className="items-center gap-3 rounded-2xl border border-line bg-white p-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <Ionicons name="fast-food-outline" size={30} color="#92400E" />
            </View>
            <Text className="text-center text-[15px] font-semibold text-ink">Nenhum produto ainda</Text>
            <Text className="text-center text-[13px] text-muted">Toque em "Novo" para cadastrar espetinhos, bebidas e o que mais vender.</Text>
            <Button title="Cadastrar primeiro produto" icon="add-circle-outline" onPress={openCreate} />
          </View>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <Header
            title={editing ? "Editar produto" : "Novo produto"}
            subtitle={editing ? "Altere nome, categoria ou preço" : "Nome, categoria e preço"}
          />
          <View className="gap-4">
            <Controller
              control={form.control}
              name="nome"
              render={({ field, fieldState }) => (
                <Input label="Nome do produto" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              control={form.control}
              name="categoria"
              render={({ field, fieldState }) => (
                <Input label="Categoria (ex: Espetos, Bebidas)" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={form.control}
                  name="preco"
                  render={({ field, fieldState }) => (
                    <Input
                      label="Preço (ex: 9,50)"
                      keyboardType="decimal-pad"
                      value={field.value === 0 ? "" : String(field.value)}
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={form.control}
                  name="custo"
                  render={({ field, fieldState }) => (
                    <Input
                      label="Custo (ex: 4,50)"
                      keyboardType="decimal-pad"
                      value={!field.value ? "" : String(field.value)}
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </View>
            </View>

            <MarginHint
              preco={parseCurrencyInput(String(form.watch("preco") ?? ""))}
              custo={parseCurrencyInput(String(form.watch("custo") ?? ""))}
            />

            {submitError ? (
              <View className="rounded-xl bg-red-50 p-2.5">
                <Text className="text-[13px] font-medium text-red-600">{submitError}</Text>
              </View>
            ) : null}

            <Button
              title="Salvar produto"
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
                <Button
                  title={confirmingId === editing.id ? "Toque para confirmar exclusão" : "Excluir produto"}
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
