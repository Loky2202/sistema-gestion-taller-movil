import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Shield, AlertTriangle, Play } from 'lucide-react';
import { Card, Button, PageHeader, Loader } from '../components/ui';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../store/auth';
import { getAlertas, marcarAlertaLeida, getUsuarios } from '../db';
import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';

export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: number; failed: number } | null>(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const alertas = await getAlertas();
    const usuarios = user?.rol === 'admin' ? await getUsuarios() : [];
    return { alertas, usuarios };
  }, [user?.rol]);

  const alertas = (data?.alertas ?? []).filter(a => !a.leida);
  const usuarios = data?.usuarios ?? [];

  const handleRunTests = async () => {
    if (!import.meta.env.DEV) return;
    setSaving(true);
    try {
      const { runTests } = await import('../tests');
      const results = await runTests();
      setTestResults(results);
      reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReset = async () => {
    // Herramienta exclusiva de desarrollo: nunca se ejecuta en producción.
    if (!import.meta.env.DEV) return;
    if (confirm('¿Restablecer todos los datos? Se perderán todos los cambios.')) {
      setSaving(true);
      try {
        const { resetDatabase } = await import('../db');
        await resetDatabase();
        logout();
        navigate('/login');
      } catch (e: any) {
        alert(e.message);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="pb-20">
      <PageHeader title="Perfil" />

      <div className="px-4 py-4 space-y-4">
        {loading && <Loader text="Cargando perfil..." />}
        {!loading && error && (
          <div className="text-center py-4 space-y-3">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={reload} className="text-blue-600 text-sm font-medium">Reintentar</button>
          </div>
        )}

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
                    onClick={async () => { await marcarAlertaLeida(a.id); reload(); }}
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-900">Usuarios del Sistema</h3>
              </div>
              <button
                onClick={() => navigate('/usuarios')}
                className="text-sm font-semibold text-blue-600 active:text-blue-800"
              >
                Administrar
              </button>
            </div>
            <div className="space-y-2">
              {usuarios.map(u => (
                <div
                  key={u.id}
                  onClick={() => navigate('/usuarios')}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer active:bg-gray-100"
                >
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
          {import.meta.env.DEV && user?.rol === 'admin' && (
            <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-3 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                Herramientas de desarrollo (no visibles en producción)
              </p>
              <Button fullWidth variant="secondary" onClick={handleRunTests} loading={saving}>
                <Play className="w-5 h-5" /> Ejecutar Pruebas del Sistema
              </Button>
              <Button fullWidth variant="ghost" onClick={handleReset} className="text-red-500" loading={saving}>
                Restablecer datos de ejemplo
              </Button>
            </div>
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
