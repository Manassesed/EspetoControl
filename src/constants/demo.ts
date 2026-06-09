import type { Gasto, Produto, Usuario, Venda } from "@/types/database";

export const DEMO_EMPRESA_ID = "demo-company";
export const DEMO_USER_ID = "demo-user";

export const demoProfile: Usuario = {
  id: DEMO_USER_ID,
  empresa_id: DEMO_EMPRESA_ID,
  nome: "Atendente Demo",
  email: "demo@espetocontrol.app"
};

export const demoProducts: Produto[] = [
  {
    id: "demo-produto-1",
    empresa_id: DEMO_EMPRESA_ID,
    nome: "Espetinho bovino",
    categoria: "Espetos",
    preco: 9,
    ativo: true
  },
  {
    id: "demo-produto-2",
    empresa_id: DEMO_EMPRESA_ID,
    nome: "Espetinho frango",
    categoria: "Espetos",
    preco: 8,
    ativo: true
  },
  {
    id: "demo-produto-3",
    empresa_id: DEMO_EMPRESA_ID,
    nome: "Refrigerante lata",
    categoria: "Bebidas",
    preco: 6,
    ativo: true
  }
];

export const demoSales: Venda[] = [
  {
    id: "demo-venda-1",
    empresa_id: DEMO_EMPRESA_ID,
    usuario_id: DEMO_USER_ID,
    valor_total: 72,
    forma_pagamento: "pix",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-venda-2",
    empresa_id: DEMO_EMPRESA_ID,
    usuario_id: DEMO_USER_ID,
    valor_total: 48,
    forma_pagamento: "dinheiro",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-venda-3",
    empresa_id: DEMO_EMPRESA_ID,
    usuario_id: DEMO_USER_ID,
    valor_total: 36,
    forma_pagamento: "cartao",
    created_at: new Date().toISOString()
  }
];

export const demoExpenses: Gasto[] = [
  {
    id: "demo-gasto-1",
    empresa_id: DEMO_EMPRESA_ID,
    descricao: "Carvao",
    categoria: "Insumos",
    valor: 28,
    created_at: new Date().toISOString()
  },
  {
    id: "demo-gasto-2",
    empresa_id: DEMO_EMPRESA_ID,
    descricao: "Embalagens",
    categoria: "Operacao",
    valor: 18,
    created_at: new Date().toISOString()
  }
];

export const demoProductSales = [
  {
    produto_id: "demo-produto-1",
    nome: "Espetinho bovino",
    categoria: "Espetos",
    quantidade: 11,
    total: 99
  },
  {
    produto_id: "demo-produto-2",
    nome: "Espetinho frango",
    categoria: "Espetos",
    quantidade: 6,
    total: 48
  },
  {
    produto_id: "demo-produto-3",
    nome: "Refrigerante lata",
    categoria: "Bebidas",
    quantidade: 5,
    total: 30
  }
];

export const demoSaleDetails = [
  {
    id: "demo-venda-1",
    label: "Venda #1024",
    items: "6x bovino, 3x refri",
    forma_pagamento: "pix",
    valor_total: 72
  },
  {
    id: "demo-venda-2",
    label: "Venda #1023",
    items: "4x frango, 2x bovino",
    forma_pagamento: "dinheiro",
    valor_total: 48
  },
  {
    id: "demo-venda-3",
    label: "Venda #1022",
    items: "4x bovino",
    forma_pagamento: "cartao",
    valor_total: 36
  }
];

export function isDemoCompany(empresaId?: string) {
  return empresaId === DEMO_EMPRESA_ID;
}
