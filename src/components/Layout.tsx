import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, KeyRound, Cable, FileText, LogOut, TrendingUp, Library } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const gestLinks = [
  { to: '/gestor', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/gestor/clientes', label: 'Clientes', icon: Users },
  { to: '/gestor/acessos', label: 'Acessos', icon: KeyRound },
  { to: '/gestor/integracao', label: 'Meta Ads', icon: Cable },
  { to: '/gestor/relatorios', label: 'Relatórios', icon: FileText },
  { to: '/gestor/biblioteca', label: 'Biblioteca de criativos', icon: Library },
];

export default function Layout() {
  const loc = useLocation();
  const { role, user, signOut } = useAuth();
  const links = role === 'cliente' ? [{ to: '/painel', label: 'Meu Painel', icon: LayoutDashboard }, { to: '/painel/biblioteca', label: 'Biblioteca de criativos', icon: Library }] : gestLinks;
  const active = (to: string) => loc.pathname === to || (to !== '/gestor' && loc.pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r border-border bg-white md:block">
        <div className="flex h-full flex-col p-4">
          <div className="mb-6 flex items-center gap-3 px-2 pt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"><TrendingUp size={20} /></div>
            <div><p className="text-[15px] font-bold tracking-tight text-slate-900">Gestão de Grupos</p><p className="text-xs text-muted">Achadinhos • WhatsApp • Telegram</p></div>
          </div>
          <nav className="flex-1 space-y-1">
            <p className="px-3 pb-1 text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400">{role === 'cliente' ? 'Painel' : 'Gestão'}</p>
            {links.map(l => (
              <Link key={l.to} to={l.to} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', active(l.to) ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}>
                <l.icon size={18} />{l.label}
              </Link>
            ))}
          </nav>
          <div className="rounded-2xl border border-border bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{user?.email?.[0]?.toUpperCase()}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-900">{user?.email}</p><p className="text-xs font-semibold text-blue-600">{role === 'gestor' ? 'Gestor' : role === 'cliente' ? 'Cliente' : 'Sem função'}</p></div>
            </div>
            <button onClick={signOut} className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-border bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><LogOut size={13} /> Sair</button>
          </div>
        </div>
      </aside>
      <div className="md:pl-[260px]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white/80 px-4 py-3 backdrop-blur md:px-6">
          <div><p className="text-sm font-bold text-slate-900 md:text-base">Gestão de Grupos</p><p className="hidden text-xs text-muted md:block">Acompanhe investimento, leads e CPL em tempo real</p></div>
          <div className="flex items-center gap-2"><span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{role === 'gestor' ? 'Gestor' : role === 'cliente' ? 'Cliente' : ''}</span></div>
        </header>
        <main className="mx-auto max-w-[1100px] p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
