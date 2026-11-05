import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-border bg-surface p-4 shadow-sm', className)}>{children}</div>;
}
export function Empty({ title, desc }: { title: string; desc: string }) {
  return <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center"><p className="font-medium text-slate-900">{title}</p><p className="mt-1 text-sm text-muted">{desc}</p></div>;
}
export function Loading({ text = 'Carregando...' }: { text?: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-6 text-sm text-muted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />{text}</div>;
}
export function ErrorBox({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{msg}</p>{onRetry && <button onClick={onRetry} className="mt-2 text-xs underline">Tentar novamente</button>}</div>;
}
export function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'muted' | 'info'; children: ReactNode }) {
  const map = { ok: 'border-emerald-200 bg-emerald-50 text-emerald-700', warn: 'border-amber-200 bg-amber-50 text-amber-700', bad: 'border-red-200 bg-red-50 text-red-700', muted: 'border-slate-200 bg-slate-50 text-slate-600', info: 'border-blue-200 bg-blue-50 text-blue-700' };
  return <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px]', map[tone])}>{children}</span>;
}
export function Btn({ children, ...p }: any) {
  return <button {...p} className={cn('inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50', p.className)}>{children}</button>;
}
export function Primary({ children, ...p }: any) {
  return <button {...p} className={cn('inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50', p.className)}>{children}</button>;
}
export function Input({ label, ...p }: any) {
  return <label className="block"><span className="mb-1 block text-xs text-muted">{label}</span><input {...p} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" /></label>;
}
