import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Plus } from 'lucide-react';
import { Card, PageHeader, StockBadge, EmptyState, Loader, formatCurrency, Button, Input, Select, Modal } from '../components/ui';
import { BottomNav } from '../components/BottomNav';
import { getRepuestos, crearRepuesto } from '../db';
import { useAuth } from '../store/auth';
import { useAsync } from '../hooks/useAsync';

export default function Inventario() {
  const navigate = useNavigate();
  const user = useAuth(s => s.user);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [showNuevo, setShowNuevo] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulario nuevo repuesto
  const [nuevoSku, setNuevoSku] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCategoria, setNuevoCategoria] = useState('Motor');
  const [nuevoUnidad, setNuevoUnidad] = useState<'unidad' | 'litro' | 'metro' | 'juego'>('unidad');
  const [nuevoStock, setNuevoStock] = useState('');
  const [nuevoStockMin, setNuevoStockMin] = useState('');
  const [nuevoCosto, setNuevoCosto] = useState('');
  const [nuevoVenta, setNuevoVenta] = useState('');
  const [nuevoProveedor, setNuevoProveedor] = useState('');

  const { data, loading, error, reload } = useAsync(getRepuestos, []);
  const todos = data ?? [];

  const repuestos = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return todos.filter(r => {
      if (!r.activo) return false;
      if (filtroCategoria && r.categoria !== filtroCategoria) return false;
      if (!q) return true;
      return (
        r.nombre.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.categoria.toLowerCase().includes(q)
      );
    });
  }, [todos, busqueda, filtroCategoria]);

  const stockBajo = todos.filter(r => r.activo && r.stock_actual <= r.stock_minimo);

  const categorias = useMemo(() => {
    const cats = [...new Set(todos.map(r => r.categoria))];
    const defaults = ['Motor', 'Frenos', 'Suspensión', 'Eléctrico', 'Llantas', 'Lubricantes'];
    return [...new Set([...defaults, ...cats])];
  }, [todos]);

  const handleCrearRepuesto = async () => {
    if (!nuevoSku || !nuevoNombre || !nuevoVenta || !nuevoStock) {
      alert('Complete los campos obligatorios (Código, Nombre, Precio venta, Stock)');
      return;
    }
    if (todos.some(r => r.sku.toLowerCase() === nuevoSku.toLowerCase())) {
      alert('Ya existe un repuesto con ese código');
      return;
    }
    setSaving(true);
    try {
      await crearRepuesto({
        sku: nuevoSku.toUpperCase(),
        nombre: nuevoNombre,
        categoria: nuevoCategoria,
        unidad: nuevoUnidad,
        stock_actual: parseFloat(nuevoStock) || 0,
        stock_minimo: parseFloat(nuevoStockMin) || 0,
        precio_costo: parseFloat(nuevoCosto) || 0,
        precio_venta: parseFloat(nuevoVenta) || 0,
        proveedor: nuevoProveedor,
        activo: true,
      });
      // Reset form
      setNuevoSku(''); setNuevoNombre(''); setNuevoStock(''); setNuevoStockMin('');
      setNuevoCosto(''); setNuevoVenta(''); setNuevoProveedor('');
      setShowNuevo(false);
      reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-20">
      <PageHeader
        title="Inventario"
        action={
          user?.rol === 'admin' ? (
            <button onClick={() => setShowNuevo(true)} className="p-2 rounded-full bg-blue-100">
              <Plus className="w-5 h-5 text-blue-600" />
            </button>
          ) : undefined
        }
      />

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
        {loading ? (
          <Loader text="Cargando inventario..." />
        ) : error ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={reload} className="text-blue-600 text-sm font-medium">Reintentar</button>
          </div>
        ) : repuestos.length === 0 ? (
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

      {/* Modal Nuevo Repuesto */}
      <Modal isOpen={showNuevo} onClose={() => setShowNuevo(false)} title="Nuevo Repuesto">
        <div className="space-y-3">
          <Input
            label="Código (SKU) *"
            value={nuevoSku}
            onChange={e => setNuevoSku(e.target.value)}
            placeholder="Ej: ACE-002"
          />
          <Input
            label="Nombre *"
            value={nuevoNombre}
            onChange={e => setNuevoNombre(e.target.value)}
            placeholder="Ej: Aceite Motor 5W-30"
          />
          <Select
            label="Categoría"
            value={nuevoCategoria}
            onChange={e => setNuevoCategoria(e.target.value)}
            options={categorias.map(c => ({ value: c, label: c }))}
          />
          <Select
            label="Unidad de medida"
            value={nuevoUnidad}
            onChange={e => setNuevoUnidad(e.target.value as 'unidad' | 'litro' | 'metro' | 'juego')}
            options={[
              { value: 'unidad', label: 'Unidad' },
              { value: 'litro', label: 'Litro' },
              { value: 'metro', label: 'Metro' },
              { value: 'juego', label: 'Juego' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Stock actual *"
              type="number"
              value={nuevoStock}
              onChange={e => setNuevoStock(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Stock mínimo"
              type="number"
              value={nuevoStockMin}
              onChange={e => setNuevoStockMin(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio costo"
              type="number"
              value={nuevoCosto}
              onChange={e => setNuevoCosto(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Precio venta *"
              type="number"
              value={nuevoVenta}
              onChange={e => setNuevoVenta(e.target.value)}
              placeholder="0"
            />
          </div>
          <Input
            label="Proveedor"
            value={nuevoProveedor}
            onChange={e => setNuevoProveedor(e.target.value)}
            placeholder="Nombre del proveedor"
          />
          <Button fullWidth onClick={handleCrearRepuesto} loading={saving}>
            Guardar Repuesto
          </Button>
        </div>
      </Modal>

      <BottomNav />
    </div>
  );
}
