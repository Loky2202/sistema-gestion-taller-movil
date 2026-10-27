import { useNavigate } from 'react-router-dom';
import { DollarSign, ClipboardList, AlertTriangle, CheckCircle, Plus, TrendingUp } from 'lucide-react';
import { Card, formatCurrency } from '../components/ui';
import { BottomNav } from '../components/BottomNav';
import { getDashboardResumen } from '../db';
import { useAuth } from '../store/auth';
import { useMemo } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuth(s => s.user);
  const data = useMemo(() => getDashboardResumen(), []);

  const maxIngreso = Math.max(...data.ingresos_7dias.map(d => d.total), 1);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm">Hola, {user?.nombre?.split(' ')[0]}</p>
            <h1 className="text-2xl font-bold text-white">Panel Principal</h1>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{user?.nombre?.[0]}</span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Tarjetas principales */}
        <div className="grid grid-cols-2 gap-3">
          {/* Ingresos hoy */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white" onClick={() => navigate('/caja')}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(data.ingresos_hoy)}</p>
            <p className="text-green-100 text-xs mt-1">Ingresos hoy</p>
          </Card>

          {/* Órdenes abiertas */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white" onClick={() => navigate('/ordenes')}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{data.ordenes_abiertas}</p>
            <p className="text-blue-100 text-xs mt-1">Órdenes abiertas</p>
          </Card>
        </div>

        {/* Órdenes listas para entregar */}
        {data.ordenes_listas > 0 && (
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Listas para entregar</h3>
                <p className="text-sm text-gray-500">{data.ordenes_listas} vehículo{data.ordenes_listas > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="space-y-2">
              {data.ordenes_listas_detalle.map(({ orden, cliente, vehiculo }) => (
                <div
                  key={orden.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-xl cursor-pointer active:bg-green-100"
                  onClick={() => navigate(`/ordenes/${orden.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{cliente}</p>
                    <p className="text-sm text-gray-500">{vehiculo}</p>
                  </div>
                  <span className="text-green-600 font-bold text-sm">{formatCurrency(orden.total)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Stock crítico */}
        {data.stock_critico.length > 0 && (
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Stock Crítico</h3>
                <p className="text-sm text-gray-500">{data.stock_critico.length} repuesto{data.stock_critico.length > 1 ? 's' : ''} bajo mínimo</p>
              </div>
            </div>
            <div className="space-y-2">
              {data.stock_critico.slice(0, 5).map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-xl cursor-pointer active:bg-red-100"
                  onClick={() => navigate(`/inventario/${r.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{r.nombre}</p>
                    <p className="text-xs text-gray-500">{r.categoria}</p>
                  </div>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                    {r.stock_actual}/{r.stock_minimo}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Gráfico de ingresos 7 días */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Ingresos últimos 7 días</h3>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {data.ingresos_7dias.map((d, i) => {
              const height = Math.max((d.total / maxIngreso) * 100, 4);
              const dayName = new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short' });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative flex items-end justify-center" style={{ height: '100px' }}>
                    <div
                      className={`w-full max-w-[32px] rounded-t-lg transition-all ${d.total > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{dayName}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* FAB Nueva Orden */}
      <button
        onClick={() => navigate('/ordenes/nueva')}
        className="fixed bottom-24 right-4 z-40 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 px-5 py-4 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
        <span className="font-bold">Nueva Orden</span>
      </button>

      <BottomNav />
    </div>
  );
}
