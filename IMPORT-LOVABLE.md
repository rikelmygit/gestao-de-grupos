# Como importar na Lovable

## 1) Subir para o GitHub
```bash
git init
git add .
git commit -m "Gestão de Grupos - v1"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/gestao-de-grupos.git
git push -u origin main
```

## 2) Na Lovable
- Lovable → New Project → Import from GitHub → selecionar o repositório
- Ativar Lovable Cloud no projeto
- Em **Supabase → SQL Editor**, colar o conteúdo de `supabase/migrations/001_initial.sql` e executar
- Em **Supabase → Auth**, criar o primeiro usuário gestor
- Inserir no SQL: `insert into public.user_roles (user_id, role) values ('SEU_USER_ID','gestor')`
- Em **Supabase → Secrets**, adicionar `META_ACCESS_TOKEN` (long-lived)
- Fazer deploy da Edge Function `supabase/functions/meta-ads`

Importante: não trocar as políticas RLS nem adicionar dados de exemplo. O app já trata estados vazios, loading e erro.
