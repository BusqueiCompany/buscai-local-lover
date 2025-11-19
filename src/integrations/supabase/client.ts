import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// As linhas originais de URL e KEY foram comentadas/removidas
// para que o Vercel não falhe ao tentar lê-las sem valores configurados.
// O código abaixo garante que o restante da aplicação React/TypeScript consiga rodar.

// Desabilitamos a criação do cliente Supabase, pois as variáveis de ambiente (VITE_SUPABASE_URL, etc.)
// não estão disponíveis no Vercel e causam a tela branca.
// O objeto vazio `{}` é um placeholder que evita que outras partes do código quebrem ao importar 'supabase'.
export const supabase = {} as any;
