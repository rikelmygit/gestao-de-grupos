import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Card, Btn } from '@/components/UI';

export default function Login() {
  const { user, role, loading, clientIds } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (role === 'gestor') window.location.href = '/gestor';
    else if (role === 'cliente' && clientIds.length) window.location.href = `/painel/${clientIds[0]}`;
    else window.location.href = '/gestor';
  }, [user, role, clientIds, loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErr(error.message);
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-semibold">Gestão de Grupos</h1>
        <p className="text-sm text-muted">Acesse sua operação.</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-sm"><span className="mb-1 block text-xs text-muted">E-mail</span><input required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-border bg-white text-slate-900 [color-scheme:light] px-3 py-2" placeholder="voce@exemplo.com" /></label>
          <label className="block text-sm"><span className="mb-1 block text-xs text-muted">Senha</span><input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-border bg-white text-slate-900 [color-scheme:light] px-3 py-2" /></label>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <Btn disabled={busy} className="w-full justify-center bg-emerald-600 text-white">{busy ? 'Entrando...' : 'Entrar'}</Btn>
          <p className="text-center text-xs text-muted">Esqueceu a senha? Use a opção de recuperação do email.</p>
        </form>
      </Card>
    </div>
  );
}
