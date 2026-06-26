export type PaymentMethod = "pix" | "dinheiro" | "cartao_credito" | "cartao_debito";

export type Empresa = {
  id: string;
  nome: string;
  created_at: string;
};

export type AccessRole = "gerente" | "colaborador";
export type MemberStatus = "pendente" | "ativo" | "inativo";

export type Usuario = {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  role: AccessRole;
  status: MemberStatus;
  convidado_por: string | null;
  created_at: string;
};

export type Produto = {
  id: string;
  empresa_id: string;
  nome: string;
  preco: number;
  /** Custo unitário do produto. Opcional para compatibilidade com registros antigos. */
  custo?: number;
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
        Insert: Omit<Usuario, "role" | "status" | "convidado_por" | "created_at"> &
          Partial<Pick<Usuario, "role" | "status" | "convidado_por" | "created_at">>;
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
      accept_invite_profile: {
        Args: {
          p_nome: string;
        };
        Returns: Usuario;
      };
      update_member_role: {
        Args: {
          p_user_id: string;
          p_role: AccessRole;
        };
        Returns: Usuario;
      };
      update_member_status: {
        Args: {
          p_user_id: string;
          p_status: "ativo" | "inativo";
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
