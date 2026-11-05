import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getEdgeUrl } from '@/lib/supabase';
import { Card, Empty, ErrorBox, Loading, Badge, Btn, Primary, Input } from '@/components/UI';
import { brl, num, dateBR, dateTimeBR, pct, periodLabel } from '@/lib/format';
import { periodRange, type PeriodKey } from '@/types/database';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis, Cell, LabelList } from 'recharts';
import { DollarSign, UserPlus, Coins, Target, CalendarDays, Download, Users } from 'lucide-react';
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
  const [adSets, setAdSets] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [salesRows, setSalesRows] = useState<any[] | null>(null);
  const [qualityRows, setQualityRows] = useState<any[] | null>(null);
  const [snaps, setSnaps] = useState<any[] | null>(null);
  const [snapPlatform, setSnapPlatform] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [snapDate, setSnapDate] = useState('');
  const [snapMembers, setSnapMembers] = useState('');
  const [snapEntries, setSnapEntries] = useState('');
  const [snapExits, setSnapExits] = useState('');
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
    const [cRes, mRes, pmRes, campRes, setRes, adsRes, sumRes, actRes, saleRes, qualRes, snapRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('performance_metrics').select('*').eq('client_id', id).gte('date', range.from).lte('date', range.to).order('date'),
      supabase.from('performance_metrics').select('*').eq('client_id', id).gte('date', prev.from).lte('date', prev.to).order('date'),
      supabase.from('campaigns').select('*').eq('client_id', id).order('name'),
      supabase.from('ad_sets').select('*').eq('client_id', id).order('name'),
      supabase.from('ads').select('*').eq('client_id', id).order('name'),
      supabase.from('operation_summaries').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('operation_actions').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('sales_results').select('*').eq('client_id', id).gte('date', range.from).lte('date', range.to).order('date'),
      supabase.from('lead_quality').select('*').eq('client_id', id).gte('date', range.from).lte('date', range.to).order('date'),
      supabase.from('group_snapshots').select('*').eq('client_id', id).gte('snapshot_date', range.from).lte('snapshot_date', range.to).order('snapshot_date', { ascending: false }),
    ]);
    if (cRes.error || mRes.error) { setErr((cRes.error || mRes.error)?.message ?? 'Erro ao carregar'); setLoading(false); return; }
    setClient(cRes.data);
    setMetrics(mRes.data ?? []);
    setPrevMetrics(pmRes.data ?? []);
    setCampaigns(campRes.data ?? []);
    setAdSets(setRes.data ?? []);
    setAds(adsRes.data ?? []);
    setSummaries(sumRes.data ?? []);
    setSummary(sumRes.data?.[0]?.content ?? cRes.data?.resumo_operacao ?? '');
    const lastUpd = [...(mRes.data ?? []), ...(campRes.data ?? [])].map((r: any) => r.updated_at).filter(Boolean).sort().pop();
    setSyncAt(lastUpd ?? null);
    if (actRes.error) setActions(null as any); else setActions(actRes.data ?? []);
    if (saleRes.error) setSalesRows(null); else setSalesRows(saleRes.data ?? []);
    if (qualRes.error) setQualityRows(null); else setQualityRows(qualRes.data ?? []);
    if (snapRes.error) setSnaps(null); else setSnaps(snapRes.data ?? []);
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

  const snapEntriesTotal = snaps ? snaps.reduce((a, s) => a + Number(s.entries ?? 0), 0) : 0;
  const snapExitsTotal = snaps ? snaps.reduce((a, s) => a + Number(s.exits ?? 0), 0) : 0;
  const snapLatest = snaps && snaps.length ? [...snaps].sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime())[0] : null;
  const cprReal = snaps && snapEntriesTotal > 0 ? cur.invest / snapEntriesTotal : null;
  const netEntries = snaps ? snapEntriesTotal - snapExitsTotal : null;

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
  async function saveSnap() {
    if (!id || !snapDate || !snapMembers) { alert('Informe data e total atual.'); return; }
    const { error } = await supabase.from('group_snapshots').upsert({ client_id: id, platform: snapPlatform, snapshot_date: snapDate, member_count: Number(snapMembers), entries: Number(snapEntries || 0), exits: Number(snapExits || 0), updated_at: new Date().toISOString() }, { onConflict: 'client_id,platform,snapshot_date' });
    if (error) alert(error.message); else { setSnapMembers(''); setSnapEntries(''); setSnapExits(''); load(); }
  }
  async function removeSnap(s: any) { if (!confirm('Remover registro?')) return; await supabase.from('group_snapshots').delete().eq('id', s.id); load(); }
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
      </Card3D>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card3D><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"><DollarSign size={18} /></div><div><p className="text-xs text-muted">Investimento total</p><p className="text-[22px] font-extrabold text-slate-900">{brl(cur.invest)}</p></div></div></Card3D>
        <Card3D><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30"><UserPlus size={18} /></div><div><p className="text-xs text-muted">Leads gerados</p><p className="text-[22px] font-extrabold text-slate-900">{num(cur.leads)}</p></div></div></Card3D>
        <Card3D><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"><Coins size={18} /></div><div><p className="text-xs text-muted">CPL</p><p className="text-[22px] font-extrabold text-slate-900">{brl(cur.cpl)}</p></div></div><div className="mt-2">{onMeta}</div></Card3D>
        <Card3D><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30"><Target size={18} /></div><div><p className="text-xs text-muted">Meta de CPL</p><p className="text-[22px] font-extrabold text-slate-900">{brl(meta)}</p></div></div></Card3D>
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

      <Card3D>
        <p className="text-sm font-bold text-slate-900">Funil: do clique à conversão</p>
        <p className="text-xs text-muted">Dados reais da Meta. Alcance não é visita à página — por isso não calculamos % a partir dele.</p>
        {(() => {
          const ctr = cur.impr ? (cur.clicks / cur.impr) * 100 : null;
          const leadRate = cur.clicks ? (cur.leads / cur.clicks) * 100 : null;
          const max = Math.max(cur.impr, cur.reach, cur.clicks, cur.leads, 1);
          const steps = [
            { label: 'Impressões', value: cur.impr, grad: 'from-slate-400 to-slate-500', note: 'base' },
            { label: 'Alcance', value: cur.reach, grad: 'from-sky-500 to-blue-500', note: 'pessoas únicas' },
            { label: 'Cliques', value: cur.clicks, grad: 'from-blue-500 to-blue-600', note: ctr != null ? `CTR ${ctr.toFixed(1).replace('.', ',')}%` : '—' },
            { label: 'Leads (Meta)', value: cur.leads, grad: 'from-blue-600 to-violet-600', note: leadRate != null ? `Clique → Lead ${leadRate.toFixed(1).replace('.', ',')}%` : '—' },
            { label: 'CPL', value: cur.cpl as any, grad: 'from-amber-500 to-orange-500', note: `Meta ${brl(meta)}`, isMoney: true },
            { label: 'Valor investido', value: cur.invest as any, grad: 'from-emerald-500 to-emerald-600', note: 'gasto no período', isMoney: true },
          ];
          return (
            <div className="mt-4 space-y-3">
              {steps.map((s, i) => {
                const isPending = s.value == null;
                const raw = s.value == null ? 0 : s.value;
                const w = isPending ? 100 : Math.max(22, Math.sqrt(raw / max) * 100);
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="w-32 shrink-0 text-right">
                      <p className="text-xs font-semibold text-slate-700">{s.label}</p>
                      <p className="text-xs text-muted">{s.note}</p>
                    </div>
                    <div className="flex-1">
                      <div className={isPending ? 'flex h-10 items-center rounded-xl border border-dashed border-slate-300 bg-slate-100 px-4' : 'flex h-10 items-center rounded-xl bg-gradient-to-r px-4 shadow-md'} style={{ width: w + '%', background: isPending ? undefined : [
                        'linear-gradient(90deg,#38BDF8,#0284C7)',
                        'linear-gradient(90deg,#0EA5E9,#0369A1)',
                        'linear-gradient(90deg,#0284C7,#1D4ED8)',
                        'linear-gradient(90deg,#1D4ED8,#7C3AED)',
                        'linear-gradient(90deg,#F59E0B,#F97316)',
                        'linear-gradient(90deg,#10B981,#059669)',
                      ][Math.min(i, 5)] }}>
                        <span className={isPending ? 'text-xs text-slate-500' : 'text-sm font-bold text-white'}>{isPending ? '—' : (s as any).isMoney ? brl(s.value) : num(s.value)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <p className="mt-3 text-xs text-muted">Conversas iniciadas e entradas no grupo não são estimadas sem webhook/registro manual.</p>
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
          <div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold text-slate-900">Crescimento de leads</p><span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"><span className="h-2 w-2 rounded-full bg-blue-600" />Novos leads</span></div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="60%" stopColor="#60A5FA" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tipStyle} cursor={{ stroke: '#2563EB', strokeOpacity: 0.15 }} />
                <Area type="monotone" dataKey="Leads" stroke="#2563EB" strokeWidth={3} fill="url(#gradArea)" dot={{ r: 5, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card3D>
        <Card3D>
          <p className="mb-2 text-sm font-bold text-slate-900">Evolução do CPL</p>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="gradCpl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tipStyle} cursor={{ stroke: '#F59E0B', strokeOpacity: 0.15 }} />
                <Line type="monotone" dataKey="CPL" stroke="#F59E0B" strokeWidth={3} dot={{ r: 5, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card3D>
      </div>

      <Card3D className="p-0 overflow-hidden">
        <div className="px-5 py-4"><p className="text-sm font-bold text-slate-900">Campanhas</p></div>
        {!campaigns.length ? <div className="px-5 pb-5"><p className="text-sm text-muted">Nenhuma campanha sincronizada.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-border bg-slate-50 text-left text-xs font-semibold tracking-wide text-muted uppercase"><th className="px-5 py-3">Nome</th><th>Status</th><th>Investimento</th><th>Leads</th><th>CPL</th><th>Impressões</th><th>Alcance</th><th>Cliques</th></tr></thead><tbody>
            {campaigns.map(c => <tr key={c.id} className="border-b border-border hover:bg-blue-50/50"><td className="px-5 py-3 font-medium text-slate-900">{c.name}</td><td>{c.status ?? '—'}</td><td>{brl(c.spend)}</td><td>{num(c.leads)}</td><td className="font-medium">{brl(c.cpl)}</td><td>{num(c.impressions)}</td><td>{num(c.reach)}</td><td>{num(c.clicks)}</td></tr>)}
          </tbody></table></div>
        )}
      </Card3D>

      <Card3D className="p-0 overflow-hidden">
        <div className="px-5 py-4"><p className="text-sm font-bold text-slate-900">Conjuntos de anúncios vinculados</p><p className="text-xs text-muted">Dados reais de <code>ad_sets</code>. Sem dados = mensagens vazia, sem mock.</p></div>
        {!adSets.length ? <div className="px-5 pb-5"><p className="text-sm text-muted">Nenhum conjunto vinculado ainda. Após a sincronização com a Meta, os conjuntos aparecem aqui.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-border bg-slate-50 text-left text-xs font-semibold tracking-wide text-muted uppercase"><th className="px-5 py-3">Nome</th><th>Status</th><th>Investimento</th><th>Leads</th><th>CPL</th><th>Campanha</th></tr></thead><tbody>
            {adSets.map(s => <tr key={s.id} className="border-b border-border hover:bg-blue-50/50"><td className="px-5 py-3 font-medium text-slate-900">{s.name}</td><td>{s.status ?? '—'}</td><td>{brl(s.spend)}</td><td>{num(s.leads)}</td><td className="font-medium">{brl(s.cpl)}</td><td className="text-xs text-muted">{s.campaign_external_id ?? '—'}</td></tr>)}
          </tbody></table></div>
        )}
      </Card3D>

      <Card3D className="p-0 overflow-hidden">
        <div className="px-5 py-4"><p className="text-sm font-bold text-slate-900">Anúncios vinculados</p><p className="text-xs text-muted">Dados reais de <code>ads</code>. Sem dados = mensagens vazia, sem mock.</p></div>
        {!ads.length ? <div className="px-5 pb-5"><p className="text-sm text-muted">Nenhum anúncio vinculado ainda.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y border-border bg-slate-50 text-left text-xs font-semibold tracking-wide text-muted uppercase"><th className="px-5 py-3">Anúncio</th><th>Criativo</th><th>Investimento</th><th>Leads</th><th>CPL</th><th>Impressões</th><th>Cliques</th></tr></thead><tbody>
            {ads.map(a => <tr key={a.id} className="border-b border-border hover:bg-blue-50/50"><td className="px-5 py-3 font-medium text-slate-900">{a.name}</td><td>{a.creative_id ?? '—'}</td><td>{brl(a.spend)}</td><td>{num(a.leads)}</td><td className="font-medium">{brl(a.cpl)}</td><td>{num(a.impressions)}</td><td>{num(a.clicks)}</td></tr>)}
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
              <thead><tr className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-muted uppercase"><th className="px-4 py-3">Dia</th><th>Impressões</th><th>Alcance</th><th>Cliques</th><th>Leads</th><th>CPL</th><th>Investido</th><th>Fonte</th></tr></thead>
              <tbody>
                {[...metrics].reverse().map(r => (
                  <tr key={r.id} className="border-b border-border hover:bg-blue-50/50">
                    <td className="px-4 py-3 font-semibold">{dateBR(r.date)}</td>
                    <td>{num(r.impressions)}</td><td>{num(r.reach)}</td><td>{num(r.clicks)}</td><td>{num(r.leads)}</td><td>{brl(r.leads ? Number(r.spend) / Number(r.leads) : null)}</td><td>{brl(r.spend)}</td><td><Badge tone="info">Meta API</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card3D>

      <Card3D>
        <p className="text-sm font-bold text-slate-900">Grupos WhatsApp / Telegram — acompanhamento real</p>
        <p className="text-xs text-muted">Registre 1x/dia o total atual, entradas e saídas observadas. CPR real = gasto / entradas reais. Participantes são contagens observadas, não conversões atribuídas.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Entradas no período</p><p className="font-bold">{snaps == null ? '— Tabela pendente' : num(snapEntriesTotal)}</p></div>
          <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Saídas</p><p className="font-bold">{snaps == null ? '—' : num(snapExitsTotal)}</p></div>
          <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">Saldo líquido</p><p className="font-bold">{snaps == null ? '—' : num(netEntries)}</p></div>
          <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted">CPR real</p><p className="font-bold">{cprReal != null ? brl(cprReal) : snaps == null ? 'Rode migração 003' : 'sem entradas'}</p></div>
        </div>
        {snaps == null ? (
          <div className="mt-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted">Rode a migração <code>003_grupos.sql</code> para ativar o acompanhamento de grupos.</div>
        ) : (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-5">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Plataforma</span><select value={snapPlatform} onChange={e => setSnapPlatform(e.target.value as any)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></label>
              <Input label="Data" type="date" value={snapDate} onChange={(e: any) => setSnapDate(e.target.value)} />
              <Input label="Total atual" type="number" value={snapMembers} onChange={(e: any) => setSnapMembers(e.target.value)} />
              <Input label="Entradas" type="number" value={snapEntries} onChange={(e: any) => setSnapEntries(e.target.value)} />
              <Input label="Saídas" type="number" value={snapExits} onChange={(e: any) => setSnapExits(e.target.value)} />
            </div>
            <Primary className="mt-3" onClick={saveSnap}>Registrar snapshot</Primary>
            {snaps.length ? (
              <div className="mt-3 divide-y divide-border">
                {snaps.map((s: any) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>{dateBR(s.snapshot_date)} • {s.platform} • membros {num(s.member_count)} • +{num(s.entries)} / -{num(s.exits)}</span>
                    <Btn onClick={() => removeSnap(s)} className="px-2 py-1 text-xs">Remover</Btn>
                  </div>
                ))}
              </div>
            ) : <p className="mt-3 text-sm text-muted">Nenhum snapshot no período.</p>}
          </>
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

    </div>
  );
}
