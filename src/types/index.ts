// ============================================================
// TIPOS DEL SISTEMA - Taller de Reparación
// ============================================================

export type Rol = 'admin' | 'mecanico';

export type EstadoOrden = 'recibido' | 'en_reparacion' | 'esperando_repuesto' | 'listo' | 'entregado' | 'cancelado';

export type TipoVehiculo = 'moto' | 'carro';

export type TipoItem = 'servicio' | 'repuesto';

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto';

export type Unidad = 'unidad' | 'litro' | 'metro' | 'juego';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  /** Solo se usa al crear/actualizar; nunca lo devuelve el backend. */
  password?: string;
  rol: Rol;
  activo: boolean;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  notas?: string;
  created_at: string;
}

export interface Vehiculo {
  id: string;
  placa: string;
  tipo: TipoVehiculo;
  marca: string;
  modelo: string;
  anio: number;
  color?: string;
  foto_url?: string;
  cliente_id: string;
  created_at: string;
}

export interface OrdenItem {
  id: string;
  orden_id: string;
  tipo: TipoItem;
  repuesto_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Orden {
  id: string;
  vehiculo_id: string;
  mecanico_id: string;
  estado: EstadoOrden;
  falla_reportada: string;
  diagnostico?: string;
  fecha_ingreso: string;
  fecha_estimada?: string;
  fecha_entrega?: string;
  total_servicios: number;
  total_repuestos: number;
  total: number;
  notas?: string;
  items: OrdenItem[];
  created_at: string;
  updated_at: string;
}

export interface Repuesto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidad: Unidad;
  stock_actual: number;
  stock_minimo: number;
  precio_costo: number;
  precio_venta: number;
  proveedor?: string;
  foto_url?: string;
  activo: boolean;
  created_at: string;
}

export interface MovimientoInventario {
  id: string;
  repuesto_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  usuario_id: string;
  created_at: string;
}

export interface Pago {
  id: string;
  orden_id: string;
  metodo: MetodoPago;
  monto: number;
  monto_recibido: number;
  cambio: number;
  usuario_id: string;
  created_at: string;
}

export interface Alerta {
  id: string;
  repuesto_id: string;
  tipo: 'stock_bajo';
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export interface CierreCaja {
  id: string;
  fecha: string;
  total_efectivo: number;
  total_transferencia: number;
  total_tarjeta: number;
  total_mixto: number;
  total_general: number;
  usuario_id: string;
  created_at: string;
}

export interface DashboardResumen {
  ingresos_hoy: number;
  ordenes_abiertas: number;
  ordenes_listas: number;
  stock_critico: Repuesto[];
  ordenes_listas_detalle: { orden: Orden; cliente: string; vehiculo: string }[];
  ingresos_7dias: { fecha: string; total: number }[];
}
