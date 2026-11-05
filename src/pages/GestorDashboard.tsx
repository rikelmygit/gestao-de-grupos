import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Card, Empty, ErrorBox, Loading, Badge } from '@/components/UI';
import { brl, num } from '@/lib/format';
import { periodRange, type Client, type PeriodKey } from '@/types/database';

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
    if (e1) { setErr(e1.message); setLoading(false); return; }
    if (e2) { setErr(e2.message); setLoading(false); return; }
    setClients(c ?? []); setMetrics(m ?? []); setLoading(false);
  }
  useEffect(() => { load(); }, [period]);

  const byClient = new Map<string, { invest: number; leads: number }>();
  metrics.forEach((r: any) => {
    const cur = byClient.get(r.client_id) ?? { invest: 0, leads: 0 };
    cur.invest += Number(r.spend ?? 0); cur.leads += Number(r.leads ?? 0);
    byClient.set(r.client_id, cur);
  });

  const active = clients.filter(c => c.status === 'ativo');
  const totalInvest = Array.from(byClient.values()).reduce((a, b) => a + b.invest, 0);
  const totalLeads = Array.from(byClient.values()).reduce((a, b) => a + b.leads, 0);
  const avgCpl = totalLeads > 0 ? totalInvest / totalLeads : null;
  const dailyBudget = active.reduce((a, c) => a + Number(c.orcamento_diario ?? 0), 0);
  const inside = clients.filter(c => { const v = byClient.get(c.id); if (!v || v.leads === 0 || c.meta_cpl == null) return false; return v.invest / v.leads <= Number(c.meta_cpl); }).length;
  const above = clients.filter(c => { const v = byClient.get(c.id); if (!v || v.leads === 0 || c.meta_cpl == null) return false; return v.invest / v.leads > Number(c.meta_cpl); }).length;

  const cards = [
    { k: 'Clientes ativos', v: num(active.length) },
    { k: 'Investimento total', v: brl(totalInvest) },
    { k: 'Leads gerados', v: num(totalLeads) },
    { k: 'CPL médio', v: brl(avgCpl) },
    { k: 'Orçamento diário total', v: brl(dailyBudget) },
    { k: 'Dentro da meta', v: num(inside) },
    { k: 'Acima da meta', v: num(above) },
  ];

  if (loading) return <Loading />;
  if (err) return <ErrorBox msg={err} onRetry={load} />;
  if (!clients.length) return <Empty title="Nenhum cliente cadastrado" desc="Cadastre o primeiro cliente em Clientes para ver os indicadores." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Visão Geral do Gestor</h1>
        <select value={period} onChange={e => setPeriod(e.target.value as PeriodKey)} className="rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm">
          <option value="hoje">Hoje</option><option value="ontem">Ontem</option><option value="7d">Últimos 7 dias</option><option value="15d">Últimos 15 dias</option><option value="30d">Últimos 30 dias</option><option value="mes">Este mês</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {cards.map(c => <Card key={c.k}><p className="text-xs text-muted">{c.k}</p><p className="mt-1 text-lg font-semibold">{c.v}</p></Card>)}
      </div>

      <Card>
        <p className="mb-3 text-sm font-medium">Operações ({clients.length})</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted"><th className="py-2">Cliente</th><th>Status</th><th>Investimento</th><th>Leads</th><th>CPL</th><th>Meta CPL</th><th>Situação</th><th></th></tr></thead>
            <tbody>
              {clients.map(c => {
                const v = byClient.get(c.id);
                const cpl = v && v.leads > 0 ? v.invest / v.leads : null;
                const situacao = !c.ad_account_id ? <Badge tone="info">Integração pendente</Badge> : cpl == null || c.meta_cpl == null ? <Badge tone="muted">Sem dados suficientes</Badge> : cpl <= Number(c.meta_cpl) ? <Badge tone="ok">Dentro da meta</Badge> : <Badge tone="bad">Acima da meta</Badge>;
                return <tr key={c.id} className="border-t border-border"><td className="py-2 font-medium">{c.nome_negocio}</td><td>{c.status}</td><td>{v ? brl(v.invest) : '—'}</td><td>{v ? num(v.leads) : '—'}</td><td>{brl(cpl)}</td><td>{brl(c.meta_cpl)}</td><td>{situacao}</td><td><Link className="text-emerald-400 hover:underline" to={`/gestor/clientes/${c.id}`}>Abrir</Link></td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
