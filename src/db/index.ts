// ============================================================
// CAPA DE DATOS - Simula backend con localStorage
// ============================================================
import { v4 as uuidv4 } from 'uuid';
import type {
  Usuario, Cliente, Vehiculo, Orden, OrdenItem, Repuesto,
  MovimientoInventario, Pago, Alerta, CierreCaja,
  EstadoOrden, MetodoPago, TipoMovimiento
} from '../types';

const DB_KEY = 'taller_db';

interface Database {
  usuarios: Usuario[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  ordenes: Orden[];
  repuestos: Repuesto[];
  movimientos: MovimientoInventario[];
  pagos: Pago[];
  alertas: Alerta[];
  cierres: CierreCaja[];
  initialized: boolean;
}

function getDB(): Database {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const db = seedDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }
  return JSON.parse(raw);
}

function saveDB(db: Database): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function seedDatabase(): Database {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();

  const usuarios: Usuario[] = [
    { id: 'u1', nombre: 'Admin Taller', email: 'admin@taller.com', password: 'admin123', rol: 'admin', activo: true, created_at: now },
    { id: 'u2', nombre: 'Carlos Mecánico', email: 'mecanico@taller.com', password: 'meca123', rol: 'mecanico', activo: true, created_at: now },
  ];

  const clientes: Cliente[] = [
    { id: 'c1', nombre: 'María García', telefono: '3001234567', email: 'maria@email.com', notas: 'Cliente frecuente', created_at: now },
    { id: 'c2', nombre: 'Juan Rodríguez', telefono: '3009876543', notas: '', created_at: now },
  ];

  const vehiculos: Vehiculo[] = [
    { id: 'v1', placa: 'ABC123', tipo: 'moto', marca: 'Yamaha', modelo: 'MT-07', anio: 2022, color: 'Negro', cliente_id: 'c1', created_at: now },
    { id: 'v2', placa: 'XYZ789', tipo: 'carro', marca: 'Chevrolet', modelo: 'Spark', anio: 2020, color: 'Blanco', cliente_id: 'c2', created_at: now },
  ];

  const repuestos: Repuesto[] = [
    { id: 'r1', sku: 'ACE-001', nombre: 'Aceite Motor 10W-40', categoria: 'Lubricantes', unidad: 'litro', stock_actual: 15, stock_minimo: 5, precio_costo: 18000, precio_venta: 28000, proveedor: 'Lubricantes SA', activo: true, created_at: now },
    { id: 'r2', sku: 'FIL-001', nombre: 'Filtro de Aceite Universal', categoria: 'Motor', unidad: 'unidad', stock_actual: 8, stock_minimo: 3, precio_costo: 12000, precio_venta: 22000, proveedor: 'Repuestos El Turbo', activo: true, created_at: now },
    { id: 'r3', sku: 'PAS-001', nombre: 'Pastillas de Freno Delanteras', categoria: 'Frenos', unidad: 'juego', stock_actual: 4, stock_minimo: 3, precio_costo: 35000, precio_venta: 55000, proveedor: 'FrenosPro', activo: true, created_at: now },
    { id: 'r4', sku: 'BUJ-001', nombre: 'Bujía NGK CPR8EA9', categoria: 'Eléctrico', unidad: 'unidad', stock_actual: 20, stock_minimo: 8, precio_costo: 8000, precio_venta: 15000, proveedor: 'Eléctrica Moto', activo: true, created_at: now },
    { id: 'r5', sku: 'CAD-001', nombre: 'Cadena de Distribución 428H', categoria: 'Motor', unidad: 'juego', stock_actual: 3, stock_minimo: 2, precio_costo: 45000, precio_venta: 75000, proveedor: 'Repuestos El Turbo', activo: true, created_at: now },
    { id: 'r6', sku: 'LLT-001', nombre: 'Llanta 110/80-17', categoria: 'Llantas', unidad: 'unidad', stock_actual: 6, stock_minimo: 2, precio_costo: 85000, precio_venta: 130000, proveedor: 'Llantas & Cauchos', activo: true, created_at: now },
    { id: 'r7', sku: 'AMO-001', nombre: 'Amortiguador Trasero', categoria: 'Suspensión', unidad: 'unidad', stock_actual: 2, stock_minimo: 1, precio_costo: 120000, precio_venta: 195000, proveedor: 'Suspensiones Plus', activo: true, created_at: now },
    { id: 'r8', sku: 'BAT-001', nombre: 'Batería 12V 7Ah', categoria: 'Eléctrico', unidad: 'unidad', stock_actual: 5, stock_minimo: 2, precio_costo: 65000, precio_venta: 98000, proveedor: 'Eléctrica Moto', activo: true, created_at: now },
    { id: 'r9', sku: 'COR-001', nombre: 'Correa Transmisión', categoria: 'Motor', unidad: 'unidad', stock_actual: 3, stock_minimo: 2, precio_costo: 55000, precio_venta: 88000, proveedor: 'Repuestos El Turbo', activo: true, created_at: now },
    { id: 'r10', sku: 'LIQ-001', nombre: 'Líquido de Frenos DOT4', categoria: 'Frenos', unidad: 'litro', stock_actual: 10, stock_minimo: 4, precio_costo: 12000, precio_venta: 20000, proveedor: 'FrenosPro', activo: true, created_at: now },
  ];

  const ordenes: Orden[] = [
    {
      id: 'o1', vehiculo_id: 'v1', mecanico_id: 'u2', estado: 'en_reparacion',
      falla_reportada: 'Ruido extraño en el motor', diagnostico: 'Cadena floja',
      fecha_ingreso: yesterday, fecha_estimada: now, total_servicios: 50000,
      total_repuestos: 75000, total: 125000, notas: '',
      items: [
        { id: 'oi1', orden_id: 'o1', tipo: 'servicio', descripcion: 'Ajuste de cadena', cantidad: 1, precio_unitario: 50000, subtotal: 50000 },
        { id: 'oi2', orden_id: 'o1', tipo: 'repuesto', repuesto_id: 'r5', descripcion: 'Cadena de Distribución 428H', cantidad: 1, precio_unitario: 75000, subtotal: 75000 },
      ],
      created_at: yesterday, updated_at: now
    },
    {
      id: 'o2', vehiculo_id: 'v2', mecanico_id: 'u2', estado: 'recibido',
      falla_reportada: 'Cambio de aceite y revisión general',
      fecha_ingreso: now, total_servicios: 30000, total_repuestos: 50000, total: 80000, notas: '',
      items: [
        { id: 'oi3', orden_id: 'o2', tipo: 'servicio', descripcion: 'Cambio de aceite', cantidad: 1, precio_unitario: 30000, subtotal: 30000 },
        { id: 'oi4', orden_id: 'o2', tipo: 'repuesto', repuesto_id: 'r1', descripcion: 'Aceite Motor 10W-40', cantidad: 1, precio_unitario: 28000, subtotal: 28000 },
        { id: 'oi5', orden_id: 'o2', tipo: 'repuesto', repuesto_id: 'r2', descripcion: 'Filtro de Aceite Universal', cantidad: 1, precio_unitario: 22000, subtotal: 22000 },
      ],
      created_at: now, updated_at: now
    },
  ];

  return {
    usuarios, clientes, vehiculos, ordenes, repuestos,
    movimientos: [], pagos: [], alertas: [], cierres: [],
    initialized: true
  };
}

// ============================================================
// API SIMULADA
// ============================================================

// --- AUTH ---
export function login(email: string, password: string): Usuario | null {
  const db = getDB();
  const user = db.usuarios.find(u => u.email === email && u.password === password && u.activo);
  return user || null;
}

export function getUsuario(id: string): Usuario | null {
  const db = getDB();
  return db.usuarios.find(u => u.id === id) || null;
}

export function getUsuarios(): Usuario[] {
  return getDB().usuarios;
}

export function crearUsuario(data: Omit<Usuario, 'id' | 'created_at'>): Usuario {
  const db = getDB();
  const user: Usuario = { ...data, id: uuidv4(), created_at: new Date().toISOString() };
  db.usuarios.push(user);
  saveDB(db);
  return user;
}

export function actualizarUsuario(id: string, data: Partial<Usuario>): Usuario | null {
  const db = getDB();
  const idx = db.usuarios.findIndex(u => u.id === id);
  if (idx === -1) return null;
  db.usuarios[idx] = { ...db.usuarios[idx], ...data };
  saveDB(db);
  return db.usuarios[idx];
}

// --- CLIENTES ---
export function getClientes(): Cliente[] {
  return getDB().clientes;
}

export function getCliente(id: string): Cliente | null {
  return getDB().clientes.find(c => c.id === id) || null;
}

export function crearCliente(data: Omit<Cliente, 'id' | 'created_at'>): Cliente {
  const db = getDB();
  const cliente: Cliente = { ...data, id: uuidv4(), created_at: new Date().toISOString() };
  db.clientes.push(cliente);
  saveDB(db);
  return cliente;
}

export function actualizarCliente(id: string, data: Partial<Cliente>): Cliente | null {
  const db = getDB();
  const idx = db.clientes.findIndex(c => c.id === id);
  if (idx === -1) return null;
  db.clientes[idx] = { ...db.clientes[idx], ...data };
  saveDB(db);
  return db.clientes[idx];
}

// --- VEHICULOS ---
export function getVehiculos(): Vehiculo[] {
  return getDB().vehiculos;
}

export function getVehiculo(id: string): Vehiculo | null {
  return getDB().vehiculos.find(v => v.id === id) || null;
}

export function buscarVehiculos(query: string): Vehiculo[] {
  const db = getDB();
  const q = query.toLowerCase();
  return db.vehiculos.filter(v => {
    const cliente = db.clientes.find(c => c.id === v.cliente_id);
    return v.placa.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      (cliente && cliente.nombre.toLowerCase().includes(q));
  });
}

export function crearVehiculo(data: Omit<Vehiculo, 'id' | 'created_at'>): Vehiculo {
  const db = getDB();
  const vehiculo: Vehiculo = { ...data, id: uuidv4(), created_at: new Date().toISOString() };
  db.vehiculos.push(vehiculo);
  saveDB(db);
  return vehiculo;
}

export function actualizarVehiculo(id: string, data: Partial<Vehiculo>): Vehiculo | null {
  const db = getDB();
  const idx = db.vehiculos.findIndex(v => v.id === id);
  if (idx === -1) return null;
  db.vehiculos[idx] = { ...db.vehiculos[idx], ...data };
  saveDB(db);
  return db.vehiculos[idx];
}

export function getVehiculosByCliente(clienteId: string): Vehiculo[] {
  return getDB().vehiculos.filter(v => v.cliente_id === clienteId);
}

export function getHistorialVehiculo(vehiculoId: string): Orden[] {
  return getDB().ordenes.filter(o => o.vehiculo_id === vehiculoId);
}

// --- REPUESTOS ---
export function getRepuestos(): Repuesto[] {
  return getDB().repuestos;
}

export function getRepuesto(id: string): Repuesto | null {
  return getDB().repuestos.find(r => r.id === id) || null;
}

export function buscarRepuestos(query: string): Repuesto[] {
  const db = getDB();
  const q = query.toLowerCase();
  return db.repuestos.filter(r =>
    r.nombre.toLowerCase().includes(q) ||
    r.sku.toLowerCase().includes(q) ||
    r.categoria.toLowerCase().includes(q)
  );
}

export function getStockBajo(): Repuesto[] {
  return getDB().repuestos.filter(r => r.activo && r.stock_actual <= r.stock_minimo);
}

export function crearRepuesto(data: Omit<Repuesto, 'id' | 'created_at'>): Repuesto {
  const db = getDB();
  const repuesto: Repuesto = { ...data, id: uuidv4(), created_at: new Date().toISOString() };
  db.repuestos.push(repuesto);
  saveDB(db);
  return repuesto;
}

export function actualizarRepuesto(id: string, data: Partial<Repuesto>): Repuesto | null {
  const db = getDB();
  const idx = db.repuestos.findIndex(r => r.id === id);
  if (idx === -1) return null;
  db.repuestos[idx] = { ...db.repuestos[idx], ...data };
  saveDB(db);
  return db.repuestos[idx];
}

export function registrarMovimiento(repuestoId: string, tipo: TipoMovimiento, cantidad: number, motivo: string, usuarioId: string): MovimientoInventario {
  const db = getDB();
  const mov: MovimientoInventario = {
    id: uuidv4(), repuesto_id: repuestoId, tipo, cantidad, motivo,
    usuario_id: usuarioId, created_at: new Date().toISOString()
  };
  db.movimientos.push(mov);
  // Actualizar stock
  const idx = db.repuestos.findIndex(r => r.id === repuestoId);
  if (idx !== -1) {
    if (tipo === 'entrada' || tipo === 'ajuste') {
      db.repuestos[idx].stock_actual += cantidad;
    } else if (tipo === 'salida') {
      db.repuestos[idx].stock_actual -= cantidad;
    }
    // Verificar alerta
    if (db.repuestos[idx].stock_actual <= db.repuestos[idx].stock_minimo) {
      const existeAlerta = db.alertas.find(a => a.repuesto_id === repuestoId && !a.leida);
      if (!existeAlerta) {
        db.alertas.push({
          id: uuidv4(), repuesto_id: repuestoId, tipo: 'stock_bajo',
          mensaje: `${db.repuestos[idx].nombre} tiene stock bajo (${db.repuestos[idx].stock_actual} ${db.repuestos[idx].unidad})`,
          leida: false, created_at: new Date().toISOString()
        });
      }
    }
  }
  saveDB(db);
  return mov;
}

// Versión interna que opera sobre un objeto DB ya cargado (para transacciones)
function registrarMovimientoInterno(db: Database, repuestoId: string, tipo: TipoMovimiento, cantidad: number, motivo: string, usuarioId: string): MovimientoInventario {
  const mov: MovimientoInventario = {
    id: uuidv4(), repuesto_id: repuestoId, tipo, cantidad, motivo,
    usuario_id: usuarioId, created_at: new Date().toISOString()
  };
  db.movimientos.push(mov);
  const idx = db.repuestos.findIndex(r => r.id === repuestoId);
  if (idx !== -1) {
    if (tipo === 'entrada' || tipo === 'ajuste') {
      db.repuestos[idx].stock_actual += cantidad;
    } else if (tipo === 'salida') {
      db.repuestos[idx].stock_actual -= cantidad;
    }
    if (db.repuestos[idx].stock_actual <= db.repuestos[idx].stock_minimo) {
      const existeAlerta = db.alertas.find(a => a.repuesto_id === repuestoId && !a.leida);
      if (!existeAlerta) {
        db.alertas.push({
          id: uuidv4(), repuesto_id: repuestoId, tipo: 'stock_bajo',
          mensaje: `${db.repuestos[idx].nombre} tiene stock bajo (${db.repuestos[idx].stock_actual} ${db.repuestos[idx].unidad})`,
          leida: false, created_at: new Date().toISOString()
        });
      }
    }
  }
  return mov;
}

export function getMovimientosByRepuesto(repuestoId: string): MovimientoInventario[] {
  return getDB().movimientos.filter(m => m.repuesto_id === repuestoId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// --- ORDENES ---
export function getOrdenes(estado?: EstadoOrden, query?: string): Orden[] {
  let ordenes = getDB().ordenes;
  if (estado) ordenes = ordenes.filter(o => o.estado === estado);
  if (query) {
    const q = query.toLowerCase();
    const db = getDB();
    ordenes = ordenes.filter(o => {
      const veh = db.vehiculos.find(v => v.id === o.vehiculo_id);
      const cli = veh ? db.clientes.find(c => c.id === veh.cliente_id) : null;
      return o.falla_reportada.toLowerCase().includes(q) ||
        (veh && veh.placa.toLowerCase().includes(q)) ||
        (cli && cli.nombre.toLowerCase().includes(q));
    });
  }
  return ordenes.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getOrden(id: string): Orden | null {
  return getDB().ordenes.find(o => o.id === id) || null;
}

export function crearOrden(data: {
  vehiculo_id: string;
  mecanico_id: string;
  falla_reportada: string;
  diagnostico?: string;
  fecha_estimada?: string;
  notas?: string;
  items: Omit<OrdenItem, 'id' | 'orden_id'>[];
}): Orden {
  const db = getDB();
  const now = new Date().toISOString();
  let totalServicios = 0;
  let totalRepuestos = 0;

  const items: OrdenItem[] = data.items.map(item => {
    const subtotal = item.cantidad * item.precio_unitario;
    if (item.tipo === 'servicio') totalServicios += subtotal;
    else totalRepuestos += subtotal;
    return { ...item, id: uuidv4(), orden_id: '', subtotal };
  });

  const orden: Orden = {
    id: uuidv4(),
    vehiculo_id: data.vehiculo_id,
    mecanico_id: data.mecanico_id,
    estado: 'recibido',
    falla_reportada: data.falla_reportada,
    diagnostico: data.diagnostico,
    fecha_ingreso: now,
    fecha_estimada: data.fecha_estimada,
    total_servicios: totalServicios,
    total_repuestos: totalRepuestos,
    total: totalServicios + totalRepuestos,
    notas: data.notas,
    items,
    created_at: now,
    updated_at: now
  };

  orden.items = orden.items.map(i => ({ ...i, orden_id: orden.id }));
  db.ordenes.push(orden);
  saveDB(db);
  return orden;
}

export function actualizarOrdenEstado(id: string, estado: EstadoOrden, usuarioId: string): Orden | null {
  const db = getDB();
  const idx = db.ordenes.findIndex(o => o.id === id);
  if (idx === -1) return null;

  const orden = db.ordenes[idx];
  if (orden.estado === 'entregado' || orden.estado === 'cancelado') return null;

  // Si pasa a "listo", descontar stock de repuestos
  if (estado === 'listo') {
    const itemsRepuesto = orden.items.filter(i => i.tipo === 'repuesto' && i.repuesto_id);
    // Primero verificar que hay stock suficiente para TODOS los items
    for (const item of itemsRepuesto) {
      const repuesto = db.repuestos.find(r => r.id === item.repuesto_id);
      if (!repuesto || repuesto.stock_actual < item.cantidad) {
        throw new Error(`Stock insuficiente de ${repuesto?.nombre || 'repuesto'}. Disponible: ${repuesto?.stock_actual || 0}, requerido: ${item.cantidad}`);
      }
    }
    // Descontar stock usando la versión interna (misma referencia db)
    for (const item of itemsRepuesto) {
      registrarMovimientoInterno(db, item.repuesto_id!, 'salida', item.cantidad, `Orden #${orden.id.slice(0, 6)}`, usuarioId);
    }
  }

  db.ordenes[idx] = {
    ...orden,
    estado,
    fecha_entrega: estado === 'entregado' ? new Date().toISOString() : orden.fecha_entrega,
    updated_at: new Date().toISOString()
  };
  saveDB(db);
  return db.ordenes[idx];
}

export function agregarItemOrden(ordenId: string, item: Omit<OrdenItem, 'id' | 'orden_id'>): Orden | null {
  const db = getDB();
  const idx = db.ordenes.findIndex(o => o.id === ordenId);
  if (idx === -1) return null;
  const orden = db.ordenes[idx];
  if (orden.estado === 'entregado' || orden.estado === 'cancelado') return null;

  const newItem: OrdenItem = { ...item, id: uuidv4(), orden_id: ordenId, subtotal: item.cantidad * item.precio_unitario };
  orden.items.push(newItem);

  // Recalcular totales
  orden.total_servicios = orden.items.filter(i => i.tipo === 'servicio').reduce((s, i) => s + i.subtotal, 0);
  orden.total_repuestos = orden.items.filter(i => i.tipo === 'repuesto').reduce((s, i) => s + i.subtotal, 0);
  orden.total = orden.total_servicios + orden.total_repuestos;
  orden.updated_at = new Date().toISOString();

  saveDB(db);
  return db.ordenes[idx];
}

export function eliminarItemOrden(ordenId: string, itemId: string): Orden | null {
  const db = getDB();
  const idx = db.ordenes.findIndex(o => o.id === ordenId);
  if (idx === -1) return null;
  const orden = db.ordenes[idx];
  if (orden.estado === 'entregado' || orden.estado === 'cancelado') return null;

  orden.items = orden.items.filter(i => i.id !== itemId);
  orden.total_servicios = orden.items.filter(i => i.tipo === 'servicio').reduce((s, i) => s + i.subtotal, 0);
  orden.total_repuestos = orden.items.filter(i => i.tipo === 'repuesto').reduce((s, i) => s + i.subtotal, 0);
  orden.total = orden.total_servicios + orden.total_repuestos;
  orden.updated_at = new Date().toISOString();

  saveDB(db);
  return db.ordenes[idx];
}

// --- PAGOS / CAJA ---
export function cobrarOrden(ordenId: string, metodo: MetodoPago, montoRecibido: number, usuarioId: string): Pago | null {
  const db = getDB();
  const idx = db.ordenes.findIndex(o => o.id === ordenId);
  if (idx === -1) return null;

  const orden = db.ordenes[idx];
  if (orden.estado !== 'listo') return null;

  const cambio = montoRecibido - orden.total;
  const pago: Pago = {
    id: uuidv4(), orden_id: ordenId, metodo, monto: orden.total,
    monto_recibido: montoRecibido, cambio: Math.max(0, cambio),
    usuario_id: usuarioId, created_at: new Date().toISOString()
  };

  db.pagos.push(pago);
  db.ordenes[idx] = { ...orden, estado: 'entregado', fecha_entrega: new Date().toISOString(), updated_at: new Date().toISOString() };
  saveDB(db);
  return pago;
}

export function getResumenHoy(): { total_efectivo: number; total_transferencia: number; total_tarjeta: number; total_mixto: number; total_general: number; ordenes_entregadas: number } {
  const db = getDB();
  const hoy = new Date().toISOString().split('T')[0];
  const pagosHoy = db.pagos.filter(p => p.created_at.startsWith(hoy));

  return {
    total_efectivo: pagosHoy.filter(p => p.metodo === 'efectivo').reduce((s, p) => s + p.monto, 0),
    total_transferencia: pagosHoy.filter(p => p.metodo === 'transferencia').reduce((s, p) => s + p.monto, 0),
    total_tarjeta: pagosHoy.filter(p => p.metodo === 'tarjeta').reduce((s, p) => s + p.monto, 0),
    total_mixto: pagosHoy.filter(p => p.metodo === 'mixto').reduce((s, p) => s + p.monto, 0),
    total_general: pagosHoy.reduce((s, p) => s + p.monto, 0),
    ordenes_entregadas: db.ordenes.filter(o => o.estado === 'entregado' && o.fecha_entrega?.startsWith(hoy)).length
  };
}

export function cerrarCaja(usuarioId: string): CierreCaja {
  const resumen = getResumenHoy();
  const db = getDB();
  const cierre: CierreCaja = {
    id: uuidv4(),
    fecha: new Date().toISOString().split('T')[0],
    ...resumen,
    usuario_id: usuarioId,
    created_at: new Date().toISOString()
  };
  db.cierres.push(cierre);
  saveDB(db);
  return cierre;
}

export function getCierres(): CierreCaja[] {
  return getDB().cierres.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// --- DASHBOARD ---
export function getDashboardResumen(): {
  ingresos_hoy: number;
  ordenes_abiertas: number;
  ordenes_listas: number;
  stock_critico: Repuesto[];
  ordenes_listas_detalle: { orden: Orden; cliente: string; vehiculo: string }[];
  ingresos_7dias: { fecha: string; total: number }[];
} {
  const db = getDB();
  const hoy = new Date().toISOString().split('T')[0];

  const ingresosHoy = db.pagos.filter(p => p.created_at.startsWith(hoy)).reduce((s, p) => s + p.monto, 0);
  const ordenesAbiertas = db.ordenes.filter(o => !['entregado', 'cancelado'].includes(o.estado)).length;
  const ordenesListas = db.ordenes.filter(o => o.estado === 'listo').length;
  const stockCritico = db.repuestos.filter(r => r.activo && r.stock_actual <= r.stock_minimo);

  const ordenesListasDetalle = db.ordenes
    .filter(o => o.estado === 'listo')
    .map(o => {
      const veh = db.vehiculos.find(v => v.id === o.vehiculo_id);
      const cli = veh ? db.clientes.find(c => c.id === veh.cliente_id) : null;
      return { orden: o, cliente: cli?.nombre || '', vehiculo: veh ? `${veh.marca} ${veh.modelo}` : '' };
    });

  // Ingresos últimos 7 días
  const ingresos7dias: { fecha: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const total = db.pagos.filter(p => p.created_at.startsWith(fecha)).reduce((s, p) => s + p.monto, 0);
    ingresos7dias.push({ fecha, total });
  }

  return { ingresos_hoy: ingresosHoy, ordenes_abiertas: ordenesAbiertas, ordenes_listas: ordenesListas, stock_critico: stockCritico, ordenes_listas_detalle: ordenesListasDetalle, ingresos_7dias: ingresos7dias };
}

// --- ALERTAS ---
export function getAlertas(): Alerta[] {
  return getDB().alertas.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function marcarAlertaLeida(id: string): void {
  const db = getDB();
  const idx = db.alertas.findIndex(a => a.id === id);
  if (idx !== -1) {
    db.alertas[idx].leida = true;
    saveDB(db);
  }
}

// --- RESET ---
export function resetDatabase(): void {
  localStorage.removeItem(DB_KEY);
}
