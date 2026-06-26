import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoProducts, isDemoCompany } from "@/constants/demo";
import type { ProductForm } from "@/lib/schemas";
import { createProduct, deleteProduct, listProducts, toggleProduct, updateProduct } from "@/services/productService";

export function useProducts(empresaId?: string, onlyActive = false) {
  return useQuery({
    queryKey: ["products", empresaId, onlyActive],
    enabled: Boolean(empresaId),
    queryFn: () => {
      if (isDemoCompany(empresaId)) {
        return Promise.resolve(onlyActive ? demoProducts.filter((product) => product.ativo) : demoProducts);
      }

      return listProducts(empresaId!, onlyActive);
    }
  });
}

export function useProductMutations(empresaId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products", empresaId] });

  const create = useMutation({
    mutationFn: (data: ProductForm) =>
      isDemoCompany(empresaId)
        ? Promise.resolve({ ...data, id: `demo-${Date.now()}`, empresa_id: empresaId!, ativo: true })
        : createProduct(empresaId!, data),
    onSuccess: invalidate
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductForm }) =>
      isDemoCompany(empresaId)
        ? Promise.resolve({ ...data, id, empresa_id: empresaId!, ativo: true })
        : updateProduct(empresaId!, id, data),
    onSuccess: invalidate
  });

  const toggle = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      isDemoCompany(empresaId) ? Promise.resolve() : toggleProduct(empresaId!, id, ativo),
    onSuccess: invalidate
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      isDemoCompany(empresaId) ? Promise.resolve() : deleteProduct(empresaId!, id),
    onSuccess: invalidate
  });

  return { create, update, toggle, remove };
}
