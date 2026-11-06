export const brl = (v: number | null | undefined) =>
  v == null || Number.isNaN(v) ? '—' : (v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const num = (v: number | null | undefined) =>
  v == null || Number.isNaN(v) ? '—' : v.toLocaleString('pt-BR');

export const dateBR = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};

export const dateTimeBR = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const pct = (v: number | null | undefined) =>
  v == null || Number.isNaN(v) ? '—' : (v > 0 ? '+' : '') + v.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + '%';

export const periodLabel = (from: string, to: string) => `${dateBR(from)} até ${dateBR(to)}`;
