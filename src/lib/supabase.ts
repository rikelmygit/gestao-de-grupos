// Re-exporta o cliente oficial (gerado) para garantir que URL e chave
// sempre existam em preview e no site publicado.
export { supabase } from '@/integrations/supabase/client';

export function getEdgeUrl(path: string) {
  const base = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL as string | undefined;
  if (base) return `${base}/${path}`;
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${path}`;
}
