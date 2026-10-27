# TallerPro - Sistema de Gestión para Taller Mecánico

## 🏍️🚗 Descripción

Sistema web PWA para la gestión integral de un taller de reparación de motocicletas y carros. Incluye control de órdenes de servicio, inventario de repuestos, gestión de clientes/vehículos, caja y dashboard con métricas clave.

## 📋 Características

- ✅ Órdenes de servicio con flujo de 3 pasos (mobile-first)
- ✅ Inventario con descuento automático de stock
- ✅ Alertas de stock bajo
- ✅ Gestión de clientes y vehículos con historial
- ✅ Cobro de órdenes con múltiples métodos de pago
- ✅ Dashboard con métricas del día
- ✅ Roles: Administrador y Mecánico
- ✅ PWA instalable con soporte offline básico
- ✅ Diseño mobile-first optimizado para celular

## 🚀 Inicio Rápido

### Desarrollo local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build
```

### Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@taller.com | admin123 |
| Mecánico | mecanico@taller.com | meca123 |

## 📱 Pantallas

1. **Login** - Autenticación minimalista
2. **Dashboard** - Métricas del día, alertas, gráfico de ingresos
3. **Órdenes** - Lista con filtros por estado y búsqueda
4. **Nueva Orden** - Flujo de 3 pasos (vehículo → falla → items)
5. **Detalle Orden** - Info completa, cambio de estado, cobro
6. **Inventario** - Lista con buscador y badges de stock
7. **Detalle Repuesto** - Info y movimientos de inventario
8. **Clientes** - Gestión de clientes y vehículos con historial
9. **Caja** - Resumen del día, desglose por método, cierre
10. **Perfil** - Info usuario, alertas, logout

## 🗄️ Estructura de Datos

La aplicación usa localStorage como base de datos local. Los datos se inicializan con seed de ejemplo:
- 2 usuarios (admin + mecánico)
- 2 clientes con vehículos
- 10 repuestos de ejemplo
- 2 órdenes de ejemplo

## 🔄 Reglas de Negocio Implementadas

1. **Descuento de stock**: Al marcar orden como "listo", se descuentan automáticamente los repuestos
2. **Alertas**: Si el stock cae por debajo del mínimo, se genera alerta persistente
3. **Validación**: No se puede marcar "listo" si no hay stock suficiente
4. **Cobro**: Al cobrar, la orden pasa a "entregado"
5. **Órdenes finalizadas**: No se pueden editar órdenes entregadas o canceladas
6. **Roles**: Admin tiene acceso total; Mecánico solo puede crear órdenes y ver inventario

## 📦 Stack Técnico

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: TailwindCSS 4 (mobile-first)
- **Estado**: Zustand (auth) + React patterns
- **Routing**: React Router v6
- **Iconos**: Lucide React
- **Datos**: localStorage (simula backend SQLite)
- **PWA**: Meta tags + offline detection

## 🗺️ Plan de Fases

### Fase 1 - MVP (Actual)
- Órdenes de servicio completas
- Inventario con alertas
- Dashboard básico
- PWA instalable

### Fase 2 - Caja y Reportes
- Cierre de caja diario
- Reportes mensuales
- Exportar datos a CSV

### Fase 3 - Escalabilidad
- Backend real con FastAPI + SQLite/PostgreSQL
- Sincronización offline/online
- Multi-sucursal
- Notificaciones WhatsApp

## 💾 Respaldo de Datos

Para respaldar los datos, exportar el localStorage:
```javascript
// En la consola del navegador:
JSON.stringify(localStorage.getItem('taller_db'))
```

## 🔄 Migración a Backend Real

Para migrar a una arquitectura con backend real:
1. Crear API REST con FastAPI
2. Reemplazar llamadas a localStorage con fetch/axios
3. Mantener la misma estructura de datos
4. Agregar autenticación JWT real
5. Configurar Docker Compose

## 📄 Decisiones Técnicas

Ver [DECISIONES.md](./DECISIONES.md) para detalles sobre las decisiones de diseño.

## 🔮 Siguientes Pasos Recomendados

1. **Notificaciones WhatsApp** - Alertar al cliente cuando su vehículo está listo
2. **Multi-sucursal** - Soporte para varios talleres
3. **Facturación electrónica** - Integración con DIAN (Colombia)
4. **Migración a PostgreSQL** - Para producción con múltiples usuarios concurrentes
5. **App nativa** - React Native para mejor experiencia offline
6. **Fotos en órdenes** - Tomar foto del vehículo al ingresar
7. **Firma digital** - El cliente firma al recibir el vehículo
8. **Reportes avanzados** - Gráficos de ingresos mensuales, mecánico más productivo

---

**TallerPro** - Hecho con ❤️ para talleres mecánicos
