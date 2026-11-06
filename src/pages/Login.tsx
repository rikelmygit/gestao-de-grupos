import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Card, Btn, Primary, Input } from '@/components/UI';

export default function Login() {
  const { user, role, loading, clientIds } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [newPass, setNewPass] = useState('');
  const [err, setErr] = useState<string | null>(null); const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot' | 'recover'>('login');

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) setMode('recover');
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setMode('recover');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (mode === 'recover' || loading || !user) return;
    if (role === 'gestor') window.location.href = '/gestor';
    else if (role === 'cliente' && clientIds.length) window.location.href = `/painel/${clientIds[0]}`;
    else if (role === 'cliente') window.location.href = '/painel/sem-acesso';
    else window.location.href = '/gestor';
  }, [user, role, clientIds, loading, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErr(error.message);
    setBusy(false);
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) { setErr('Informe um e-mail válido.'); return; }
    setErr(null); setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/login?mode=recovery' });
    if (error) setErr(error.message);
    else setMsg('Verifique seu e-mail para redefinir a senha.');
    setBusy(false);
  }

  async function saveNewPass(e: React.FormEvent) {
    e.preventDefault();
    if (newPass.length < 6) { setErr('A nova senha deve ter no mínimo 6 caracteres.'); return; }
    setErr(null); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) setErr(error.message);
    else { setMsg('Senha atualizada!'); window.location.hash = ''; setMode('login'); setNewPass(''); }
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-bold text-slate-900">Gestão de Grupos</h1>
        <p className="text-sm text-muted">Acesse sua operação.</p>

        {mode === 'login' && (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Input label="E-mail" required value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
            <Input label="Senha" required type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
            {err && <p className="text-sm text-red-600">{err}</p>}
            <Primary disabled={busy} className="w-full justify-center">{busy ? 'Entrando...' : 'Entrar'}</Primary>
            <button type="button" onClick={() => setMode('forgot')} className="w-full text-center text-sm font-semibold text-blue-600 hover:underline">Esqueci minha senha</button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={sendReset} className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">Informe seu e-mail e enviaremos um link para redefinir a senha.</p>
            <Input label="E-mail" required value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
            {err && <p className="text-sm text-red-600">{err}</p>}
            {msg && <p className="text-sm text-emerald-700">{msg}</p>}
            <Primary disabled={busy} className="w-full justify-center">{busy ? 'Enviando...' : 'Enviar e-mail de redefinição'}</Primary>
            <button type="button" onClick={() => { setMode('login'); setMsg(null); setErr(null); }} className="w-full text-center text-sm font-semibold text-blue-600 hover:underline">Voltar para login</button>
          </form>
        )}

        {mode === 'recover' && (
          <form onSubmit={saveNewPass} className="mt-4 space-y-3">
            <p className="text-sm font-bold text-slate-900">Definir nova senha</p>
            <Input label="Nova senha" required type="password" value={newPass} onChange={(e: any) => setNewPass(e.target.value)} />
            {err && <p className="text-sm text-red-600">{err}</p>}
            {msg && <p className="text-sm text-emerald-700">{msg}</p>}
            <Primary disabled={busy} className="w-full justify-center">{busy ? 'Salvando...' : 'Salvar nova senha'}</Primary>
          </form>
        )}
      </Card>
    </div>
  );
}
