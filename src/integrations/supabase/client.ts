import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// As linhas originais de URL e KEY foram comentadas/removidas.
// O código abaixo garante que o restante da aplicação React/TypeScript consiga rodar.

// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Exportamos o objeto vazio UMA ÚNICA VEZ para evitar o erro de duplicação.
export const supabase = {} as any; 

/* Bloco de código original (comentado):
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
*/
