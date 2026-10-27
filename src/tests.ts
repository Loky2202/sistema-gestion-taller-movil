// ============================================================
// PRUEBAS DE LÓGICA DE NEGOCIO
// Ejecutar en la consola del navegador después de cargar la app
// ============================================================

import * as db from './db';

export function runTests() {
  console.log('🧪 Iniciando pruebas de TallerPro...\n');
  
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error: any) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
  }

  // Reset database
  db.resetDatabase();

  // TEST 1: Login
  test('Login con credenciales válidas', () => {
    const user = db.login('admin@taller.com', 'admin123');
    assert(user !== null, 'Usuario no encontrado');
    assert(user!.email === 'admin@taller.com', 'Email incorrecto');
    assert(user!.rol === 'admin', 'Rol incorrecto');
  });

  test('Login con credenciales inválidas', () => {
    const user = db.login('admin@taller.com', 'wrongpassword');
    assert(user === null, 'No debería permitir login');
  });

  // TEST 2: Crear cliente
  test('Crear cliente nuevo', () => {
    const cliente = db.crearCliente({
      nombre: 'Test Cliente',
      telefono: '3111111111',
      email: 'test@test.com'
    });
    assert(cliente.id !== undefined, 'ID no generado');
    assert(cliente.nombre === 'Test Cliente', 'Nombre incorrecto');
    
    const clientes = db.getClientes();
    assert(clientes.some(c => c.id === cliente.id), 'Cliente no guardado');
  });

  // TEST 3: Crear vehículo
  test('Crear vehículo nuevo', () => {
    const clientes = db.getClientes();
    const cliente = clientes[0];
    
    const vehiculo = db.crearVehiculo({
      placa: 'TEST123',
      tipo: 'moto',
      marca: 'Honda',
      modelo: 'CBR',
      anio: 2023,
      color: 'Rojo',
      cliente_id: cliente.id
    });
    
    assert(vehiculo.id !== undefined, 'ID no generado');
    assert(vehiculo.placa === 'TEST123', 'Placa incorrecta');
    
    const vehiculos = db.getVehiculosByCliente(cliente.id);
    assert(vehiculos.some(v => v.id === vehiculo.id), 'Vehículo no guardado');
  });

  // TEST 4: Crear orden
  test('Crear orden de servicio', () => {
    const vehiculos = db.getVehiculos();
    const vehiculo = vehiculos.find(v => v.placa === 'TEST123');
    const usuarios = db.getUsuarios();
    const mecanico = usuarios.find(u => u.rol === 'mecanico');
    
    const orden = db.crearOrden({
      vehiculo_id: vehiculo!.id,
      mecanico_id: mecanico!.id,
      falla_reportada: 'Ruido en el motor',
      diagnostico: 'Cadena floja',
      items: [
        {
          tipo: 'servicio',
          descripcion: 'Ajuste de cadena',
          cantidad: 1,
          precio_unitario: 50000,
          subtotal: 50000
        }
      ]
    });
    
    assert(orden.id !== undefined, 'ID no generado');
    assert(orden.estado === 'recibido', 'Estado inicial incorrecto');
    assert(orden.total === 50000, 'Total incorrecto');
    
    const ordenes = db.getOrdenes();
    assert(ordenes.some(o => o.id === orden.id), 'Orden no guardada');
  });

  // TEST 5: Agregar repuesto a orden
  test('Agregar repuesto a orden', () => {
    const ordenes = db.getOrdenes();
    const orden = ordenes.find(o => o.falla_reportada === 'Ruido en el motor');
    const repuestos = db.getRepuestos();
    const aceite = repuestos.find(r => r.sku === 'ACE-001');
    
    const stockAntes = aceite!.stock_actual;
    
    db.agregarItemOrden(orden!.id, {
      tipo: 'repuesto',
      repuesto_id: aceite!.id,
      descripcion: aceite!.nombre,
      cantidad: 2,
      precio_unitario: aceite!.precio_venta,
      subtotal: 2 * aceite!.precio_venta
    });
    
    const ordenActualizada = db.getOrden(orden!.id);
    assert(ordenActualizada!.items.length === 2, 'Item no agregado');
    assert(ordenActualizada!.total_repuestos === 2 * aceite!.precio_venta, 'Total repuestos incorrecto');
    
    // Stock NO debe cambiar hasta marcar como "listo"
    const aceiteDespues = db.getRepuesto(aceite!.id);
    assert(aceiteDespues!.stock_actual === stockAntes, 'Stock cambió antes de tiempo');
  });

  // TEST 6: Cambiar estado a "listo" (descuenta stock)
  test('Cambiar estado a listo descuenta stock', () => {
    const ordenes = db.getOrdenes();
    const orden = ordenes.find(o => o.falla_reportada === 'Ruido en el motor');
    const usuarios = db.getUsuarios();
    const mecanico = usuarios.find(u => u.rol === 'mecanico');
    
    const repuestos = db.getRepuestos();
    const aceite = repuestos.find(r => r.sku === 'ACE-001');
    const stockAntes = aceite!.stock_actual;
    
    db.actualizarOrdenEstado(orden!.id, 'listo', mecanico!.id);
    
    const ordenActualizada = db.getOrden(orden!.id);
    assert(ordenActualizada!.estado === 'listo', 'Estado no cambió');
    
    const aceiteDespues = db.getRepuesto(aceite!.id);
    assert(aceiteDespues!.stock_actual === stockAntes - 2, 'Stock no se descontó correctamente');
  });

  // TEST 7: Alerta de stock bajo
  test('Generar alerta cuando stock baja del mínimo', () => {
    const repuestos = db.getRepuestos();
    const aceite = repuestos.find(r => r.sku === 'ACE-001');
    
    // Stock actual debería ser 13 (15 - 2)
    // Stock mínimo es 5, así que NO debería haber alerta aún
    const alertas = db.getAlertas();
    const alertaAceite = alertas.find(a => a.repuesto_id === aceite!.id && !a.leida);
    
    // Si stock_actual (13) > stock_minimo (5), no hay alerta
    if (aceite!.stock_actual > aceite!.stock_minimo) {
      assert(alertaAceite === undefined, 'No debería haber alerta');
    } else {
      assert(alertaAceite !== undefined, 'Debería haber alerta');
    }
  });

  // TEST 8: Cobrar orden
  test('Cobrar orden cambia estado a entregado', () => {
    const ordenes = db.getOrdenes();
    const orden = ordenes.find(o => o.falla_reportada === 'Ruido en el motor');
    const usuarios = db.getUsuarios();
    const admin = usuarios.find(u => u.rol === 'admin');
    
    db.cobrarOrden(orden!.id, 'efectivo', orden!.total, admin!.id);
    
    const ordenActualizada = db.getOrden(orden!.id);
    assert(ordenActualizada!.estado === 'entregado', 'Estado no cambió a entregado');
    assert(ordenActualizada!.fecha_entrega !== undefined, 'Fecha de entrega no registrada');
    
    const pagos = db.getResumenHoy();
    assert(pagos.total_efectivo >= orden!.total, 'Pago no registrado');
  });

  // TEST 9: No se puede editar orden entregada
  test('No se puede editar orden entregada', () => {
    const ordenes = db.getOrdenes();
    const orden = ordenes.find(o => o.falla_reportada === 'Ruido en el motor');
    const usuarios = db.getUsuarios();
    const mecanico = usuarios.find(u => u.rol === 'mecanico');
    
    const resultado = db.actualizarOrdenEstado(orden!.id, 'en_reparacion', mecanico!.id);
    assert(resultado === null, 'No debería permitir editar orden entregada');
  });

  // TEST 10: Validación de stock insuficiente
  test('No permite marcar listo si no hay stock suficiente', () => {
    // Crear orden con repuesto que no tiene stock
    const vehiculos = db.getVehiculos();
    const vehiculo = vehiculos[0];
    const usuarios = db.getUsuarios();
    const mecanico = usuarios.find(u => u.rol === 'mecanico');
    const repuestos = db.getRepuestos();
    const repuesto = repuestos.find(r => r.stock_actual === 0) || repuestos[0];
    
    // Forzar stock a 0
    db.actualizarRepuesto(repuesto.id, { stock_actual: 0 });
    
    const orden = db.crearOrden({
      vehiculo_id: vehiculo.id,
      mecanico_id: mecanico!.id,
      falla_reportada: 'Test stock',
      items: [
        {
          tipo: 'repuesto',
          repuesto_id: repuesto.id,
          descripcion: repuesto.nombre,
          cantidad: 1,
          precio_unitario: repuesto.precio_venta,
          subtotal: repuesto.precio_venta
        }
      ]
    });
    
    let error = false;
    try {
      db.actualizarOrdenEstado(orden.id, 'listo', mecanico!.id);
    } catch (e: any) {
      error = true;
      assert(e.message.includes('Stock insuficiente'), 'Mensaje de error incorrecto');
    }
    
    assert(error, 'Debería lanzar error por stock insuficiente');
    
    // Restaurar stock
    db.actualizarRepuesto(repuesto.id, { stock_actual: 5 });
  });

  // TEST 11: Buscar vehículos
  test('Buscar vehículos por placa o cliente', () => {
    const resultados1 = db.buscarVehiculos('TEST');
    assert(resultados1.length > 0, 'No encontró vehículos por placa');
    
    const resultados2 = db.buscarVehiculos('Test Cliente');
    assert(resultados2.length > 0, 'No encontró vehículos por cliente');
  });

  // TEST 12: Dashboard resumen
  test('Dashboard muestra datos correctos', () => {
    const resumen = db.getDashboardResumen();
    assert(typeof resumen.ingresos_hoy === 'number', 'Ingresos no es número');
    assert(typeof resumen.ordenes_abiertas === 'number', 'Órdenes abiertas no es número');
    assert(Array.isArray(resumen.stock_critico), 'Stock crítico no es array');
    assert(Array.isArray(resumen.ingresos_7dias), 'Ingresos 7 días no es array');
  });

  // TEST 13: Crear repuesto
  test('Crear repuesto nuevo', () => {
    const repuesto = db.crearRepuesto({
      sku: 'TEST-001',
      nombre: 'Repuesto Test',
      categoria: 'Motor',
      unidad: 'unidad',
      stock_actual: 10,
      stock_minimo: 3,
      precio_costo: 5000,
      precio_venta: 10000,
      proveedor: 'Test Proveedor',
      activo: true
    });
    
    assert(repuesto.id !== undefined, 'ID no generado');
    assert(repuesto.sku === 'TEST-001', 'SKU incorrecto');
    
    const repuestos = db.getRepuestos();
    assert(repuestos.some(r => r.id === repuesto.id), 'Repuesto no guardado');
  });

  // TEST 14: Movimientos de inventario
  test('Registrar movimiento de inventario', () => {
    const repuestos = db.getRepuestos();
    const repuesto = repuestos.find(r => r.sku === 'TEST-001');
    const usuarios = db.getUsuarios();
    const admin = usuarios.find(u => u.rol === 'admin');
    
    const stockAntes = repuesto!.stock_actual;
    
    db.registrarMovimiento(repuesto!.id, 'entrada', 5, 'Compra test', admin!.id);
    
    const repuestoDespues = db.getRepuesto(repuesto!.id);
    assert(repuestoDespues!.stock_actual === stockAntes + 5, 'Stock no se actualizó');
    
    const movimientos = db.getMovimientosByRepuesto(repuesto!.id);
    assert(movimientos.length > 0, 'Movimiento no registrado');
    assert(movimientos[0].tipo === 'entrada', 'Tipo de movimiento incorrecto');
  });

  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Resultados: ${passed} pasadas, ${failed} fallidas`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('\n🎉 ¡Todas las pruebas pasaron!');
  } else {
    console.log(`\n⚠️  ${failed} prueba(s) fallaron`);
  }
  
  return { passed, failed };
}

// Para ejecutar en la consola del navegador:
// import('./tests').then(m => m.runTests())
