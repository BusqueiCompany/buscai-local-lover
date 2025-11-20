-- Criar tabela para solicitações de parceria
CREATE TABLE public.partnership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  nome_comercio TEXT NOT NULL,
  endereco TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own requests"
  ON public.partnership_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
  ON public.partnership_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.partnership_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

CREATE POLICY "Admins can update requests"
  ON public.partnership_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_partnership_requests_updated_at
  BEFORE UPDATE ON public.partnership_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();