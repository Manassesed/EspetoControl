import { useMemo, useState } from "react";

import type { Produto } from "@/types/database";

export type CartItem = {
  produto: Produto;
  quantidade: number;
};

export function useSaleCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  function addProduct(produto: Produto) {
    setItems((current) => {
      const existing = current.find((item) => item.produto.id === produto.id);

      if (existing) {
        return current.map((item) =>
          item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }

      return [...current, { produto, quantidade: 1 }];
    });
  }

  function decrementProduct(produtoId: string) {
    setItems((current) =>
      current
        .map((item) =>
          item.produto.id === produtoId ? { ...item, quantidade: item.quantidade - 1 } : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  function clear() {
    setItems([]);
  }

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.produto.preco * item.quantidade, 0),
    [items]
  );

  return { items, total, addProduct, decrementProduct, clear };
}
