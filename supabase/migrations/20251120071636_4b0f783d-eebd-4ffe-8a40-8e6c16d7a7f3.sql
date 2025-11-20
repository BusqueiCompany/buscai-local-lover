-- Adicionar campos faltantes na tabela lojas
ALTER TABLE public.lojas
ADD COLUMN IF NOT EXISTS serial TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
ADD COLUMN IF NOT EXISTS notas_admin TEXT;

-- Adicionar campos faltantes na tabela produtos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'un';

-- Adicionar campo de estoque na tabela produtos_lojas
ALTER TABLE public.produtos_lojas
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;

-- Criar função para gerar serial automático
CREATE OR REPLACE FUNCTION public.generate_store_serial()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  new_serial TEXT;
BEGIN
  -- Buscar o maior número de serial existente
  SELECT COALESCE(MAX(CAST(SUBSTRING(serial FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.lojas
  WHERE serial ~ '^BUSQ-[0-9]+$';
  
  -- Formatar como BUSQ-000001
  new_serial := 'BUSQ-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN new_serial;
END;
$$;

-- Criar função para gerar slug a partir do nome
CREATE OR REPLACE FUNCTION public.generate_slug(nome TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(nome, 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$;

-- Atualizar lojas existentes sem serial
UPDATE public.lojas
SET serial = generate_store_serial()
WHERE serial IS NULL;

-- Atualizar lojas existentes sem slug
UPDATE public.lojas
SET slug = generate_slug(nome)
WHERE slug IS NULL;

-- Trigger para gerar serial e slug automaticamente ao inserir nova loja
CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Gerar serial se não fornecido
  IF NEW.serial IS NULL OR NEW.serial = '' THEN
    NEW.serial := generate_store_serial();
  END IF;
  
  -- Gerar slug se não fornecido
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.nome);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para execução automática
DROP TRIGGER IF EXISTS trigger_handle_new_store ON public.lojas;
CREATE TRIGGER trigger_handle_new_store
BEFORE INSERT ON public.lojas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_store();

-- Trigger para atualizar slug ao modificar nome
CREATE OR REPLACE FUNCTION public.handle_store_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar slug se nome mudou
  IF NEW.nome != OLD.nome THEN
    NEW.slug := generate_slug(NEW.nome);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_handle_store_update ON public.lojas;
CREATE TRIGGER trigger_handle_store_update
BEFORE UPDATE ON public.lojas
FOR EACH ROW
EXECUTE FUNCTION public.handle_store_update();