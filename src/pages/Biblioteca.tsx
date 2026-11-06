import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Empty, ErrorBox, Loading, Badge, Btn, Primary, Input } from '@/components/UI';
import { brl, num } from '@/lib/format';

export default function Biblioteca() {
  const [clients, setClients] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState(''); const [niche, setNiche] = useState(''); const [clientId, setClientId] = useState(''); const [driveUrl, setDriveUrl] = useState(''); const [notes, setNotes] = useState('');

  async function load() {
    setLoading(true);
    const [c, it, a] = await Promise.all([
      supabase.from('clients').select('id,nome_negocio').order('nome_negocio'),
      supabase.from('creatives_library').select('*').order('created_at', { ascending: false }),
      supabase.from('ads').select('*,clients(nome_negocio)').order('spend', { ascending: false }).limit(200),
    ]);
    if (c.error) setErr(c.error.message);
    else { setClients(c.data ?? []); setItems(it.error ? [] : it.data ?? []); setAds(a.data ?? []); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = items.filter(x => x.title.toLowerCase().includes(q.toLowerCase()) || (x.niche ?? '').toLowerCase().includes(q.toLowerCase()));

  async function create() {
    if (!title.trim() || !clientId) { alert('Título e cliente obrigatórios.'); return; }
    const { error } = await supabase.from('creatives_library').insert({ client_id: clientId, title: title.trim(), niche: niche.trim() || null, drive_url: driveUrl.trim() || null, notes: notes.trim() || null });
    if (error) alert(error.message); else { setTitle(''); setNiche(''); setClientId(''); setDriveUrl(''); setNotes(''); load(); }
  }
  async function remove(id: string) { if (!confirm('Remover da biblioteca?')) return; await supabase.from('creatives_library').delete().eq('id', id); load(); }

  if (loading) return <Loading />;
  if (err) return <ErrorBox msg={err} onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs tracking-[0.14em] uppercase text-muted">Repertório para sua operação</p><h1 className="text-xl font-bold text-slate-900">Biblioteca de criativos</h1><p className="text-sm text-muted">Seus envios e materiais da equipe. Arquivos de outros clientes nunca aparecem aqui.</p></div>
        <Primary onClick={create} disabled={!title.trim() || !clientId}>Analisar criativo</Primary>
      </div>

      <Card>
        <p className="mb-3 text-sm font-bold">Novo criativo</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Título *" value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="Ex.: Criativo WhatsApp 01" />
          <Input label="Nicho" value={niche} onChange={(e: any) => setNiche(e.target.value)} />
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Cliente</span><select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"><option value="">Selecione...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nome_negocio}</option>)}</select></label>
          <Input label="Link (Drive / URL do arquivo)" value={driveUrl} onChange={(e: any) => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/..." />
        </div>
        <div className="mt-3"><Input label="Notas" value={notes} onChange={(e: any) => setNotes(e.target.value)} /></div>
      </Card>

      <div className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por título ou nicho" className="flex-1 rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm" />
        <Btn>Buscar</Btn>
      </div>

      {!filtered.length ? (
        <Card><div className="py-10 text-center"><p className="font-semibold">A biblioteca ainda está vazia.</p><p className="text-sm text-muted">Seus envios aparecerão automaticamente. A equipe também pode disponibilizar criativos para todos os clientes.</p></div></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(x => (
            <Card key={x.id} className="p-4">
              <div className="flex items-start justify-between gap-2"><div><p className="font-bold">{x.title}</p><p className="text-xs text-muted">{x.niche ?? '—'} • {x.drive_url ? <a href={x.drive_url} target="_blank" className="text-blue-600 hover:underline">Abrir arquivo ↗</a> : 'sem arquivo'}</p>{x.notes && <p className="mt-1 text-xs">{x.notes}</p>}</div><Btn onClick={() => remove(x.id)} className="px-2 py-1 text-xs">Remover</Btn></div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4"><p className="text-sm font-bold">Análise por criativo (Meta Ads)</p><p className="text-xs text-muted">Desempenho real dos anúncios sincronizados — sem dados fictícios.</p></div>
        {!ads.length ? <div className="px-5 pb-5"><Empty title="Sem anúncios sincronizados" desc="Sincronize uma campanha para ver a análise." /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-xs uppercase text-muted"><th className="px-5 py-3">Anúncio</th><th>Cliente</th><th>Investimento</th><th>Leads</th><th>CPL</th><th>Cliques</th></tr></thead><tbody>
            {ads.map(a => <tr key={a.id} className="border-t border-border hover:bg-blue-50/50"><td className="px-5 py-3 font-medium">{a.name}</td><td>{a.clients?.nome_negocio ?? '—'}</td><td>{brl(a.spend)}</td><td>{num(a.leads)}</td><td className="font-medium">{brl(a.cpl)}</td><td>{num(a.clicks)}</td></tr>)}
          </tbody></table></div>
        )}
      </Card>
    </div>
  );
}
