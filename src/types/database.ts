export type ClientStatus = 'ativo' | 'pausado' | 'desativado' | 'pendente';
export type Client = {
  id: string;
  nome_negocio: string;
  nome_responsavel: string | null;
  telefone: string | null;
  email: string | null;
  nicho: string | null;
  status: ClientStatus;
  orcamento_diario: number | null;
  meta_cpl: number | null;
  ad_account_id: string | null;
  resumo_operacao: string | null;
  created_at: string;
  updated_at: string;
};
export type PeriodKey = 'hoje' | 'ontem' | '7d' | '15d' | '30d' | 'mes' | 'custom';
export function periodRange(k: PeriodKey, custom?: { from: string; to: string }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = (offset: number) => { const x = new Date(today); x.setDate(x.getDate() + offset); return x.toISOString().slice(0, 10); };
  switch (k) {
    case 'hoje': return { from: d(0), to: d(0) };
    case 'ontem': return { from: d(-1), to: d(-1) };
    case '7d': return { from: d(-6), to: d(0) };
    case '15d': return { from: d(-14), to: d(0) };
    case '30d': return { from: d(-29), to: d(0) };
    case 'mes': { const f = new Date(today.getFullYear(), today.getMonth(), 1); return { from: f.toISOString().slice(0, 10), to: d(0) }; }
    default: return { from: custom?.from ?? d(-29), to: custom?.to ?? d(0) };
  }
}
