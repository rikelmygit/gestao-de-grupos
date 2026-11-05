import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Empty, Loading, ErrorBox } from '@/components/UI';
import { brl, num } from '@/lib/format';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, Legend } from 'recharts';

export default function Relatorios() {
  const [clients, setClients] = useState<any[]>([]); const [metrics, setMetrics] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: c }, { data: m, error }] = await Promise.all([
      supabase.from('clients').select('*').order('nome_negocio'),
      supabase.from('performance_metrics').select('*').order('date'),
    ]);
    if (error) setErr(error.message); else { setClients(c ?? []); setMetrics(m ?? []); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const byDate = new Map<string, { invest: number; leads: number }>();
  metrics.forEach(r => { const k = r.date; const cur = byDate.get(k) ?? { invest: 0, leads: 0 }; cur.invest += Number(r.spend ?? 0); cur.leads += Number(r.leads ?? 0); byDate.set(k, cur); });
  const data = Array.from(byDate.entries()).map(([date, v]) => ({ date: date.slice(5), Investimento: v.invest, Leads: v.leads, CPL: v.leads ? v.invest / v.leads : 0 }));

  if (loading) return <Loading />;
  if (err) return <ErrorBox msg={err} onRetry={load} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Relatórios</h1>
      {!clients.length ? <Empty title="Sem clientes" desc="Cadastre clientes primeiro." /> : !metrics.length ? <Empty title="Sem histórico" desc="Sincronize a Meta Ads para popular o histórico. Não exibimos números fictícios." /> : (
        <>
          <Card><p className="mb-2 text-sm font-medium">Investimento por período</p><div className="h-64"><ResponsiveContainer><LineChart data={data}><CartesianGrid stroke="#26262B" /><XAxis dataKey="date" tick={{ fill: '#8A8A93', fontSize: 11 }} /><YAxis tick={{ fill: '#8A8A93', fontSize: 11 }} /><Tooltip /><Legend /><Line dataKey="Investimento" stroke="#22C55E" dot={false} /></LineChart></ResponsiveContainer></div></Card>
          <Card><p className="mb-2 text-sm font-medium">Leads por período</p><div className="h-64"><ResponsiveContainer><LineChart data={data}><CartesianGrid stroke="#26262B" /><XAxis dataKey="date" tick={{ fill: '#8A8A93', fontSize: 11 }} /><YAxis tick={{ fill: '#8A8A93', fontSize: 11 }} /><Tooltip /><Legend /><Line dataKey="Leads" stroke="#38BDF8" dot={false} /></LineChart></ResponsiveContainer></div></Card>
          <Card><p className="mb-2 text-sm font-medium">CPL por período</p><div className="h-64"><ResponsiveContainer><LineChart data={data}><CartesianGrid stroke="#26262B" /><XAxis dataKey="date" tick={{ fill: '#8A8A93', fontSize: 11 }} /><YAxis tick={{ fill: '#8A8A93', fontSize: 11 }} /><Tooltip /><Legend /><Line dataKey="CPL" stroke="#F59E0B" dot={false} /></LineChart></ResponsiveContainer></div></Card>
          <Card><p className="mb-2 text-sm font-medium">Desempenho por cliente</p><div className="grid gap-2">{clients.map(c => { const rows = metrics.filter(r => r.client_id === c.id); const inv = rows.reduce((a, r) => a + Number(r.spend ?? 0), 0); const leads = rows.reduce((a, r) => a + Number(r.leads ?? 0), 0); return <div key={c.id} className="flex justify-between border-t border-border py-2 text-sm"><span>{c.nome_negocio}</span><span>{brl(inv)} • {num(leads)} leads • CPL {leads ? brl(inv / leads) : '—'} {c.meta_cpl ? `(meta ${brl(c.meta_cpl)})` : ''}</span></div>; })}</div></Card>
        </>
      )}
    </div>
  );
}
