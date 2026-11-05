import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-border bg-surface p-5 shadow-card', className)}>{children}</div>;
}
export function Empty({ title, desc }: { title: string; desc: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center"><p className="font-semibold text-slate-900">{title}</p><p className="mt-1 text-sm text-muted">{desc}</p></div>;
}
export function Loading({ text = 'Carregando...' }: { text?: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-sm text-muted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />{text}</div>;
}
export function ErrorBox({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{msg}</p>{onRetry && <button onClick={onRetry} className="mt-2 text-xs font-medium underline">Tentar novamente</button>}</div>;
}
export function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'muted' | 'info'; children: ReactNode }) {
  const map = { ok: 'border-emerald-200 bg-emerald-50 text-emerald-700', warn: 'border-amber-200 bg-amber-50 text-amber-700', bad: 'border-red-200 bg-red-50 text-red-700', muted: 'border-slate-200 bg-slate-50 text-slate-600', info: 'border-blue-200 bg-blue-50 text-blue-700' };
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold', map[tone])}>{children}</span>;
}
export function Btn({ children, ...p }: any) {
  return <button {...p} className={cn('inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50', p.className)}>{children}</button>;
}
export function Primary({ children, ...p }: any) {
  return <button {...p} className={cn('inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50', p.className)}>{children}</button>;
}
export function Input({ label, ...p }: any) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><input {...p} className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>;
}
