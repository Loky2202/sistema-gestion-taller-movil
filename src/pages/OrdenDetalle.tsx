import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, CreditCard, Wrench } from 'lucide-react';
import { Card, StatusBadge, Button, Modal, Select, Input, Loader, formatCurrency, formatDate, formatDateTime } from '../components/ui';
import { getOrden, getVehiculo, getCliente, actualizarOrdenEstado, cobrarOrden, eliminarItemOrden, getUsuario } from '../db';
import { useAuth } from '../store/auth';
import { useAsync } from '../hooks/useAsync';
import type { EstadoOrden, MetodoPago } from '../types';

const estados: { value: EstadoOrden; label: string }[] = [
  { value: 'recibido', label: 'Recibido' },
  { value: 'en_reparacion', label: 'En reparación' },
  { value: 'esperando_repuesto', label: 'Esperando repuesto' },
  { value: 'listo', label: 'Listo para entregar' },
  { value: 'cancelado', label: 'Cancelar orden' },
];

export default function OrdenDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth(s => s.user);
  const [showCobro, setShowCobro] = useState(false);
  const [showCambiarEstado, setShowCambiarEstado] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState<EstadoOrden>('en_reparacion');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  // Debe declararse junto al resto de hooks: los returns condicionales de abajo
  // no pueden dejar hooks sin ejecutar entre renders.
  const [itemAEliminar, setItemAEliminar] = useState<string | null>(null);

  const { data, loading, error: loadError, reload } = useAsync(async () => {
    if (!id) return null;
    
    try {
      const orden = await getOrden(id);
      if (!orden) return null;

      const vehiculo = await getVehiculo(orden.vehiculo_id);
      const cliente = vehiculo ? await getCliente(vehiculo.cliente_id) : null;
      const mecanico = await getUsuario(orden.mecanico_id);

      return { orden, vehiculo, cliente, mecanico };
    } catch (e: any) {
      throw new Error(e.message || 'Error al recuperar los detalles de la orden');
    }
  }, [id]);

  if (loading) {
    return (
      <div className="pb-20">
        <Loader text="Cargando orden..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 text-center space-y-4">
        <p className="text-red-600">{loadError}</p>
        <Button onClick={reload}>Reintentar</Button>
      </div>
    );
  }

  const orden = data?.orden ?? null;
  const vehiculo = data?.vehiculo ?? null;
  const cliente = data?.cliente ?? null;
  const mecanico = data?.mecanico ?? null;

  if (!orden) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Orden no encontrada</p>
        <Button onClick={() => navigate('/ordenes')} className="mt-4">Volver</Button>
      </div>
    );
  }

  const esFinalizada = orden.estado === 'entregado' || orden.estado === 'cancelado';
  const cambio = montoRecibido ? parseFloat(montoRecibido) - orden.total : 0;

  const handleCambiarEstado = async () => {
    setError('');
    setSaving(true);
    try {
      await actualizarOrdenEstado(orden.id, nuevoEstado, user?.id);
      setSuccess('Estado actualizado correctamente');
      setShowCambiarEstado(false);
      reload();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      // No cerrar el modal si hay error, mostrar el mensaje dentro
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCobrar = async () => {
    setError('');
    const monto = parseFloat(montoRecibido);
    if (isNaN(monto) || monto < orden.total) {
      setError('El monto recibido debe ser igual o mayor al total');
      return;
    }
    setSaving(true);
    try {
      await cobrarOrden(orden.id, metodoPago, monto, user?.id);
      setSuccess('Orden cobrada y entregada exitosamente');
      setShowCobro(false);
      reload();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarItem = (itemId: string) => {
    setItemAEliminar(itemId);
  };

  const confirmarEliminarItem = async () => {
    if (itemAEliminar) {
      try {
        await eliminarItemOrden(orden.id, itemAEliminar);
        setItemAEliminar(null);
        reload();
      } catch (e: any) {
        setError(e.message);
        setItemAEliminar(null);
      }
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/ordenes')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Orden #{orden.id.slice(0, 6)}</h1>
          <p className="text-xs text-gray-500">{formatDate(orden.fecha_ingreso)}</p>
        </div>
        <StatusBadge estado={orden.estado} />
      </div>

      {success && (
        <div className="mx-4 mt-3 bg-green-50 text-green-700 p-3 rounded-xl text-sm font-medium text-center">
          ✓ {success}
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Cliente y Vehículo */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-gray-900 text-lg">{cliente?.nombre}</p>
              <p className="text-gray-500">{vehiculo?.marca} {vehiculo?.modelo} ({vehiculo?.anio})</p>
              <p className="text-gray-500">Placa: <span className="font-mono font-bold">{vehiculo?.placa}</span> • {vehiculo?.color}</p>
              {cliente?.telefono && (
                <a href={`tel:${cliente.telefono}`} className="inline-flex items-center gap-1 text-blue-600 text-sm mt-2">
                  <Phone className="w-4 h-4" /> {cliente.telefono}
                </a>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">Tipo</span>
              <p className="font-medium text-gray-700">{vehiculo?.tipo === 'moto' ? '🏍️ Moto' : '🚗 Carro'}</p>
            </div>
          </div>
        </Card>

        {/* Falla y Diagnóstico */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Falla Reportada
          </h3>
          <p className="text-gray-700">{orden.falla_reportada}</p>
          {orden.diagnostico && (
            <>
              <h3 className="font-bold text-gray-900 mt-3 mb-1">Diagnóstico</h3>
              <p className="text-gray-700">{orden.diagnostico}</p>
            </>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
            <p>Mecánico: {mecanico?.nombre}</p>
            {orden.fecha_estimada && <p>Estimada: {formatDate(orden.fecha_estimada)}</p>}
            {orden.notas && <p className="mt-1">Notas: {orden.notas}</p>}
          </div>
        </Card>

        {/* Items */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-3">Detalle de la Orden</h3>
          <div className="space-y-2">
            {orden.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{item.descripcion}</p>
                  <p className="text-xs text-gray-500">
                    {item.tipo === 'repuesto' ? '🔧 Repuesto' : '🛠️ Servicio'} • Cant: {item.cantidad}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <p className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                  {!esFinalizada && (
                    <button onClick={() => handleEliminarItem(item.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="mt-4 pt-3 border-t border-gray-200 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Servicios</span>
              <span>{formatCurrency(orden.total_servicios)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Repuestos</span>
              <span>{formatCurrency(orden.total_repuestos)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
              <span>Total</span>
              <span>{formatCurrency(orden.total)}</span>
            </div>
          </div>
        </Card>

        {/* Acciones */}
        {!esFinalizada && (
          <div className="space-y-3">
            <Button fullWidth onClick={() => setShowCambiarEstado(true)}>
              Cambiar Estado
            </Button>
            {orden.estado === 'listo' && (
              <Button fullWidth variant="primary" onClick={() => { setShowCobro(true); setMontoRecibido(orden.total.toString()); }}>
                <CreditCard className="w-5 h-5" /> Cobrar y Entregar
              </Button>
            )}
          </div>
        )}

        {esFinalizada && (
          <Card className="bg-gray-50">
            <p className="text-center text-gray-500 text-sm">
              Orden {orden.estado === 'entregado' ? 'entregada' : 'cancelada'}
              {orden.fecha_entrega && ` el ${formatDateTime(orden.fecha_entrega)}`}
            </p>
          </Card>
        )}
      </div>

      {/* Modal Cambiar Estado */}
      <Modal isOpen={showCambiarEstado} onClose={() => setShowCambiarEstado(false)} title="Cambiar Estado">
        <div className="space-y-4">
          <Select
            label="Nuevo estado"
            value={nuevoEstado}
            onChange={e => setNuevoEstado(e.target.value as EstadoOrden)}
            options={estados.map(e => ({ value: e.value, label: e.label }))}
          />
          {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
          <Button fullWidth onClick={handleCambiarEstado} loading={saving}>Confirmar Cambio</Button>
        </div>
      </Modal>

      {/* Modal Cobro */}
      <Modal isOpen={showCobro} onClose={() => setShowCobro(false)} title="Cobrar Orden">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl text-center">
            <p className="text-sm text-blue-600">Total a cobrar</p>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(orden.total)}</p>
          </div>
          <Select
            label="Método de pago"
            value={metodoPago}
            onChange={e => setMetodoPago(e.target.value as MetodoPago)}
            options={[
              { value: 'efectivo', label: '💵 Efectivo' },
              { value: 'transferencia', label: '📱 Transferencia' },
              { value: 'tarjeta', label: '💳 Tarjeta' },
              { value: 'mixto', label: '🔄 Mixto' },
            ]}
          />
          <Input
            label="Monto recibido"
            type="number"
            value={montoRecibido}
            onChange={e => setMontoRecibido(e.target.value)}
            placeholder="0"
          />
          {cambio >= 0 && parseFloat(montoRecibido) > orden.total && (
            <div className="bg-green-50 p-3 rounded-xl text-center">
              <p className="text-sm text-green-600">Cambio</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(cambio)}</p>
            </div>
          )}
          {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
          <Button fullWidth onClick={handleCobrar} loading={saving}>
            <CreditCard className="w-5 h-5" /> Confirmar Pago
          </Button>
        </div>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal isOpen={!!itemAEliminar} onClose={() => setItemAEliminar(null)} title="¿Eliminar ítem?">
        <p className="text-gray-600">Esta acción no se puede deshacer. El ítem se eliminará de la orden.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setItemAEliminar(null)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={confirmarEliminarItem} className="flex-1">Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
