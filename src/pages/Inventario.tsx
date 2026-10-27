import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle } from 'lucide-react';
import { Card, PageHeader, StockBadge, EmptyState, formatCurrency } from '../components/ui';
import { BottomNav } from '../components/BottomNav';
import { getRepuestos, buscarRepuestos } from '../db';

export default function Inventario() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const categorias = useMemo(() => {
    const reps = getRepuestos();
    return [...new Set(reps.map(r => r.categoria))];
  }, []);

  const repuestos = useMemo(() => {
    let reps = busqueda ? buscarRepuestos(busqueda) : getRepuestos();
    if (filtroCategoria) reps = reps.filter(r => r.categoria === filtroCategoria);
    return reps.filter(r => r.activo);
  }, [busqueda, filtroCategoria]);

  const stockBajo = repuestos.filter(r => r.stock_actual <= r.stock_minimo);

  return (
    <div className="pb-20">
      <PageHeader title="Inventario" />

      <div className="px-4 py-3 space-y-3">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar repuesto por nombre o código..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* Filtro categoría */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltroCategoria('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${!filtroCategoria ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Todos
          </button>
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setFiltroCategoria(c)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filtroCategoria === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Alerta stock bajo */}
        {stockBajo.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {stockBajo.length} repuesto{stockBajo.length > 1 ? 's' : ''} con stock bajo
            </p>
          </div>
        )}

        {/* Lista */}
        {repuestos.length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8" />}
            title="Sin resultados"
            description="No se encontraron repuestos"
          />
        ) : (
          <div className="space-y-2">
            {repuestos.map(r => (
              <Card key={r.id} onClick={() => navigate(`/inventario/${r.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{r.nombre}</p>
                      {r.stock_actual <= r.stock_minimo && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{r.sku} • {r.categoria}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <StockBadge actual={r.stock_actual} minimo={r.stock_minimo} />
                      <span className="text-sm font-bold text-gray-700">{formatCurrency(r.precio_venta)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
