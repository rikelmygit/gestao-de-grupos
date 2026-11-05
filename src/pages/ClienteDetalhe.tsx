import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getEdgeUrl } from '@/lib/supabase';
import { Card, Empty, ErrorBox, Loading, Badge, Btn, Primary, Input } from '@/components/UI';
import { brl, num } from '@/lib/format';
import { periodRange, type PeriodKey } from '@/types/database';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, Legend } from 'recharts';

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
    if (!id) return;
    setLoading(true);
    const [{ data: c, error: e1 }, { data: m, error: e2 }, { data: camps, error: e3 }, { data: sum }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('performance_metrics').select('*').eq('client_id', id).gte('date', range.from).lte('date', range.to).order('date'),
      supabase.from('campaigns').select('*').eq('client_id', id).order('name'),
      supabase.from('operation_summaries').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (e1 || e2) { setErr((e1 || e2)?.message ?? 'Erro ao carregar'); setLoading(false); return; }
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

  async function saveSummary() {
    if (!id) return;
    await supabase.from('operation_summaries').insert({ client_id: id, content: summary });
    await supabase.from('clients').update({ resumo_operacao: summary, updated_at: new Date().toISOString() }).eq('id', id);
    alert('Resumo salvo.');
  }

  async function syncMeta() {
    if (!id) return;
    if (!client?.ad_account_id) { setSyncMsg('Integração pendente: nenhuma conta de anúncios associada.'); return; }
    setSyncMsg('Sincronizando com Meta Ads...');
    try {
      const res = await fetch(getEdgeUrl('meta-ads'), { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string, Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }, body: JSON.stringify({ client_id: id, ad_account_id: client.ad_account_id, from: range.from, to: range.to }) });
      const j = await res.json();
      if (!res.ok) setSyncMsg(j.error ?? 'Erro na integração.');
      else { setSyncMsg(`Sincronizado: ${j.saved ?? 0} registros.`); load(); }
    } catch (e: any) { setSyncMsg(e.message); }
  }

  if (loading) return <Loading />;
  if (err) return <ErrorBox msg={err} onRetry={load} />;
  if (!client) return <Empty title="Cliente não encontrado" desc="Verifique o ID." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-xl font-semibold">{client.nome_negocio}</h1><p className="text-sm text-muted">{client.nome_responsavel ?? ''} • {client.nicho ?? ''} • {client.status}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value as PeriodKey)} className="rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm"><option value="hoje">Hoje</option><option value="ontem">Ontem</option><option value="7d">Últimos 7 dias</option><option value="15d">Últimos 15 dias</option><option value="30d">Últimos 30 dias</option><option value="mes">Este mês</option><option value="custom">Personalizado</option></select>
          {period === 'custom' && <><Input type="date" value={custom.from} onChange={(e: any) => setCustom({ ...custom, from: e.target.value })} /><Input type="date" value={custom.to} onChange={(e: any) => setCustom({ ...custom, to: e.target.value })} /></>}
          <Btn onClick={syncMeta}>{client.ad_account_id ? 'Sincronizar Meta Ads' : 'Integração pendente'}</Btn>
        </div>
      </div>

      {syncMsg && <div className={syncMsg.includes('pendente') || syncMsg.includes('Erro') ? 'rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-sm' : 'rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm'}>{syncMsg}</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-xs text-muted">Investimento total</p><p className="text-lg font-semibold">{brl(totalInvest)}</p></Card>
        <Card><p className="text-xs text-muted">Leads gerados</p><p className="text-lg font-semibold">{num(totalLeads)}</p></Card>
        <Card><p className="text-xs text-muted">CPL</p><p className="text-lg font-semibold">{brl(cpl)}</p><div className="mt-1">{onMeta}</div></Card>
        <Card><p className="text-xs text-muted">Meta de CPL</p><p className="text-lg font-semibold">{brl(client.meta_cpl)}</p></Card>
        <Card><p className="text-xs text-muted">Orçamento diário</p><p className="text-lg font-semibold">{brl(client.orcamento_diario)}</p></Card>
        <Card><p className="text-xs text-muted">Investimento do dia</p><p className="text-lg font-semibold">{brl(todayInvest)}</p></Card>
        <Card><p className="text-xs text-muted">Leads do dia</p><p className="text-lg font-semibold">{num(todayLeads)}</p></Card>
        <Card><p className="text-xs text-muted">CPL do dia</p><p className="text-lg font-semibold">{todayLeads ? brl(todayInvest / todayLeads) : '—'}</p></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><p className="mb-2 text-sm font-medium">Investimento por dia</p><div className="h-56"><ResponsiveContainer><BarChart data={chartData}><CartesianGrid stroke="#26262B" /><XAxis dataKey="date" tick={{ fill: '#8A8A93', fontSize: 11 }} /><YAxis tick={{ fill: '#8A8A93', fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="Investimento" fill="#22C55E" /></BarChart></ResponsiveContainer></div></Card>
        <Card><p className="mb-2 text-sm font-medium">Leads por dia</p><div className="h-56"><ResponsiveContainer><BarChart data={chartData}><CartesianGrid stroke="#26262B" /><XAxis dataKey="date" tick={{ fill: '#8A8A93', fontSize: 11 }} /><YAxis tick={{ fill: '#8A8A93', fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="Leads" fill="#60A5FA" /></BarChart></ResponsiveContainer></div></Card>
        <Card><p className="mb-2 text-sm font-medium">Evolução do CPL</p><div className="h-56"><ResponsiveContainer><LineChart data={chartData}><CartesianGrid stroke="#26262B" /><XAxis dataKey="date" tick={{ fill: '#8A8A93', fontSize: 11 }} /><YAxis tick={{ fill: '#8A8A93', fontSize: 11 }} /><Tooltip /><Legend /><Line dataKey="CPL" stroke="#F59E0B" dot={false} /></LineChart></ResponsiveContainer></div></Card>
        <Card><p className="mb-2 text-sm font-medium">Comparativo: Investimento x Leads</p><div className="h-56"><ResponsiveContainer><LineChart data={chartData}><CartesianGrid stroke="#26262B" /><XAxis dataKey="date" tick={{ fill: '#8A8A93', fontSize: 11 }} /><YAxis tick={{ fill: '#8A8A93', fontSize: 11 }} /><Tooltip /><Legend /><Line dataKey="Investimento" stroke="#22C55E" dot={false} /><Line dataKey="Leads" stroke="#38BDF8" dot={false} /></LineChart></ResponsiveContainer></div></Card>
      </div>

      <Card>
        <p className="mb-2 text-sm font-medium">Campanhas</p>
        {!campaigns.length ? <p className="text-sm text-muted">Nenhuma campanha sincronizada.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted"><th>Nome</th><th>Status</th><th>Investimento</th><th>Leads</th><th>CPL</th><th>Impressões</th><th>Alcance</th><th>Cliques</th></tr></thead><tbody>
            {campaigns.map(c => <tr key={c.id} className="border-t border-border"><td className="py-2">{c.name}</td><td>{c.status ?? '—'}</td><td>{brl(c.spend)}</td><td>{num(c.leads)}</td><td>{brl(c.cpl)}</td><td>{num(c.impressions)}</td><td>{num(c.reach)}</td><td>{num(c.clicks)}</td></tr>)}
          </tbody></table></div>
        )}
      </Card>

      <Card>
        <p className="mb-2 text-sm font-medium">Resumo da operação</p>
        <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-zinc-900 p-3 text-sm" placeholder="Atualizações, alterações, estratégias..." />
        <Primary className="mt-2" onClick={saveSummary}>Salvar resumo</Primary>
      </Card>
    </div>
  );
}
