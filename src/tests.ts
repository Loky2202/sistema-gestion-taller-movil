// ============================================================
// PRUEBAS DE LÓGICA DE NEGOCIO
// Se ejecutan contra el API real (reinicia los datos al inicio).
// ============================================================

import * as db from './db';

export async function runTests() {
  console.log('🧪 Iniciando pruebas de TallerPro...\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
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

  // Reiniciar datos de ejemplo antes de probar
  await db.resetDatabase();

  // TEST 1: Login
  await test('Login con credenciales válidas', async () => {
    const user = await db.login('admin@taller.com', 'admin123');
    assert(user !== null, 'Usuario no encontrado');
    assert(user!.email === 'admin@taller.com', 'Email incorrecto');
    assert(user!.rol === 'admin', 'Rol incorrecto');
  });

  await test('Login con credenciales inválidas', async () => {
    let fallo = false;
    try {
      await db.login('admin@taller.com', 'wrongpassword');
    } catch {
      fallo = true;
    }
    assert(fallo, 'No debería permitir login');
  });

  // TEST 2: Crear cliente
  await test('Crear cliente nuevo', async () => {
    const cliente = await db.crearCliente({
      nombre: 'Test Cliente',
      telefono: '3111111111',
      email: 'test@test.com',
    });
    assert(cliente.id !== undefined, 'ID no generado');
    assert(cliente.nombre === 'Test Cliente', 'Nombre incorrecto');

    const clientes = await db.getClientes();
    assert(clientes.some(c => c.id === cliente.id), 'Cliente no guardado');
  });

  // TEST 3: Crear vehículo
  await test('Crear vehículo nuevo', async () => {
    const clientes = await db.getClientes();
    const cliente = clientes.find(c => c.telefono === '3111111111')!;

    const vehiculo = await db.crearVehiculo({
      placa: 'TEST123',
      tipo: 'moto',
      marca: 'Honda',
      modelo: 'CBR',
      anio: 2023,
      color: 'Rojo',
      cliente_id: cliente.id,
    });

    assert(vehiculo.id !== undefined, 'ID no generado');
    assert(vehiculo.placa === 'TEST123', 'Placa incorrecta');

    const vehiculos = await db.getVehiculosByCliente(cliente.id);
    assert(vehiculos.some(v => v.id === vehiculo.id), 'Vehículo no guardado');
  });

  // TEST 4: Crear orden
  await test('Crear orden de servicio', async () => {
    const vehiculos = await db.getVehiculos();
    const vehiculo = vehiculos.find(v => v.placa === 'TEST123')!;

    const orden = await db.crearOrden({
      vehiculo_id: vehiculo.id,
      mecanico_id: '',
      falla_reportada: 'Ruido en el motor',
      diagnostico: 'Cadena floja',
      items: [
        {
          tipo: 'servicio',
          descripcion: 'Ajuste de cadena',
          cantidad: 1,
          precio_unitario: 50000,
          subtotal: 50000,
        },
      ],
    });

    assert(orden.id !== undefined, 'ID no generado');
    assert(orden.estado === 'recibido', 'Estado inicial incorrecto');
    assert(orden.total === 50000, 'Total incorrecto');

    const ordenes = await db.getOrdenes();
    assert(ordenes.some(o => o.id === orden.id), 'Orden no guardada');
  });

  // TEST 5: Agregar repuesto a orden
  await test('Agregar repuesto a orden', async () => {
    const ordenes = await db.getOrdenes();
    const orden = ordenes.find(o => o.falla_reportada === 'Ruido en el motor')!;
    const repuestos = await db.getRepuestos();
    const aceite = repuestos.find(r => r.sku === 'ACE-001')!;

    const stockAntes = aceite.stock_actual;

    await db.agregarItemOrden(orden.id, {
      tipo: 'repuesto',
      repuesto_id: aceite.id,
      descripcion: aceite.nombre,
      cantidad: 2,
      precio_unitario: aceite.precio_venta,
      subtotal: 2 * aceite.precio_venta,
    });

    const ordenActualizada = await db.getOrden(orden.id);
    assert(ordenActualizada!.items.length === 2, 'Item no agregado');
    assert(ordenActualizada!.total_repuestos === 2 * aceite.precio_venta, 'Total repuestos incorrecto');

    // Stock NO debe cambiar hasta marcar como "listo"
    const aceiteDespues = await db.getRepuesto(aceite.id);
    assert(aceiteDespues!.stock_actual === stockAntes, 'Stock cambió antes de tiempo');
  });

  // TEST 6: Cambiar estado a "listo" (descuenta stock)
  await test('Cambiar estado a listo descuenta stock', async () => {
    const ordenes = await db.getOrdenes();
    const orden = ordenes.find(o => o.falla_reportada === 'Ruido en el motor')!;

    const repuestos = await db.getRepuestos();
    const aceite = repuestos.find(r => r.sku === 'ACE-001')!;
    const stockAntes = aceite.stock_actual;

    await db.actualizarOrdenEstado(orden.id, 'listo');

    const ordenActualizada = await db.getOrden(orden.id);
    assert(ordenActualizada!.estado === 'listo', 'Estado no cambió');

    const aceiteDespues = await db.getRepuesto(aceite.id);
    assert(aceiteDespues!.stock_actual === stockAntes - 2, 'Stock no se descontó correctamente');
  });

  // TEST 7: Alerta de stock bajo
  await test('Generar alerta cuando stock baja del mínimo', async () => {
    const repuestos = await db.getRepuestos();
    const aceite = repuestos.find(r => r.sku === 'ACE-001')!;

    const alertas = await db.getAlertas();
    const alertaAceite = alertas.find(a => a.repuesto_id === aceite.id && !a.leida);

    if (aceite.stock_actual > aceite.stock_minimo) {
      assert(alertaAceite === undefined, 'No debería haber alerta');
    } else {
      assert(alertaAceite !== undefined, 'Debería haber alerta');
    }
  });

  // TEST 8: Cobrar orden
  await test('Cobrar orden cambia estado a entregado', async () => {
    const ordenes = await db.getOrdenes();
    const orden = ordenes.find(o => o.falla_reportada === 'Ruido en el motor')!;

    await db.cobrarOrden(orden.id, 'efectivo', orden.total);

    const ordenActualizada = await db.getOrden(orden.id);
    assert(ordenActualizada!.estado === 'entregado', 'Estado no cambió a entregado');
    assert(ordenActualizada!.fecha_entrega !== undefined, 'Fecha de entrega no registrada');

    const pagos = await db.getResumenHoy();
    assert(pagos.total_efectivo >= orden.total, 'Pago no registrado');
  });

  // TEST 9: No se puede editar orden entregada
  await test('No se puede editar orden entregada', async () => {
    const ordenes = await db.getOrdenes();
    const orden = ordenes.find(o => o.falla_reportada === 'Ruido en el motor')!;

    let fallo = false;
    try {
      await db.actualizarOrdenEstado(orden.id, 'en_reparacion');
    } catch {
      fallo = true;
    }
    assert(fallo, 'No debería permitir editar orden entregada');
  });

  // TEST 10: Validación de stock insuficiente
  await test('No permite marcar listo si no hay stock suficiente', async () => {
    const vehiculos = await db.getVehiculos();
    const vehiculo = vehiculos[0];
    const repuestos = await db.getRepuestos();
    const repuesto = repuestos.find(r => r.stock_actual === 0) || repuestos[0];

    await db.actualizarRepuesto(repuesto.id, { stock_actual: 0 });

    const orden = await db.crearOrden({
      vehiculo_id: vehiculo.id,
      mecanico_id: '',
      falla_reportada: 'Test stock',
      items: [
        {
          tipo: 'repuesto',
          repuesto_id: repuesto.id,
          descripcion: repuesto.nombre,
          cantidad: 1,
          precio_unitario: repuesto.precio_venta,
          subtotal: repuesto.precio_venta,
        },
      ],
    });

    let error: any = null;
    try {
      await db.actualizarOrdenEstado(orden.id, 'listo');
    } catch (e: any) {
      error = e;
    }

    assert(error !== null, 'Debería lanzar error por stock insuficiente');
    assert(
      String(error.message).includes('Stock insuficiente'),
      'Mensaje de error incorrecto'
    );

    // Restaurar stock
    await db.actualizarRepuesto(repuesto.id, { stock_actual: 5 });
  });

  // TEST 11: Buscar vehículos
  await test('Buscar vehículos por placa o cliente', async () => {
    const resultados1 = await db.buscarVehiculos('TEST');
    assert(resultados1.length > 0, 'No encontró vehículos por placa');

    const resultados2 = await db.buscarVehiculos('Test Cliente');
    assert(resultados2.length > 0, 'No encontró vehículos por cliente');
  });

  // TEST 12: Dashboard resumen
  await test('Dashboard muestra datos correctos', async () => {
    const resumen = await db.getDashboardResumen();
    assert(typeof resumen.ingresos_hoy === 'number', 'Ingresos no es número');
    assert(typeof resumen.ordenes_abiertas === 'number', 'Órdenes abiertas no es número');
    assert(Array.isArray(resumen.stock_critico), 'Stock crítico no es array');
    assert(Array.isArray(resumen.ingresos_7dias), 'Ingresos 7 días no es array');
  });

  // TEST 13: Crear repuesto
  await test('Crear repuesto nuevo', async () => {
    const repuesto = await db.crearRepuesto({
      sku: 'TEST-001',
      nombre: 'Repuesto Test',
      categoria: 'Motor',
      unidad: 'unidad',
      stock_actual: 10,
      stock_minimo: 3,
      precio_costo: 5000,
      precio_venta: 10000,
      proveedor: 'Test Proveedor',
      activo: true,
    });

    assert(repuesto.id !== undefined, 'ID no generado');
    assert(repuesto.sku === 'TEST-001', 'SKU incorrecto');

    const repuestos = await db.getRepuestos();
    assert(repuestos.some(r => r.id === repuesto.id), 'Repuesto no guardado');
  });

  // TEST 14: Movimientos de inventario
  await test('Registrar movimiento de inventario', async () => {
    const repuestos = await db.getRepuestos();
    const repuesto = repuestos.find(r => r.sku === 'TEST-001')!;

    const stockAntes = repuesto.stock_actual;

    await db.registrarMovimiento(repuesto.id, 'entrada', 5, 'Compra test');

    const repuestoDespues = await db.getRepuesto(repuesto.id);
    assert(repuestoDespues!.stock_actual === stockAntes + 5, 'Stock no se actualizó');

    const movimientos = await db.getMovimientosByRepuesto(repuesto.id);
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
