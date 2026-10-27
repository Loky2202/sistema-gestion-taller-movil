import { useState, useMemo } from 'react';
import { DollarSign, CreditCard, Smartphone, Banknote, Receipt } from 'lucide-react';
import { Card, PageHeader, Button, formatCurrency } from '../components/ui';
import { BottomNav } from '../components/BottomNav';
import { getResumenHoy, cerrarCaja, getCierres, getOrdenes } from '../db';
import { useAuth } from '../store/auth';

export default function Caja() {
  const user = useAuth(s => s.user);
  const [showConfirmCierre, setShowConfirmCierre] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const resumen = useMemo(() => getResumenHoy(), [refresh]);
  const cierres = useMemo(() => getCierres(), [refresh]);
  const ordenesHoy = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return getOrdenes().filter(o => o.estado === 'entregado' && o.fecha_entrega?.startsWith(hoy));
  }, [refresh]);

  const [errorCierre, setErrorCierre] = useState('');
  const [successCierre, setSuccessCierre] = useState('');

  const handleCierre = () => {
    setErrorCierre('');
    // Verificar si ya hay un cierre hoy
    const hoy = new Date().toISOString().split('T')[0];
    const cierreHoy = cierres.find(c => c.fecha === hoy);
    if (cierreHoy) {
      setErrorCierre('Ya se realizó un cierre de caja hoy. Solo se permite un cierre por día.');
      return;
    }
    cerrarCaja(user!.id);
    setShowConfirmCierre(false);
    setSuccessCierre('Caja cerrada exitosamente');
    setRefresh(r => r + 1);
    setTimeout(() => setSuccessCierre(''), 3000);
  };

  return (
    <div className="pb-20">
      <PageHeader title="Caja" />

      <div className="px-4 py-4 space-y-4">
        {/* Total del día */}
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-green-100 text-sm">Total cobrado hoy</p>
              <p className="text-3xl font-bold">{formatCurrency(resumen.total_general)}</p>
            </div>
          </div>
          <p className="text-green-100 text-sm">{resumen.ordenes_entregadas} órdenes entregadas hoy</p>
        </Card>

        {/* Desglose por método */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-3">Desglose por método de pago</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-green-600" />
                <span className="font-medium">Efectivo</span>
              </div>
              <span className="font-bold text-green-700">{formatCurrency(resumen.total_efectivo)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Transferencia</span>
              </div>
              <span className="font-bold text-blue-700">{formatCurrency(resumen.total_transferencia)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Tarjeta</span>
              </div>
              <span className="font-bold text-purple-700">{formatCurrency(resumen.total_tarjeta)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-orange-600" />
                <span className="font-medium">Mixto</span>
              </div>
              <span className="font-bold text-orange-700">{formatCurrency(resumen.total_mixto)}</span>
            </div>
          </div>
        </Card>

        {/* Órdenes entregadas hoy */}
        {ordenesHoy.length > 0 && (
          <Card>
            <h3 className="font-bold text-gray-900 mb-3">Órdenes entregadas hoy</h3>
            <div className="space-y-2">
              {ordenesHoy.map(o => (
                <div key={o.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">#{o.id.slice(0, 6)}</span>
                  <span className="font-bold text-sm">{formatCurrency(o.total)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Cierre de caja */}
        {user?.rol === 'admin' && (
          <>
            <Button fullWidth variant="danger" onClick={() => setShowConfirmCierre(true)}>
              🔒 Cerrar Caja del Día
            </Button>

            {/* Historial cierres */}
            {cierres.length > 0 && (
              <Card>
                <h3 className="font-bold text-gray-900 mb-3">Historial de Cierres</h3>
                <div className="space-y-2">
                  {cierres.slice(0, 10).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-sm">{c.fecha}</p>
                        <p className="text-xs text-gray-500">{c.total_general > 0 ? `${formatCurrency(c.total_general)} total` : 'Sin ventas'}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Mensajes de éxito/error */}
      {successCierre && (
        <div className="mx-4 bg-green-50 text-green-700 p-3 rounded-xl text-sm font-medium text-center">
          ✓ {successCierre}
        </div>
      )}

      {/* Modal confirmación cierre */}
      {showConfirmCierre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowConfirmCierre(false); setErrorCierre(''); }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-center">¿Cerrar caja del día?</h3>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600">Total del día</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(resumen.total_general)}</p>
            </div>
            {errorCierre && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center font-medium">
                {errorCierre}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setShowConfirmCierre(false); setErrorCierre(''); }} className="flex-1">Cancelar</Button>
              <Button variant="danger" onClick={handleCierre} className="flex-1">Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
