# Decisiones Técnicas - TallerPro

## Decisiones Resueltas

### 1. Base de datos: localStorage vs Backend real
**Decisión**: Usar localStorage como almacenamiento en el MVP.
**Justificación**: El entorno de build es React/Vite. localStorage permite demostrar toda la funcionalidad sin necesidad de un servidor. La estructura de datos está diseñada para migrar fácilmente a SQLite/PostgreSQL cambiando solo la capa de acceso a datos.

### 2. Autenticación: Simulada con persistencia
**Decisión**: Zustand con persist middleware para mantener sesión.
**Justificación**: Sin backend real, la autenticación se simula validando contra datos en localStorage. El token JWT se simula con la persistencia del estado. En producción se reemplazaría con JWT real.

### 3. Diseño mobile-first con max-width
**Decisión**: Contenedor con `max-w-lg mx-auto` para simular viewport móvil en desktop.
**Justificación**: Los mecánicos usarán celular como herramienta principal. El diseño debe verse perfecto en pantallas de 360-428px de ancho.

### 4. Flujo de nueva orden en 3 pasos
**Decisión**: Wizard de 3 pasos con indicador visual de progreso.
**Justificación**: Reduce carga cognitiva. El mecánico no necesita ver todos los campos a la vez. Cada paso tiene un propósito claro.

### 5. Sin tablas en móvil
**Decisión**: Todo se muestra en tarjetas (cards), nunca en tablas.
**Justificación**: Las tablas con scroll horizontal son difíciles de usar en celular. Las tarjetas permiten mostrar la información de forma legible y con acciones claras.

### 6. Botones grandes (min 48px)
**Decisión**: Todos los botones interactivos tienen mínimo 48px de altura.
**Justificación**: Cumple con las guías de accesibilidad de Material Design y Apple HIG. Los mecánicos usan el celular con las manos sucias o con guantes.

### 7. Stock negativo: Validación en la aplicación
**Decisión**: No permitir marcar "listo" si no hay stock suficiente.
**Justificación**: Previene inconsistencias. El mecánico debe reponer stock antes de cerrar la orden.

### 8. Alertas persistentes
**Decisión**: Las alertas de stock bajo se mantienen hasta que se marquen como leídas.
**Justificación**: El admin necesita ver qué repuestos están críticos sin tener que revisar el inventario manualmente.

### 9. Moneda: Pesos colombianos (COP)
**Decisión**: Formatear todos los montos en COP sin decimales.
**Justificación**: El taller está en Colombia. Los montos en pesos no usan centavos en la práctica.

### 10. Sin framework CSS adicional
**Decisión**: Solo TailwindCSS, sin componentes pre-construidos.
**Justificación**: TailwindCSS 4 con el plugin de Vite es suficiente. Evita dependencias innecesarias y mantiene el bundle pequeño.

### 11. Bottom navigation de 4 items
**Decisión**: Inicio, Órdenes, Inventario, Perfil.
**Justificación**: Son las 4 secciones principales. "Clientes" se accede desde Perfil. "Caja" solo para admin desde Perfil. Esto mantiene la navegación simple.

### 12. Offline básico
**Decisión**: Detectar conexión y mostrar banner. Datos ya cargados permanecen accesibles.
**Justificación**: El taller puede tener señal intermitente. No se necesita un service worker completo en el MVP; basta con que los datos en localStorage sigan disponibles.

### 13. Seed data incluido
**Decisión**: Al primer acceso, crear datos de ejemplo automáticamente.
**Justificación**: Permite probar la app inmediatamente sin configuración. El admin puede restablecer los datos desde Perfil.

### 14. Estados con colores semafóricos
**Decisión**: Cada estado de orden tiene un color distintivo.
**Justificación**: Permite identificar el estado de un vistazo, crucial cuando el mecánico maneja múltiples órdenes simultáneamente.

### 15. SPA con routing client-side
**Decisión**: React Router con BrowserRouter.
**Justificación**: Para una PWA single-page, el routing del lado del cliente es más rápido y no requiere configuración de servidor adicional.

---

## Arquitectura para Producción (Futura)

Cuando se migre a backend real:

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   React PWA     │────▶│  FastAPI        │────▶│  SQLite/     │
│   (Nginx)       │     │  (Python)       │     │  PostgreSQL  │
│   Puerto 8000   │     │  Puerto 8001    │     │  (volumen)   │
└─────────────────┘     └─────────────────┘     └──────────────┘
        │                        │
        │    JWT Auth            │   SQLAlchemy
        │    REST API            │   Alembic
        ▼                        ▼
```

La capa de datos (`src/db/index.ts`) está diseñada como una interfaz que puede reemplazarse por llamadas HTTP sin cambiar la lógica de negocio en los componentes.
