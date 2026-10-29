# Configuración de Base de Datos
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from ..core.config import settings

# Crear engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={
        "check_same_thread": False,  # Solo necesario para SQLite
        # Esperar hasta 30s por el lock antes de fallar con "database is locked"
        "timeout": 30,
    },
)

# Acceso concurrente por LAN: el modo WAL permite que varios dispositivos lean
# mientras otro escribe, evitando bloqueos de la base completa.
if engine.dialect.name == "sqlite":

    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()
