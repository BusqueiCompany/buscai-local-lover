-- Adicionar constraint unique para permitir upsert em produtos_lojas
ALTER TABLE public.produtos_lojas 
ADD CONSTRAINT produtos_lojas_produto_loja_unique UNIQUE (produto_id, loja_id);