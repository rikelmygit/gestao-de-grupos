// Edge Function: cria usuário de cliente sem derrubar sessão do gestor (service_role)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Sem autenticação.' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await req.json().catch(() => ({}));
  const { email, password, client_id, role } = body;
  const userJwt = authHeader.replace('Bearer ', '');
  const { data: caller } = await supabase.auth.getUser(userJwt);
  if (!caller?.user) return new Response(JSON.stringify({ error: 'Usuário inválido.' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
  const { data: r } = await supabase.from('user_roles').select('role').eq('user_id', caller.user.id).maybeSingle();
  if (r?.role !== 'gestor') return new Response(JSON.stringify({ error: 'Apenas gestor pode criar acessos.' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (!email?.includes('@') || !password?.length) return new Response(JSON.stringify({ error: 'E-mail ou senha inválidos.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  const { data: created, error } = await supabase.auth.admin.createUser({ email: email.trim(), password, email_confirm: true });
  if (error || !created?.user) return new Response(JSON.stringify({ error: error?.message ?? 'Não foi possível criar usuário. O e-mail pode já existir.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  const uid = created.user.id;
  await supabase.from('user_roles').upsert({ user_id: uid, role: role ?? 'cliente' }, { onConflict: 'user_id' });
  if (client_id) await supabase.from('client_users').upsert({ user_id: uid, client_id, is_active: true }, { onConflict: 'client_id,user_id' });
  return new Response(JSON.stringify({ ok: true, user_id: uid }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
