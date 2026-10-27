# 🔄 Guía de Migración a Backend Real

> ✅ **Estado: completada.** TallerPro ya usa FastAPI + SQLite con JWT y datos compartidos por LAN.
> Este documento se conserva como referencia del proceso de migración.

## 📋 Contexto Actual

La aplicación actualmente usa **localStorage** como base de datos, lo cual tiene limitaciones:
- ❌ Datos solo existen en un navegador/dispositivo
- ❌ Sin sincronización entre dispositivos
- ❌ Límite de 5-10MB de almacenamiento
- ❌ Sin concurrencia (múltiples usuarios)
- ❌ Sin backups automáticos
- ❌ Datos se pierden si se limpia el caché

## 🎯 Objetivo

Migrar a una arquitectura con backend real:
- ✅ Base de datos persistente (SQLite/PostgreSQL)
- ✅ API REST con FastAPI
- ✅ Autenticación JWT real
- ✅ Multi-dispositivo
- ✅ Backups automáticos
- ✅ Escalabilidad

---

## 🏗️ Arquitectura Propuesta

```
┌─────────────────┐      ┌─────────────────┐      ┌──────────────┐
│   React PWA     │      │   FastAPI       │      │  SQLite/     │
│   (Frontend)    │◄────►│   (Backend)     │◄────►│  PostgreSQL  │
│                 │ REST │                 │ SQL  │              │
│  Puerto 8000    │ API  │  Puerto 8001    │      │  (Volumen)   │
└─────────────────┘      └─────────────────┘      └──────────────┘
        │                         │
        │   Nginx (reverse proxy) │
        └─────────────────────────┘
```

---

## 📦 Estructura del Backend

```
backend/
├── app/
│   ├── main.py                 # Punto de entrada FastAPI
│   ├── core/
│   │   ├── config.py          # Configuración
│   │   ├── security.py        # JWT, password hashing
│   │   └── deps.py            # Dependencias (DB session, current user)
│   ├── db/
│   │   ├── session.py         # SQLAlchemy session
│   │   ├── base.py            # Base declarative
│   │   └── init_db.py         # Inicialización y seed
│   ├── models/
│   │   ├── user.py
│   │   ├── cliente.py
│   │   ├── vehiculo.py
│   │   ├── orden.py
│   │   ├── repuesto.py
│   │   └── ...
│   ├── schemas/
│   │   ├── user.py
│   │   ├── orden.py
│   │   └── ...
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── ordenes.py
│   │       ├── inventario.py
│   │       └── ...
│   └── services/
│       ├── orden_service.py
│       ├── inventario_service.py
│       └── ...
├── alembic/
│   └── versions/              # Migraciones
├── tests/
├── requirements.txt
├── Dockerfile
└── alembic.ini
```

---

## 🚀 Pasos de Migración

### Paso 1: Crear el Backend con FastAPI

#### 1.1 Estructura base

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, users, ordenes, inventario, clientes, dashboard

app = FastAPI(
    title="TallerPro API",
    description="API para gestión de taller mecánico",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://tudominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(ordenes.router, prefix="/api/v1/ordenes", tags=["ordenes"])
app.include_router(inventario.router, prefix="/api/v1/inventario", tags=["inventario"])
app.include_router(clientes.router, prefix="/api/v1/clientes", tags=["clientes"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
```

#### 1.2 Modelo de Usuario

```python
# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, nullable=False)  # 'admin' | 'mecanico'
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

#### 1.3 Esquema Pydantic

```python
# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    activo: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
```

#### 1.4 Endpoint de Login

```python
# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.security import create_access_token, verify_password
from app.core.deps import get_db
from app.schemas.user import LoginRequest, Token
from app.models.user import User

router = APIRouter()

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "rol": user.rol},
        expires_delta=timedelta(hours=12)
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
```

---

### Paso 2: Configurar la Base de Datos

#### 2.1 Configuración de SQLAlchemy

```python
# backend/app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # Solo para SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

#### 2.2 Configuración

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./data/taller.db"
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 12
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

### Paso 3: Migraciones con Alembic

#### 3.1 Inicializar Alembic

```bash
cd backend
alembic init alembic
```

#### 3.2 Configurar Alembic

```python
# backend/alembic/env.py
from app.db.base import Base
from app.models import user, cliente, vehiculo, orden, repuesto

target_metadata = Base.metadata
```

#### 3.3 Generar migración inicial

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

---

### Paso 4: Adaptar el Frontend

#### 4.1 Crear cliente API

```typescript
// frontend/src/api/client.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 4.2 Actualizar store de autenticación

```typescript
// frontend/src/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        try {
          const response = await apiClient.post('/auth/login', { email, password });
          const { access_token } = response.data;
          
          localStorage.setItem('token', access_token);
          
          // Obtener datos del usuario
          const userResponse = await apiClient.get('/auth/me');
          
          set({
            user: userResponse.data,
            token: access_token,
            isAuthenticated: true,
          });
          
          return true;
        } catch (error) {
          return false;
        }
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'taller-auth',
    }
  )
);
```

#### 4.3 Actualizar capa de datos

```typescript
// frontend/src/db/index.ts (nueva versión con API)
import apiClient from '../api/client';

export async function getOrdenes(estado?: string, query?: string) {
  const params = new URLSearchParams();
  if (estado) params.append('estado', estado);
  if (query) params.append('q', query);
  
  const response = await apiClient.get(`/ordenes?${params}`);
  return response.data;
}

export async function crearOrden(data: any) {
  const response = await apiClient.post('/ordenes', data);
  return response.data;
}

export async function actualizarOrdenEstado(id: string, estado: string) {
  const response = await apiClient.patch(`/ordenes/${id}/estado`, { estado });
  return response.data;
}

// ... otros métodos
```

---

### Paso 5: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8001:8000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - DATABASE_URL=sqlite:///./data/taller.db
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "8000:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:8001/api/v1
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

---

### Paso 6: Migrar Datos Existentes

```python
# backend/scripts/migrate_from_localstorage.py
import json
from app.db.session import SessionLocal
from app.models.user import User
from app.models.cliente import Cliente
from app.models.vehiculo import Vehiculo
from app.models.orden import Orden
from app.models.repuesto import Repuesto
from app.core.security import get_password_hash

def migrate_data(backup_file: str):
    """Migra datos desde un backup de localStorage a la base de datos"""
    
    with open(backup_file, 'r') as f:
        backup = json.load(f)
    
    data = backup['data']
    db = SessionLocal()
    
    try:
        # Migrar usuarios
        for user_data in data['usuarios']:
            user = User(
                nombre=user_data['nombre'],
                email=user_data['email'],
                password_hash=get_password_hash(user_data['password']),
                rol=user_data['rol'],
                activo=user_data['activo']
            )
            db.add(user)
        
        # Migrar clientes
        for cliente_data in data['clientes']:
            cliente = Cliente(**cliente_data)
            db.add(cliente)
        
        # ... migrar otros modelos
        
        db.commit()
        print("✓ Migración completada")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error en migración: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Uso: python migrate_from_localstorage.py <backup_file.json>")
        sys.exit(1)
    
    migrate_data(sys.argv[1])
```

---

## 📊 Comparación: Antes vs Después

| Característica | localStorage | Backend Real |
|----------------|--------------|--------------|
| **Persistencia** | Solo en un navegador | Base de datos centralizada |
| **Multi-dispositivo** | ❌ No | ✅ Sí |
| **Concurrencia** | ❌ No | ✅ Sí |
| **Backups** | Manual | Automático |
| **Escalabilidad** | ❌ Limitado | ✅ Ilimitado |
| **Seguridad** | ⚠️ Básica | ✅ JWT + HTTPS |
| **Performance** | ✅ Muy rápido | ⚠️ Depende de red |
| **Offline** | ✅ Funciona | ⚠️ Requiere PWA |

---

## 🎯 Plan de Migración Paso a Paso

### Fase 1: Preparación (1-2 días)
1. ✅ Crear estructura del backend
2. ✅ Definir modelos de base de datos
3. ✅ Configurar Alembic para migraciones
4. ✅ Implementar autenticación JWT

### Fase 2: API Endpoints (3-5 días)
1. ✅ Implementar endpoints de usuarios
2. ✅ Implementar endpoints de clientes/vehículos
3. ✅ Implementar endpoints de órdenes
4. ✅ Implementar endpoints de inventario
5. ✅ Implementar endpoints de dashboard

### Fase 3: Adaptar Frontend (2-3 días)
1. ✅ Crear cliente API con axios
2. ✅ Actualizar store de autenticación
3. ✅ Reemplazar llamadas a localStorage por API calls
4. ✅ Manejar estados de loading y error
5. ✅ Implementar retry logic

### Fase 4: Testing (2 días)
1. ✅ Probar todos los flujos con backend
2. ✅ Probar concurrencia (múltiples usuarios)
3. ✅ Probar modo offline con PWA
4. ✅ Probar migración de datos

### Fase 5: Deploy (1 día)
1. ✅ Configurar Docker Compose
2. ✅ Desplegar en servidor
3. ✅ Configurar dominio y SSL
4. ✅ Migrar datos de producción

---

## 🔐 Consideraciones de Seguridad

### Backend
- ✅ Usar HTTPS siempre
- ✅ Password hashing con bcrypt
- ✅ JWT con expiración corta
- ✅ Rate limiting
- ✅ Validación de inputs
- ✅ SQL injection prevention (SQLAlchemy)
- ✅ CORS configurado correctamente

### Frontend
- ✅ No almacenar datos sensibles en localStorage
- ✅ Token en memoria o httpOnly cookie
- ✅ Sanitizar datos del usuario
- ✅ Validar datos antes de enviar

---

## 📈 Monitoreo y Logs

```python
# backend/app/main.py
import logging
from fastapi import Request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Status: {response.status_code}")
    return response
```

---

## 🆘 Troubleshooting

### Problema: CORS errors
**Solución:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://tudominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Problema: Token expirado
**Solución:** Implementar refresh token o forzar re-login

### Problema: Datos no se sincronizan
**Solución:** Verificar que el frontend está usando API calls, no localStorage

---

## 📚 Recursos

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **Alembic**: https://alembic.sqlalchemy.org/
- **Pydantic**: https://docs.pydantic.dev/

---

**¿Necesitas ayuda con la migración?**
- Revisa la documentación en DEPLOY.md
- Consulta los ejemplos en el repositorio
- Abre un issue en GitHub
