export type PaymentMethod = "pix" | "dinheiro" | "cartao";

export type Empresa = {
  id: string;
  nome: string;
  created_at: string;
};

export type Usuario = {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
};

export type Produto = {
  id: string;
  empresa_id: string;
  nome: string;
  preco: number;
  categoria: string;
  ativo: boolean;
};

export type Venda = {
  id: string;
  empresa_id: string;
  usuario_id: string;
  valor_total: number;
  forma_pagamento: PaymentMethod;
  created_at: string;
};

export type VendaItem = {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number;
  valor: number;
};

export type ProductSale = {
  produto_id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  total: number;
};

export type Gasto = {
  id: string;
  empresa_id: string;
  descricao: string;
  categoria: string;
  valor: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: Empresa;
        Insert: Pick<Empresa, "nome"> & { id?: string; created_at?: string };
        Update: Partial<Empresa>;
        Relationships: [];
      };
      usuarios: {
        Row: Usuario;
        Insert: Usuario;
        Update: Partial<Usuario>;
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey";
            columns: ["empresa_id"];
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
      produtos: {
        Row: Produto;
        Insert: Omit<Produto, "id"> & { id?: string };
        Update: Partial<Produto>;
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey";
            columns: ["empresa_id"];
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
      vendas: {
        Row: Venda;
        Insert: Omit<Venda, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Venda>;
        Relationships: [
          {
            foreignKeyName: "vendas_empresa_id_fkey";
            columns: ["empresa_id"];
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendas_usuario_id_fkey";
            columns: ["usuario_id"];
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          }
        ];
      };
      venda_itens: {
        Row: VendaItem;
        Insert: Omit<VendaItem, "id"> & { id?: string };
        Update: Partial<VendaItem>;
        Relationships: [
          {
            foreignKeyName: "venda_itens_venda_id_fkey";
            columns: ["venda_id"];
            referencedRelation: "vendas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venda_itens_produto_id_fkey";
            columns: ["produto_id"];
            referencedRelation: "produtos";
            referencedColumns: ["id"];
          }
        ];
      };
      gastos: {
        Row: Gasto;
        Insert: Omit<Gasto, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Gasto>;
        Relationships: [
          {
            foreignKeyName: "gastos_empresa_id_fkey";
            columns: ["empresa_id"];
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_empresa_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      create_initial_profile: {
        Args: {
          p_nome: string;
          p_empresa: string;
          p_email: string;
        };
        Returns: Usuario;
      };
      registrar_venda: {
        Args: {
          p_forma_pagamento: PaymentMethod;
          p_items: Array<{
            produto_id: string;
            quantidade: number;
          }>;
        };
        Returns: Venda;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
