# Main - Punto de entrada FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from .db.session import engine, Base, SessionLocal
from .db.init_db import init_db
from .api import router
from .core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events"""
    # Startup
    print(f"🔧 Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Crear directorios necesarios
    os.makedirs("data", exist_ok=True)
    os.makedirs("uploads", exist_ok=True)
    
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    print("✓ Tablas de base de datos creadas")
    
    # Inicializar datos de ejemplo
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    
    yield
    
    # Shutdown
    print("🔧 Cerrando aplicación...")


# Crear aplicación
app = FastAPI(
    title=settings.APP_NAME,
    description="API para gestión de taller mecánico",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(router, prefix="/api/v1")


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": f"Bienvenido a {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }
