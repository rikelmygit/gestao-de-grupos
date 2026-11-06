import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Card, Empty, ErrorBox, Loading, Badge } from '@/components/UI';
import { brl, num } from '@/lib/format';
import { periodRange, type Client, type PeriodKey } from '@/types/database';
import { Users, DollarSign, Coins, UserPlus, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react';

export default function GestorDashboard() {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const range = periodRange(period);

  async function load() {
    setLoading(true); setErr(null);
    const [{ data: c, error: e1 }, { data: m, error: e2 }] = await Promise.all([
      supabase.from('clients').select('*').order('nome_negocio'),
      supabase.from('performance_metrics').select('*').gte('date', range.from).lte('date', range.to),
    ]);
    if (e1 || e2) { setErr((e1 || e2)?.message ?? 'Erro'); setLoading(false); return; }
    setClients((c ?? []) as Client[]); setMetrics(m ?? []); setLoading(false);
  }
  useEffect(() => { load(); }, [period]);

  const byClient = new Map<string, { invest: number; leads: number }>();
  metrics.forEach((r: any) => { const cur = byClient.get(r.client_id) ?? { invest: 0, leads: 0 }; cur.invest += Number(r.spend ?? 0); cur.leads += Number(r.leads ?? 0); byClient.set(r.client_id, cur); });
  const active = clients.filter(c => c.status === 'ativo');
  const totalInvest = Array.from(byClient.values()).reduce((a, b) => a + b.invest, 0);
  const totalLeads = Array.from(byClient.values()).reduce((a, b) => a + b.leads, 0);
  const avgCpl = totalLeads > 0 ? totalInvest / totalLeads : null;
  const dailyBudget = active.reduce((a, c) => a + Number(c.orcamento_diario ?? 0), 0);
  const inside = clients.filter(c => { const v = byClient.get(c.id); if (!v || v.leads === 0 || c.meta_cpl == null) return false; return v.invest / v.leads <= Number(c.meta_cpl); }).length;
  const above = clients.filter(c => { const v = byClient.get(c.id); if (!v || v.leads === 0 || c.meta_cpl == null) return false; return v.invest / v.leads > Number(c.meta_cpl); }).length;

  const cards = [
    { k: 'Clientes ativos', v: num(active.length), icon: Users, tone: 'from-blue-500 to-blue-600 text-white shadow-blue-500/30' },
    { k: 'Investimento total', v: brl(totalInvest), icon: DollarSign, tone: 'from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30' },
    { k: 'Leads gerados', v: num(totalLeads), icon: UserPlus, tone: 'from-violet-500 to-purple-600 text-white shadow-violet-500/30' },
    { k: 'CPL médio', v: brl(avgCpl), icon: Coins, tone: 'from-amber-500 to-orange-500 text-white shadow-amber-500/30' },
    { k: 'Orçamento diário', v: brl(dailyBudget), icon: CalendarDays, tone: 'from-sky-500 to-cyan-500 text-white shadow-sky-500/30' },
    { k: 'Dentro da meta', v: num(inside), icon: CheckCircle2, tone: 'from-emerald-500 to-teal-500 text-white shadow-emerald-500/30' },
    { k: 'Acima da meta', v: num(above), icon: AlertCircle, tone: 'from-rose-500 to-red-500 text-white shadow-rose-500/30' },
  ];

  if (loading) return <Loading />;
  if (err) return <ErrorBox msg={err} onRetry={load} />;
  if (!clients.length) return <Empty title="Nenhum cliente cadastrado" desc="Cadastre o primeiro cliente em Clientes para ver os indicadores." />;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[22px] border border-white/60 bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 p-[1px] shadow-[0_20px_50px_-20px_rgba(37,99,235,0.45)]">
        <div className="rounded-[21px] bg-white/95 p-5 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h1 className="bg-gradient-to-r from-blue-700 to-violet-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">Visão Geral do Gestor</h1><p className="text-sm text-muted">Todos os indicadores são calculados de dados reais do período selecionado.</p></div>
            <select value={period} onChange={e => setPeriod(e.target.value as PeriodKey)} className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium shadow-sm"><option value="hoje">Hoje</option><option value="ontem">Ontem</option><option value="7d">Últimos 7 dias</option><option value="15d">Últimos 15 dias</option><option value="30d">Últimos 30 dias</option><option value="mes">Este mês</option></select>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Card key={c.k} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg ${c.tone}`}><c.icon size={18} /></div>
              <div><p className="text-xs font-medium text-muted">{c.k}</p><p className="text-lg font-extrabold tracking-tight text-slate-900">{c.v}</p></div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4"><div><p className="text-sm font-bold text-slate-900">Operações</p><p className="text-xs text-muted">{clients.length} clientes • atualizado agora</p></div><Badge tone="info">{period === '30d' ? '30 dias' : period}</Badge></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-y border-border bg-slate-50 text-left text-xs font-semibold tracking-wide text-muted uppercase"><th className="px-5 py-3">Cliente</th><th>Status</th><th>Investimento</th><th>Leads</th><th>CPL</th><th>Meta CPL</th><th>Situação</th><th></th></tr></thead>
            <tbody>
              {clients.map(c => {
                const v = byClient.get(c.id);
                const cpl = v && v.leads > 0 ? v.invest / v.leads : null;
                const situacao = !c.ad_account_id ? <Badge tone="info">Integração pendente</Badge> : cpl == null || c.meta_cpl == null ? <Badge tone="muted">Sem dados suficientes</Badge> : cpl <= Number(c.meta_cpl) ? <Badge tone="ok">Dentro da meta</Badge> : <Badge tone="bad">Acima da meta</Badge>;
                return <tr key={c.id} className="border-b border-border hover:bg-blue-50/40"><td className="px-5 py-3 font-semibold text-slate-900">{c.nome_negocio}</td><td><span className="text-xs font-medium text-slate-600">{c.status}</span></td><td className="font-medium">{v ? brl(v.invest) : '—'}</td><td>{v ? num(v.leads) : '—'}</td><td className="font-medium">{brl(cpl)}</td><td>{brl(c.meta_cpl)}</td><td>{situacao}</td><td><Link className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700" to={`/gestor/clientes/${c.id}`}>Abrir</Link></td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
