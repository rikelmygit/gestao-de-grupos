import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export function getEdgeUrl(path: string) {
  const base = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL as string;
  if (base) return `${base}/${path}`;
  return `${url}/functions/v1/${path}`;
}
