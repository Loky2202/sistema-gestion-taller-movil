# Modelos de Base de Datos
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.session import Base


class User(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, nullable=False)  # 'admin' | 'mecanico'
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    ordenes_asignadas = relationship("Orden", back_populates="mecanico")


class Cliente(Base):
    __tablename__ = "clientes"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    telefono = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=True)
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    vehiculos = relationship("Vehiculo", back_populates="cliente")


class Vehiculo(Base):
    __tablename__ = "vehiculos"
    
    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String, unique=True, nullable=False, index=True)
    tipo = Column(String, nullable=False)  # 'moto' | 'carro'
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    anio = Column(Integer, nullable=False)
    color = Column(String, nullable=True)
    foto_url = Column(String, nullable=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    cliente = relationship("Cliente", back_populates="vehiculos")
    ordenes = relationship("Orden", back_populates="vehiculo")


class Orden(Base):
    __tablename__ = "ordenes"
    
    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=False)
    mecanico_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    estado = Column(String, nullable=False, default="recibido", index=True)
    falla_reportada = Column(Text, nullable=False)
    diagnostico = Column(Text, nullable=True)
    fecha_ingreso = Column(DateTime(timezone=True), server_default=func.now())
    fecha_estimada = Column(DateTime(timezone=True), nullable=True)
    fecha_entrega = Column(DateTime(timezone=True), nullable=True)
    total_servicios = Column(Float, default=0)
    total_repuestos = Column(Float, default=0)
    total = Column(Float, default=0)
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    vehiculo = relationship("Vehiculo", back_populates="ordenes")
    mecanico = relationship("User", back_populates="ordenes_asignadas")
    items = relationship("OrdenItem", back_populates="orden", cascade="all, delete-orphan")
    pagos = relationship("Pago", back_populates="orden")


class OrdenItem(Base):
    __tablename__ = "orden_items"
    
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes.id"), nullable=False)
    tipo = Column(String, nullable=False)  # 'servicio' | 'repuesto'
    repuesto_id = Column(Integer, ForeignKey("repuestos.id"), nullable=True)
    descripcion = Column(String, nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    
    # Relationships
    orden = relationship("Orden", back_populates="items")
    repuesto = relationship("Repuesto")


class Repuesto(Base):
    __tablename__ = "repuestos"
    
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, nullable=False, index=True)
    nombre = Column(String, nullable=False)
    categoria = Column(String, nullable=False)
    unidad = Column(String, nullable=False)  # 'unidad' | 'litro' | 'metro' | 'juego'
    stock_actual = Column(Integer, nullable=False, default=0)
    stock_minimo = Column(Integer, nullable=False, default=0)
    precio_costo = Column(Float, nullable=False)
    precio_venta = Column(Float, nullable=False)
    proveedor = Column(String, nullable=True)
    foto_url = Column(String, nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    movimientos = relationship("MovimientoInventario", back_populates="repuesto")


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    
    id = Column(Integer, primary_key=True, index=True)
    repuesto_id = Column(Integer, ForeignKey("repuestos.id"), nullable=False)
    tipo = Column(String, nullable=False)  # 'entrada' | 'salida' | 'ajuste'
    cantidad = Column(Integer, nullable=False)
    motivo = Column(String, nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    repuesto = relationship("Repuesto", back_populates="movimientos")


class Pago(Base):
    __tablename__ = "pagos"
    
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes.id"), nullable=False)
    metodo = Column(String, nullable=False)  # 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto'
    monto = Column(Float, nullable=False)
    monto_recibido = Column(Float, nullable=False)
    cambio = Column(Float, nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    orden = relationship("Orden", back_populates="pagos")


class Alerta(Base):
    __tablename__ = "alertas"
    
    id = Column(Integer, primary_key=True, index=True)
    repuesto_id = Column(Integer, ForeignKey("repuestos.id"), nullable=False)
    tipo = Column(String, nullable=False)  # 'stock_bajo'
    mensaje = Column(String, nullable=False)
    leida = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CierreCaja(Base):
    __tablename__ = "cierres_caja"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(String, nullable=False)
    total_efectivo = Column(Float, default=0)
    total_transferencia = Column(Float, default=0)
    total_tarjeta = Column(Float, default=0)
    total_mixto = Column(Float, default=0)
    total_general = Column(Float, default=0)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
