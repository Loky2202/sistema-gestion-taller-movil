# 🐳 TallerPro - Guía Docker Completa

## 📋 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │   FRONTEND       │      │   BACKEND        │        │
│  │   Puerto 8000    │─────▶│   Puerto 8001    │        │
│  │   React + Nginx  │ API  │   FastAPI        │        │
│  └──────────────────┘      └────────┬─────────┘        │
│                                      │                   │
│                           ┌──────────▼─────────┐        │
│                           │   SQLite           │        │
│                           │   /data/taller.db  │        │
│                           └────────────────────┘        │
│                                                          │
│  Volúmenes persistentes:                                 │
│  - ./data (base de datos SQLite)                        │
│  - ./uploads (archivos subidos)                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Inicio Rápido

### 1. Clonar y configurar

```bash
git clone https://github.com/tu-usuario/tallerpro.git
cd tallerpro

# Copiar configuración
cp .env.example .env
```

### 2. Configurar variables de entorno

Edita el archivo `.env`:

```bash
# Generar clave secreta segura
openssl rand -hex 32

# Pega el resultado en SECRET_KEY
SECRET_KEY=tu-clave-generada-aqui
```

### 3. Levantar servicios

```bash
docker compose up -d
```

### 4. Acceder a la aplicación

- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:8001
- **Swagger Docs**: http://localhost:8001/docs

### 5. Credenciales de prueba

**Administrador:**
- Email: `admin@taller.com`
- Contraseña: `admin123`

**Mecánico:**
- Email: `mecanico@taller.com`
- Contraseña: `meca123`

---

## 📂 Estructura de Archivos

```
tallerpro/
├── docker-compose.yml          # Orquestación de contenedores
├── Dockerfile.frontend         # Build del frontend
├── nginx.conf                  # Configuración Nginx
├── .env                        # Variables de entorno (NO subir a Git)
├── .env.example                # Plantilla de variables
│
├── backend/                    # Backend FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py            # Punto de entrada
│       ├── api.py             # Rutas API
│       ├── core/              # Configuración, seguridad
│       ├── db/                # Base de datos, seed
│       └── models/            # Modelos SQLAlchemy
│
├── frontend/                   # (Código React existente)
├── data/                       # Base de datos SQLite (persistente)
└── uploads/                    # Archivos subidos (persistente)
```

---

## 🔧 Comandos Docker

### Gestión de Servicios

```bash
# Levantar servicios
docker compose up -d

# Ver estado
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend

# Detener servicios
docker compose down

# Reiniciar servicios
docker compose restart

# Reconstruir después de cambios
docker compose up -d --build
```

### Base de Datos

```bash
# Backup manual
cp data/taller.db backups/taller_$(date +%Y%m%d_%H%M%S).db

# Restaurar backup
cp backups/taller_20240115.db data/taller.db
docker compose restart backend

# Ver tamaño de la base de datos
ls -lh data/taller.db

# Exportar a SQL
docker compose exec backend sqlite3 /app/data/taller.db .dump > backup.sql
```

### Acceso a Contenedores

```bash
# Entrar al contenedor backend
docker compose exec backend sh

# Dentro del contenedor:
# - Base de datos: /app/data/taller.db
# - Uploads: /app/uploads
# - Logs: /app/logs

# Ejecutar comandos Python
docker compose exec backend python -c "print('Hola desde el contenedor')"

# Salir
exit
```

---

## 🗄️ Base de Datos SQLite

### Ubicación

La base de datos se almacena en:
```
./data/taller.db
```

### Características

- ✅ **Persistente**: Los datos sobreviven a reinicios
- ✅ **Backup fácil**: Solo copia el archivo `.db`
- ✅ **Portátil**: Funciona en cualquier sistema
- ✅ **Sin configuración**: No necesita servidor de BD

### Limitaciones

- ❌ Single-user (un escritor a la vez)
- ❌ No recomendado para +50 usuarios concurrentes
- ❌ Sin replicación nativa

### Para un Negocio Pequeño (1-5 mecánicos)

✅ **SQLite es PERFECTO** porque:
- Suficiente para el volumen de datos
- Fácil de respaldar
- No requiere administración
- Bajo consumo de recursos

### Migrar a PostgreSQL (Futuro)

Si creces y necesitas PostgreSQL:

1. Cambia `DATABASE_URL` en `.env`:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/tallerdb
```

2. Agrega PostgreSQL a `docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: taller
      POSTGRES_PASSWORD: password
      POSTGRES_DB: tallerdb
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

3. Reinicia:
```bash
docker compose down
docker compose up -d
```

---

## 🔒 Seguridad

### Variables de Entorno Críticas

**NUNCA subas `.env` a Git**

```bash
# Agregar a .gitignore (ya está)
.env
```

### Clave Secreta

Genera una clave segura:

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Cambiar Credenciales Iniciales

**IMPORTANTE**: Cambia las contraseñas antes de usar en producción

1. Entra al contenedor:
```bash
docker compose exec backend sh
```

2. Ejecuta script de cambio:
```bash
python -c "
from app.db.session import SessionLocal
from app.models import User
from app.core.security import get_password_hash

db = SessionLocal()
admin = db.query(User).filter(User.email == 'admin@taller.com').first()
admin.password_hash = get_password_hash('NUEVA_CONTRASEÑA_SEGURA')
db.commit()
print('Contraseña actualizada')
"
```

---

## 📊 Monitoreo

### Ver Logs

```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Últimas 100 líneas
docker compose logs --tail=100 backend
```

### Health Checks

```bash
# Verificar estado
docker compose ps

# Ver health check del backend
curl http://localhost:8001/api/v1/health
```

### Recursos

```bash
# Uso de CPU/Memoria
docker stats

# Espacio en disco
docker system df
```

---

## 🔄 Actualizaciones

### Actualizar Código

```bash
# 1. Pull últimos cambios
git pull origin main

# 2. Reconstruir imágenes
docker compose up -d --build

# 3. Verificar que todo funcione
docker compose ps
curl http://localhost:8001/api/v1/health
```

### Actualizar Dependencias

```bash
# Backend
docker compose exec backend pip install --upgrade -r requirements.txt
docker compose restart backend

# Frontend (requiere rebuild)
docker compose up -d --build frontend
```

---

## 🆘 Troubleshooting

### Problema: "Port already in use"

```bash
# Ver qué usa el puerto
lsof -i :8000
lsof -i :8001

# Cambiar puerto en docker-compose.yml
ports:
  - "8080:80"  # Cambia 8000 por 8080
```

### Problema: "Database is locked"

```bash
# Reiniciar backend
docker compose restart backend

# Si persiste, verificar permisos
chmod 666 data/taller.db
```

### Problema: "Cannot connect to backend"

```bash
# Verificar que backend esté corriendo
docker compose ps

# Ver logs del backend
docker compose logs backend

# Verificar health check
curl http://localhost:8001/api/v1/health
```

### Problema: "Permission denied"

```bash
# Arreglar permisos de carpetas
chmod -R 755 data uploads
chown -R $USER:$USER data uploads
```

### Problema: "Out of memory"

```bash
# Limitar memoria en docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

## 📦 Backup Automatizado

### Script de Backup

Crea `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de base de datos
cp data/taller.db $BACKUP_DIR/taller_$DATE.db

# Backup de uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Eliminar backups antiguos (+30 días)
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
```

### Automatizar con Cron

```bash
# Editar crontab
crontab -e

# Backup diario a las 2 AM
0 2 * * * /ruta/al/tallerpro/backup.sh
```

---

## 🚀 Deploy a Producción

### En un VPS (DigitalOcean, AWS, etc.)

1. **Instalar Docker**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

2. **Clonar repositorio**:
```bash
git clone https://github.com/tu-usuario/tallerpro.git
cd tallerpro
```

3. **Configurar**:
```bash
cp .env.example .env
nano .env  # Editar variables
```

4. **Levantar**:
```bash
docker compose up -d
```

5. **Configurar Nginx reverse proxy** (opcional):
```nginx
server {
    listen 80;
    server_name taller.tudominio.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

6. **Configurar SSL con Let's Encrypt**:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d taller.tudominio.com
```

---

## 📈 Escalabilidad

### Para Crecer (10-50 usuarios)

1. **Migrar a PostgreSQL** (ver sección anterior)
2. **Agregar Redis** para cache
3. **Usar load balancer** (Nginx/HAProxy)
4. **Horizontal scaling** con múltiples backends

### Para Escalar (50+ usuarios)

1. **Kubernetes** para orquestación
2. **Microservicios** si es necesario
3. **CDN** para assets estáticos
4. **Base de datos distribuida**

---

## 📚 Recursos

- **Docker Docs**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLite**: https://www.sqlite.org/docs.html

---

## ✅ Checklist de Producción

- [ ] Cambiar `SECRET_KEY` por una segura
- [ ] Cambiar credenciales iniciales
- [ ] Configurar backups automáticos
- [ ] Configurar SSL/HTTPS
- [ ] Configurar dominio personalizado
- [ ] Monitorear logs regularmente
- [ ] Verificar espacio en disco
- [ ] Probar restauración de backup

---

**¿Necesitas ayuda?** Revisa la documentación completa en README.md o abre un issue en GitHub.
