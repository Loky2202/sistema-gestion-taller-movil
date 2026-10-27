// ============================================================
// CAPA DE DATOS - Cliente del API (FastAPI + SQLite)
// Mantiene los nombres usados por las pantallas, ahora asíncronos.
// ============================================================
import { api, ApiError, setToken } from '../api/client';
import type {
  Usuario, Cliente, Vehiculo, Orden, OrdenItem, Repuesto,
  MovimientoInventario, Pago, Alerta, CierreCaja,
  EstadoOrden, MetodoPago, TipoMovimiento, DashboardResumen,
} from '../types';

// Devuelve null cuando el recurso no existe (404) en lugar de lanzar.
async function maybe<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

const toInt = (value: number | string | undefined, fallback = 0): number => {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? Math.round(n as number) : fallback;
};

// --- AUTH ---
export async function login(email: string, password: string): Promise<Usuario | null> {
  const data = await api.login<{ access_token: string; token_type: string; user: Usuario }>(
    '/auth/login',
    { email, password }
  );
  setToken(data.access_token);
  return data.user;
}

/** Valida el token guardado y devuelve el usuario actual. */
export async function getMe(): Promise<Usuario | null> {
  return maybe(api.get<Usuario>('/auth/me'));
}

export function logout(): void {
  setToken(null);
}

export async function getUsuario(id: string): Promise<Usuario | null> {
  return maybe(api.get<Usuario>(`/usuarios/${id}`));
}

export async function getUsuarios(): Promise<Usuario[]> {
  return api.get<Usuario[]>('/usuarios');
}

export async function crearUsuario(data: Omit<Usuario, 'id' | 'created_at'>): Promise<Usuario> {
  return api.post<Usuario>('/usuarios', data);
}

export async function actualizarUsuario(id: string, data: Partial<Usuario>): Promise<Usuario | null> {
  return maybe(api.patch<Usuario>(`/usuarios/${id}`, data));
}

// --- CLIENTES ---
export async function getClientes(query?: string): Promise<Cliente[]> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  return api.get<Cliente[]>(`/clientes${qs}`);
}

export async function getCliente(id: string): Promise<Cliente | null> {
  return maybe(api.get<Cliente>(`/clientes/${id}`));
}

export async function crearCliente(data: Omit<Cliente, 'id' | 'created_at'>): Promise<Cliente> {
  return api.post<Cliente>('/clientes', data);
}

export async function actualizarCliente(id: string, data: Partial<Cliente>): Promise<Cliente | null> {
  return maybe(api.patch<Cliente>(`/clientes/${id}`, data));
}

// --- VEHICULOS ---
export async function getVehiculos(): Promise<Vehiculo[]> {
  return api.get<Vehiculo[]>('/vehiculos');
}

export async function getVehiculo(id: string): Promise<Vehiculo | null> {
  return maybe(api.get<Vehiculo>(`/vehiculos/${id}`));
}

export async function buscarVehiculos(query: string): Promise<Vehiculo[]> {
  if (!query.trim()) return [];
  return api.get<Vehiculo[]>(`/vehiculos?q=${encodeURIComponent(query)}`);
}

export async function crearVehiculo(data: Omit<Vehiculo, 'id' | 'created_at'>): Promise<Vehiculo> {
  return api.post<Vehiculo>('/vehiculos', data);
}

export async function actualizarVehiculo(id: string, data: Partial<Vehiculo>): Promise<Vehiculo | null> {
  return maybe(api.patch<Vehiculo>(`/vehiculos/${id}`, data));
}

export async function getVehiculosByCliente(clienteId: string): Promise<Vehiculo[]> {
  return api.get<Vehiculo[]>(`/clientes/${clienteId}/vehiculos`);
}

export async function getHistorialVehiculo(vehiculoId: string): Promise<Orden[]> {
  return api.get<Orden[]>(`/vehiculos/${vehiculoId}/historial`);
}

// --- REPUESTOS ---
export async function getRepuestos(): Promise<Repuesto[]> {
  return api.get<Repuesto[]>('/repuestos');
}

export async function getRepuesto(id: string): Promise<Repuesto | null> {
  return maybe(api.get<Repuesto>(`/repuestos/${id}`));
}

export async function buscarRepuestos(query: string): Promise<Repuesto[]> {
  if (!query.trim()) return getRepuestos();
  return api.get<Repuesto[]>(`/repuestos?q=${encodeURIComponent(query)}`);
}

export async function getStockBajo(): Promise<Repuesto[]> {
  return api.get<Repuesto[]>('/repuestos/stock-bajo');
}

export async function crearRepuesto(data: Omit<Repuesto, 'id' | 'created_at'>): Promise<Repuesto> {
  return api.post<Repuesto>('/repuestos', {
    ...data,
    stock_actual: toInt(data.stock_actual),
    stock_minimo: toInt(data.stock_minimo),
  });
}

export async function actualizarRepuesto(id: string, data: Partial<Repuesto>): Promise<Repuesto | null> {
  return maybe(api.patch<Repuesto>(`/repuestos/${id}`, data));
}

export async function registrarMovimiento(
  repuestoId: string,
  tipo: TipoMovimiento,
  cantidad: number,
  motivo: string,
  _usuarioId?: string
): Promise<MovimientoInventario> {
  return api.post<MovimientoInventario>(`/repuestos/${repuestoId}/movimientos`, {
    tipo,
    cantidad: toInt(cantidad),
    motivo,
  });
}

export async function getMovimientosByRepuesto(repuestoId: string): Promise<MovimientoInventario[]> {
  return api.get<MovimientoInventario[]>(`/repuestos/${repuestoId}/movimientos`);
}

// --- ORDENES ---
export async function getOrdenes(estado?: EstadoOrden, query?: string): Promise<Orden[]> {
  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  if (query?.trim()) params.set('q', query.trim());
  const qs = params.toString();
  return api.get<Orden[]>(`/ordenes${qs ? `?${qs}` : ''}`);
}

export async function getOrden(id: string): Promise<Orden | null> {
  return maybe(api.get<Orden>(`/ordenes/${id}`));
}

export async function crearOrden(data: {
  vehiculo_id: string;
  mecanico_id: string;
  falla_reportada: string;
  diagnostico?: string;
  fecha_estimada?: string;
  notas?: string;
  items: Omit<OrdenItem, 'id' | 'orden_id'>[];
}): Promise<Orden> {
  return api.post<Orden>('/ordenes', {
    vehiculo_id: data.vehiculo_id,
    falla_reportada: data.falla_reportada,
    diagnostico: data.diagnostico,
    fecha_estimada: data.fecha_estimada,
    notas: data.notas,
    items: data.items.map(i => ({
      tipo: i.tipo,
      repuesto_id: i.repuesto_id,
      descripcion: i.descripcion,
      cantidad: toInt(i.cantidad, 1),
      precio_unitario: i.precio_unitario,
    })),
  });
}

export async function actualizarOrdenEstado(
  id: string,
  estado: EstadoOrden,
  _usuarioId?: string
): Promise<Orden | null> {
  return maybe(api.patch<Orden>(`/ordenes/${id}/estado`, { estado }));
}

export async function agregarItemOrden(
  ordenId: string,
  item: Omit<OrdenItem, 'id' | 'orden_id'>
): Promise<Orden | null> {
  return maybe(
    api.post<Orden>(`/ordenes/${ordenId}/items`, {
      tipo: item.tipo,
      repuesto_id: item.repuesto_id,
      descripcion: item.descripcion,
      cantidad: toInt(item.cantidad, 1),
      precio_unitario: item.precio_unitario,
    })
  );
}

export async function eliminarItemOrden(ordenId: string, itemId: string): Promise<Orden | null> {
  return maybe(api.del<Orden>(`/ordenes/${ordenId}/items/${itemId}`));
}

// --- PAGOS / CAJA ---
export async function cobrarOrden(
  ordenId: string,
  metodo: MetodoPago,
  montoRecibido: number,
  _usuarioId?: string
): Promise<Pago | null> {
  return maybe(
    api.post<Pago>(`/ordenes/${ordenId}/cobrar`, {
      metodo,
      monto_recibido: montoRecibido,
    })
  );
}

export async function getResumenHoy(): Promise<{
  total_efectivo: number;
  total_transferencia: number;
  total_tarjeta: number;
  total_mixto: number;
  total_general: number;
  ordenes_entregadas: number;
}> {
  return api.get('/caja/resumen-hoy');
}

export async function cerrarCaja(_usuarioId?: string): Promise<CierreCaja> {
  return api.post<CierreCaja>('/caja/cerrar');
}

export async function getCierres(): Promise<CierreCaja[]> {
  return api.get<CierreCaja[]>('/caja/cierres');
}

// --- DASHBOARD ---
export async function getDashboardResumen(): Promise<DashboardResumen> {
  return api.get<DashboardResumen>('/dashboard/resumen');
}

// --- ALERTAS ---
export async function getAlertas(): Promise<Alerta[]> {
  return api.get<Alerta[]>('/alertas');
}

export async function marcarAlertaLeida(id: string): Promise<void> {
  await api.patch<Alerta>(`/alertas/${id}/leida`);
}

// --- RESET ---
export async function resetDatabase(): Promise<void> {
  await api.post('/admin/reset');
}
