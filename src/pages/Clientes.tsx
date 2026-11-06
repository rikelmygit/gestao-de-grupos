import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Card, Empty, ErrorBox, Loading, Badge, Btn, Primary, Input } from '@/components/UI';
import { dateBR } from '@/lib/format';
import type { Client } from '@/types/database';
import { MoreVertical, Pencil, Ban, Trash2, Eye } from 'lucide-react';

const emptyForm = { nome_negocio: '', nome_responsavel: '', telefone: '', email: '', nicho: '', status: 'ativo' as const, orcamento_diario: '', meta_cpl: '', ad_account_id: '', resumo_operacao: '' };

export default function Clientes() {
  const [list, setList] = useState<Client[]>([]); const [q, setQ] = useState(''); const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true); const [err, setErr] = useState<string | null>(null);
  const [show, setShow] = useState(false); const [form, setForm] = useState(emptyForm); const [editing, setEditing] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  async function load() { setLoading(true); const { data, error } = await supabase.from('clients').select('*').order('nome_negocio'); if (error) setErr(error.message); else { setList((data ?? []) as Client[]); setErr(null); } setLoading(false); }
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
      <div className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_24px_60px_-20px_rgba(37,99,235,0.35)] ring-1 ring-slate-200">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-violet-600" />
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Clientes</h1><p className="text-sm text-muted">Gerencie as operações dos seus clientes</p></div>
          <Primary onClick={() => { setEditing(null); setForm(emptyForm); setShow(true); }}>Novo cliente</Primary>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome..." className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none [color-scheme:light]" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none [color-scheme:light]"><option value="all">Todos statuses</option><option>ativo</option><option>pausado</option><option>desativado</option><option>pendente</option></select>
      </div>

      {!filtered.length ? <Empty title="Nenhum cliente encontrado" desc="Ajuste a busca ou cadastre um novo cliente." /> : (
        <Card className="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-slate-50 text-left text-xs font-semibold tracking-wide text-muted uppercase"><th className="px-5 py-3">Cliente</th><th>Responsável</th><th>Status</th><th>Orçamento/dia</th><th>Meta CPL</th><th>Cadastro</th><th className="w-10"></th></tr></thead>
            <tbody>{filtered.map(c => (
              <tr key={c.id} className="border-b border-border hover:bg-blue-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {(c as any).logo_url ? <img src={(c as any).logo_url} className="h-9 w-9 rounded-xl object-cover" alt="" /> : <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-extrabold text-white">{c.nome_negocio.slice(0, 1).toUpperCase()}</div>}
                    <div><Link to={`/gestor/clientes/${c.id}`} className="font-bold text-slate-900 hover:underline">{c.nome_negocio}</Link><div className="text-xs text-muted">{c.email}</div></div>
                  </div>
                </td>
                <td className="text-slate-700">{c.nome_responsavel ?? '—'}</td>
                <td><Badge tone={c.status === 'ativo' ? 'ok' : c.status === 'desativado' ? 'bad' : 'muted'}>{c.status}</Badge></td>
                <td className="font-medium">{c.orcamento_diario ? `R$ ${c.orcamento_diario}` : '—'}</td>
                <td className="font-medium">{c.meta_cpl ? `R$ ${c.meta_cpl}` : '—'}</td>
                <td>{dateBR(c.created_at)}</td>
                <td className="relative px-3 py-3">
                  <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-slate-600 shadow-sm hover:bg-slate-50" aria-label="Ações"><MoreVertical size={18} /></button>
                  {openMenu === c.id && (
                    <div className="absolute right-3 z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
                      <button onClick={() => { setOpenMenu(null); edit(c); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50"><Pencil size={14} /> Editar</button>
                      <Link to={`/gestor/clientes/${c.id}`} onClick={() => setOpenMenu(null)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50"><Eye size={14} /> Abrir painel</Link>
                      <button onClick={() => { setOpenMenu(null); toggleStatus(c); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50"><Ban size={14} /> {c.status === 'desativado' ? 'Ativar' : 'Desativar'}</button>
                      <button onClick={() => { setOpenMenu(null); remove(c); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Remover</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}</tbody></table></div>
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
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Status</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 [color-scheme:light]"><option>ativo</option><option>pausado</option><option>desativado</option><option>pendente</option></select></label>
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
