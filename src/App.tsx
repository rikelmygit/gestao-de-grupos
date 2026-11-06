import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import GestorDashboard from '@/pages/GestorDashboard';
import Clientes from '@/pages/Clientes';
import ClienteDetalhe from '@/pages/ClienteDetalhe';
import Acessos from '@/pages/Acessos';
import MetaIntegracao from '@/pages/MetaIntegracao';
import PainelCliente from '@/pages/PainelCliente';
import Relatorios from '@/pages/Relatorios';
import Biblioteca from '@/pages/Biblioteca';
import { Card, Empty, Loading } from '@/components/UI';

function Gate({ children, roles }: { children: JSX.Element; roles: string[] }) {
  const { user, role, loading, clientIds } = useAuth();
  if (loading) return <div className="p-6"><Loading /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(role ?? '')) return <div className="p-6"><Empty title="Sem permissão" desc={`Sua função (${role ?? 'não definida'}) não tem acesso. Fale com o gestor.`} /></div>;
  return children;
}

function HomeRedirect() {
  const { user, role, loading, clientIds } = useAuth();
  if (loading) return <div className="p-6"><Loading /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'gestor') return <Navigate to="/gestor" replace />;
  if (role === 'cliente' && clientIds.length) return <Navigate to={`/painel/${clientIds[0]}`} replace />;
  return <Navigate to="/gestor" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route element={<Layout />}>
            <Route path="/gestor" element={<Gate roles={['gestor']}><GestorDashboard /></Gate>} />
            <Route path="/gestor/clientes" element={<Gate roles={['gestor']}><Clientes /></Gate>} />
            <Route path="/gestor/clientes/:id" element={<Gate roles={['gestor']}><ClienteDetalhe /></Gate>} />
            <Route path="/gestor/acessos" element={<Gate roles={['gestor']}><Acessos /></Gate>} />
            <Route path="/gestor/integracao" element={<Gate roles={['gestor']}><MetaIntegracao /></Gate>} />
            <Route path="/gestor/relatorios" element={<Gate roles={['gestor']}><Relatorios /></Gate>} />
            <Route path="/gestor/biblioteca" element={<Gate roles={['gestor']}><Biblioteca /></Gate>} />
            <Route path="/painel/biblioteca" element={<Gate roles={['cliente']}><Biblioteca /></Gate>} />
            <Route path="/painel/:id" element={<Gate roles={['cliente']}><PainelCliente /></Gate>} />
            <Route path="/painel/sem-acesso" element={<Empty title="Sem cliente vinculado" desc="Fale com o gestor." />} />
          </Route>
          <Route path="/sem-permissao" element={<div className="p-6"><Empty title="Sem função atribuída" desc="Peça ao gestor para configurar user_roles." /></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
