export type PaymentMethod = "pix" | "dinheiro" | "cartao_credito" | "cartao_debito";

export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled" | "lifetime";

export type Empresa = {
  id: string;
  nome: string;
  created_at: string;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string;
  mp_preapproval_id: string | null;
  mp_payer_email: string | null;
  subscription_updated_at: string;
  paid_until: string | null;
};

/** Projeção só com os campos que o gate de acesso e a tela de assinatura precisam. */
export type EmpresaSubscription = Pick<
  Empresa,
  "subscription_status" | "trial_ends_at" | "mp_preapproval_id" | "paid_until"
>;

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

export type ComandaStatus = "aberta" | "fechada" | "cancelada";

export type Mesa = {
  id: string;
  empresa_id: string;
  nome: string;
  ativa: boolean;
  created_at: string;
};

export type Comanda = {
  id: string;
  empresa_id: string;
  mesa_id: string;
  status: ComandaStatus;
  aberta_por: string;
  fechada_por: string | null;
  venda_id: string | null;
  opened_at: string;
  closed_at: string | null;
};

export type ComandaItem = {
  id: string;
  empresa_id: string;
  comanda_id: string;
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  adicionado_por: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: Empresa;
        Insert: Pick<Empresa, "nome"> & {
          id?: string;
          created_at?: string;
          subscription_status?: SubscriptionStatus;
          trial_ends_at?: string;
          mp_preapproval_id?: string | null;
          mp_payer_email?: string | null;
          subscription_updated_at?: string;
          paid_until?: string | null;
        };
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
      mesas: {
        Row: Mesa;
        Insert: Omit<Mesa, "id" | "ativa" | "created_at"> & {
          id?: string;
          ativa?: boolean;
          created_at?: string;
        };
        Update: Partial<Mesa>;
        Relationships: [
          {
            foreignKeyName: "mesas_empresa_id_fkey";
            columns: ["empresa_id"];
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
      comandas: {
        Row: Comanda;
        Insert: Omit<Comanda, "id" | "status" | "fechada_por" | "venda_id" | "opened_at" | "closed_at"> & {
          id?: string;
          status?: ComandaStatus;
          fechada_por?: string | null;
          venda_id?: string | null;
          opened_at?: string;
          closed_at?: string | null;
        };
        Update: Partial<Comanda>;
        Relationships: [
          {
            foreignKeyName: "comandas_empresa_id_fkey";
            columns: ["empresa_id"];
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comandas_mesa_id_fkey";
            columns: ["mesa_id"];
            referencedRelation: "mesas";
            referencedColumns: ["id"];
          }
        ];
      };
      comanda_itens: {
        Row: ComandaItem;
        Insert: Omit<ComandaItem, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<ComandaItem>;
        Relationships: [
          {
            foreignKeyName: "comanda_itens_comanda_id_fkey";
            columns: ["comanda_id"];
            referencedRelation: "comandas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comanda_itens_produto_id_fkey";
            columns: ["produto_id"];
            referencedRelation: "produtos";
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
      abrir_comanda: {
        Args: { p_mesa_id: string };
        Returns: Comanda;
      };
      comanda_incrementar_item: {
        Args: { p_comanda_id: string; p_produto_id: string; p_delta: number };
        Returns: ComandaItem | null;
      };
      comanda_definir_item: {
        Args: { p_comanda_id: string; p_produto_id: string; p_quantidade: number };
        Returns: ComandaItem | null;
      };
      fechar_comanda: {
        Args: { p_comanda_id: string; p_forma_pagamento: PaymentMethod };
        Returns: Venda;
      };
      cancelar_comanda: {
        Args: { p_comanda_id: string };
        Returns: Comanda;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
