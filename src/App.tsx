import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/auth';
import { useEffect } from 'react';
import { OfflineBanner } from './components/ui';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ordenes from './pages/Ordenes';
import OrdenDetalle from './pages/OrdenDetalle';
import NuevaOrden from './pages/NuevaOrden';
import Inventario from './pages/Inventario';
import RepuestoDetalle from './pages/RepuestoDetalle';
import Clientes from './pages/Clientes';
import Caja from './pages/Caja';
import Perfil from './pages/Perfil';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuth(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const isOnline = useAuth(s => s.isOnline);
  const setOnline = useAuth(s => s.setOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto relative">
      {!isOnline && <OfflineBanner />}
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/ordenes" element={<ProtectedRoute><AppLayout><Ordenes /></AppLayout></ProtectedRoute>} />
        <Route path="/ordenes/nueva" element={<ProtectedRoute><AppLayout><NuevaOrden /></AppLayout></ProtectedRoute>} />
        <Route path="/ordenes/:id" element={<ProtectedRoute><AppLayout><OrdenDetalle /></AppLayout></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute><AppLayout><Inventario /></AppLayout></ProtectedRoute>} />
        <Route path="/inventario/:id" element={<ProtectedRoute><AppLayout><RepuestoDetalle /></AppLayout></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><AppLayout><Clientes /></AppLayout></ProtectedRoute>} />
        <Route path="/caja" element={<ProtectedRoute><AppLayout><Caja /></AppLayout></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><AppLayout><Perfil /></AppLayout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
