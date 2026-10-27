# 🔧 TallerPro - Sistema de Gestión para Taller Mecánico

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?logo=tailwindcss)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC4?logo=pwa)
![License](https://img.shields.io/badge/license-MIT-green)

**Sistema web PWA para gestión integral de talleres de reparación de motocicletas y carros**

[Demo](#-demo) • [Instalación](#-instalación) • [Documentación](#-documentación) • [Deploy](#-deploy-a-producción)

</div>

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Demo](#-demo)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Arquitectura](#-arquitectura)
- [Deploy a Producción](#-deploy-a-producción)
- [Documentación](#-documentación)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### 🎯 Funcionalidades Principales

- ✅ **Órdenes de Servicio** - Flujo completo de 3 pasos optimizado para móvil
- ✅ **Inventario Inteligente** - Control de stock con alertas automáticas
- ✅ **Gestión de Clientes** - Historial completo de vehículos y reparaciones
- ✅ **Sistema de Caja** - Cobros con múltiples métodos de pago
- ✅ **Dashboard en Tiempo Real** - Métricas clave del negocio
- ✅ **Roles y Permisos** - Admin y Mecánico con accesos diferenciados
- ✅ **PWA Instalable** - Funciona como app nativa en móviles
- ✅ **Datos compartidos por LAN** - Un servidor en el taller; todos los dispositivos ven la misma información

### 🎨 Experiencia de Usuario

- 📱 **Mobile-First** - Diseñado para usarse en celulares
- 🎨 **UI Moderna** - Interfaz limpia con TailwindCSS
- ⚡ **Rápido** - Optimizado para conexiones lentas
- 🔔 **Alertas Visuales** - Notificaciones de stock bajo
- 🎯 **Flujos Simplificados** - Máximo 3 pasos para tareas comunes

### 🔒 Seguridad

- 🔐 **Autenticación JWT** - Tokens seguros con expiración
- 👥 **Control de Roles** - Admin vs Mecánico
- ✅ **Validaciones** - Prevención de datos duplicados
- 🛡️ **Headers de Seguridad** - Protección contra ataques comunes

---

## 🎮 Demo

### Credenciales de Prueba

**Administrador:**
- 📧 Email: `admin@taller.com`
- 🔑 Contraseña: `admin123`

**Mecánico:**
- 📧 Email: `mecanico@taller.com`
- 🔑 Contraseña: `meca123`

### Datos de Ejemplo

La aplicación incluye datos precargados:
- 👥 2 clientes con vehículos
- 🔧 10 repuestos con stock
- 📋 2 órdenes de ejemplo en diferentes estados

---

## 🚀 Instalación con Docker

### Requisitos Previos

- Docker 20+
- Docker Compose 2+
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### Instalación Rápida (Recomendado)

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/tallerpro.git
cd tallerpro

# 2. Copiar archivo de entorno
cp .env.example .env

# 3. Generar clave secreta segura
openssl rand -hex 32
# Copia el resultado y pégalo en .env en SECRET_KEY

# 4. Levantar servicios
docker compose up -d

# 5. Abrir en navegador
# Frontend: http://localhost:8000
# Backend API: http://localhost:8001
# Swagger Docs: http://localhost:8001/docs
```

### Desarrollo Local (sin Docker)

```bash
# Terminal 1 - Backend (API en http://localhost:8001)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Terminal 2 - Frontend (http://localhost:3000)
# Vite redirige /api al backend del puerto 8001
npm install
npm run dev
```

> Requiere Python 3.11+ y Node 22+. La base de datos se crea sola en `backend/data/taller.db`.

### Comandos Útiles

```bash
# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Reconstruir después de cambios
docker compose up -d --build

# Backup de base de datos
cp data/taller.db backups/taller_$(date +%Y%m%d).db
```

---

## 📖 Uso

### Flujo de Trabajo Típico

#### 1. Crear Nueva Orden

```
1. Iniciar sesión como mecánico
2. Ir a "Órdenes" → botón "+"
3. Paso 1: Buscar/crear vehículo
4. Paso 2: Describir falla
5. Paso 3: Agregar servicios y repuestos
6. Crear orden
```

#### 2. Gestionar Inventario

```
1. Ir a "Inventario" (solo admin puede crear)
2. Buscar repuesto por nombre o código
3. Ver stock actual y alertas
4. Registrar movimientos (entrada/salida)
```

#### 3. Cambiar Estado de Orden

```
1. Abrir orden desde lista
2. Tocar "Cambiar Estado"
3. Seleccionar nuevo estado:
   - Recibido → En reparación → Listo → Entregado
4. Confirmar cambio
```

#### 4. Cobrar Orden

```
1. Con orden en estado "Listo"
2. Tocar "Cobrar y Entregar"
3. Seleccionar método de pago
4. Ingresar monto recibido
5. Confirmar pago
```

### Atajos y Tips

- 🔍 **Búsqueda rápida** - Usa el buscador en cada pantalla
- 📱 **Instalar PWA** - Toca "Agregar a pantalla de inicio"
- 🔔 **Alertas** - Revisa el dashboard para stock crítico
- 💾 **Backup** - Haz backup regular desde Perfil

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
Frontend:
├── React 18.2          # UI framework
├── TypeScript 5.7      # Type safety
├── Vite 6.3           # Build tool
├── TailwindCSS 4.1    # Styling
├── React Router 6     # Navigation
├── Zustand            # State management
└── Lucide React       # Icons

Backend:
├── FastAPI            # API REST
├── SQLite             # Base de datos (data/taller.db)
├── SQLAlchemy         # ORM
└── JWT (python-jose)  # Autenticación

Servido por Nginx, que hace proxy de /api al backend.
```

### Estructura del Proyecto

```
tallerpro/
├── backend/           # API FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api.py     # Endpoints
│   │   ├── models/    # Modelos (UUID)
│   │   └── core/      # Config, JWT, dependencias
│   └── requirements.txt
├── src/
│   ├── api/           # Cliente HTTP (fetch + JWT)
│   ├── hooks/         # useAsync / useDebounced
│   ├── components/    # Componentes reutilizables
│   ├── pages/         # Páginas de la aplicación
│   ├── db/            # Capa de datos (envoltorio del API)
│   ├── store/         # Estado global (Zustand)
│   └── types/         # Tipos TypeScript
├── data/              # Base de datos SQLite (volumen Docker)
├── public/            # PWA manifest, Service Worker, icono
├── nginx.conf         # Proxy /api + SPA
└── vite.config.ts     # Configuración Vite
```

### Flujo de Datos

```
Usuario → UI → Componente → db/index.ts → api/client.ts → FastAPI → SQLite
                ↓
            Estado (Zustand)
                ↓
            Re-render UI
```

---

## 🌐 Deploy a Producción

> TallerPro necesita el backend (FastAPI + SQLite). El despliegue recomendado es **Docker en la PC del taller**, accesible por LAN. Un hosting estático (Vercel/Netlify) solo serviría el frontend y no tendría datos.

### Opción recomendada: PC del taller con Docker

```bash
docker compose up -d --build
# Abrir desde cualquier dispositivo de la red: http://IP-DE-LA-PC:8000
```

### Opción: Servidor propio con Nginx

```bash
# Build local
npm run build

# Subir a servidor
scp -r dist/* usuario@servidor:/var/www/tallerpro/

# Configurar Nginx (ver DEPLOY.md)
```

### ⚠️ Limitaciones conocidas

- La app necesita que la PC del taller esté encendida y accesible por LAN. No hay escritura offline (los datos viven en el servidor).
- Para **instalar la PWA** en celulares hace falta HTTPS (o `localhost`). Por HTTP usando una IP de la LAN la app funciona, pero el navegador no registra el Service Worker.
- Los respaldos son manuales: copiar `data/taller.db` a un USB o disco externo.

### 📚 Documentación Completa de Deploy

Consulta **[DEPLOY.md](./DEPLOY.md)** para:
- Instrucciones detalladas por plataforma
- Configuración de dominio personalizado
- SSL/HTTPS
- Docker Compose
- Backups y monitoreo

---

## 📚 Documentación

### Guías Principales

| Documento | Descripción |
|-----------|-------------|
| **[README.md](./README.md)** | Este archivo - Introducción general |
| **[DEPLOY.md](./DEPLOY.md)** | Guía completa de despliegue |
| **[MIGRACION_BACKEND.md](./MIGRACION_BACKEND.md)** | Cómo migrar a backend real |
| **[SECURITY.md](./SECURITY.md)** | Política de seguridad |
| **[PRUEBAS.md](./PRUEBAS.md)** | Guía de pruebas |
| **[MEJORAS.md](./MEJORAS.md)** | Historial de mejoras |
| **[DECISIONES.md](./DECISIONES.md)** | Decisiones técnicas |

### Documentación Técnica

- **Arquitectura**: Ver sección [Arquitectura](#-arquitectura)
- **API**: FastAPI en `/api/v1` (Swagger en `http://localhost:8001/docs`)
- **Base de Datos**: SQLite, modelos en `backend/app/models/models.py`
- **Componentes**: Ver `src/components/`

---

## 🗺️ Roadmap

### ✅ v1.0.0 - MVP (Actual)

- [x] Órdenes de servicio completas
- [x] Inventario con alertas
- [x] Gestión de clientes y vehículos
- [x] Sistema de caja
- [x] Dashboard con métricas
- [x] PWA instalable
- [x] Validaciones de datos
- [x] Documentación completa
- [x] Backend FastAPI + SQLite, JWT real y datos compartidos por LAN

### ✅ v1.1.0 - Backend Real (Actual)

- [x] API REST con FastAPI
- [x] Base de datos SQLite
- [x] Autenticación JWT real
- [x] Multi-dispositivo por LAN
- [ ] Sincronización offline/online (no incluida)
- [ ] Backups automáticos

### 📅 v1.2.0 - Funcionalidades Avanzadas

- [ ] Fotos en órdenes
- [ ] Firma digital del cliente
- [ ] Notificaciones WhatsApp
- [ ] Reportes avanzados
- [ ] Exportar datos a PDF/Excel
- [ ] Multi-sucursal

### 🎯 v2.0.0 - Escalabilidad

- [ ] Facturación electrónica
- [ ] Integración con contabilidad
- [ ] App móvil nativa
- [ ] API pública
- [ ] Marketplace de repuestos
- [ ] IA para diagnóstico

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guía de Contribución

- Sigue el estilo de código existente
- Escribe commits descriptivos
- Actualiza la documentación si es necesario
- Agrega tests para nuevas funcionalidades
- Reporta bugs en GitHub Issues

### Código de Conducta

- Sé respetuoso y profesional
- Acepta críticas constructivas
- Enfócate en lo que es mejor para la comunidad
- Muestra empatía hacia otros miembros

---

## 🐛 Reportar Bugs

Si encuentras un bug:

1. Verifica que no esté reportado en [Issues](https://github.com/tu-usuario/tallerpro/issues)
2. Abre un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Versión del navegador y SO

---

## 🔒 Seguridad

Si encuentras una vulnerabilidad de seguridad:

- **NO** abras un issue público
- Envía email a: **seguridad@tudominio.com**
- Ver [SECURITY.md](./SECURITY.md) para más detalles

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](./LICENSE) para detalles.

```
MIT License

Copyright (c) 2024 TallerPro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🙏 Agradecimientos

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Iconos
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

## 📞 Contacto

- **Email**: info@tudominio.com
- **Website**: https://tallerpro.tudominio.com
- **GitHub**: https://github.com/tu-usuario/tallerpro

---

## ⭐ Star History

Si este proyecto te fue útil, considera darle una estrella en GitHub ⭐

---

<div align="center">

**Hecho con ❤️ para talleres mecánicos**

[Reportar Bug](https://github.com/tu-usuario/tallerpro/issues) · [Solicitar Feature](https://github.com/tu-usuario/tallerpro/issues) · [Documentación](#-documentación)

</div>
