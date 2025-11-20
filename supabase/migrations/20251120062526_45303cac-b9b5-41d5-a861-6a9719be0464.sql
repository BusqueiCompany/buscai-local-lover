-- Adicionar role ENTREGADOR ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ENTREGADOR';

-- Criar tabela pedidos
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES auth.users(id),
  entregador_id UUID REFERENCES auth.users(id),
  loja_nome TEXT NOT NULL,
  loja_lat FLOAT8,
  loja_lng FLOAT8,
  itens JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'atribuido',
  checkin_loja TIMESTAMPTZ,
  inicio_coleta TIMESTAMPTZ,
  inicio_fila TIMESTAMPTZ,
  saida_loja TIMESTAMPTZ,
  chegada_cliente TIMESTAMPTZ,
  tempo_extra_minutos INTEGER DEFAULT 0,
  taxa_por_minuto NUMERIC DEFAULT 1.5,
  valor_tempo_extra NUMERIC DEFAULT 0,
  fotos JSONB DEFAULT '[]'::jsonb,
  movimento_loja TEXT,
  nota_fiscal_url TEXT,
  obs_entregador TEXT,
  aceita_ajuste BOOLEAN,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela pedido_logs
CREATE TABLE public.pedido_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  detalhe TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela parametros_sistema
CREATE TABLE public.parametros_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taxa_por_minuto NUMERIC NOT NULL DEFAULT 1.5,
  minutos_gratis INTEGER NOT NULL DEFAULT 10,
  distancia_max_checkin INTEGER NOT NULL DEFAULT 150,
  timeout_aceite INTEGER NOT NULL DEFAULT 120,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir parametros padrão
INSERT INTO public.parametros_sistema (taxa_por_minuto, minutos_gratis, distancia_max_checkin, timeout_aceite)
VALUES (1.5, 10, 150, 120);

-- Enable RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros_sistema ENABLE ROW LEVEL SECURITY;

-- RLS Policies para pedidos
CREATE POLICY "Entregadores podem ver seus pedidos"
ON public.pedidos
FOR SELECT
USING (
  auth.uid() = entregador_id 
  OR has_role(auth.uid(), 'ADMINISTRADOR'::app_role)
  OR has_role(auth.uid(), 'SUPORTE'::app_role)
);

CREATE POLICY "Entregadores podem atualizar seus pedidos"
ON public.pedidos
FOR UPDATE
USING (
  auth.uid() = entregador_id 
  OR has_role(auth.uid(), 'ADMINISTRADOR'::app_role)
);

CREATE POLICY "Admins podem gerenciar todos pedidos"
ON public.pedidos
FOR ALL
USING (has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- RLS Policies para pedido_logs
CREATE POLICY "Usuários podem ver logs de seus pedidos"
ON public.pedido_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = pedido_logs.pedido_id
    AND (p.entregador_id = auth.uid() OR p.cliente_id = auth.uid())
  )
  OR has_role(auth.uid(), 'ADMINISTRADOR'::app_role)
  OR has_role(auth.uid(), 'SUPORTE'::app_role)
);

CREATE POLICY "Sistema pode inserir logs"
ON public.pedido_logs
FOR INSERT
WITH CHECK (true);

-- RLS Policies para parametros_sistema
CREATE POLICY "Todos podem ler parametros"
ON public.parametros_sistema
FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem modificar parametros"
ON public.parametros_sistema
FOR ALL
USING (has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- Trigger para atualizar atualizado_em
CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar storage bucket para fotos de pedidos
INSERT INTO storage.buckets (id, name, public)
VALUES ('pedidos', 'pedidos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies para pedidos
CREATE POLICY "Entregadores podem fazer upload de fotos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pedidos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Fotos de pedidos são públicas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pedidos');