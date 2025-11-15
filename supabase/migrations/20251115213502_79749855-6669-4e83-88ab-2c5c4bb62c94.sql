-- Create categories for stores
CREATE TABLE public.categorias_lojas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stores table
CREATE TABLE public.lojas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias_lojas(id) ON DELETE SET NULL,
  telefone TEXT,
  horario TEXT,
  foto_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product categories table (with support for subcategories)
CREATE TABLE public.categorias_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  parent_id UUID REFERENCES public.categorias_produtos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias_produtos(id) ON DELETE SET NULL,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products-stores relationship table with pricing
CREATE TABLE public.produtos_lojas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  preco_atual DECIMAL(10, 2) NOT NULL,
  promocao_percentual DECIMAL(5, 2) DEFAULT 0,
  economia_valor DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(produto_id, loja_id)
);

-- Create price history table
CREATE TABLE public.historico_precos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_loja_id UUID NOT NULL REFERENCES public.produtos_lojas(id) ON DELETE CASCADE,
  preco DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias_lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_precos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categorias_lojas
CREATE POLICY "Anyone can view store categories"
  ON public.categorias_lojas FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage store categories"
  ON public.categorias_lojas FOR ALL
  USING (public.has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- RLS Policies for lojas
CREATE POLICY "Anyone can view active stores"
  ON public.lojas FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

CREATE POLICY "Admins can manage stores"
  ON public.lojas FOR ALL
  USING (public.has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- RLS Policies for categorias_produtos
CREATE POLICY "Anyone can view product categories"
  ON public.categorias_produtos FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product categories"
  ON public.categorias_produtos FOR ALL
  USING (public.has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- RLS Policies for produtos
CREATE POLICY "Anyone can view products"
  ON public.produtos FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage products"
  ON public.produtos FOR ALL
  USING (public.has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- RLS Policies for produtos_lojas
CREATE POLICY "Anyone can view product prices"
  ON public.produtos_lojas FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product prices"
  ON public.produtos_lojas FOR ALL
  USING (public.has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- RLS Policies for historico_precos
CREATE POLICY "Anyone can view price history"
  ON public.historico_precos FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage price history"
  ON public.historico_precos FOR ALL
  USING (public.has_role(auth.uid(), 'ADMINISTRADOR'::app_role));

-- Create trigger for updating lojas updated_at
CREATE TRIGGER update_lojas_updated_at
  BEFORE UPDATE ON public.lojas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating produtos updated_at
CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating produtos_lojas updated_at
CREATE TRIGGER update_produtos_lojas_updated_at
  BEFORE UPDATE ON public.produtos_lojas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories for stores
INSERT INTO public.categorias_lojas (nome) VALUES
  ('Supermercado'),
  ('Farmácia'),
  ('Padaria'),
  ('Açougue'),
  ('Hortifruti'),
  ('Loja de Conveniência'),
  ('Pet Shop'),
  ('Outros');

-- Insert some default categories for products
INSERT INTO public.categorias_produtos (nome) VALUES
  ('Alimentos'),
  ('Bebidas'),
  ('Higiene e Limpeza'),
  ('Medicamentos'),
  ('Carne e Frios'),
  ('Frutas e Verduras'),
  ('Padaria e Confeitaria'),
  ('Pet'),
  ('Outros');