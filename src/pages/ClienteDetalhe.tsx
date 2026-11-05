import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getEdgeUrl } from '@/lib/supabase';
import { Card, Empty, ErrorBox, Loading, Badge, Btn, Primary, Input } from '@/components/UI';
import { brl, num, dateBR, dateTimeBR, pct, periodLabel } from '@/lib/format';
import { periodRange, type PeriodKey } from '@/types/database';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis, Cell, LabelList } from 'recharts';
import { DollarSign, ShoppingBag, Target, CalendarDays, Download, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const tipStyle = { background: 'rgba(255,255,255,0.95)', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 20px 40px rgba(15,23,42,0.15)', fontSize: 12, backdropFilter: 'blur(8px)' };

function prevRange(from: string, to: string) {
  const f = new Date(from + 'T12:00:00');
  const t = new Date(to + 'T12:00:00');
  const diff = Math.round((t.getTime() - f.getTime()) / 86400000);
  const pf = new Date(f); pf.setDate(pf.getDate() - diff - 1);
  const pt = new Date(t); pt.setDate(pt.getDate() - diff - 1);
  return { from: pf.toISOString().slice(0, 10), to: pt.toISOString().slice(0, 10) };
}
function summarize(rows: any[]) {
  const invest = rows.reduce((a, r) => a + Number(r.spend ?? 0), 0);
  const leads = rows.reduce((a, r) => a + Number(r.leads ?? 0), 0);
  const clicks = rows.reduce((a, r) => a + Number(r.clicks ?? 0), 0);
  const impr = rows.reduce((a, r) => a + Number(r.impressions ?? 0), 0);
  const reach = rows.reduce((a, r) => a + Number(r.reach ?? 0), 0);
  const cpl = leads > 0 ? invest / leads : null;
  return { invest, leads, clicks, impr, reach, cpl };
}
function variation(cur: number | null, prev: number | null) {
  if (cur == null || prev == null || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}
function diffLabel(cur: number | null, prev: number | null, money = false) {
  if (cur == null || prev == null) return '—';
  const d = cur - prev;
  return `${money ? brl(Math.abs(d)) : num(Math.abs(d))} ${d >= 0 ? 'acima' : 'abaixo'}`;
}

function Card3D({ children, className }: { children: any; className?: string }) {
  return <div className={cn('relative overflow-hidden rounded-[20px] border border-white/60 bg-white/80 shadow-[0_20px_50px_-20px_rgba(37,99,235,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-transform hover:-translate-y-0.5', className)}><div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-violet-50/40" /> <div className="relative p-5">{children}</div></div>;
}

export default function ClienteDetalhe() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [prevMetrics, setPrevMetrics] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [salesRows, setSalesRows] = useState<any[] | null>(null);
  const [qualityRows, setQualityRows] = useState<any[] | null>(null);
  const [compare, setCompare] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [summary, setSummary] = useState('');
  const [actionText, setActionText] = useState('');
  const [resp, setResp] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncAt, setSyncAt] = useState<string | null>(null);
  const range = periodRange(period, custom.from && custom.to ? custom : undefined);
  const prev = prevRange(range.from, range.to);

  async function load() {
    if (!id) return; setLoading(true);
    const [cRes, mRes, pmRes, campRes, sumRes, actRes, saleRes, qualRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('performance_metrics').select('*').eq('client_id', id).gte('date', range.from).lte('date', range.to).order('date'),
      supabase.from('performance_metrics').select('*').eq('client_id', id).gte('date', prev.from).lte('date', prev.to).order('date'),
      supabase.from('campaigns').select('*').eq('client_id', id).order('name'),
      supabase.from('operation_summaries').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('operation_actions').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('sales_results').select('*').eq('client_id', id).gte('date', range.from).lte('date', range.to).order('date'),
      supabase.from('lead_quality').select('*').eq('client_id', id).gte('date', range.from).lte('date', range.to).order('date'),
    ]);
    if (cRes.error || mRes.error) { setErr((cRes.error || mRes.error)?.message ?? 'Erro ao carregar'); setLoading(false); return; }
    setClient(cRes.data);
    setMetrics(mRes.data ?? []);
    setPrevMetrics(pmRes.data ?? []);
    setCampaigns(campRes.data ?? []);
    setSummaries(sumRes.data ?? []);
    setSummary(sumRes.data?.[0]?.content ?? cRes.data?.resumo_operacao ?? '');
    const lastUpd = [...(mRes.data ?? []), ...(campRes.data ?? [])].map((r: any) => r.updated_at).filter(Boolean).sort().pop();
    setSyncAt(lastUpd ?? null);
    if (actRes.error) setActions(null as any); else setActions(actRes.data ?? []);
    if (saleRes.error) setSalesRows(null); else setSalesRows(saleRes.data ?? []);
    if (qualRes.error) setQualityRows(null); else setQualityRows(qualRes.data ?? []);
    setErr(null); setLoading(false);
  }
  useEffect(() => { load(); }, [id, period, custom]);

  const cur = summarize(metrics);
  const prv = summarize(prevMetrics);
  const days = Math.max(1, Math.round((new Date(range.to + 'T12:00:00').getTime() - new Date(range.from + 'T12:00:00').getTime()) / 86400000) + 1);
  const chartData = metrics.map(r => ({ date: r.date.slice(5), full: r.date, Investimento: Number(r.spend ?? 0), Leads: Number(r.leads ?? 0), CPL: r.leads ? Number(r.spend ?? 0) / Number(r.leads) : 0 }));

  const meta = client?.meta_cpl != null ? Number(client.meta_cpl) : null;
  const metaDiff = cur.cpl != null && meta != null ? cur.cpl - meta : null;
  const onMeta = cur.cpl != null && meta != null ? (cur.cpl <= meta ? <Badge tone="ok">Dentro da meta</Badge> : <Badge tone="bad">Acima da meta</Badge>) : <Badge tone="muted">Sem dados suficientes</Badge>;

  const salesTotal = salesRows ? salesRows.reduce((a, r) => a + Number(r.sales ?? 0), 0) : 0;
  const revTotal = salesRows ? salesRows.reduce((a, r) => a + Number(r.revenue ?? 0), 0) : 0;
  const roas = salesRows && revTotal > 0 && cur.invest > 0 ? revTotal / cur.invest : null;

  const qValid = qualityRows ? qualityRows.reduce((a, r) => a + Number(r.valid_leads ?? 0), 0) : null;
  const qInvalid = qualityRows ? qualityRows.reduce((a, r) => a + Number(r.invalid_leads ?? 0), 0) : null;
  const qDup = qualityRows ? qualityRows.reduce((a, r) => a + Number(r.duplicate_leads ?? 0), 0) : null;
  const qRet7 = qualityRows ? qualityRows.reduce((a, r) => a + Number(r.retained_7d ?? 0), 0) : null;

  const budgetLimit = client?.orcamento_diario != null ? Number(client.orcamento_diario) * days : null;
  const balance = budgetLimit != null ? budgetLimit - cur.invest : null;
  const avgDay = days > 0 ? cur.invest / days : 0;
  const forecast = avgDay * days;
  const budgetPct = budgetLimit && budgetLimit > 0 ? (cur.invest / budgetLimit) * 100 : null;

  function recommendation(c: any) {
    const ccpl = c.cpl != null ? Number(c.cpl) : null;
    if (Number(c.leads) === 0 && Number(c.spend) > 0) return { tone: 'bad' as const, text: 'Sem leads com investimento — revisar segmentação, página destino e CTA. Não pausar automaticamente.' };
    if (ccpl != null && meta != null && ccpl > meta * 1.2) return { tone: 'bad' as const, text: `CPL ${brl(ccpl)} acima da meta ${brl(meta)} (+${pct(((ccpl - meta) / meta) * 100)}) — testar novo criativo antes de aumentar orçamento.` };
    if (ccpl != null && meta != null && ccpl <= meta) return { tone: 'ok' as const, text: 'Dentro da meta — candidato a testar aumento gradual de orçamento, monitorando CPL.' };
    if (Number(c.spend) === 0) return { tone: 'muted' as const, text: 'Sem investimento no período — verificar status e entrega.' };
    return { tone: 'warn' as const, text: 'Monitorar evolução do CPL antes de qualquer mudança.' };
  }

  function exportCSV() {
    const header = 'Dia;Gasto;Leads;CPL;Cliques;Impressoes;Alcance;Fonte\n';
    const rows = metrics.map(r => `${r.date};${Number(r.spend ?? 0).toFixed(2)};${r.leads ?? 0};${r.leads ? (Number(r.spend) / Number(r.leads)).toFixed(2) : ''};${r.clicks ?? 0};${r.impressions ?? 0};${r.reach ?? 0};Meta API`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `historico-${range.from}-${range.to}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  async function saveSummary() { if (!id) return; await supabase.from('operation_summaries').insert({ client_id: id, content: summary }); await supabase.from('clients').update({ resumo_operacao: summary, updated_at: new Date().toISOString() }).eq('id', id); load(); }
  async function saveAction() {
    if (!id || !actionText.trim()) { alert('Descreva a ação.'); return; }
    const { error } = await supabase.from('operation_actions').insert({ client_id: id, action: actionText.trim(), responsible: resp.trim() || null, deadline: deadline || null });
    if (error) alert(error.message); else { setActionText(''); setResp(''); setDeadline(''); load(); }
  }
  async function changeStatus(a: any, st: string) { await supabase.from('operation_actions').update({ status: st, updated_at: new Date().toISOString() }).eq('id', a.id); load(); }
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
      <div className="relative overflow-hidden rounded-[22px] border border-white/60 bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 p-[1px] shadow-[0_20px_50px_-20px_rgba(37,99,235,0.45)]">
        <div className="rounded-[21px] bg-white/95 p-5 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="bg-gradient-to-r from-blue-700 to-violet-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">{client.nome_negocio}</h1>
              <p className="text-sm text-muted">{client.nome_responsavel ?? ''} • {client.nicho ?? ''} • {client.status}</p>
              <p className="mt-1 text-xs text-muted">Período: <b className="text-slate-800">{periodLabel(range.from, range.to)}</b> ({days} dias) • Última sincronização: <b className="text-slate-800">{syncAt ? dateTimeBR(syncAt) : 'não sincronizado'}</b></p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={period} onChange={e => setPeriod(e.target.value as PeriodKey)} className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium shadow-sm"><option value="hoje">Hoje</option><option value="ontem">Ontem</option><option value="7d">Últimos 7 dias</option><option value="15d">Últimos 15 dias</option><option value="30d">Últimos 30 dias</option><option value="mes">Este mês</option><option value="custom">Personalizado</option></select>
              {period === 'custom' && <><Input type="date" value={custom.from} onChange={(e: any) => setCustom({ ...custom, from: e.target.value })} /><Input type="date" value={custom.to} onChange={(e: any) => setCustom({ ...custom, to: e.target.value })} /></>}
              <Btn onClick={syncMeta}>{client.ad_account_id ? 'Sincronizar Meta Ads' : 'Integração pendente'}</Btn>
            </div>
          </div>
        </div>
      </div>

      {syncMsg && <div className={syncMsg.includes('pendente') || syncMsg.includes('Erro') ? 'rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800' : 'rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800'}>{syncMsg}</div>}

      <Card3D>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900">Comparação com período anterior ({periodLabel(prev.from, prev.to)})</p>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} /> Mostrar comparação</label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-gradient-to-br from-white to-slate-50 p-3 text-sm shadow-sm"><p className="text-muted">Investimento</p><p className="font-bold">{brl(cur.invest)} <span className="text-xs font-medium text-slate-500">vs {brl(prv.invest)} ({diffLabel(cur.invest, prv.invest, true)}) {pct(variation(cur.invest, prv.invest))}</span></p></div>
          <div className="rounded-xl border border-border bg-gradient-to-br from-white to-slate-50 p-3 text-sm shadow-sm"><p className="text-muted">Leads</p><p className="font-bold">{num(cur.leads)} <span className="text-xs font-medium text-slate-500">vs {num(prv.leads)} ({diffLabel(cur.leads, prv.leads)}) {pct(variation(cur.leads, prv.leads))}</span></p></div>
          <div className="rounded-xl border border-border bg-gradient-to-br from-white to-slate-50 p-3 text-sm shadow-sm"><p className="text-muted">CPL</p><p className="font-bold">{brl(cur.cpl)} <span className="text-xs font-medium text-slate-500">vs {brl(prv.cpl)} ({diffLabel(cur.cpl, prv.cpl, true)}) {pct(variation(cur.cpl, prv.cpl))}</span></p></div>
        </div>
        <div className="mt-2 text-xs">CPL atual {brl(cur.cpl)} • Meta {brl(meta)} • {metaDiff == null ? 'sem dados suficientes' : metaDiff <= 0 ? `${brl(Math.abs(metaDiff))} abaixo da meta` : `${brl(metaDiff)} acima da meta`}</div>
      </Card3D>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card3D><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"><DollarSign size={18} /></div><div><p className="text-xs text-muted">Investimento total</p><p className="text-[22px] font-extrabold text-slate-900">{brl(cur.invest)}</p></div></div></Card3D>
        <Card3D><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30"><ShoppingBag size={18} /></div><div><p className="text-xs text-muted">Leads gerados</p><p className="text-[22px] font-extrabold text-slate-900">{num(cur.leads)}</p></div></div></Card3D>
        <Card3D><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"><Target size={18} /></div><div><p className="text-xs text-muted">CPL</p><p className="text-[22px] font-extrabold text-slate-900">{brl(cur.cpl)}</p></div></div><div className="mt-2">{onMeta}</div></Card3D>
        <Card3D><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30"><CalendarDays size={18} /></div><div><p className="text-xs text-muted">Meta de CPL</p><p className="text-[22px] font-extrabold text-slate-900">{brl(meta)}</p></div></div></Card3D>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card3D>
          <div className="mb-1 flex items-center justify-between"><div><p className="text-sm font-bold text-slate-900">Evolução do investimento</p><p className="text-xs text-muted">Gastos por dia, sem projeção. Até 30 barras.</p></div><span className="flex items-center gap-1.5 text-xs text-muted"><span className="h-2 w-2 rounded-full bg-blue-600" />Gasto</span></div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={chartData} barCategoryGap="30%">
                <defs>
                  <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="55%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                  <filter id="softShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563EB" floodOpacity="0.25" /></filter>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip contentStyle={tipStyle} cursor={{ fill: '#2563EB0D' }} />
                <Bar dataKey="Investimento" fill="url(#gradBar)" radius={[8, 8, 4, 4]} filter="url(#softShadow)">
                  <LabelList dataKey="Investimento" position="top" formatter={(v: any) => v > 0 ? brl(v) : ''} style={{ fontSize: 9, fill: '#64748B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted">Somente dias com registro. Passe sobre as barras para ver valores.</p>
        </Card3D>

        <Card3D>
          <p className="text-xs tracking-[0.12em] uppercase text-muted">O que estamos acompanhando</p>
          <p className="text-sm font-bold text-slate-900">Resumo do gestor</p>
          <div className="mt-3 rounded-xl border-l-4 border-blue-600 bg-blue-50/70 p-3 text-sm">{summaries[0]?.content ?? 'A equipe ainda não publicou uma atualização para esta campanha.'}</div>
          <p className="mt-2 text-xs text-muted">Cadastro atualizado em {dateBR(client.updated_at)}. Os números seguem a fonte indicada, não são leitura em tempo real.</p>
          <div className="mt-4 rounded-xl border border-border p-3 text-sm">
            <p className="font-semibold">Grupos desta campanha</p>
            <p className="text-muted text-xs mt-1">O cliente ainda não vinculou grupos a esta campanha. Participantes são contagens observadas, não conversões atribuídas.</p>
            <Btn className="mt-2"><Users size={14} /> Conectar e selecionar meus grupos ↗</Btn>
          </div>
        </Card3D>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card3D>
          <p className="text-sm font-bold text-slate-900">Do clique à conversão</p>
          <div className="mt-3 divide-y divide-border">
            <div className="flex justify-between py-3"><span className="text-sm text-muted">Impressões</span><span className="font-bold">{num(cur.impr)}</span></div>
            <div className="flex justify-between py-3"><span className="text-sm text-muted">Cliques</span><span className="font-bold">{num(cur.clicks)} • CTR {cur.impr ? (((cur.clicks / cur.impr) * 100).toFixed(1)) + '%' : '—'}</span></div>
            <div className="flex justify-between py-3"><span className="text-sm text-muted">Visitas à página</span><span className="font-bold">{num(cur.reach ? Math.min(cur.reach, 999999) : null)} • {cur.clicks ? ((cur.reach / cur.clicks) * 100).toFixed(0) + '%' : '—'}</span></div>
            <div className="flex justify-between py-3"><span className="text-sm text-muted">Leads</span><span className="font-bold">{num(cur.leads)} • conversão {cur.clicks ? (((cur.leads / cur.clicks) * 100).toFixed(1)) + '%' : '—'}</span></div>
          </div>
          <p className="text-xs text-muted">Taxas usam somente métricas compatíveis do acumulado. “—” = não disponível.</p>
        </Card3D>

        <Card3D>
          <p className="text-sm font-bold text-slate-900">Funil completo</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {['Impressões','Cliques','Leads Meta','Entradas no grupo'].map((st, i) => (
              <div key={st} className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-violet-500" />
                <p className="text-xs text-muted">{st}</p>
                <p className="font-bold">{i === 0 ? num(cur.impr) : i === 1 ? num(cur.clicks) : i === 2 ? num(cur.leads) : '—'}</p>
                <p className="text-xs text-slate-500">{i === 3 ? 'Não disponível — requer registro/integração' : ''}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Conversas iniciadas e entradas no grupo não são estimadas sem webhook/registro manual.</p>
        </Card3D>
      </div>

      <Card3D>
        <p className="text-sm font-bold text-slate-900">Resultado para o cliente</p>
        {salesRows === null ? <div className="mt-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted">Tabela de vendas ainda não criada. Rode a migração <code>002_acoes_funnel.sql</code>. Sem integração, vendas/receita/ROAS não são exibidos.</div>
        : salesRows.length === 0 ? <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">Vendas e receita ainda não são acompanhadas neste cliente.</div>
        : <div className="mt-3 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Vendas</p><p className="font-bold">{num(salesTotal)}</p></div><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Receita</p><p className="font-bold">{brl(revTotal)}</p></div><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">ROAS</p><p className="font-bold">{roas == null ? '—' : roas.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + 'x'}</p></div></div>}
      </Card3D>

      <Card3D>
        <p className="text-sm font-bold text-slate-900">Qualidade e retenção dos leads</p>
        {qualityRows === null ? <div className="mt-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted">Tabela de qualidade ainda não criada. Rode a migração <code>002</code>.</div>
        : qualityRows.length === 0 ? <p className="mt-2 text-sm text-muted">Nenhum dado de qualidade no período. Leads válidos/inválidos/duplicados e retenção precisam ser registrados/integrados.</p>
        : <div className="mt-3 grid gap-3 sm:grid-cols-4"><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Válidos</p><p className="font-bold">{num(qValid)}</p></div><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Inválidos</p><p className="font-bold">{num(qInvalid)}</p></div><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Duplicados</p><p className="font-bold">{num(qDup)}</p></div><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Retenção 7d</p><p className="font-bold">{num(qRet7)}</p></div></div>}
      </Card3D>

      <Card3D>
        <p className="text-sm font-bold text-slate-900">Orçamento do período</p>
        {!client?.orcamento_diario ? <p className="mt-2 text-sm text-muted">Sem orçamento diário definido — nenhum valor fictício exibido.</p> : (
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Limite do período</p><p className="font-bold">{brl(budgetLimit)}</p><p className="text-xs text-slate-500">{brl(client.orcamento_diario)}/dia × {days}d</p></div>
            <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Gasto</p><p className="font-bold">{brl(cur.invest)}</p></div>
            <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Saldo</p><p className="font-bold">{brl(balance)}</p><p className="text-xs text-slate-500">{budgetPct == null ? '—' : budgetPct.toFixed(1) + '% do limite'}</p></div>
            <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Previsão (ritmo atual)</p><p className="font-bold">{brl(forecast)}</p><p className="text-xs text-slate-500">{brl(avgDay)}/dia em média</p></div>
          </div>
        )}
      </Card3D>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card3D className="lg:col-span-2">
          <div className="mb-1 flex items-center justify-between"><p className="text-sm font-bold text-slate-900">Crescimento de leads</p><span className="flex items-center gap-1.5 text-xs text-muted"><span className="h-2 w-2 rounded-full bg-blue-600" />Novos leads</span></div>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip contentStyle={tipStyle} />
                <Area type="monotone" dataKey="Leads" stroke="#2563EB" strokeWidth={3} fill="url(#gradArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card3D>
        <Card3D><p className="text-sm font-bold text-slate-900">Evolução do CPL</p><div className="h-56"><ResponsiveContainer><LineChart data={chartData}><CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} /><YAxis tick={{ fill: '#64748B', fontSize: 11 }} /><Tooltip contentStyle={tipStyle} /><Line type="monotone" dataKey="CPL" stroke="#F59E0B" strokeWidth={3} dot={{ r: 3, fill: '#F59E0B' }} /></LineChart></ResponsiveContainer></div></Card3D>
      </div>

      <Card3D className="p-0 overflow-hidden">
        <div className="px-5 py-4"><p className="text-sm font-bold text-slate-900">Campanhas e recomendações</p><p className="text-xs text-muted">Recomendações são sugestões — nada é pausado automaticamente.</p></div>
        {!campaigns.length ? <div className="px-5 pb-5"><p className="text-sm text-muted">Nenhuma campanha sincronizada.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-border bg-slate-50 text-left text-xs font-semibold tracking-wide text-muted uppercase"><th className="px-5 py-3">Nome</th><th>Status</th><th>Investimento</th><th>Leads</th><th>CPL</th><th>Situação</th><th>Recomendação</th></tr></thead><tbody>
            {campaigns.map(c => { const r = recommendation(c); return <tr key={c.id} className="border-b border-border hover:bg-blue-50/50"><td className="px-5 py-3 font-medium text-slate-900">{c.name}</td><td>{c.status ?? '—'}</td><td>{brl(c.spend)}</td><td>{num(c.leads)}</td><td className="font-medium">{brl(c.cpl)}</td><td><Badge tone={r.tone}>{r.tone === 'ok' ? 'Dentro da meta' : r.tone === 'bad' ? 'Atenção' : 'Monitorar'}</Badge></td><td className="max-w-xs text-xs text-slate-600">{r.text}</td></tr>; })}
          </tbody></table></div>
        )}
      </Card3D>

      <Card3D className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div><p className="text-sm font-bold text-slate-900">Histórico diário</p><p className="text-xs text-muted">Dados lidos via Meta API, no fuso da conta. Dias ausentes não são preenchidos com zero.</p></div>
          <Btn onClick={exportCSV}><Download size={14} /> Exportar diário</Btn>
        </div>
        {!metrics.length ? <div className="px-5 pb-5"><Empty title="Sem dados no período" desc="Sincronize a Meta Ads para popular o histórico." /></div> : (
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-muted uppercase"><th className="px-4 py-3">Dia</th><th>Gasto</th><th>Leads</th><th>CPL</th><th>Cliques</th><th>Impressões</th><th>Fonte</th></tr></thead>
              <tbody>
                {[...metrics].reverse().map(r => (
                  <tr key={r.id} className="border-b border-border hover:bg-blue-50/50">
                    <td className="px-4 py-3 font-semibold">{dateBR(r.date)}</td>
                    <td>{brl(r.spend)}</td><td>{num(r.leads)}</td><td>{brl(r.leads ? Number(r.spend) / Number(r.leads) : null)}</td><td>{num(r.clicks)}</td><td>{num(r.impressions)}</td><td><Badge tone="info">Meta API</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card3D>

      <Card3D>
        <p className="text-sm font-bold text-slate-900 mb-3">Ações da operação</p>
        {actions === null ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Tabela de ações ainda não criada. Rode a migração <code>002_acoes_funnel.sql</code> no Lovable Cloud → SQL Editor.</div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
              <Input label="Ação" value={actionText} onChange={(e: any) => setActionText(e.target.value)} placeholder="Ex.: testar novo criativo" />
              <Input label="Responsável" value={resp} onChange={(e: any) => setResp(e.target.value)} placeholder="Nome" />
              <Input label="Prazo" type="date" value={deadline} onChange={(e: any) => setDeadline(e.target.value)} />
              <div className="flex items-end"><Primary onClick={saveAction}>Registrar ação</Primary></div>
            </div>
            <div className="mt-3 divide-y divide-border">
              {!actions.length ? <p className="py-3 text-sm text-muted">Nenhuma ação registrada.</p> : actions.map((a: any) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div><p className="font-medium">{a.action}</p><p className="text-xs text-muted">{a.responsible ? `Responsável: ${a.responsible} • ` : ''}{a.deadline ? `Prazo: ${dateBR(a.deadline)} • ` : ''}Status: {a.status}</p></div>
                  <select value={a.status} onChange={e => changeStatus(a, e.target.value)} className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs"><option value="pendente">Pendente</option><option value="em_andamento">Em andamento</option><option value="concluida">Concluída</option><option value="pausada">Pausada</option></select>
                </div>
              ))}
            </div>
          </>
        )}
      </Card3D>

      <Card3D>
        <p className="mb-2 text-sm font-bold text-slate-900">Resumo da operação — histórico</p>
        <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-white p-3.5 text-sm shadow-sm outline-none focus:border-blue-500" placeholder="Nova atualização..." />
        <Primary className="mt-3" onClick={saveSummary}>Publicar atualização</Primary>
        <div className="mt-4 space-y-3">
          {summaries.length === 0 ? <p className="text-sm text-muted">Nenhum registro ainda.</p> : summaries.map((s: any) => (
            <div key={s.id} className="rounded-xl border border-border bg-gradient-to-br from-white to-slate-50 p-3 text-sm shadow-sm"><p className="whitespace-pre-wrap">{s.content}</p><p className="mt-1 text-xs text-muted">{dateTimeBR(s.created_at)}</p></div>
          ))}
        </div>
      </Card3D>
    </div>
  );
}
