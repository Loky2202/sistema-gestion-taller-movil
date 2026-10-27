import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Shield, AlertTriangle, Play } from 'lucide-react';
import { Card, Button, PageHeader } from '../components/ui';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../store/auth';
import { getAlertas, marcarAlertaLeida, getUsuarios, resetDatabase } from '../db';
import { useState, useMemo } from 'react';
import { runTests } from '../tests';

export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [testResults, setTestResults] = useState<{ passed: number; failed: number } | null>(null);

  const alertas = useMemo(() => getAlertas().filter(a => !a.leida), [refresh]);
  const usuarios = useMemo(() => getUsuarios(), [refresh]);

  const handleRunTests = () => {
    const results = runTests();
    setTestResults(results);
    setRefresh(r => r + 1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReset = () => {
    if (confirm('¿Restablecer todos los datos? Se perderán todos los cambios.')) {
      resetDatabase();
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="pb-20">
      <PageHeader title="Perfil" />

      <div className="px-4 py-4 space-y-4">
        {/* User info */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">{user?.nombre?.[0]}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.nombre}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                user?.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Shield className="w-3 h-3" />
                {user?.rol === 'admin' ? 'Administrador' : 'Mecánico'}
              </span>
            </div>
          </div>
        </Card>

        {/* Alertas */}
        {alertas.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Alertas ({alertas.length})</h3>
            </div>
            <div className="space-y-2">
              {alertas.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                  <p className="text-sm text-orange-700 flex-1">{a.mensaje}</p>
                  <button
                    onClick={() => { marcarAlertaLeida(a.id); setRefresh(r => r + 1); }}
                    className="text-xs text-orange-500 font-medium ml-2"
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Admin: Usuarios */}
        {user?.rol === 'admin' && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-900">Usuarios del Sistema</h3>
            </div>
            <div className="space-y-2">
              {usuarios.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{u.nombre}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  } ${!u.activo ? 'opacity-50' : ''}`}>
                    {u.rol} {u.activo ? '' : '(inactivo)'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Links */}
        <div className="space-y-2">
          <Card onClick={() => navigate('/clientes')} className="cursor-pointer">
            <p className="font-medium text-gray-900">📋 Clientes y Vehículos</p>
          </Card>
          <Card onClick={() => navigate('/caja')} className="cursor-pointer">
            <p className="font-medium text-gray-900">💰 Caja</p>
          </Card>
        </div>

        {/* Acciones */}
        <div className="space-y-3 pt-4">
          {user?.rol === 'admin' && (
            <>
              <Button fullWidth variant="secondary" onClick={handleRunTests}>
                <Play className="w-5 h-5" /> Ejecutar Pruebas del Sistema
              </Button>
              <Button fullWidth variant="ghost" onClick={handleReset} className="text-red-500">
                Restablecer datos de ejemplo
              </Button>
            </>
          )}
          <Button fullWidth variant="secondary" onClick={handleLogout}>
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </Button>
        </div>

        {/* Resultados de pruebas */}
        {testResults && (
          <Card className={testResults.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <h3 className="font-bold text-lg mb-2">
              {testResults.failed === 0 ? '✅ Todas las pruebas pasaron' : '❌ Algunas pruebas fallaron'}
            </h3>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-bold text-green-700">{testResults.passed}</span>
                <span className="text-gray-600">pasadas</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-red-700">{testResults.failed}</span>
                <span className="text-gray-600">fallidas</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Revisa la consola del navegador (F12) para ver el detalle de cada prueba.
            </p>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-4">
          <p className="text-xs text-gray-400">TallerPro v1.0</p>
          <p className="text-xs text-gray-300">Sistema de gestión para taller mecánico</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
