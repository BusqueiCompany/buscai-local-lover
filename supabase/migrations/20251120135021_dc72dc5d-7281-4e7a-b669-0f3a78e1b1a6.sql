-- Create delivery_requests table for delivery driver applications
CREATE TABLE public.delivery_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT NOT NULL,
  tem_cnh BOOLEAN NOT NULL,
  tipo_veiculo TEXT NOT NULL CHECK (tipo_veiculo IN ('moto', 'bike', 'carro')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own requests
CREATE POLICY "Users can create their own delivery requests"
ON public.delivery_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view their own delivery requests"
ON public.delivery_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all delivery requests"
ON public.delivery_requests
FOR SELECT
USING (has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- Admins can update requests
CREATE POLICY "Admins can update delivery requests"
ON public.delivery_requests
FOR UPDATE
USING (has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_delivery_requests_updated_at
BEFORE UPDATE ON public.delivery_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();