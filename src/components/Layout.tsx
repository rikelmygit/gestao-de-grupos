import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, KeyRound, Cable, FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const gestLinks = [
  { to: '/gestor', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/gestor/clientes', label: 'Clientes', icon: Users },
  { to: '/gestor/acessos', label: 'Acessos', icon: KeyRound },
  { to: '/gestor/integracao', label: 'Meta Ads', icon: Cable },
  { to: '/gestor/relatorios', label: 'Relatórios', icon: FileText },
];

export default function Layout() {
  const loc = useLocation();
  const { role, user, signOut } = useAuth();
  const links = role === 'cliente' ? [{ to: '/painel', label: 'Meu Painel', icon: LayoutDashboard }] : gestLinks;
  const active = (to: string) => loc.pathname === to || (to !== '/gestor' && loc.pathname.startsWith(to));

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-surface p-4 md:block">
        <div className="mb-6"><p className="text-base font-bold tracking-tight text-blue-700">Gestão de Grupos</p><p className="text-xs text-muted">Tráfego para achadinhos</p></div>
        <nav className="space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium', active(l.to) ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50')}>
              <l.icon size={16} />{l.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-border bg-slate-50 p-3">
          <p className="truncate text-xs text-muted">{user?.email}</p>
          <p className={cn('text-xs font-semibold', role === 'gestor' ? 'text-blue-600' : 'text-blue-500')}>{role === 'gestor' ? 'Gestor' : role === 'cliente' ? 'Cliente' : 'Sem função'}</p>
          <button onClick={signOut} className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"><LogOut size={13} /> Sair</button>
        </div>
      </aside>
      <div className="md:pl-60">
        <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-blue-700">Gestão de Grupos</p><button onClick={signOut} className="text-xs text-muted">Sair</button></div>
          <div className="mt-2 flex gap-2 overflow-auto">{links.map(l => <Link key={l.to} to={l.to} className={cn('whitespace-nowrap rounded-full border border-border bg-white px-3 py-1 text-xs', active(l.to) && 'bg-blue-50 text-blue-700 border-blue-200')}>{l.label}</Link>)}</div>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
