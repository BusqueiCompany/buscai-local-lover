-- Criar tabela para listas de compras dos usuários
CREATE TABLE public.user_shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_type TEXT NOT NULL DEFAULT 'unidade',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_unit_type CHECK (unit_type IN ('unidade', 'kg'))
);

-- Habilitar RLS
ALTER TABLE public.user_shopping_lists ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuários podem ver apenas suas próprias listas
CREATE POLICY "Users can view their own shopping lists"
ON public.user_shopping_lists
FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias listas
CREATE POLICY "Users can insert their own shopping lists"
ON public.user_shopping_lists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias listas
CREATE POLICY "Users can update their own shopping lists"
ON public.user_shopping_lists
FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias listas
CREATE POLICY "Users can delete their own shopping lists"
ON public.user_shopping_lists
FOR DELETE
USING (auth.uid() = user_id);

-- Admins podem ver todas as listas
CREATE POLICY "Admins can view all shopping lists"
ON public.user_shopping_lists
FOR SELECT
USING (has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- Criar índice para melhor performance
CREATE INDEX idx_user_shopping_lists_user_id ON public.user_shopping_lists(user_id);
CREATE INDEX idx_user_shopping_lists_is_active ON public.user_shopping_lists(is_active);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_shopping_lists_updated_at
BEFORE UPDATE ON public.user_shopping_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();