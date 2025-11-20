-- Migrate existing addresses from profiles to user_addresses
-- Only migrate profiles that have an address and don't already exist in user_addresses
INSERT INTO public.user_addresses (user_id, nome, endereco, numero, bairro, complemento, referencia, is_active)
SELECT 
  p.id as user_id,
  'Casa' as nome,
  p.endereco,
  COALESCE(p.numero, '') as numero,
  COALESCE(p.bairro, '') as bairro,
  '' as complemento,
  COALESCE(p.referencia, '') as referencia,
  true as is_active
FROM public.profiles p
WHERE p.endereco IS NOT NULL 
  AND p.endereco != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.user_addresses ua WHERE ua.user_id = p.id
  );