export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categorias_lojas: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      categorias_produtos: {
        Row: {
          created_at: string
          id: string
          nome: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_produtos_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_precos: {
        Row: {
          created_at: string
          id: string
          preco: number
          produto_loja_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preco: number
          produto_loja_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preco?: number
          produto_loja_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_precos_produto_loja_id_fkey"
            columns: ["produto_loja_id"]
            isOneToOne: false
            referencedRelation: "produtos_lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          categoria_id: string | null
          created_at: string
          endereco: string
          foto_url: string | null
          horario: string | null
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          nome: string
          notas_admin: string | null
          serial: string | null
          slug: string | null
          status: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          endereco: string
          foto_url?: string | null
          horario?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          nome: string
          notas_admin?: string | null
          serial?: string | null
          slug?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          endereco?: string
          foto_url?: string | null
          horario?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          nome?: string
          notas_admin?: string | null
          serial?: string | null
          slug?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lojas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_sistema: {
        Row: {
          created_at: string
          distancia_max_checkin: number
          id: string
          minutos_gratis: number
          taxa_por_minuto: number
          timeout_aceite: number
        }
        Insert: {
          created_at?: string
          distancia_max_checkin?: number
          id?: string
          minutos_gratis?: number
          taxa_por_minuto?: number
          timeout_aceite?: number
        }
        Update: {
          created_at?: string
          distancia_max_checkin?: number
          id?: string
          minutos_gratis?: number
          taxa_por_minuto?: number
          timeout_aceite?: number
        }
        Relationships: []
      }
      pedido_logs: {
        Row: {
          acao: string
          detalhe: string | null
          id: string
          pedido_id: string
          timestamp: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          detalhe?: string | null
          id?: string
          pedido_id: string
          timestamp?: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          detalhe?: string | null
          id?: string
          pedido_id?: string
          timestamp?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_logs_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          aceita_ajuste: boolean | null
          atualizado_em: string
          checkin_loja: string | null
          chegada_cliente: string | null
          cliente_id: string | null
          criado_em: string
          entregador_id: string | null
          fotos: Json | null
          id: string
          inicio_coleta: string | null
          inicio_fila: string | null
          itens: Json | null
          loja_lat: number | null
          loja_lng: number | null
          loja_nome: string
          movimento_loja: string | null
          nota_fiscal_url: string | null
          obs_entregador: string | null
          saida_loja: string | null
          status: string
          taxa_por_minuto: number | null
          tempo_extra_minutos: number | null
          valor_tempo_extra: number | null
        }
        Insert: {
          aceita_ajuste?: boolean | null
          atualizado_em?: string
          checkin_loja?: string | null
          chegada_cliente?: string | null
          cliente_id?: string | null
          criado_em?: string
          entregador_id?: string | null
          fotos?: Json | null
          id?: string
          inicio_coleta?: string | null
          inicio_fila?: string | null
          itens?: Json | null
          loja_lat?: number | null
          loja_lng?: number | null
          loja_nome: string
          movimento_loja?: string | null
          nota_fiscal_url?: string | null
          obs_entregador?: string | null
          saida_loja?: string | null
          status?: string
          taxa_por_minuto?: number | null
          tempo_extra_minutos?: number | null
          valor_tempo_extra?: number | null
        }
        Update: {
          aceita_ajuste?: boolean | null
          atualizado_em?: string
          checkin_loja?: string | null
          chegada_cliente?: string | null
          cliente_id?: string | null
          criado_em?: string
          entregador_id?: string | null
          fotos?: Json | null
          id?: string
          inicio_coleta?: string | null
          inicio_fila?: string | null
          itens?: Json | null
          loja_lat?: number | null
          loja_lng?: number | null
          loja_nome?: string
          movimento_loja?: string | null
          nota_fiscal_url?: string | null
          obs_entregador?: string | null
          saida_loja?: string | null
          status?: string
          taxa_por_minuto?: number | null
          tempo_extra_minutos?: number | null
          valor_tempo_extra?: number | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          categoria_id: string | null
          created_at: string
          id: string
          imagem_url: string | null
          nome: string
          sku: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          id?: string
          imagem_url?: string | null
          nome: string
          sku?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          id?: string
          imagem_url?: string | null
          nome?: string
          sku?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_lojas: {
        Row: {
          created_at: string
          economia_valor: number | null
          id: string
          loja_id: string
          preco_atual: number
          produto_id: string
          promocao_percentual: number | null
          quantity: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          economia_valor?: number | null
          id?: string
          loja_id: string
          preco_atual: number
          produto_id: string
          promocao_percentual?: number | null
          quantity?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          economia_valor?: number | null
          id?: string
          loja_id?: string
          preco_atual?: number
          produto_id?: string
          promocao_percentual?: number | null
          quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_lojas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_lojas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bairro: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string
          endereco: string | null
          id: string
          is_active: boolean | null
          nome_completo: string | null
          numero: string | null
          referencia: string | null
          sexo: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email: string
          endereco?: string | null
          id: string
          is_active?: boolean | null
          nome_completo?: string | null
          numero?: string | null
          referencia?: string | null
          sexo?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string
          endereco?: string | null
          id?: string
          is_active?: boolean | null
          nome_completo?: string | null
          numero?: string | null
          referencia?: string | null
          sexo?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string
          data_diff: Json | null
          id: string
          target_id: string | null
          target_type: string | null
          timestamp: string
          user_id_admin: string | null
        }
        Insert: {
          action: string
          created_at?: string
          data_diff?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
          timestamp?: string
          user_id_admin?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          data_diff?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
          timestamp?: string
          user_id_admin?: string | null
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          bairro: string
          complemento: string | null
          created_at: string
          endereco: string
          id: string
          is_active: boolean
          nome: string
          numero: string
          referencia: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bairro: string
          complemento?: string | null
          created_at?: string
          endereco: string
          id?: string
          is_active?: boolean
          nome: string
          numero: string
          referencia?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bairro?: string
          complemento?: string | null
          created_at?: string
          endereco?: string
          id?: string
          is_active?: boolean
          nome?: string
          numero?: string
          referencia?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_slug: { Args: { nome: string }; Returns: string }
      generate_store_serial: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "FREE"
        | "VIP"
        | "PARCEIRO"
        | "SUPORTE"
        | "ADMINISTRADOR"
        | "ENTREGADOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "FREE",
        "VIP",
        "PARCEIRO",
        "SUPORTE",
        "ADMINISTRADOR",
        "ENTREGADOR",
      ],
    },
  },
} as const
