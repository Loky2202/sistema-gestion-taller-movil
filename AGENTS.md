# AGENTS.md

Guía para agentes de código (OpenCode) trabajando en este repo.

## Comandos

Frontend (raíz): `npm install`, `npm run dev` (http://localhost:3000), `npm run build`, `npm run typecheck`.
Backend (`backend/`): `pip install -r requirements.txt`, `uvicorn app.main:app --reload --port 8001`. Swagger: http://localhost:8001/docs.
Todo con Docker: `docker compose up -d --build` (frontend :8000, backend :8001).

- **No hay lint ni test runner vía CLI**: `npm run typecheck` (`tsc --noEmit`) es la única verificación automática. Backend no tiene suite de pruebas.
- Para probar la app hay que levantar **backend y frontend**: el frontend usa rutas relativas y falla sin API.

## Pruebas

- La suite (`src/tests.ts`) corre **en el navegador**, no con un runner: Perfil → "Ejecutar Pruebas del Sistema", o `import('./tests').then(m => m.runTests())` en la consola.
- ⚠️ Necesita el backend corriendo y **borra todos los datos** al inicio (`resetDatabase()` → `POST /api/v1/admin/reset`). Nunca ejecutarla contra una base con datos reales; usar solo la BD de desarrollo.
- Flujos a verificar a mano: listados en PRUEBAS.md.

## Arquitectura

- Dos paquetes sin tooling de monorepo: frontend React 18 + Vite 6 + TS 5.7 (raíz), backend FastAPI + SQLAlchemy + SQLite (`backend/`).
- Flujo de datos: páginas → `src/db/index.ts` (envoltorio del API, funciones asíncronas; es la única capa que habla con el backend) → `src/api/client.ts` (fetch + JWT, base `/api/v1` relativa) → FastAPI → SQLite.
- **No hardcodear URLs del backend.** El frontend llama a `/api/v1/...` relativo; Vite (dev, puerto 3000 `strictPort`) y Nginx (prod, :8000) hacen proxy a :8001.
- Backend plano: casi todo el API vive en `backend/app/api.py` (~1.100 líneas) y los modelos en `backend/app/models/models.py`. La estructura con `schemas/`, `services/` y `alembic/` descrita en MIGRACION_BACKEND.md **nunca se implementó** (ese doc es histórico).
- La BD (`backend/data/taller.db`) se crea y siembra sola al arrancar (`init_db`). El esquema se genera con `create_all`, **no hay migraciones**: cambiar `models.py` no altera una BD existente (hay que recrearla o correr Alembic a mano).
- Fechas: el backend guarda UTC y calcula "hoy" con `UTC_OFFSET_HOURS` (default `-5`, Colombia) de `backend/app/core/config.py`. Cualquier lógica de día/cierre de caja debe pasar por los helpers del backend (`_inicio_dia`, etc.), no comparar con la hora local.
- Montos en **COP enteros, sin decimales** (`toInt` redondea en `src/db/index.ts`).

## Lógica de negocio en el backend (no duplicar en el frontend)

- Marcar orden **"listo" por primera vez descuenta stock** de los repuestos de la orden; falla si stock insuficiente. Quitar un ítem de una orden "listo" lo restaura.
- Estados: `recibido → en_reparacion → listo → entregado` (+ `cancelado`). Órdenes `entregado`/`cancelado` son **inmutables** (no se editan ítems ni estado).
- Alertas de stock bajo se crean server-side (`_crear_alerta_stock`) cuando el stock cae al mínimo.
- Permisos: dependencia `get_current_admin` en `backend/app/core/deps.py` protege los endpoints solo-admin (usuarios, reset, caja). La UI oculta opciones, pero la regla real está en el API.

## Convenciones UI (del proyecto, no genéricas)

- Mobile-first para 360–428px: contenedor `max-w-lg mx-auto`; **nunca tablas, siempre cards**; botones ≥48px de alto.
- Bottom nav fija de 4 items (Inicio, Órdenes, Inventario, Perfil); Clientes y Caja se acceden desde Perfil.
- La nueva orden es un wizard de 3 pasos.
- Todo (código, comentarios, UI, mensajes de error) en **español**, redactado para el público del taller (mensajes tipo "La PC del taller está apagada").

## Gotchas

- **No usar el alias `@/`**: existe en `vite.config.ts` pero `tsconfig.json` no tiene `paths` y ningún archivo lo usa; rompería `typecheck`. Importaciones relativas.
- `DECISIONES.md` describe parcialmente el MVP viejo (localStorage, auth simulada, seed en cliente) — está desactualizado. README.md y el código son la fuente de verdad.
- Credenciales demo: `admin@taller.com / admin123`, `mecanico@taller.com / meca123`.
- El botón "Restablecer datos de ejemplo" (dev) invoca `POST /api/v1/admin/reset`: destructivo, no usar con datos reales. El endpoint solo responde 200 si el backend corre con `DEBUG=true` (en producción devuelve 404; para dev local crear `backend/.env` con `DEBUG=true`).
- Respaldos manuales: copiar `data/taller.db` (y los archivos `taller.db-wal`/`taller.db-shm` si existen, o hacer backup con el backend detenido).
