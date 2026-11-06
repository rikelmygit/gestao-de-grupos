import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-[20px] border border-white/60 bg-white/80 p-5 shadow-[0_20px_50px_-20px_rgba(37,99,235,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl', className)}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-violet-50/40" />
      <div className="relative">{children}</div>
    </div>
  );
}
export function Empty({ title, desc }: { title: string; desc: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center"><p className="text-base font-semibold text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-600">{desc}</p></div>;
}
export function Loading({ text = 'Carregando...' }: { text?: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-sm text-slate-600"><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />{text}</div>;
}
export function ErrorBox({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{msg}</p>{onRetry && <button onClick={onRetry} className="mt-2 text-xs font-medium underline">Tentar novamente</button>}</div>;
}
export function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'muted' | 'info'; children: ReactNode }) {
  const map = { ok: 'border-emerald-200 bg-emerald-50 text-emerald-700', warn: 'border-amber-200 bg-amber-50 text-amber-700', bad: 'border-red-200 bg-red-50 text-red-700', muted: 'border-slate-200 bg-slate-50 text-slate-600', info: 'border-blue-200 bg-blue-50 text-blue-700' };
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', map[tone])}>{children}</span>;
}
export function Btn({ children, ...p }: any) {
  return <button {...p} className={cn('inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50', p.className)}>{children}</button>;
}
export function Primary({ children, ...p }: any) {
  return <button {...p} className={cn('inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50', p.className)}>{children}</button>;
}
export function Input({ label, ...p }: any) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span><input {...p} className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>;
}
