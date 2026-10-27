import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Minus } from 'lucide-react';
import { Card, Button, Input, Select, Modal, PageHeader, formatCurrency } from '../components/ui';
import { getRepuesto, getMovimientosByRepuesto, registrarMovimiento, actualizarRepuesto } from '../db';
import { useAuth } from '../store/auth';

export default function RepuestoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth(s => s.user);
  const [showMovimiento, setShowMovimiento] = useState(false);
  const [tipoMov, setTipoMov] = useState<'entrada' | 'ajuste'>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [refresh, setRefresh] = useState(0);

  const repuesto = useMemo(() => id ? getRepuesto(id) : null, [id, refresh]);
  const movimientos = useMemo(() => id ? getMovimientosByRepuesto(id) : [], [id, refresh]);

  if (!repuesto) {
    return <div className="p-4 text-center"><p>Repuesto no encontrado</p></div>;
  }

  const handleMovimiento = () => {
    const cant = parseFloat(cantidad);
    if (isNaN(cant) || cant <= 0) { alert('Ingrese una cantidad válida'); return; }
    if (!motivo) { alert('Ingrese un motivo'); return; }
    registrarMovimiento(repuesto.id, tipoMov, cant, motivo, user!.id);
    setShowMovimiento(false);
    setCantidad('');
    setMotivo('');
    setRefresh(r => r + 1);
  };

  return (
    <div className="pb-8">
      <PageHeader title="Detalle del Repuesto" onBack={() => navigate('/inventario')} />

      <div className="px-4 py-4 space-y-4">
        {/* Info */}
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{repuesto.nombre}</h2>
              <p className="text-sm text-gray-500">Código: {repuesto.sku}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              repuesto.stock_actual <= repuesto.stock_minimo
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {repuesto.stock_actual} {repuesto.unidad}(s)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-500">Categoría</p>
              <p className="font-medium text-gray-900">{repuesto.categoria}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-500">Proveedor</p>
              <p className="font-medium text-gray-900 text-sm">{repuesto.proveedor}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-500">Precio Costo</p>
              <p className="font-medium text-gray-900">{formatCurrency(repuesto.precio_costo)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-500">Precio Venta</p>
              <p className="font-bold text-blue-600">{formatCurrency(repuesto.precio_venta)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-500">Stock Mínimo</p>
              <p className="font-medium text-gray-900">{repuesto.stock_minimo} {repuesto.unidad}(s)</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-500">Unidad</p>
              <p className="font-medium text-gray-900 capitalize">{repuesto.unidad}</p>
            </div>
          </div>
        </Card>

        {/* Acción */}
        {user?.rol === 'admin' && (
          <Button fullWidth onClick={() => setShowMovimiento(true)}>
            <Package className="w-5 h-5" /> Registrar Movimiento
          </Button>
        )}

        {/* Historial movimientos */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-3">Historial de Movimientos</h3>
          {movimientos.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Sin movimientos registrados</p>
          ) : (
            <div className="space-y-2">
              {movimientos.slice(0, 20).map(m => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.tipo === 'entrada' ? 'bg-green-100 text-green-700' :
                        m.tipo === 'salida' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {m.tipo === 'entrada' ? '↑ Entrada' : m.tipo === 'salida' ? '↓ Salida' : '↕ Ajuste'}
                      </span>
                      <span className="font-bold text-sm">{m.cantidad > 0 ? '+' : ''}{m.cantidad}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{m.motivo}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(m.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal Movimiento */}
      <Modal isOpen={showMovimiento} onClose={() => setShowMovimiento(false)} title="Registrar Movimiento">
        <div className="space-y-4">
          <Select
            label="Tipo"
            value={tipoMov}
            onChange={e => setTipoMov(e.target.value as 'entrada' | 'ajuste')}
            options={[
              { value: 'entrada', label: '↑ Entrada (compra)' },
              { value: 'ajuste', label: '↕ Ajuste (corrección)' },
            ]}
          />
          <Input label="Cantidad" type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="0" />
          <Input label="Motivo" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Compra a proveedor..." />
          <Button fullWidth onClick={handleMovimiento}>Registrar</Button>
        </div>
      </Modal>
    </div>
  );
}
