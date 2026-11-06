// Edge Function: Meta Ads (real Graph API, no fake data)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const token = Deno.env.get('META_ACCESS_TOKEN');
  if (!token) return new Response(JSON.stringify({ error: 'Integração pendente: META_ACCESS_TOKEN não configurado no backend.' }), { status: 501, headers: { ...cors, 'Content-Type': 'application/json' } });
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Sem autenticação.' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await req.json().catch(() => ({}));
  const { action, client_id, ad_account_id, from, to } = body;
  const userJwt = authHeader.replace('Bearer ', '');
  const { data: userData } = await supabase.auth.getUser(userJwt);
  if (!userData?.user) return new Response(JSON.stringify({ error: 'Usuário inválido.' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
  async function g(url: string) {
    const r = await fetch(url);
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.error?.message ?? 'Erro Meta API');
    return j;
  }
  try {
    if (action === 'list_accounts') {
      const j = await g(`https://graph.facebook.com/v20.0/me/adaccounts?access_token=${token}&fields=id,name`);
      return new Response(JSON.stringify({ accounts: j.data ?? [] }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    if (action === 'connect' || client_id) {
      const acct = String(ad_account_id).replace('act_', '');
      const insightsUrl = `https://graph.facebook.com/v20.0/act_${acct}/insights?access_token=${token}&fields=campaign_name,campaign_id,adset_name,adset_id,ad_name,ad_id,spend,impressions,reach,clicks,actions&level=campaign&time_range[since]=${from}&time_range[until]=${to}&time_increment=1&limit=5000`;
      const j = await g(insightsUrl);
      const rows = j.data ?? [];
      const agg = new Map<string, { spend: number; leads: number; impr: number; reach: number; clicks: number }>();
      const campAgg = new Map<string, { name: string; spend: number; leads: number; impr: number; reach: number; clicks: number }>();
      for (const r of rows) {
        const leads = (r.actions ?? []).filter((a: any) => a.action_type === 'lead' || a.action_type === 'offsite_conversion.conversion')
          .reduce((s: number, a: any) => s + Number(a.value ?? 0), 0);
        const d: string = r.date_start ?? to;
        const cur = agg.get(d) ?? { spend: 0, leads: 0, impr: 0, reach: 0, clicks: 0 };
        cur.spend += Number(r.spend ?? 0); cur.leads += leads; cur.impr += Number(r.impressions ?? 0); cur.reach += Number(r.reach ?? 0); cur.clicks += Number(r.clicks ?? 0);
        agg.set(d, cur);
        const cid = r.campaign_id;
        const cc = campAgg.get(cid) ?? { name: r.campaign_name, spend: 0, leads: 0, impr: 0, reach: 0, clicks: 0 };
        cc.spend += Number(r.spend ?? 0); cc.leads += leads; cc.impr += Number(r.impressions ?? 0); cc.reach += Number(r.reach ?? 0); cc.clicks += Number(r.clicks ?? 0);
        campAgg.set(cid, cc);
      }
      let saved = 0;
      for (const [date, v] of agg.entries()) {
        const { error } = await supabase.from('performance_metrics').upsert({ client_id, date, spend: v.spend, leads: v.leads, cpl: v.leads ? v.spend / v.leads : null, impressions: v.impr, reach: v.reach, clicks: v.clicks }, { onConflict: 'client_id,date' });
        if (!error) saved++;
      }
      for (const [external_id, v] of campAgg.entries()) {
        await supabase.from('campaigns').upsert({ client_id, external_id, name: v.name, spend: v.spend, leads: v.leads, cpl: v.leads ? v.spend / v.leads : null, impressions: v.impr, reach: v.reach, clicks: v.clicks, updated_at: new Date().toISOString() }, { onConflict: 'client_id,external_id' });
      }
      return new Response(JSON.stringify({ ok: true, saved, days: agg.size }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Ação desconhecida.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
