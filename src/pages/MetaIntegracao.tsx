import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getEdgeUrl } from '@/lib/supabase';
import { Card, Empty, Loading, Badge, Btn } from '@/components/UI';
import { brl } from '@/lib/format';

export default function MetaIntegracao() {
  const [clients, setClients] = useState<any[]>([]); const [accounts, setAccounts] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('clients').select('id,nome_negocio,ad_account_id').order('nome_negocio');
    setClients(data ?? []); setLoading(false);
  })(); }, []);

  async function connect(client: any) {
    if (!client.ad_account_id) { setMsg('Informe o ID da conta de anúncios no cadastro do cliente.'); return; }
    setMsg(`Conectando conta ${client.ad_account_id}...`);
    try {
      const res = await fetch(getEdgeUrl('meta-ads'), { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string, Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }, body: JSON.stringify({ action: 'connect', client_id: client.id, ad_account_id: client.ad_account_id }) });
      const j = await res.json();
      if (!res.ok) setMsg(j.error ?? 'Falha na integração. Verifique token e permissões.');
      else setMsg('Conta conectada com sucesso.');
    } catch (e: any) { setMsg(e.message); }
  }

  async function listAccounts() {
    setMsg('Buscando contas disponíveis...');
    try {
      const res = await fetch(getEdgeUrl('meta-ads'), { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string, Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }, body: JSON.stringify({ action: 'list_accounts' }) });
      const j = await res.json();
      if (!res.ok) setMsg(j.error ?? 'Não foi possível listar. Verifique as credenciais da Meta no backend.');
      else { setAccounts(j.accounts ?? []); setMsg(`${(j.accounts ?? []).length} contas encontradas.`); }
    } catch (e: any) { setMsg(e.message); }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold">Meta Ads</h1><Btn onClick={listAccounts}>Listar minhas contas</Btn></div>
      {msg && <div className="rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-sm">{msg}</div>}

      <Card>
        <p className="mb-2 text-sm font-medium">Contas disponíveis via API</p>
        {!accounts.length ? <Empty title="Integração pendente" desc="Configure META_ACCESS_TOKEN (long-lived) e META_APP_SECRET no servidor (Lovable Cloud Secrets / Supabase Secrets). Sem isso, nenhuma conexão é fingida." /> : (
          accounts.map((a: any) => <div key={a.id} className="border-t border-border py-2 text-sm">{a.name} — <span className="text-muted">{a.id}</span></div>)
        )}
      </Card>

      <Card>
        <p className="mb-2 text-sm font-medium">Clientes e contas associadas</p>
        {clients.map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 text-sm"><span>{c.nome_negocio} <span className="text-muted">({c.ad_account_id ?? 'sem conta'})</span></span><span className="flex items-center gap-2">{c.ad_account_id ? <Badge tone="ok">Associated</Badge> : <Badge tone="info">Pendente</Badge>}<Btn onClick={() => connect(c)}>Conectar e sincronizar</Btn></span></div>)}
      </Card>
    </div>
  );
}
