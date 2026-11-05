export const brl = (v: number | null | undefined) =>
  v == null || Number.isNaN(v) ? '—' : (v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const num = (v: number | null | undefined) =>
  v == null || Number.isNaN(v) ? '—' : v.toLocaleString('pt-BR');

export const dateBR = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};

export const periodLabel = (from: string, to: string) => `${dateBR(from)} até ${dateBR(to)}`;
