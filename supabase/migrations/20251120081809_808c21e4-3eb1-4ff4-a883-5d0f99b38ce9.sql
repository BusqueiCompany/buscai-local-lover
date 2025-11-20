-- Criar tabela de logs do sistema para auditoria
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT,
  data_diff JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem inserir logs
CREATE POLICY "Admins can insert logs"
ON public.system_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- Admins e suporte podem ver logs
CREATE POLICY "Admins and support can view logs"
ON public.system_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'ADMINISTRADOR'::app_role) OR 
  has_role(auth.uid(), 'SUPORTE'::app_role)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_system_logs_user_admin ON public.system_logs(user_id_admin);
CREATE INDEX IF NOT EXISTS idx_system_logs_target ON public.system_logs(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON public.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON public.system_logs(action);