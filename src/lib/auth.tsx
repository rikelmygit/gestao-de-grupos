import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

type Role = 'gestor' | 'cliente' | null;
type AuthCtx = { user: User | null; session: Session | null; role: Role; clientIds: string[]; loading: boolean; signOut: () => Promise<void> };

const Ctx = createContext<AuthCtx>({ user: null, session: null, role: null, clientIds: [], loading: true, signOut: async () => {} });

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(u: User | null) {
    if (!u) { setRole(null); setClientIds([]); setLoading(false); return; }
    const { data: r } = await supabase.from('user_roles').select('role').eq('user_id', u.id).maybeSingle();
    setRole((r?.role as Role) ?? null);
    const { data: links } = await supabase.from('client_users').select('client_id').eq('user_id', u.id).eq('is_active', true);
    setClientIds((links ?? []).map((x: any) => x.client_id));
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session); setUser(data.session?.user ?? null);
      await load(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s); setUser(s?.user ?? null);
      await load(s?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <Ctx.Provider value={{ user, session, role, clientIds, loading, signOut: async () => { await supabase.auth.signOut(); window.location.href = '/login'; } }}>{children}</Ctx.Provider>;
}
