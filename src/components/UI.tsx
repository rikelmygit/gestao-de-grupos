import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-border bg-surface p-4 shadow-sm', className)}>{children}</div>;
}
export function Empty({ title, desc }: { title: string; desc: string }) {
  return <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted">{desc}</p></div>;
}
export function Loading({ text = 'Carregando...' }: { text?: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-6 text-sm text-muted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />{text}</div>;
}
export function ErrorBox({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  return <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200"><p>{msg}</p>{onRetry && <button onClick={onRetry} className="mt-2 text-xs underline">Tentar novamente</button>}</div>;
}
export function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'muted' | 'info'; children: ReactNode }) {
  const map = { ok: 'border-emerald-900 bg-emerald-950/50 text-emerald-300', warn: 'border-amber-900 bg-amber-950/50 text-amber-300', bad: 'border-red-900 bg-red-950/50 text-red-300', muted: 'border-border bg-zinc-900 text-zinc-300', info: 'border-sky-900 bg-sky-950/50 text-sky-300' };
  return <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px]', map[tone])}>{children}</span>;
}
export function Btn({ children, ...p }: any) {
  return <button {...p} className={cn('inline-flex items-center gap-2 rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50', p.className)}>{children}</button>;
}
export function Primary({ children, ...p }: any) {
  return <button {...p} className={cn('inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50', p.className)}>{children}</button>;
}
export function Input({ label, ...p }: any) {
  return <label className="block"><span className="mb-1 block text-xs text-muted">{label}</span><input {...p} className="w-full rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-600" /></label>;
}
