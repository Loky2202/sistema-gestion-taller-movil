import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Phone, Car, Plus } from 'lucide-react';
import { Card, PageHeader, Button, Input, Modal, EmptyState, formatDate } from '../components/ui';
import { BottomNav } from '../components/BottomNav';
import { getClientes, getVehiculosByCliente, crearCliente, crearVehiculo, getHistorialVehiculo, getVehiculo } from '../db';
import type { Vehiculo } from '../types';

export default function Clientes() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [showNuevo, setShowNuevo] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<string | null>(null);
  const [, setRefresh] = useState(0);

  // Nuevo vehículo
  const [showNuevoVeh, setShowNuevoVeh] = useState(false);
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState<'moto' | 'carro'>('moto');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('2023');
  const [color, setColor] = useState('');

  const clientes = useMemo(() => {
    const all = getClientes();
    if (!busqueda) return all;
    const q = busqueda.toLowerCase();
    return all.filter(c => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q));
  }, [busqueda]);

  const handleCrearCliente = () => {
    if (!nombre || !telefono) { alert('Nombre y teléfono son obligatorios'); return; }
    crearCliente({ nombre, telefono, email: email || undefined });
    setNombre(''); setTelefono(''); setEmail('');
    setShowNuevo(false);
    setRefresh(r => r + 1);
  };

  const handleCrearVehiculo = () => {
    if (!placa || !marca || !selectedCliente) { alert('Complete los campos'); return; }
    crearVehiculo({ placa: placa.toUpperCase(), tipo, marca, modelo, anio: parseInt(anio) || 2023, color, cliente_id: selectedCliente });
    setPlaca(''); setMarca(''); setModelo(''); setColor('');
    setShowNuevoVeh(false);
    setRefresh(r => r + 1);
  };

  const vehiculosCliente = selectedCliente ? getVehiculosByCliente(selectedCliente) : [];

  return (
    <div className="pb-20">
      <PageHeader
        title="Clientes y Vehículos"
        action={
          <button onClick={() => setShowNuevo(true)} className="p-2 rounded-full bg-blue-100">
            <Plus className="w-5 h-5 text-blue-600" />
          </button>
        }
      />

      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {clientes.length === 0 ? (
          <EmptyState icon={<Search className="w-8 h-8" />} title="Sin clientes" description="Agrega un nuevo cliente" />
        ) : (
          <div className="space-y-3">
            {clientes.map(c => {
              const vehiculos = getVehiculosByCliente(c.id);
              const isExpanded = selectedCliente === c.id;
              return (
                <div key={c.id}>
                  <Card onClick={() => setSelectedCliente(isExpanded ? null : c.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{c.nombre}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="w-3 h-3" /> {c.telefono}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        {vehiculos.map(v => {
                          const historial = getHistorialVehiculo(v.id);
                          return (
                            <div key={v.id} className="p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">{v.placa} {v.tipo === 'moto' ? '🏍️' : '🚗'}</p>
                                  <p className="text-sm text-gray-500">{v.marca} {v.modelo} ({v.anio}) - {v.color}</p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/ordenes/nueva?vehiculo=${v.id}`); }}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                                >
                                  Nueva orden
                                </button>
                              </div>
                              {historial.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">Historial ({historial.length} órdenes):</p>
                                  {historial.slice(0, 3).map(o => (
                                    <p key={o.id} className="text-xs text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => navigate(`/ordenes/${o.id}`)}>
                                      #{o.id.slice(0, 6)} - {o.falla_reportada.slice(0, 30)}...
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setShowNuevoVeh(true); }}>
                          <Plus className="w-4 h-4" /> Agregar vehículo
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nuevo Cliente */}
      <Modal isOpen={showNuevo} onClose={() => setShowNuevo(false)} title="Nuevo Cliente">
        <div className="space-y-3">
          <Input label="Nombre completo *" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: María García" />
          <Input label="Teléfono *" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="3001234567" type="tel" />
          <Input label="Email (opcional)" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" type="email" />
          <Button fullWidth onClick={handleCrearCliente}>Guardar Cliente</Button>
        </div>
      </Modal>

      {/* Modal Nuevo Vehículo */}
      <Modal isOpen={showNuevoVeh} onClose={() => setShowNuevoVeh(false)} title="Nuevo Vehículo">
        <div className="space-y-3">
          <Input label="Placa *" value={placa} onChange={e => setPlaca(e.target.value)} placeholder="ABC123" />
          <select className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base" value={tipo} onChange={e => setTipo(e.target.value as 'moto' | 'carro')}>
            <option value="moto">🏍️ Moto</option>
            <option value="carro">🚗 Carro</option>
          </select>
          <Input label="Marca *" value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: Yamaha" />
          <Input label="Modelo" value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ej: MT-07" />
          <Input label="Año" value={anio} onChange={e => setAnio(e.target.value)} type="number" />
          <Input label="Color" value={color} onChange={e => setColor(e.target.value)} placeholder="Negro" />
          <Button fullWidth onClick={handleCrearVehiculo}>Guardar Vehículo</Button>
        </div>
      </Modal>

      <BottomNav />
    </div>
  );
}
