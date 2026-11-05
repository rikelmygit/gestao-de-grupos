import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getEdgeUrl } from '@/lib/supabase';
import { Card, Empty, ErrorBox, Loading, Badge, Btn, Primary, Input } from '@/components/UI';
import { brl, num } from '@/lib/format';
import { periodRange, type PeriodKey } from '@/types/database';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { DollarSign, ShoppingBag, Target, CalendarDays } from 'lucide-react';

const tipStyle = { backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', fontSize: 12 };

export default function ClienteDetalhe() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const range = periodRange(period, custom.from && custom.to ? custom : undefined);

  async function load() {
    if (!id) return; setLoading(true);
    const [{ data: c, error: e1 }, { data: m, error: e2 }, { data: camps }, { data: sum }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('performance_metrics').select('*').eq('client_id', id).gte('date', range.from).lte('date', range.to).order('date'),
      supabase.from('campaigns').select('*').eq('client_id', id).order('name'),
      supabase.from('operation_summaries').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (e1 || e2) { setErr((e1 || e2)?.message ?? 'Erro'); setLoading(false); return; }
    setClient(c); setMetrics(m ?? []); setCampaigns(camps ?? []); setSummary(sum?.content ?? c?.resumo_operacao ?? ''); setErr(null); setLoading(false);
  }
  useEffect(() => { load(); }, [id, period, custom]);

  const totalInvest = metrics.reduce((a, r) => a + Number(r.spend ?? 0), 0);
  const totalLeads = metrics.reduce((a, r) => a + Number(r.leads ?? 0), 0);
  const cpl = totalLeads > 0 ? totalInvest / totalLeads : null;
  const todayRows = metrics.filter(r => r.date === new Date().toISOString().slice(0, 10));
  const todayInvest = todayRows.reduce((a, r) => a + Number(r.spend ?? 0), 0);
  const todayLeads = todayRows.reduce((a, r) => a + Number(r.leads ?? 0), 0);
  const chartData = metrics.map(r => ({ date: r.date.slice(5), Investimento: Number(r.spend ?? 0), Leads: Number(r.leads ?? 0), CPL: r.leads ? Number(r.spend ?? 0) / Number(r.leads) : 0 }));

  const onMeta = cpl != null && client?.meta_cpl != null ? (cpl <= Number(client.meta_cpl) ? <Badge tone="ok">Dentro da meta</Badge> : <Badge tone="bad">Acima da meta</Badge>) : <Badge tone="muted">Sem dados suficientes</Badge>;

  async function saveSummary() { if (!id) return; await supabase.from('operation_summaries').insert({ client_id: id, content: summary }); await supabase.from('clients').update({ resumo_operacao: summary, updated_at: new Date().toISOString() }).eq('id', id); alert('Resumo salvo.'); }
  async function syncMeta() {
    if (!id) return; if (!client?.ad_account_id) { setSyncMsg('Integração pendente: nenhuma conta de anúncios associada.'); return; }
    setSyncMsg('Sincronizando com Meta Ads...');
    try {
      const res = await fetch(getEdgeUrl('meta-ads'), { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string, Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }, body: JSON.stringify({ client_id: id, ad_account_id: client.ad_account_id, from: range.from, to: range.to }) });
      const j = await res.json(); if (!res.ok) setSyncMsg(j.error ?? 'Erro na integração.'); else { setSyncMsg(`Sincronizado: ${j.saved ?? 0} registros.`); load(); }
    } catch (e: any) { setSyncMsg(e.message); }
  }

  if (loading) return <Loading />;
  if (err) return <ErrorBox msg={err} onRetry={load} />;
  if (!client) return <Empty title="Cliente não encontrado" desc="Verifique o ID." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-xl font-bold tracking-tight text-slate-900">{client.nome_negocio}</h1><p className="text-sm text-muted">{client.nome_responsavel ?? ''} • {client.nicho ?? ''} • {client.status}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value as PeriodKey)} className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium shadow-sm"><option value="hoje">Hoje</option><option value="ontem">Ontem</option><option value="7d">Últimos 7 dias</option><option value="15d">Últimos 15 dias</option><option value="30d">Últimos 30 dias</option><option value="mes">Este mês</option><option value="custom">Personalizado</option></select>
          {period === 'custom' && <><Input type="date" value={custom.from} onChange={(e: any) => setCustom({ ...custom, from: e.target.value })} /><Input type="date" value={custom.to} onChange={(e: any) => setCustom({ ...custom, to: e.target.value })} /></>}
          <Btn onClick={syncMeta}>{client.ad_account_id ? 'Sincronizar Meta Ads' : 'Integração pendente'}</Btn>
        </div>
      </div>

      {syncMsg && <div className={syncMsg.includes('pendente') || syncMsg.includes('Erro') ? 'rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800' : 'rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800'}>{syncMsg}</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><DollarSign size={18} /></div><div><p className="text-xs text-muted">Investimento total</p><p className="text-lg font-bold text-slate-900">{brl(totalInvest)}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><ShoppingBag size={18} /></div><div><p className="text-xs text-muted">Leads gerados</p><p className="text-lg font-bold text-slate-900">{num(totalLeads)}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Target size={18} /></div><div><p className="text-xs text-muted">CPL</p><p className="text-lg font-bold text-slate-900">{brl(cpl)}</p></div></div><div className="mt-2">{onMeta}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><CalendarDays size={18} /></div><div><p className="text-xs text-muted">Meta de CPL</p><p className="text-lg font-bold text-slate-900">{brl(client.meta_cpl)}</p></div></div></Card>
        <Card className="p-4"><p className="text-xs text-muted">Orçamento diário</p><p className="text-lg font-bold text-slate-900">{brl(client.orcamento_diario)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Investimento do dia</p><p className="text-lg font-bold text-slate-900">{brl(todayInvest)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Leads do dia</p><p className="text-lg font-bold text-slate-900">{num(todayLeads)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">CPL do dia</p><p className="text-lg font-bold text-slate-900">{todayLeads ? brl(todayInvest / todayLeads) : '—'}</p></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><p className="mb-2 text-sm font-bold text-slate-900">Investimento por dia</p><div className="h-56"><ResponsiveContainer><BarChart data={chartData}><CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} /><YAxis tick={{ fill: '#64748B', fontSize: 11 }} /><Tooltip contentStyle={tipStyle} /><Legend /><Bar dataKey="Investimento" fill="#2563EB" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><p className="mb-2 text-sm font-bold text-slate-900">Leads por dia</p><div className="h-56"><ResponsiveContainer><BarChart data={chartData}><CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} /><YAxis tick={{ fill: '#64748B', fontSize: 11 }} /><Tooltip contentStyle={tipStyle} /><Legend /><Bar dataKey="Leads" fill="#8B5CF6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><p className="mb-2 text-sm font-bold text-slate-900">Evolução do CPL</p><div className="h-56"><ResponsiveContainer><LineChart data={chartData}><CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} /><YAxis tick={{ fill: '#64748B', fontSize: 11 }} /><Tooltip contentStyle={tipStyle} /><Legend /><Line dataKey="CPL" stroke="#F59E0B" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div></Card>
        <Card><p className="mb-2 text-sm font-bold text-slate-900">Comparativo: Investimento x Leads</p><div className="h-56"><ResponsiveContainer><LineChart data={chartData}><CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} /><YAxis tick={{ fill: '#64748B', fontSize: 11 }} /><Tooltip contentStyle={tipStyle} /><Legend /><Line dataKey="Investimento" stroke="#2563EB" strokeWidth={2.5} dot={false} /><Line dataKey="Leads" stroke="#10B981" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div></Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4"><p className="text-sm font-bold text-slate-900">Campanhas</p></div>
        {!campaigns.length ? <div className="px-5 pb-5"><p className="text-sm text-muted">Nenhuma campanha sincronizada.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-border bg-slate-50 text-left text-xs font-semibold tracking-wide text-muted uppercase"><th className="px-5 py-3">Nome</th><th>Status</th><th>Investimento</th><th>Leads</th><th>CPL</th><th>Impressões</th><th>Alcance</th><th>Cliques</th></tr></thead><tbody>
            {campaigns.map(c => <tr key={c.id} className="border-b border-border hover:bg-blue-50/40"><td className="px-5 py-3 font-medium text-slate-900">{c.name}</td><td>{c.status ?? '—'}</td><td>{brl(c.spend)}</td><td>{num(c.leads)}</td><td className="font-medium">{brl(c.cpl)}</td><td>{num(c.impressions)}</td><td>{num(c.reach)}</td><td>{num(c.clicks)}</td></tr>)}
          </tbody></table></div>
        )}
      </Card>

      <Card>
        <p className="mb-2 text-sm font-bold text-slate-900">Resumo da operação</p>
        <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={4} className="w-full rounded-xl border border-border bg-white p-3.5 text-sm shadow-sm outline-none focus:border-blue-500" placeholder="Atualizações, alterações, estratégias..." />
        <Primary className="mt-3" onClick={saveSummary}>Salvar resumo</Primary>
      </Card>
    </div>
  );
}
