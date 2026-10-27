# API Principal - Todas las rutas
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from .core.config import settings
from .core.deps import get_current_admin, get_current_user, get_db
from .core.security import create_access_token, get_password_hash, verify_password
from .db.init_db import init_db
from .models.models import (
    Alerta,
    CierreCaja,
    Cliente,
    MovimientoInventario,
    Orden,
    OrdenItem,
    Pago,
    Repuesto,
    User,
    Vehiculo,
)

router = APIRouter()

ESTADOS_VALIDOS = {
    "recibido",
    "en_reparacion",
    "esperando_repuesto",
    "listo",
    "entregado",
    "cancelado",
}


# ============================================
# SCHEMAS
# ============================================

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(ORMModel):
    id: str
    nombre: str
    email: str
    rol: str
    activo: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class UserCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str = "mecanico"
    activo: bool = True


class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None


class ClienteCreate(BaseModel):
    nombre: str
    telefono: str
    email: Optional[str] = None
    notas: Optional[str] = None


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    notas: Optional[str] = None


class ClienteResponse(ClienteCreate, ORMModel):
    id: str
    created_at: datetime


class VehiculoCreate(BaseModel):
    placa: str
    tipo: str
    marca: str
    modelo: str
    anio: int
    color: Optional[str] = None
    foto_url: Optional[str] = None
    cliente_id: str


class VehiculoUpdate(BaseModel):
    placa: Optional[str] = None
    tipo: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio: Optional[int] = None
    color: Optional[str] = None
    foto_url: Optional[str] = None
    cliente_id: Optional[str] = None


class VehiculoResponse(VehiculoCreate, ORMModel):
    id: str
    created_at: datetime


class RepuestoCreate(BaseModel):
    sku: str
    nombre: str
    categoria: str
    unidad: str
    stock_actual: int = 0
    stock_minimo: int = 0
    precio_costo: float
    precio_venta: float
    proveedor: Optional[str] = None
    foto_url: Optional[str] = None


class RepuestoUpdate(BaseModel):
    sku: Optional[str] = None
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    unidad: Optional[str] = None
    stock_actual: Optional[int] = None
    stock_minimo: Optional[int] = None
    precio_costo: Optional[float] = None
    precio_venta: Optional[float] = None
    proveedor: Optional[str] = None
    foto_url: Optional[str] = None
    activo: Optional[bool] = None


class RepuestoResponse(RepuestoCreate, ORMModel):
    id: str
    activo: bool
    created_at: datetime


class MovimientoCreate(BaseModel):
    tipo: str
    cantidad: int
    motivo: str


class MovimientoResponse(ORMModel):
    id: str
    repuesto_id: str
    tipo: str
    cantidad: int
    motivo: str
    usuario_id: str
    created_at: datetime


class OrdenItemCreate(BaseModel):
    tipo: str
    repuesto_id: Optional[str] = None
    descripcion: str
    cantidad: int
    precio_unitario: float


class OrdenItemResponse(ORMModel):
    id: str
    orden_id: str
    tipo: str
    repuesto_id: Optional[str] = None
    descripcion: str
    cantidad: int
    precio_unitario: float
    subtotal: float


class OrdenCreate(BaseModel):
    vehiculo_id: str
    falla_reportada: str
    diagnostico: Optional[str] = None
    fecha_estimada: Optional[datetime] = None
    notas: Optional[str] = None
    items: List[OrdenItemCreate] = []


class OrdenResponse(ORMModel):
    id: str
    vehiculo_id: str
    mecanico_id: str
    estado: str
    falla_reportada: str
    diagnostico: Optional[str] = None
    fecha_ingreso: datetime
    fecha_estimada: Optional[datetime] = None
    fecha_entrega: Optional[datetime] = None
    total_servicios: float
    total_repuestos: float
    total: float
    notas: Optional[str] = None
    items: List[OrdenItemResponse] = []
    created_at: datetime
    updated_at: datetime


class EstadoUpdate(BaseModel):
    estado: str


class CobroRequest(BaseModel):
    metodo: str
    monto_recibido: float


class PagoResponse(ORMModel):
    id: str
    orden_id: str
    metodo: str
    monto: float
    monto_recibido: float
    cambio: float
    usuario_id: str
    created_at: datetime


class AlertaResponse(ORMModel):
    id: str
    repuesto_id: str
    tipo: str
    mensaje: str
    leida: bool
    created_at: datetime


class CierreResponse(ORMModel):
    id: str
    fecha: str
    total_efectivo: float
    total_transferencia: float
    total_tarjeta: float
    total_mixto: float
    total_general: float
    usuario_id: str
    created_at: datetime


class ResumenCaja(BaseModel):
    total_efectivo: float
    total_transferencia: float
    total_tarjeta: float
    total_mixto: float
    total_general: float
    ordenes_entregadas: int


class DashboardResumen(BaseModel):
    ingresos_hoy: float
    ordenes_abiertas: int
    ordenes_listas: int
    stock_critico: List[RepuestoResponse]
    ordenes_listas_detalle: List[dict]
    ingresos_7dias: List[dict]


# ============================================
# HELPERS
# ============================================

# Zona horaria del taller: las fechas se guardan en UTC, pero los cortes de día
# (caja, ingresos) se calculan en hora local.
TZ_LOCAL = timezone(timedelta(hours=settings.UTC_OFFSET_HOURS))


def _a_utc(fecha: datetime) -> datetime:
    return fecha.replace(tzinfo=timezone.utc) if fecha.tzinfo is None else fecha


def _inicio_dia(fecha: Optional[datetime] = None) -> datetime:
    """Medianoche local expresada como datetime UTC naive (como se guarda en la BD)."""
    local = datetime.now(TZ_LOCAL) if fecha is None else _a_utc(fecha).astimezone(TZ_LOCAL)
    inicio = datetime.combine(local.date(), datetime.min.time(), tzinfo=TZ_LOCAL)
    return inicio.astimezone(timezone.utc).replace(tzinfo=None)


def _fin_dia(fecha: Optional[datetime] = None) -> datetime:
    return _inicio_dia(fecha) + timedelta(days=1)


def _fecha_local(fecha: Optional[datetime] = None) -> str:
    """Fecha (YYYY-MM-DD) en hora local del taller."""
    if fecha is None:
        return datetime.now(TZ_LOCAL).strftime("%Y-%m-%d")
    return _a_utc(fecha).astimezone(TZ_LOCAL).strftime("%Y-%m-%d")


def _get_orden(db: Session, orden_id: str) -> Orden:
    orden = (
        db.query(Orden)
        .options(selectinload(Orden.items))
        .filter(Orden.id == orden_id)
        .first()
    )
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return orden


def _recalcular_totales(orden: Orden) -> None:
    orden.total_servicios = sum(i.subtotal for i in orden.items if i.tipo == "servicio")
    orden.total_repuestos = sum(i.subtotal for i in orden.items if i.tipo == "repuesto")
    orden.total = orden.total_servicios + orden.total_repuestos


def _crear_alerta_stock(db: Session, repuesto: Repuesto) -> None:
    if repuesto.stock_actual > repuesto.stock_minimo:
        return
    existe = (
        db.query(Alerta)
        .filter(Alerta.repuesto_id == repuesto.id, Alerta.leida == False)
        .first()
    )
    if not existe:
        db.add(
            Alerta(
                repuesto_id=repuesto.id,
                tipo="stock_bajo",
                mensaje=(
                    f"{repuesto.nombre} tiene stock bajo "
                    f"({repuesto.stock_actual} {repuesto.unidad})"
                ),
            )
        )


def _resumen_caja(db: Session, fecha: Optional[datetime] = None) -> dict:
    inicio = _inicio_dia(fecha)
    fin = _fin_dia(fecha)
    pagos = db.query(Pago).filter(Pago.created_at >= inicio, Pago.created_at < fin).all()

    def total(metodo: str) -> float:
        return sum(p.monto for p in pagos if p.metodo == metodo)

    ordenes_entregadas = (
        db.query(Orden)
        .filter(
            Orden.estado == "entregado",
            Orden.fecha_entrega >= inicio,
            Orden.fecha_entrega < fin,
        )
        .count()
    )

    return {
        "total_efectivo": total("efectivo"),
        "total_transferencia": total("transferencia"),
        "total_tarjeta": total("tarjeta"),
        "total_mixto": total("mixto"),
        "total_general": sum(p.monto for p in pagos),
        "ordenes_entregadas": ordenes_entregadas,
    }


# ============================================
# AUTH
# ============================================

@router.post("/auth/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login de usuario."""
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )

    access_token = create_access_token(data={"sub": user.email, "rol": user.rol})
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Obtener usuario actual."""
    return current_user


# ============================================
# USUARIOS
# ============================================

@router.get("/usuarios", response_model=List[UserResponse])
def get_usuarios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar usuarios del sistema."""
    return db.query(User).order_by(User.nombre).all()


@router.get("/usuarios/{usuario_id}", response_model=UserResponse)
def get_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener un usuario por ID."""
    usuario = db.query(User).filter(User.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.post("/usuarios", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_usuario(
    usuario: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Crear usuario (solo admin)."""
    if db.query(User).filter(User.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")

    if usuario.rol not in {"admin", "mecanico"}:
        raise HTTPException(status_code=400, detail="Rol inválido")

    db_usuario = User(
        nombre=usuario.nombre,
        email=usuario.email,
        password_hash=get_password_hash(usuario.password),
        rol=usuario.rol,
        activo=usuario.activo,
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


@router.patch("/usuarios/{usuario_id}", response_model=UserResponse)
def update_usuario(
    usuario_id: str,
    cambios: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Actualizar usuario (solo admin)."""
    usuario = db.query(User).filter(User.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    data = cambios.model_dump(exclude_unset=True)
    if "email" in data and data["email"] != usuario.email:
        if db.query(User).filter(User.email == data["email"]).first():
            raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")
    if "rol" in data and data["rol"] not in {"admin", "mecanico"}:
        raise HTTPException(status_code=400, detail="Rol inválido")
    if "password" in data:
        password = data.pop("password")
        if password:
            usuario.password_hash = get_password_hash(password)

    for campo, valor in data.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)
    return usuario


# ============================================
# CLIENTES
# ============================================

@router.get("/clientes", response_model=List[ClienteResponse])
def get_clientes(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener clientes, opcionalmente filtrados por texto."""
    query = db.query(Cliente)
    if q:
        patron = f"%{q}%"
        query = query.filter(
            or_(
                Cliente.nombre.ilike(patron),
                Cliente.telefono.ilike(patron),
                Cliente.email.ilike(patron),
            )
        )
    return query.order_by(Cliente.nombre).all()


@router.get("/clientes/{cliente_id}", response_model=ClienteResponse)
def get_cliente(
    cliente_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener un cliente por ID."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("/clientes", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def create_cliente(
    cliente: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crear cliente nuevo."""
    existe = db.query(Cliente).filter(Cliente.telefono == cliente.telefono).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un cliente con ese teléfono")

    db_cliente = Cliente(**cliente.model_dump())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente


@router.patch("/clientes/{cliente_id}", response_model=ClienteResponse)
def update_cliente(
    cliente_id: str,
    cambios: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualizar un cliente."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    data = cambios.model_dump(exclude_unset=True)
    if "telefono" in data and data["telefono"] != cliente.telefono:
        existe = db.query(Cliente).filter(Cliente.telefono == data["telefono"]).first()
        if existe:
            raise HTTPException(status_code=400, detail="Ya existe un cliente con ese teléfono")

    for campo, valor in data.items():
        setattr(cliente, campo, valor)

    db.commit()
    db.refresh(cliente)
    return cliente


@router.get("/clientes/{cliente_id}/vehiculos", response_model=List[VehiculoResponse])
def get_vehiculos_cliente(
    cliente_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener los vehículos de un cliente."""
    return (
        db.query(Vehiculo)
        .filter(Vehiculo.cliente_id == cliente_id)
        .order_by(Vehiculo.placa)
        .all()
    )


# ============================================
# VEHICULOS
# ============================================

@router.get("/vehiculos", response_model=List[VehiculoResponse])
def get_vehiculos(
    q: Optional[str] = None,
    cliente_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener vehículos, opcionalmente filtrados."""
    query = db.query(Vehiculo)
    if cliente_id:
        query = query.filter(Vehiculo.cliente_id == cliente_id)
    if q:
        patron = f"%{q}%"
        query = query.outerjoin(Cliente, Vehiculo.cliente_id == Cliente.id).filter(
            or_(
                Vehiculo.placa.ilike(patron),
                Vehiculo.marca.ilike(patron),
                Vehiculo.modelo.ilike(patron),
                Cliente.nombre.ilike(patron),
            )
        )
    return query.order_by(Vehiculo.placa).all()


@router.get("/vehiculos/{vehiculo_id}", response_model=VehiculoResponse)
def get_vehiculo(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener un vehículo por ID."""
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehiculo


@router.post("/vehiculos", response_model=VehiculoResponse, status_code=status.HTTP_201_CREATED)
def create_vehiculo(
    vehiculo: VehiculoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crear vehículo nuevo."""
    existe = db.query(Vehiculo).filter(Vehiculo.placa == vehiculo.placa).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un vehículo con esa placa")

    if not db.query(Cliente).filter(Cliente.id == vehiculo.cliente_id).first():
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db_vehiculo = Vehiculo(**vehiculo.model_dump())
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo


@router.patch("/vehiculos/{vehiculo_id}", response_model=VehiculoResponse)
def update_vehiculo(
    vehiculo_id: str,
    cambios: VehiculoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualizar un vehículo."""
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    data = cambios.model_dump(exclude_unset=True)
    if "placa" in data and data["placa"] != vehiculo.placa:
        existe = db.query(Vehiculo).filter(Vehiculo.placa == data["placa"]).first()
        if existe:
            raise HTTPException(status_code=400, detail="Ya existe un vehículo con esa placa")

    for campo, valor in data.items():
        setattr(vehiculo, campo, valor)

    db.commit()
    db.refresh(vehiculo)
    return vehiculo


@router.get("/vehiculos/{vehiculo_id}/historial", response_model=List[OrdenResponse])
def get_historial_vehiculo(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Historial de órdenes de un vehículo."""
    return (
        db.query(Orden)
        .options(selectinload(Orden.items))
        .filter(Orden.vehiculo_id == vehiculo_id)
        .order_by(Orden.created_at.desc())
        .all()
    )


# ============================================
# REPUESTOS
# ============================================

@router.get("/repuestos/stock-bajo", response_model=List[RepuestoResponse])
def get_stock_bajo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Repuestos con stock en o por debajo del mínimo."""
    return (
        db.query(Repuesto)
        .filter(Repuesto.activo == True, Repuesto.stock_actual <= Repuesto.stock_minimo)
        .order_by(Repuesto.nombre)
        .all()
    )


@router.get("/repuestos", response_model=List[RepuestoResponse])
def get_repuestos(
    q: Optional[str] = None,
    stock_bajo: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener repuestos activos, opcionalmente filtrados."""
    query = db.query(Repuesto).filter(Repuesto.activo == True)
    if stock_bajo:
        query = query.filter(Repuesto.stock_actual <= Repuesto.stock_minimo)
    if q:
        patron = f"%{q}%"
        query = query.filter(
            or_(
                Repuesto.nombre.ilike(patron),
                Repuesto.sku.ilike(patron),
                Repuesto.categoria.ilike(patron),
            )
        )
    return query.order_by(Repuesto.nombre).all()


@router.get("/repuestos/{repuesto_id}", response_model=RepuestoResponse)
def get_repuesto(
    repuesto_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener un repuesto por ID."""
    repuesto = db.query(Repuesto).filter(Repuesto.id == repuesto_id).first()
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    return repuesto


@router.post("/repuestos", response_model=RepuestoResponse, status_code=status.HTTP_201_CREATED)
def create_repuesto(
    repuesto: RepuestoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Crear repuesto nuevo (solo admin)."""
    existe = db.query(Repuesto).filter(Repuesto.sku == repuesto.sku).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un repuesto con ese código")

    db_repuesto = Repuesto(**repuesto.model_dump(), activo=True)
    db.add(db_repuesto)
    db.commit()
    db.refresh(db_repuesto)
    return db_repuesto


@router.patch("/repuestos/{repuesto_id}", response_model=RepuestoResponse)
def update_repuesto(
    repuesto_id: str,
    cambios: RepuestoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Actualizar un repuesto (solo admin)."""
    repuesto = db.query(Repuesto).filter(Repuesto.id == repuesto_id).first()
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")

    data = cambios.model_dump(exclude_unset=True)
    if "sku" in data and data["sku"] != repuesto.sku:
        existe = db.query(Repuesto).filter(Repuesto.sku == data["sku"]).first()
        if existe:
            raise HTTPException(status_code=400, detail="Ya existe un repuesto con ese código")

    for campo, valor in data.items():
        setattr(repuesto, campo, valor)

    _crear_alerta_stock(db, repuesto)
    db.commit()
    db.refresh(repuesto)
    return repuesto


@router.get("/repuestos/{repuesto_id}/movimientos", response_model=List[MovimientoResponse])
def get_movimientos_repuesto(
    repuesto_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Movimientos de inventario de un repuesto."""
    return (
        db.query(MovimientoInventario)
        .filter(MovimientoInventario.repuesto_id == repuesto_id)
        .order_by(MovimientoInventario.created_at.desc())
        .all()
    )


@router.post(
    "/repuestos/{repuesto_id}/movimientos",
    response_model=MovimientoResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_movimiento(
    repuesto_id: str,
    movimiento: MovimientoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registrar entrada, salida o ajuste de inventario."""
    repuesto = db.query(Repuesto).filter(Repuesto.id == repuesto_id).first()
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")

    if movimiento.tipo not in {"entrada", "salida", "ajuste"}:
        raise HTTPException(status_code=400, detail="Tipo de movimiento inválido")

    if movimiento.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor que cero")

    if movimiento.tipo == "salida":
        if repuesto.stock_actual < movimiento.cantidad:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Stock insuficiente de {repuesto.nombre}. "
                    f"Disponible: {repuesto.stock_actual}"
                ),
            )
        repuesto.stock_actual -= movimiento.cantidad
    else:
        repuesto.stock_actual += movimiento.cantidad

    db_mov = MovimientoInventario(
        repuesto_id=repuesto.id,
        tipo=movimiento.tipo,
        cantidad=movimiento.cantidad,
        motivo=movimiento.motivo,
        usuario_id=current_user.id,
    )
    db.add(db_mov)
    _crear_alerta_stock(db, repuesto)
    db.commit()
    db.refresh(db_mov)
    return db_mov


# ============================================
# ORDENES
# ============================================

@router.get("/ordenes", response_model=List[OrdenResponse])
def get_ordenes(
    estado: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener órdenes, opcionalmente filtradas por estado y texto."""
    query = db.query(Orden).options(selectinload(Orden.items))
    if estado:
        query = query.filter(Orden.estado == estado)
    if q:
        patron = f"%{q}%"
        query = (
            query.outerjoin(Vehiculo, Orden.vehiculo_id == Vehiculo.id)
            .outerjoin(Cliente, Vehiculo.cliente_id == Cliente.id)
            .filter(
                or_(
                    Orden.falla_reportada.ilike(patron),
                    Vehiculo.placa.ilike(patron),
                    Cliente.nombre.ilike(patron),
                )
            )
        )
    return query.order_by(Orden.created_at.desc()).all()


@router.get("/ordenes/{orden_id}", response_model=OrdenResponse)
def get_orden(
    orden_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener una orden por ID."""
    return _get_orden(db, orden_id)


@router.post("/ordenes", response_model=OrdenResponse, status_code=status.HTTP_201_CREATED)
def create_orden(
    orden: OrdenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crear orden nueva."""
    if not db.query(Vehiculo).filter(Vehiculo.id == orden.vehiculo_id).first():
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    db_orden = Orden(
        vehiculo_id=orden.vehiculo_id,
        mecanico_id=current_user.id,
        estado="recibido",
        falla_reportada=orden.falla_reportada,
        diagnostico=orden.diagnostico,
        fecha_estimada=orden.fecha_estimada,
        notas=orden.notas,
    )
    db.add(db_orden)
    db.flush()

    for item_data in orden.items:
        if item_data.tipo not in {"servicio", "repuesto"}:
            raise HTTPException(status_code=400, detail="Tipo de ítem inválido")
        if item_data.cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor que cero")

        subtotal = item_data.cantidad * item_data.precio_unitario
        db.add(
            OrdenItem(
                orden_id=db_orden.id,
                tipo=item_data.tipo,
                repuesto_id=item_data.repuesto_id,
                descripcion=item_data.descripcion,
                cantidad=item_data.cantidad,
                precio_unitario=item_data.precio_unitario,
                subtotal=subtotal,
            )
        )

    db.flush()
    db.refresh(db_orden)
    _recalcular_totales(db_orden)
    db.commit()
    return _get_orden(db, db_orden.id)


@router.patch("/ordenes/{orden_id}/estado", response_model=OrdenResponse)
def update_estado_orden(
    orden_id: str,
    estado_update: EstadoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cambiar estado de una orden."""
    orden = _get_orden(db, orden_id)

    if estado_update.estado not in ESTADOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Estado inválido")

    if orden.estado in {"entregado", "cancelado"}:
        raise HTTPException(status_code=400, detail="No se puede modificar una orden finalizada")

    # Si pasa a "listo" por primera vez, descontar stock y registrar movimientos.
    if estado_update.estado == "listo" and orden.estado != "listo":
        items_repuesto = [i for i in orden.items if i.tipo == "repuesto" and i.repuesto_id]

        for item in items_repuesto:
            repuesto = db.query(Repuesto).filter(Repuesto.id == item.repuesto_id).first()
            if not repuesto or repuesto.stock_actual < item.cantidad:
                nombre = repuesto.nombre if repuesto else "repuesto"
                disponible = repuesto.stock_actual if repuesto else 0
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Stock insuficiente de {nombre}. "
                        f"Disponible: {disponible}, requerido: {item.cantidad}"
                    ),
                )

        for item in items_repuesto:
            repuesto = db.query(Repuesto).filter(Repuesto.id == item.repuesto_id).first()
            repuesto.stock_actual -= item.cantidad
            db.add(
                MovimientoInventario(
                    repuesto_id=repuesto.id,
                    tipo="salida",
                    cantidad=item.cantidad,
                    motivo=f"Orden #{orden.id[:6]}",
                    usuario_id=current_user.id,
                )
            )
            _crear_alerta_stock(db, repuesto)

    orden.estado = estado_update.estado
    if estado_update.estado == "entregado":
        orden.fecha_entrega = datetime.utcnow()

    db.commit()
    return _get_orden(db, orden.id)


@router.post("/ordenes/{orden_id}/items", response_model=OrdenResponse)
def add_item_orden(
    orden_id: str,
    item: OrdenItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Agregar un ítem a una orden."""
    orden = _get_orden(db, orden_id)
    if orden.estado in {"entregado", "cancelado"}:
        raise HTTPException(status_code=400, detail="No se puede modificar una orden finalizada")
    if item.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor que cero")

    subtotal = item.cantidad * item.precio_unitario
    db.add(
        OrdenItem(
            orden_id=orden.id,
            tipo=item.tipo,
            repuesto_id=item.repuesto_id,
            descripcion=item.descripcion,
            cantidad=item.cantidad,
            precio_unitario=item.precio_unitario,
            subtotal=subtotal,
        )
    )
    db.flush()
    db.refresh(orden)
    _recalcular_totales(orden)
    db.commit()
    return _get_orden(db, orden.id)


@router.delete("/ordenes/{orden_id}/items/{item_id}", response_model=OrdenResponse)
def delete_item_orden(
    orden_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Eliminar un ítem de una orden."""
    orden = _get_orden(db, orden_id)
    if orden.estado in {"entregado", "cancelado"}:
        raise HTTPException(status_code=400, detail="No se puede modificar una orden finalizada")

    item = next((i for i in orden.items if i.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")

    # Si la orden ya estaba "listo", el stock fue descontado: restaurarlo.
    if orden.estado == "listo" and item.tipo == "repuesto" and item.repuesto_id:
        repuesto = db.query(Repuesto).filter(Repuesto.id == item.repuesto_id).first()
        if repuesto:
            repuesto.stock_actual += item.cantidad
            db.add(
                MovimientoInventario(
                    repuesto_id=repuesto.id,
                    tipo="entrada",
                    cantidad=item.cantidad,
                    motivo=f"Eliminación ítem en orden #{orden.id[:6]}",
                    usuario_id=current_user.id,
                )
            )

    db.delete(item)
    db.flush()
    db.refresh(orden)
    _recalcular_totales(orden)
    db.commit()
    return _get_orden(db, orden.id)


@router.post(
    "/ordenes/{orden_id}/cobrar",
    response_model=PagoResponse,
    status_code=status.HTTP_201_CREATED,
)
def cobrar_orden(
    orden_id: str,
    cobro: CobroRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cobrar una orden en estado 'listo'."""
    orden = _get_orden(db, orden_id)

    if orden.estado != "listo":
        raise HTTPException(
            status_code=400,
            detail="La orden debe estar en estado 'listo' para cobrar",
        )

    pago = Pago(
        orden_id=orden.id,
        metodo=cobro.metodo,
        monto=orden.total,
        monto_recibido=cobro.monto_recibido,
        cambio=max(0, cobro.monto_recibido - orden.total),
        usuario_id=current_user.id,
    )
    db.add(pago)

    orden.estado = "entregado"
    orden.fecha_entrega = datetime.utcnow()

    db.commit()
    db.refresh(pago)
    return pago


# ============================================
# CAJA
# ============================================

@router.get("/caja/resumen-hoy", response_model=ResumenCaja)
def get_resumen_hoy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resumen de caja del día actual."""
    return _resumen_caja(db)


@router.post("/caja/cerrar", response_model=CierreResponse, status_code=status.HTTP_201_CREATED)
def cerrar_caja(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Cerrar la caja del día (solo admin)."""
    hoy = _fecha_local()

    if db.query(CierreCaja).filter(CierreCaja.fecha == hoy).first():
        raise HTTPException(
            status_code=400,
            detail="Ya se realizó un cierre de caja hoy",
        )

    resumen = _resumen_caja(db)
    cierre = CierreCaja(
        fecha=hoy,
        total_efectivo=resumen["total_efectivo"],
        total_transferencia=resumen["total_transferencia"],
        total_tarjeta=resumen["total_tarjeta"],
        total_mixto=resumen["total_mixto"],
        total_general=resumen["total_general"],
        usuario_id=current_user.id,
    )
    db.add(cierre)
    db.commit()
    db.refresh(cierre)
    return cierre


@router.get("/caja/cierres", response_model=List[CierreResponse])
def get_cierres(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Historial de cierres de caja."""
    return db.query(CierreCaja).order_by(CierreCaja.created_at.desc()).all()


# ============================================
# DASHBOARD
# ============================================

@router.get("/dashboard/resumen", response_model=DashboardResumen)
def get_dashboard_resumen(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resumen del dashboard."""
    hoy = datetime.utcnow()
    inicio_hoy = _inicio_dia(hoy)
    fin_hoy = _fin_dia(hoy)

    pagos_hoy = db.query(Pago).filter(
        Pago.created_at >= inicio_hoy, Pago.created_at < fin_hoy
    ).all()
    ingresos_hoy = sum(p.monto for p in pagos_hoy)

    ordenes_abiertas = (
        db.query(Orden)
        .filter(~Orden.estado.in_(["entregado", "cancelado"]))
        .count()
    )
    ordenes_listas = db.query(Orden).filter(Orden.estado == "listo").count()

    stock_critico = (
        db.query(Repuesto)
        .filter(Repuesto.activo == True, Repuesto.stock_actual <= Repuesto.stock_minimo)
        .all()
    )

    ordenes_listas_db = (
        db.query(Orden)
        .options(selectinload(Orden.items))
        .filter(Orden.estado == "listo")
        .order_by(Orden.created_at.desc())
        .all()
    )

    ordenes_listas_detalle = []
    for orden in ordenes_listas_db:
        vehiculo = db.query(Vehiculo).filter(Vehiculo.id == orden.vehiculo_id).first()
        cliente = (
            db.query(Cliente).filter(Cliente.id == vehiculo.cliente_id).first()
            if vehiculo
            else None
        )
        ordenes_listas_detalle.append(
            {
                "orden": OrdenResponse.model_validate(orden).model_dump(),
                "cliente": cliente.nombre if cliente else "",
                "vehiculo": f"{vehiculo.marca} {vehiculo.modelo}" if vehiculo else "",
            }
        )

    ingresos_7dias = []
    for i in range(6, -1, -1):
        fecha = datetime.utcnow() - timedelta(days=i)
        inicio = _inicio_dia(fecha)
        fin = _fin_dia(fecha)
        total = sum(
            p.monto
            for p in db.query(Pago)
            .filter(Pago.created_at >= inicio, Pago.created_at < fin)
            .all()
        )
        ingresos_7dias.append({"fecha": _fecha_local(fecha), "total": total})

    return {
        "ingresos_hoy": ingresos_hoy,
        "ordenes_abiertas": ordenes_abiertas,
        "ordenes_listas": ordenes_listas,
        "stock_critico": stock_critico,
        "ordenes_listas_detalle": ordenes_listas_detalle,
        "ingresos_7dias": ingresos_7dias,
    }


# ============================================
# ALERTAS
# ============================================

@router.get("/alertas", response_model=List[AlertaResponse])
def get_alertas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar alertas."""
    return db.query(Alerta).order_by(Alerta.created_at.desc()).all()


@router.patch("/alertas/{alerta_id}/leida", response_model=AlertaResponse)
def marcar_alerta_leida(
    alerta_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marcar una alerta como leída."""
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alerta.leida = True
    db.commit()
    db.refresh(alerta)
    return alerta


# ============================================
# ADMIN / UTILIDADES
# ============================================

@router.post("/admin/reset")
def reset_database(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Restablecer los datos de ejemplo (solo admin, destructivo)."""
    for model in [
        Pago,
        OrdenItem,
        Alerta,
        MovimientoInventario,
        CierreCaja,
        Orden,
        Vehiculo,
        Cliente,
        Repuesto,
        User,
    ]:
        db.query(model).delete()
    db.commit()

    init_db(db)
    return {"message": "Datos restablecidos correctamente"}


@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.utcnow()}
