# Guía de Pruebas - TallerPro

## 🧪 Cómo ejecutar las pruebas

### Opción 1: Desde la interfaz (Recomendado)

1. Inicia sesión como **administrador** (`admin@taller.com` / `admin123`)
2. Ve a la pestaña **Perfil**
3. Haz clic en **"Ejecutar Pruebas del Sistema"**
4. Verás los resultados en pantalla (pasadas/fallidas)
5. Abre la consola del navegador (F12) para ver el detalle de cada prueba

### Opción 2: Desde la consola del navegador

1. Abre la aplicación en el navegador
2. Presiona F12 para abrir las herramientas de desarrollador
3. Ve a la pestaña "Console"
4. Ejecuta:

```javascript
import('./tests').then(m => m.runTests())
```

## 📋 Pruebas implementadas

### 1. Autenticación
- ✅ Login con credenciales válidas
- ✅ Login con credenciales inválidas

### 2. Clientes
- ✅ Crear cliente nuevo

### 3. Vehículos
- ✅ Crear vehículo nuevo
- ✅ Buscar vehículos por placa
- ✅ Buscar vehículos por nombre de cliente

### 4. Órdenes de Servicio
- ✅ Crear orden de servicio
- ✅ Agregar repuesto a orden
- ✅ Cambiar estado a "listo" (descuenta stock)
- ✅ Cobrar orden (cambia estado a "entregado")
- ✅ No se puede editar orden entregada
- ✅ Validación de stock insuficiente

### 5. Inventario
- ✅ Crear repuesto nuevo
- ✅ Registrar movimiento de inventario
- ✅ Alerta de stock bajo

### 6. Dashboard
- ✅ Resumen muestra datos correctos

## 🐛 Bugs corregidos

### Bug crítico #1: Stock no se descontaba
**Problema**: Al marcar una orden como "listo", el stock de repuestos no se descontaba correctamente.

**Causa**: La función `actualizarOrdenEstado` llamaba a `registrarMovimiento`, que guardaba en localStorage, pero luego `actualizarOrdenEstado` hacía `saveDB(db)` con una referencia antigua de `db`, sobreescribiendo los cambios.

**Solución**: Crear `registrarMovimientoInterno` que opera sobre la misma referencia de `db` que `actualizarOrdenEstado`.

### Bug crítico #2: UI no se actualizaba
**Problema**: Al cambiar el estado de una orden, la pantalla no mostraba el nuevo estado.

**Causa**: Los componentes usaban `useMemo` sin las dependencias correctas, por lo que no se recalculaban cuando los datos cambiaban.

**Solución**: Agregar variable `refresh` al estado y usarla como dependencia en `useMemo`.

### Bug crítico #3: Dashboard no mostraba datos actualizados
**Problema**: El dashboard no actualizaba los ingresos del día al navegar desde otra pantalla.

**Causa**: Usaba `useMemo` sin dependencias, calculando los datos solo una vez.

**Solución**: Eliminar `useMemo` y calcular los datos directamente en cada render.

## 🔍 Qué verificar manualmente

Además de las pruebas automatizadas, verifica estos flujos manualmente:

### Flujo completo de orden
1. Crear cliente nuevo
2. Crear vehículo para ese cliente
3. Crear orden con servicios y repuestos
4. Cambiar estado a "En reparación"
5. Cambiar estado a "Listo" (verificar que el stock se descuenta)
6. Cobrar la orden (verificar que pasa a "Entregado")
7. Verificar que aparece en los ingresos del día

### Flujo de inventario
1. Crear repuesto nuevo
2. Registrar entrada de stock
3. Verificar que el stock aumenta
4. Crear orden con ese repuesto
5. Marcar orden como "listo"
6. Verificar que el stock disminuye
7. Si baja del mínimo, verificar que aparece alerta en Dashboard

### Flujo de validación
1. Crear orden con repuesto que tiene stock = 1
2. Agregar 2 unidades del repuesto a la orden
3. Intentar marcar como "listo"
4. Debe mostrar error "Stock insuficiente"

### Flujo de roles
1. Login como mecánico
2. Verificar que NO puede crear repuestos
3. Verificar que SÍ puede crear órdenes
4. Verificar que SÍ puede cambiar estados de órdenes

### Flujo offline
1. Abrir la app
2. Desconectar internet (modo avión)
3. Verificar que aparece banner "Sin conexión"
4. Verificar que los datos siguen visibles
5. Reconectar internet
6. Verificar que desaparece el banner

## 📊 Métricas de calidad

- **Cobertura de lógica de negocio**: 14 pruebas automatizadas
- **Flujos críticos cubiertos**: Login, Órdenes, Inventario, Pagos
- **Validaciones probadas**: Stock insuficiente, edición de órdenes finalizadas
- **Roles probados**: Admin y Mecánico

## 🚨 Limitaciones

Estas pruebas verifican la **lógica de negocio** pero no:
- ❌ Renderizado visual de componentes
- ❌ Interacciones de usuario (clicks, scrolls)
- ❌ Responsive design en diferentes dispositivos
- ❌ Performance y tiempos de carga
- ❌ Accesibilidad (WCAG)

Para pruebas de UI se recomienda agregar:
- React Testing Library
- Cypress o Playwright para E2E
- Lighthouse para performance y accesibilidad

## 🔄 Regenerar datos de prueba

Si las pruebas modifican los datos y quieres volver al estado inicial:

1. Ve a **Perfil**
2. Haz clic en **"Restablecer datos de ejemplo"**
3. Confirma la acción
4. Se cerrará la sesión
5. Vuelve a iniciar sesión

Los datos de ejemplo incluyen:
- 2 usuarios (admin + mecánico)
- 2 clientes con vehículos
- 10 repuestos con stock
- 2 órdenes de ejemplo

---

**Nota**: Las pruebas se ejecutan en el navegador del usuario y modifican el localStorage. No envíes datos reales a producción sin antes implementar un backend real con base de datos.
