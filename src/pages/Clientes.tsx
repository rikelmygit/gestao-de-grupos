import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Card, Empty, ErrorBox, Loading, Badge, Btn, Primary, Input } from '@/components/UI';
import { dateBR } from '@/lib/format';
import type { Client } from '@/types/database';

const emptyForm = { nome_negocio: '', nome_responsavel: '', telefone: '', email: '', nicho: '', status: 'ativo' as const, orcamento_diario: '', meta_cpl: '', ad_account_id: '', resumo_operacao: '' };

export default function Clientes() {
  const [list, setList] = useState<Client[]>([]); const [q, setQ] = useState(''); const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true); const [err, setErr] = useState<string | null>(null);
  const [show, setShow] = useState(false); const [form, setForm] = useState(emptyForm); const [editing, setEditing] = useState<string | null>(null); const [saving, setSaving] = useState(false);

  async function load() { setLoading(true); const { data, error } = await supabase.from('clients').select('*').order('nome_negocio'); if (error) setErr(error.message); else { setList(data ?? []); setErr(null); } setLoading(false); }
  useEffect(() => { load(); }, []);

  const filtered = list.filter(c => (status === 'all' || c.status === status) && c.nome_negocio.toLowerCase().includes(q.toLowerCase()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome_negocio.trim() || !form.email.trim()) { alert('Nome do negócio e e-mail são obrigatórios.'); return; }
    if (form.email && !form.email.includes('@')) { alert('E-mail inválido.'); return; }
    setSaving(true);
    const payload = { nome_negocio: form.nome_negocio.trim(), nome_responsavel: form.nome_responsavel || null, telefone: form.telefone || null, email: form.email || null, nicho: form.nicho || null, status: form.status, orcamento_diario: form.orcamento_diario ? Number(form.orcamento_diario) : null, meta_cpl: form.meta_cpl ? Number(form.meta_cpl) : null, ad_account_id: form.ad_account_id || null, resumo_operacao: form.resumo_operacao || null, updated_at: new Date().toISOString() };
    const res = editing ? await supabase.from('clients').update(payload).eq('id', editing) : await supabase.from('clients').insert(payload);
    if (res.error) alert(res.error.message);
    else { setShow(false); setEditing(null); setForm(emptyForm); load(); }
    setSaving(false);
  }

  function edit(c: Client) { setEditing(c.id); setForm({ nome_negocio: c.nome_negocio, nome_responsavel: c.nome_responsavel ?? '', telefone: c.telefone ?? '', email: c.email ?? '', nicho: c.nicho ?? '', status: c.status as any, orcamento_diario: c.orcamento_diario?.toString() ?? '', meta_cpl: c.meta_cpl?.toString() ?? '', ad_account_id: c.ad_account_id ?? '', resumo_operacao: c.resumo_operacao ?? '' }); setShow(true); }

  async function remove(c: Client) {
    if (!confirm(`Remover ${c.nome_negocio}?`)) return;
    const { error } = await supabase.from('clients').delete().eq('id', c.id);
    if (error) alert(error.message); else load();
  }
  async function toggleStatus(c: Client) {
    const next = c.status === 'desativado' ? 'ativo' : 'desativado';
    await supabase.from('clients').update({ status: next, updated_at: new Date().toISOString() }).eq('id', c.id); load();
  }

  if (loading) return <Loading />;
  if (err) return <ErrorBox msg={err} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Primary onClick={() => { setEditing(null); setForm(emptyForm); setShow(true); }}>Novo cliente</Primary>
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome..." className="rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm"><option value="all">Todos statuses</option><option>ativo</option><option>pausado</option><option>desativado</option><option>pendente</option></select>
      </div>

      {!filtered.length ? <Empty title="Nenhum cliente encontrado" desc="Ajuste a busca ou cadastre um novo cliente." /> : (
        <Card>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted"><th>Cliente</th><th>Responsável</th><th>Status</th><th>Orçamento/dia</th><th>Meta CPL</th><th>Cadastro</th><th>Ações</th></tr></thead>
            <tbody>{filtered.map(c => <tr key={c.id} className="border-t border-border"><td className="py-2 font-medium"><Link to={`/gestor/clientes/${c.id}`} className="hover:underline">{c.nome_negocio}</Link><div className="text-xs text-muted">{c.email}</div></td><td>{c.nome_responsavel ?? '—'}</td><td><Badge tone={c.status === 'ativo' ? 'ok' : c.status === 'desativado' ? 'bad' : 'muted'}>{c.status}</Badge></td><td>{c.orcamento_diario ? `R$ ${c.orcamento_diario}` : '—'}</td><td>{c.meta_cpl ? `R$ ${c.meta_cpl}` : '—'}</td><td>{dateBR(c.created_at)}</td><td><div className="flex gap-2"><Btn onClick={() => edit(c)}>Editar</Btn><Btn onClick={() => toggleStatus(c)}>{c.status === 'desativado' ? 'Ativar' : 'Desativar'}</Btn><Btn onClick={() => remove(c)}>Remover</Btn></div></td></tr>)}</tbody></table></div>
        </Card>
      )}

      {show && (
        <div className="fixed inset-0 bg-black/70 p-4"><div className="mx-auto mt-10 max-w-lg rounded-xl border border-border bg-surface p-4">
          <h2 className="font-semibold">{editing ? 'Editar cliente' : 'Novo cliente'}</h2>
          <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Nome do negócio *" value={form.nome_negocio} onChange={(e: any) => setForm({ ...form, nome_negocio: e.target.value })} />
            <Input label="Responsável" value={form.nome_responsavel} onChange={(e: any) => setForm({ ...form, nome_responsavel: e.target.value })} />
            <Input label="Telefone" value={form.telefone} onChange={(e: any) => setForm({ ...form, telefone: e.target.value })} />
            <Input label="E-mail *" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} />
            <Input label="Nicho" value={form.nicho} onChange={(e: any) => setForm({ ...form, nicho: e.target.value })} />
            <label className="block"><span className="mb-1 block text-xs text-muted">Status</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full rounded-lg border border-border bg-zinc-900 px-3 py-2"><option>ativo</option><option>pausado</option><option>desativado</option><option>pendente</option></select></label>
            <Input label="Orçamento diário (R$)" type="number" step="0.01" value={form.orcamento_diario} onChange={(e: any) => setForm({ ...form, orcamento_diario: e.target.value })} />
            <Input label="Meta de CPL (R$)" type="number" step="0.01" value={form.meta_cpl} onChange={(e: any) => setForm({ ...form, meta_cpl: e.target.value })} />
            <Input label="ID da conta de anúncios" value={form.ad_account_id} onChange={(e: any) => setForm({ ...form, ad_account_id: e.target.value })} />
            <div className="sm:col-span-2"><Input label="Resumo da operação" value={form.resumo_operacao} onChange={(e: any) => setForm({ ...form, resumo_operacao: e.target.value })} /></div>
            <div className="flex gap-2 sm:col-span-2"><Primary disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Primary><Btn onClick={() => setShow(false)}>Cancelar</Btn></div>
          </form>
        </div></div>
      )}
    </div>
  );
}
