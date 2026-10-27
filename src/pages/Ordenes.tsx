import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import { Card, StatusBadge, PageHeader, EmptyState, Loader, formatCurrency, formatDate } from '../components/ui';
import { BottomNav } from '../components/BottomNav';
import { getOrdenes, getVehiculos, getClientes } from '../db';
import { useAsync, useDebounced } from '../hooks/useAsync';
import type { EstadoOrden } from '../types';

const estados: { value: EstadoOrden | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'recibido', label: 'Recibido' },
  { value: 'en_reparacion', label: 'En reparación' },
  { value: 'esperando_repuesto', label: 'Esperando repuesto' },
  { value: 'listo', label: 'Listo' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function Ordenes() {
  const navigate = useNavigate();
  const [filtroEstado, setFiltroEstado] = useState<EstadoOrden | ''>('');
  const [busqueda, setBusqueda] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const busquedaDebounced = useDebounced(busqueda, 300);

  const { data, loading, error, reload } = useAsync(async () => {
    const [ordenes, vehiculos, clientes] = await Promise.all([
      getOrdenes(filtroEstado || undefined, busquedaDebounced || undefined),
      getVehiculos(),
      getClientes(),
    ]);
    return { ordenes, vehiculos, clientes };
  }, [filtroEstado, busquedaDebounced]);

  const ordenes = data?.ordenes ?? [];
  const vehiculos = data?.vehiculos ?? [];
  const clientes = data?.clientes ?? [];

  return (
    <div className="pb-20">
      <PageHeader
        title="Órdenes de Servicio"
        action={
          <button onClick={() => setShowFilters(!showFilters)} className="p-2 rounded-full hover:bg-gray-100">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        }
      />

      <div className="px-4 py-3 space-y-3">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, cliente o falla..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {estados.map(e => (
              <button
                key={e.value}
                onClick={() => setFiltroEstado(e.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filtroEstado === e.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        )}

        {/* Lista de órdenes */}
        {loading ? (
          <Loader text="Cargando órdenes..." />
        ) : error ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={reload} className="text-blue-600 text-sm font-medium">Reintentar</button>
          </div>
        ) : ordenes.length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8" />}
            title="No hay órdenes"
            description="No se encontraron órdenes con estos filtros"
          />
        ) : (
          <div className="space-y-3">
            {ordenes.map(orden => {
              const vehiculo = vehiculos.find(v => v.id === orden.vehiculo_id);
              const cliente = vehiculo ? clientes.find(c => c.id === vehiculo.cliente_id) : null;
              return (
                <Card key={orden.id} onClick={() => navigate(`/ordenes/${orden.id}`)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge estado={orden.estado} />
                        <span className="text-xs text-gray-400">#{orden.id.slice(0, 6)}</span>
                      </div>
                      <p className="font-semibold text-gray-900">{cliente?.nombre || 'Sin cliente'}</p>
                      <p className="text-sm text-gray-500">
                        {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} • ${vehiculo.placa}` : 'Sin vehículo'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{orden.falla_reportada}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(orden.total)}</p>
                      <p className="text-xs text-gray-400">{formatDate(orden.fecha_ingreso)}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/ordenes/nueva')}
        className="fixed bottom-24 right-4 z-40 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 px-5 py-4 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
        <span className="font-bold">Nueva</span>
      </button>

      <BottomNav />
    </div>
  );
}
