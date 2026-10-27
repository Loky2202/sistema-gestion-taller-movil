# API Principal - Todas las rutas
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
import os
import shutil

from ..core.deps import get_db, get_current_user, get_current_admin
from ..core.security import verify_password, get_password_hash, create_access_token
from ..models.models import User, Cliente, Vehiculo, Orden, OrdenItem, Repuesto, MovimientoInventario, Pago, Alerta, CierreCaja
from ..core.config import settings

router = APIRouter()

# ============================================
# SCHEMAS
# ============================================

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    activo: bool
    
    class Config:
        from_attributes = True

class ClienteCreate(BaseModel):
    nombre: str
    telefono: str
    email: Optional[str] = None
    notas: Optional[str] = None

class ClienteResponse(ClienteCreate):
    id: int
    class Config:
        from_attributes = True

class VehiculoCreate(BaseModel):
    placa: str
    tipo: str
    marca: str
    modelo: str
    anio: int
    color: Optional[str] = None
    cliente_id: int

class VehiculoResponse(VehiculoCreate):
    id: int
    class Config:
        from_attributes = True

class OrdenItemCreate(BaseModel):
    tipo: str
    repuesto_id: Optional[int] = None
    descripcion: str
    cantidad: int
    precio_unitario: float

class OrdenItemResponse(OrdenItemCreate):
    id: int
    orden_id: int
    subtotal: float
    class Config:
        from_attributes = True

class OrdenCreate(BaseModel):
    vehiculo_id: int
    falla_reportada: str
    diagnostico: Optional[str] = None
    items: List[OrdenItemCreate]

class OrdenResponse(BaseModel):
    id: int
    vehiculo_id: int
    mecanico_id: int
    estado: str
    falla_reportada: str
    diagnostico: Optional[str]
    fecha_ingreso: datetime
    fecha_estimada: Optional[datetime]
    fecha_entrega: Optional[datetime]
    total_servicios: float
    total_repuestos: float
    total: float
    notas: Optional[str]
    items: List[OrdenItemResponse]
    
    class Config:
        from_attributes = True

class RepuestoCreate(BaseModel):
    sku: str
    nombre: str
    categoria: str
    unidad: str
    stock_actual: int
    stock_minimo: int
    precio_costo: float
    precio_venta: float
    proveedor: Optional[str] = None

class RepuestoResponse(RepuestoCreate):
    id: int
    activo: bool
    class Config:
        from_attributes = True

class EstadoUpdate(BaseModel):
    estado: str

class CobroRequest(BaseModel):
    metodo: str
    monto_recibido: float

# ============================================
# AUTH
# ============================================

@router.post("/auth/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login de usuario"""
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
    
    access_token = create_access_token(data={"sub": user.email, "rol": user.rol})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Obtener usuario actual"""
    return current_user

# ============================================
# CLIENTES
# ============================================

@router.get("/clientes", response_model=List[ClienteResponse])
def get_clientes(db: Session = Depends(get_db)):
    """Obtener todos los clientes"""
    return db.query(Cliente).all()

@router.post("/clientes", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def create_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    """Crear cliente nuevo"""
    # Validar teléfono único
    existe = db.query(Cliente).filter(Cliente.telefono == cliente.telefono).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un cliente con ese teléfono")
    
    db_cliente = Cliente(**cliente.dict())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

# ============================================
# VEHICULOS
# ============================================

@router.get("/vehiculos", response_model=List[VehiculoResponse])
def get_vehiculos(db: Session = Depends(get_db)):
    """Obtener todos los vehículos"""
    return db.query(Vehiculo).all()

@router.post("/vehiculos", response_model=VehiculoResponse, status_code=status.HTTP_201_CREATED)
def create_vehiculo(vehiculo: VehiculoCreate, db: Session = Depends(get_db)):
    """Crear vehículo nuevo"""
    # Validar placa única
    existe = db.query(Vehiculo).filter(Vehiculo.placa == vehiculo.placa).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un vehículo con esa placa")
    
    db_vehiculo = Vehiculo(**vehiculo.dict())
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

# ============================================
# REPUESTOS
# ============================================

@router.get("/repuestos", response_model=List[RepuestoResponse])
def get_repuestos(db: Session = Depends(get_db)):
    """Obtener todos los repuestos"""
    return db.query(Repuesto).filter(Repuesto.activo == True).all()

@router.post("/repuestos", response_model=RepuestoResponse, status_code=status.HTTP_201_CREATED)
def create_repuesto(
    repuesto: RepuestoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Crear repuesto nuevo (solo admin)"""
    # Validar SKU único
    existe = db.query(Repuesto).filter(Repuesto.sku == repuesto.sku).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un repuesto con ese código")
    
    db_repuesto = Repuesto(**repuesto.dict(), activo=True)
    db.add(db_repuesto)
    db.commit()
    db.refresh(db_repuesto)
    return db_repuesto

# ============================================
# ORDENES
# ============================================

@router.get("/ordenes", response_model=List[OrdenResponse])
def get_ordenes(estado: Optional[str] = None, db: Session = Depends(get_db)):
    """Obtener órdenes"""
    query = db.query(Orden)
    if estado:
        query = query.filter(Orden.estado == estado)
    return query.order_by(Orden.created_at.desc()).all()

@router.post("/ordenes", response_model=OrdenResponse, status_code=status.HTTP_201_CREATED)
def create_orden(
    orden: OrdenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear orden nueva"""
    # Calcular totales
    total_servicios = 0
    total_repuestos = 0
    
    db_orden = Orden(
        vehiculo_id=orden.vehiculo_id,
        mecanico_id=current_user.id,
        estado="recibido",
        falla_reportada=orden.falla_reportada,
        diagnostico=orden.diagnostico
    )
    
    db.add(db_orden)
    db.flush()  # Para obtener el ID
    
    # Crear items
    for item_data in orden.items:
        subtotal = item_data.cantidad * item_data.precio_unitario
        
        if item_data.tipo == "servicio":
            total_servicios += subtotal
        else:
            total_repuestos += subtotal
        
        item = OrdenItem(
            orden_id=db_orden.id,
            **item_data.dict(),
            subtotal=subtotal
        )
        db.add(item)
    
    db_orden.total_servicios = total_servicios
    db_orden.total_repuestos = total_repuestos
    db_orden.total = total_servicios + total_repuestos
    
    db.commit()
    db.refresh(db_orden)
    return db_orden

@router.patch("/ordenes/{orden_id}/estado", response_model=OrdenResponse)
def update_estado_orden(
    orden_id: int,
    estado_update: EstadoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cambiar estado de orden"""
    orden = db.query(Orden).filter(Orden.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    if orden.estado in ["entregado", "cancelado"]:
        raise HTTPException(status_code=400, detail="No se puede modificar una orden finalizada")
    
    # Si pasa a "listo", descontar stock
    if estado_update.estado == "listo":
        items_repuesto = db.query(OrdenItem).filter(
            OrdenItem.orden_id == orden_id,
            OrdenItem.tipo == "repuesto"
        ).all()
        
        # Verificar stock
        for item in items_repuesto:
            repuesto = db.query(Repuesto).filter(Repuesto.id == item.repuesto_id).first()
            if not repuesto or repuesto.stock_actual < item.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente de {repuesto.nombre if repuesto else 'repuesto'}"
                )
        
        # Descontar stock
        for item in items_repuesto:
            repuesto = db.query(Repuesto).filter(Repuesto.id == item.repuesto_id).first()
            repuesto.stock_actual -= item.cantidad
            
            # Registrar movimiento
            movimiento = MovimientoInventario(
                repuesto_id=repuesto.id,
                tipo="salida",
                cantidad=item.cantidad,
                motivo=f"Orden #{orden_id}",
                usuario_id=current_user.id
            )
            db.add(movimiento)
            
            # Verificar alerta
            if repuesto.stock_actual <= repuesto.stock_minimo:
                alerta_existente = db.query(Alerta).filter(
                    Alerta.repuesto_id == repuesto.id,
                    Alerta.leida == False
                ).first()
                
                if not alerta_existente:
                    alerta = Alerta(
                        repuesto_id=repuesto.id,
                        tipo="stock_bajo",
                        mensaje=f"{repuesto.nombre} tiene stock bajo ({repuesto.stock_actual} {repuesto.unidad})"
                    )
                    db.add(alerta)
    
    orden.estado = estado_update.estado
    if estado_update.estado == "entregado":
        orden.fecha_entrega = datetime.utcnow()
    
    db.commit()
    db.refresh(orden)
    return orden

@router.post("/ordenes/{orden_id}/cobrar", status_code=status.HTTP_201_CREATED)
def cobrar_orden(
    orden_id: int,
    cobro: CobroRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cobrar orden"""
    orden = db.query(Orden).filter(Orden.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    if orden.estado != "listo":
        raise HTTPException(status_code=400, detail="La orden debe estar en estado 'listo' para cobrar")
    
    # Crear pago
    pago = Pago(
        orden_id=orden_id,
        metodo=cobro.metodo,
        monto=orden.total,
        monto_recibido=cobro.monto_recibido,
        cambio=max(0, cobro.monto_recibido - orden.total),
        usuario_id=current_user.id
    )
    db.add(pago)
    
    # Cambiar estado a entregado
    orden.estado = "entregado"
    orden.fecha_entrega = datetime.utcnow()
    
    db.commit()
    return {"message": "Orden cobrada exitosamente"}

# ============================================
# DASHBOARD
# ============================================

@router.get("/dashboard/resumen")
def get_dashboard_resumen(db: Session = Depends(get_db)):
    """Obtener resumen del dashboard"""
    hoy = datetime.utcnow().date()
    
    # Ingresos del día
    pagos_hoy = db.query(Pago).filter(
        Pago.created_at >= datetime.combine(hoy, datetime.min.time())
    ).all()
    ingresos_hoy = sum(p.monto for p in pagos_hoy)
    
    # Órdenes abiertas
    ordenes_abiertas = db.query(Orden).filter(
        ~Orden.estado.in_(["entregado", "cancelado"])
    ).count()
    
    # Órdenes listas
    ordenes_listas = db.query(Orden).filter(Orden.estado == "listo").count()
    
    # Stock crítico
    stock_critico = db.query(Repuesto).filter(
        Repuesto.activo == True,
        Repuesto.stock_actual <= Repuesto.stock_minimo
    ).all()
    
    return {
        "ingresos_hoy": ingresos_hoy,
        "ordenes_abiertas": ordenes_abiertas,
        "ordenes_listas": ordenes_listas,
        "stock_critico": [
            {
                "id": r.id,
                "nombre": r.nombre,
                "categoria": r.categoria,
                "stock_actual": r.stock_actual,
                "stock_minimo": r.stock_minimo
            }
            for r in stock_critico
        ]
    }

# ============================================
# HEALTH CHECK
# ============================================

@router.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.utcnow()}
