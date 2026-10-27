import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Minus, Check } from 'lucide-react';
import { Button, Input, Select, Card, PageHeader } from '../components/ui';
import { buscarVehiculos, crearVehiculo, getClientes, crearCliente, crearOrden, getRepuestos, getVehiculo } from '../db';
import { useAuth } from '../store/auth';
import { useAsync, useDebounced } from '../hooks/useAsync';
import { formatCurrency } from '../components/ui';
import type { Vehiculo, OrdenItem, Repuesto } from '../types';

export default function NuevaOrden() {
  const navigate = useNavigate();
  const user = useAuth(s => s.user);
  const [searchParams] = useSearchParams();
  const vehiculoParam = searchParams.get('vehiculo');
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Vehículo
  const [busquedaVeh, setBusquedaVeh] = useState('');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);
  const [showNuevoVehiculo, setShowNuevoVehiculo] = useState(false);
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');
  const [nuevoClienteTel, setNuevoClienteTel] = useState('');
  const [nuevaPlaca, setNuevaPlaca] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'moto' | 'carro'>('moto');
  const [nuevaMarca, setNuevaMarca] = useState('');
  const [nuevoModelo, setNuevoModelo] = useState('');
  const [nuevoAnio, setNuevoAnio] = useState('2023');
  const [nuevoColor, setNuevoColor] = useState('');

  // Step 2: Falla
  const [fallaReportada, setFallaReportada] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  // Step 3: Items
  const [items, setItems] = useState<Omit<OrdenItem, 'id' | 'orden_id'>[]>([]);
  const [busquedaRepuesto, setBusquedaRepuesto] = useState('');
  const [showAgregarServicio, setShowAgregarServicio] = useState(false);
  const [nuevoServicioDesc, setNuevoServicioDesc] = useState('');
  const [nuevoServicioPrecio, setNuevoServicioPrecio] = useState('');

  const busquedaVehDebounced = useDebounced(busquedaVeh, 300);

  const { data: vehiculosData } = useAsync(
    () =>
      busquedaVehDebounced.length >= 2
        ? buscarVehiculos(busquedaVehDebounced)
        : Promise.resolve([] as Vehiculo[]),
    [busquedaVehDebounced]
  );
  const vehiculosEncontrados = vehiculosData ?? [];

  const { data: clientesData } = useAsync(getClientes, []);
  const clientes = clientesData ?? [];

  const { data: repuestosData } = useAsync(getRepuestos, []);
  const repuestos = repuestosData ?? [];

  const repuestosEncontrados = repuestos.filter(r => {
    if (!r.activo || r.stock_actual <= 0) return false;
    if (!busquedaRepuesto.trim()) return true;
    const q = busquedaRepuesto.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(q) ||
      r.sku.toLowerCase().includes(q) ||
      r.categoria.toLowerCase().includes(q)
    );
  });

  // Preseleccionar vehículo cuando se llega desde la pantalla de clientes
  useEffect(() => {
    if (!vehiculoParam) return;
    let alive = true;
    getVehiculo(vehiculoParam).then(v => {
      if (alive && v) setVehiculoSeleccionado(v);
    });
    return () => {
      alive = false;
    };
  }, [vehiculoParam]);

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  const [errorVehiculo, setErrorVehiculo] = useState('');

  const handleCrearVehiculo = async () => {
    setErrorVehiculo('');
    if (!nuevoClienteNombre || !nuevoClienteTel || !nuevaPlaca || !nuevaMarca) {
      setErrorVehiculo('Complete los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      const encontrados = await getClientes(nuevoClienteTel);
      let cliente = encontrados.find(c => c.telefono === nuevoClienteTel);
      if (!cliente) {
        cliente = await crearCliente({ nombre: nuevoClienteNombre, telefono: nuevoClienteTel });
      }
      const vehiculo = await crearVehiculo({
        placa: nuevaPlaca.toUpperCase(),
        tipo: nuevoTipo,
        marca: nuevaMarca,
        modelo: nuevoModelo,
        anio: parseInt(nuevoAnio) || 2023,
        color: nuevoColor,
        cliente_id: cliente.id,
      });
      setVehiculoSeleccionado(vehiculo);
      setShowNuevoVehiculo(false);
      setStep(2);
    } catch (e: any) {
      setErrorVehiculo(e.message);
    } finally {
      setSaving(false);
    }
  };

  const [errorRepuesto, setErrorRepuesto] = useState('');

  const handleAgregarRepuesto = (repuesto: Repuesto) => {
    setErrorRepuesto('');
    const existing = items.find(i => i.repuesto_id === repuesto.id);
    if (existing) {
      if (existing.cantidad >= repuesto.stock_actual) {
        setErrorRepuesto(`Stock insuficiente de ${repuesto.nombre}. Disponible: ${repuesto.stock_actual}`);
        return;
      }
      setItems(items.map(i => i.repuesto_id === repuesto.id
        ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_unitario }
        : i
      ));
    } else {
      if (repuesto.stock_actual < 1) {
        setErrorRepuesto(`Stock insuficiente de ${repuesto.nombre}. Disponible: ${repuesto.stock_actual}`);
        return;
      }
      setItems([...items, {
        tipo: 'repuesto',
        repuesto_id: repuesto.id,
        descripcion: repuesto.nombre,
        cantidad: 1,
        precio_unitario: repuesto.precio_venta,
        subtotal: repuesto.precio_venta,
      }]);
    }
  };

  const handleAgregarServicio = () => {
    if (!nuevoServicioDesc || !nuevoServicioPrecio) return;
    const precio = parseFloat(nuevoServicioPrecio);
    setItems([...items, {
      tipo: 'servicio',
      descripcion: nuevoServicioDesc,
      cantidad: 1,
      precio_unitario: precio,
      subtotal: precio,
    }]);
    setNuevoServicioDesc('');
    setNuevoServicioPrecio('');
    setShowAgregarServicio(false);
  };

  const handleEliminarItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleCrearOrden = async () => {
    if (!vehiculoSeleccionado || !fallaReportada || items.length === 0) {
      alert('Complete todos los pasos antes de crear la orden');
      return;
    }
    setSaving(true);
    try {
      const orden = await crearOrden({
        vehiculo_id: vehiculoSeleccionado.id,
        mecanico_id: user?.id ?? '',
        falla_reportada: fallaReportada,
        diagnostico: diagnostico || undefined,
        items,
      });
      if (orden && orden.id) {
        navigate(`/ordenes/${orden.id}`);
      } else {
        throw new Error('El servidor no devolvió un ID de orden válido');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-8">
      <PageHeader title="Nueva Orden" onBack={() => step > 1 ? setStep(step - 1) : navigate('/ordenes')} />

      {/* Steps indicator */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 rounded ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">Vehículo</span>
          <span className="text-xs text-gray-500">Falla</span>
          <span className="text-xs text-gray-500">Items</span>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* STEP 1: Buscar/Crear Vehículo */}
        {step === 1 && (
          <>
            {!showNuevoVehiculo ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por placa, marca o cliente..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={busquedaVeh}
                    onChange={e => setBusquedaVeh(e.target.value)}
                    autoFocus
                  />
                </div>

                {vehiculoSeleccionado && (
                  <Card className="border-2 border-blue-500 bg-blue-50">
                    <p className="font-bold text-blue-900">{vehiculoSeleccionado.placa}</p>
                    <p className="text-sm text-blue-700">{vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo} ({vehiculoSeleccionado.anio})</p>
                    <Button size="sm" variant="primary" className="mt-2" onClick={() => setStep(2)}>
                      Continuar →
                    </Button>
                  </Card>
                )}

                {vehiculosEncontrados.length > 0 && !vehiculoSeleccionado && (
                  <div className="space-y-2">
                    {vehiculosEncontrados.map(v => {
                      const cli = clientes.find(c => c.id === v.cliente_id);
                      return (
                        <Card key={v.id} onClick={() => { setVehiculoSeleccionado(v); setStep(2); }}>
                          <p className="font-bold text-gray-900">{v.placa} • {v.tipo === 'moto' ? '🏍️' : '🚗'}</p>
                          <p className="text-sm text-gray-600">{v.marca} {v.modelo} ({v.anio}) - {v.color}</p>
                          <p className="text-xs text-gray-400">Cliente: {cli?.nombre}</p>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <Button fullWidth variant="secondary" onClick={() => setShowNuevoVehiculo(true)}>
                  <Plus className="w-5 h-5" /> Crear vehículo nuevo
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">Nuevo Vehículo</h3>
                <Input label="Nombre del cliente *" placeholder="Ej: María García" value={nuevoClienteNombre} onChange={e => setNuevoClienteNombre(e.target.value)} />
                <Input label="Teléfono *" placeholder="3001234567" value={nuevoClienteTel} onChange={e => setNuevoClienteTel(e.target.value)} type="tel" />
                <Input label="Placa *" placeholder="ABC123" value={nuevaPlaca} onChange={e => setNuevaPlaca(e.target.value)} />
                <Select label="Tipo" value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value as 'moto' | 'carro')} options={[{ value: 'moto', label: '🏍️ Moto' }, { value: 'carro', label: '🚗 Carro' }]} />
                <Input label="Marca *" placeholder="Ej: Yamaha" value={nuevaMarca} onChange={e => setNuevaMarca(e.target.value)} />
                <Input label="Modelo" placeholder="Ej: MT-07" value={nuevoModelo} onChange={e => setNuevoModelo(e.target.value)} />
                <Input label="Año" placeholder="2023" value={nuevoAnio} onChange={e => setNuevoAnio(e.target.value)} type="number" />
                <Input label="Color" placeholder="Negro" value={nuevoColor} onChange={e => setNuevoColor(e.target.value)} />
                {errorVehiculo && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center font-medium">
                    {errorVehiculo}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" onClick={() => { setShowNuevoVehiculo(false); setErrorVehiculo(''); }} className="flex-1">Cancelar</Button>
                  <Button onClick={handleCrearVehiculo} className="flex-1" loading={saving}>Crear y Continuar</Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* STEP 2: Describir Falla */}
        {step === 2 && (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">¿Cuál es la falla? *</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Describa la falla reportada por el cliente..."
                  value={fallaReportada}
                  onChange={e => setFallaReportada(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Diagnóstico (opcional)</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Diagnóstico del mecánico..."
                  value={diagnostico}
                  onChange={e => setDiagnostico(e.target.value)}
                />
              </div>
            </div>
            <Button fullWidth onClick={() => setStep(3)} disabled={!fallaReportada}>
              Siguiente: Agregar Items →
            </Button>
          </>
        )}

        {/* STEP 3: Agregar Items */}
        {step === 3 && (
          <>
            {/* Items agregados */}
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{item.descripcion}</p>
                      <p className="text-xs text-gray-500">
                        {item.tipo === 'repuesto' ? '🔧' : '🛠️'} × {item.cantidad}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{formatCurrency(item.subtotal)}</p>
                      <button onClick={() => handleEliminarItem(idx)} className="text-red-400 p-1">
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between p-3 bg-blue-50 rounded-xl font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            )}

            {/* Agregar servicio */}
            {!showAgregarServicio ? (
              <Button variant="secondary" fullWidth onClick={() => setShowAgregarServicio(true)}>
                <Plus className="w-5 h-5" /> Agregar Servicio
              </Button>
            ) : (
              <Card>
                <h4 className="font-bold text-sm mb-2">Nuevo Servicio</h4>
                <Input placeholder="Descripción del servicio" value={nuevoServicioDesc} onChange={e => setNuevoServicioDesc(e.target.value)} className="mb-2" />
                <Input placeholder="Precio" type="number" value={nuevoServicioPrecio} onChange={e => setNuevoServicioPrecio(e.target.value)} className="mb-2" />
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setShowAgregarServicio(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleAgregarServicio}>Agregar</Button>
                </div>
              </Card>
            )}

            {/* Buscar repuestos */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar repuesto..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={busquedaRepuesto}
                onChange={e => setBusquedaRepuesto(e.target.value)}
              />
            </div>

            {repuestosEncontrados.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {repuestosEncontrados.map(r => (
                  <Card key={r.id} onClick={() => handleAgregarRepuesto(r)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.nombre}</p>
                        <p className="text-xs text-gray-500">{r.categoria} • Stock: {r.stock_actual}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-blue-600">{formatCurrency(r.precio_venta)}</p>
                        <Plus className="w-4 h-4 text-blue-600 ml-auto" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Mensaje de error de stock */}
            {errorRepuesto && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center font-medium">
                {errorRepuesto}
              </div>
            )}

            {/* Crear orden */}
            <div className="pt-4 space-y-2">
              <Button fullWidth size="lg" onClick={handleCrearOrden} disabled={items.length === 0} loading={saving}>
                ✓ Crear Orden ({formatCurrency(total)})
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
