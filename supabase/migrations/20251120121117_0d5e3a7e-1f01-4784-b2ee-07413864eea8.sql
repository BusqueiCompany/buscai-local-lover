-- Criar tabela de endereços dos usuários
CREATE TABLE public.user_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, -- ex: "Casa", "Trabalho", "Apartamento"
  endereco TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  referencia TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice para buscar endereços por usuário
CREATE INDEX idx_user_addresses_user_id ON public.user_addresses(user_id);

-- Habilitar RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuários podem gerenciar apenas seus próprios endereços
CREATE POLICY "Users can view their own addresses"
  ON public.user_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
  ON public.user_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON public.user_addresses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON public.user_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins podem ver e gerenciar todos os endereços
CREATE POLICY "Admins can view all addresses"
  ON public.user_addresses
  FOR SELECT
  USING (has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

CREATE POLICY "Admins can manage all addresses"
  ON public.user_addresses
  FOR ALL
  USING (has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para desativar outros endereços quando um é ativado
CREATE OR REPLACE FUNCTION public.handle_active_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Desativa todos os outros endereços do usuário
    UPDATE public.user_addresses
    SET is_active = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para garantir apenas um endereço ativo por usuário
CREATE TRIGGER ensure_single_active_address
  BEFORE INSERT OR UPDATE ON public.user_addresses
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.handle_active_address();