import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Empty, ErrorBox, Loading, Badge, Btn, Primary, Input } from '@/components/UI';

export default function Acessos() {
  const [clients, setClients] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [clientId, setClientId] = useState(''); const [role, setRole] = useState('cliente');
  const [loading, setLoading] = useState(true); const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: c }, { data: l }, { data: r }] = await Promise.all([
      supabase.from('clients').select('id,nome_negocio,email').order('nome_negocio'),
      supabase.from('client_users').select('*,clients(nome_negocio,email)').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*').order('created_at', { ascending: false }),
    ]);
    setClients(c ?? []); setLinks(l ?? []); setProfiles(r ?? []); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!email.trim() || !password.trim() || !clientId) { alert('Preencha e-mail, senha e cliente.'); return; }
    const { data: sess } = await supabase.auth.getSession();
    const edgeBase = (import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL as string | undefined)
      ? `${import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL}/create-access`
      : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-access`;
    const res = await fetch(edgeBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string, Authorization: `Bearer ${sess.session?.access_token}` },
      body: JSON.stringify({ email: email.trim(), password, client_id: clientId, role }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { alert(j.error ?? 'Não foi possível criar usuário.'); return; }
    setEmail(''); setPassword(''); load(); alert('Usuário criado e vinculado. Envie e-mail/senha ao cliente.');
  }

  async function toggleLink(l: any) { await supabase.from('client_users').update({ is_active: !l.is_active }).eq('id', l.id); load(); }
  async function removeLink(l: any) { if (confirm('Remover vínculo?')) { await supabase.from('client_users').delete().eq('id', l.id); load(); } }

  const withoutAccess = clients.filter(c => !links.some(l => l.client_id === c.id));

  if (loading) return <Loading />;
  if (err) return <ErrorBox msg={err} onRetry={load} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Acessos</h1>

      <Card>
        <p className="mb-3 text-sm font-medium">Novo acesso</p>
        <div className="grid gap-3 md:grid-cols-4">
          <Input label="E-mail do cliente" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="cliente@email.com" />
          <Input label="Senha inicial" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
          <label className="block"><span className="mb-1 block text-xs text-muted">Cliente</span><select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full rounded-lg border border-border bg-white text-slate-900 [color-scheme:light] px-3 py-2 text-sm"><option value="">Selecione...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nome_negocio}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-xs text-muted">Tipo</span><select value={role} onChange={e => setRole(e.target.value)} className="w-full rounded-lg border border-border bg-white text-slate-900 [color-scheme:light] px-3 py-2 text-sm"><option value="cliente">Cliente</option><option value="gestor">Gestor</option></select></label>
        </div>
        <Primary className="mt-3" onClick={create}>Criar usuário</Primary>
        <p className="mt-2 text-xs text-muted">O cliente deve confirmar o e-mail e usar a tela de login.</p>
      </Card>

      <Card>
        <p className="mb-2 text-sm font-medium">Clientes sem acesso ({withoutAccess.length})</p>
        {withoutAccess.length ? withoutAccess.map(c => <p key={c.id} className="text-sm">{c.nome_negocio} <span className="text-muted">({c.email})</span></p>) : <p className="text-sm text-muted">Todos os clientes possuem vínculo.</p>}
      </Card>

      <Card>
        <p className="mb-2 text-sm font-medium">Vínculos usuário → cliente</p>
        {!links.length ? <Empty title="Nenhum vínculo" desc="Crie um usuário acima para vincular ao cliente." /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted"><th>Usuário</th><th>Cliente</th><th>Status</th><th></th></tr></thead><tbody>
            {links.map(l => <tr key={l.id} className="border-t border-border"><td className="py-2">{l.user_id}</td><td>{l.clients?.nome_negocio ?? l.client_id}</td><td><Badge tone={l.is_active ? 'ok' : 'muted'}>{l.is_active ? 'ativo' : 'inativo'}</Badge></td><td><div className="flex gap-2"><Btn onClick={() => toggleLink(l)}>{l.is_active ? 'Desativar' : 'Ativar'}</Btn><Btn onClick={() => removeLink(l)}>Remover</Btn></div></td></tr>)}
          </tbody></table></div>
        )}
      </Card>
    </div>
  );
}
