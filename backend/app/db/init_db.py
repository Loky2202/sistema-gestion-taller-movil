# Inicialización de Base de Datos con Seed Data
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..models import User, Cliente, Vehiculo, Orden, OrdenItem, Repuesto
from ..core.security import get_password_hash


def init_db(db: Session):
    """Inicializa la base de datos con datos de ejemplo"""
    
    # Verificar si ya hay datos
    if db.query(User).first():
        print("Base de datos ya inicializada")
        return
    
    print("Inicializando base de datos con datos de ejemplo...")
    
    # Crear usuarios
    admin = User(
        nombre="Admin Taller",
        email="admin@taller.com",
        password_hash=get_password_hash("admin123"),
        rol="admin",
        activo=True
    )
    
    mecanico = User(
        nombre="Carlos Mecánico",
        email="mecanico@taller.com",
        password_hash=get_password_hash("meca123"),
        rol="mecanico",
        activo=True
    )
    
    db.add_all([admin, mecanico])
    db.commit()
    
    # Crear clientes
    cliente1 = Cliente(
        nombre="María García",
        telefono="3001234567",
        email="maria@email.com",
        notas="Cliente frecuente"
    )
    
    cliente2 = Cliente(
        nombre="Juan Rodríguez",
        telefono="3009876543"
    )
    
    db.add_all([cliente1, cliente2])
    db.commit()
    
    # Crear vehículos
    vehiculo1 = Vehiculo(
        placa="ABC123",
        tipo="moto",
        marca="Yamaha",
        modelo="MT-07",
        anio=2022,
        color="Negro",
        cliente_id=cliente1.id
    )
    
    vehiculo2 = Vehiculo(
        placa="XYZ789",
        tipo="carro",
        marca="Chevrolet",
        modelo="Spark",
        anio=2020,
        color="Blanco",
        cliente_id=cliente2.id
    )
    
    db.add_all([vehiculo1, vehiculo2])
    db.commit()
    
    # Crear repuestos
    repuestos_data = [
        {"sku": "ACE-001", "nombre": "Aceite Motor 10W-40", "categoria": "Lubricantes", "unidad": "litro", "stock_actual": 15, "stock_minimo": 5, "precio_costo": 18000, "precio_venta": 28000, "proveedor": "Lubricantes SA"},
        {"sku": "FIL-001", "nombre": "Filtro de Aceite Universal", "categoria": "Motor", "unidad": "unidad", "stock_actual": 8, "stock_minimo": 3, "precio_costo": 12000, "precio_venta": 22000, "proveedor": "Repuestos El Turbo"},
        {"sku": "PAS-001", "nombre": "Pastillas de Freno Delanteras", "categoria": "Frenos", "unidad": "juego", "stock_actual": 4, "stock_minimo": 3, "precio_costo": 35000, "precio_venta": 55000, "proveedor": "FrenosPro"},
        {"sku": "BUJ-001", "nombre": "Bujía NGK CPR8EA9", "categoria": "Eléctrico", "unidad": "unidad", "stock_actual": 20, "stock_minimo": 8, "precio_costo": 8000, "precio_venta": 15000, "proveedor": "Eléctrica Moto"},
        {"sku": "CAD-001", "nombre": "Cadena de Distribución 428H", "categoria": "Motor", "unidad": "juego", "stock_actual": 3, "stock_minimo": 2, "precio_costo": 45000, "precio_venta": 75000, "proveedor": "Repuestos El Turbo"},
        {"sku": "LLT-001", "nombre": "Llanta 110/80-17", "categoria": "Llantas", "unidad": "unidad", "stock_actual": 6, "stock_minimo": 2, "precio_costo": 85000, "precio_venta": 130000, "proveedor": "Llantas & Cauchos"},
        {"sku": "AMO-001", "nombre": "Amortiguador Trasero", "categoria": "Suspensión", "unidad": "unidad", "stock_actual": 2, "stock_minimo": 1, "precio_costo": 120000, "precio_venta": 195000, "proveedor": "Suspensiones Plus"},
        {"sku": "BAT-001", "nombre": "Batería 12V 7Ah", "categoria": "Eléctrico", "unidad": "unidad", "stock_actual": 5, "stock_minimo": 2, "precio_costo": 65000, "precio_venta": 98000, "proveedor": "Eléctrica Moto"},
        {"sku": "COR-001", "nombre": "Correa Transmisión", "categoria": "Motor", "unidad": "unidad", "stock_actual": 3, "stock_minimo": 2, "precio_costo": 55000, "precio_venta": 88000, "proveedor": "Repuestos El Turbo"},
        {"sku": "LIQ-001", "nombre": "Líquido de Frenos DOT4", "categoria": "Frenos", "unidad": "litro", "stock_actual": 10, "stock_minimo": 4, "precio_costo": 12000, "precio_venta": 20000, "proveedor": "FrenosPro"},
    ]
    
    repuestos = []
    for data in repuestos_data:
        repuesto = Repuesto(**data, activo=True)
        repuestos.append(repuesto)
    
    db.add_all(repuestos)
    db.commit()
    
    # Crear órdenes de ejemplo
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)
    
    orden1 = Orden(
        vehiculo_id=vehiculo1.id,
        mecanico_id=mecanico.id,
        estado="en_reparacion",
        falla_reportada="Ruido extraño en el motor",
        diagnostico="Cadena floja",
        fecha_ingreso=yesterday,
        fecha_estimada=now,
        total_servicios=50000,
        total_repuestos=75000,
        total=125000
    )
    
    orden2 = Orden(
        vehiculo_id=vehiculo2.id,
        mecanico_id=mecanico.id,
        estado="recibido",
        falla_reportada="Cambio de aceite y revisión general",
        fecha_ingreso=now,
        total_servicios=30000,
        total_repuestos=50000,
        total=80000
    )
    
    db.add_all([orden1, orden2])
    db.commit()
    
    # Crear items de órdenes
    item1 = OrdenItem(
        orden_id=orden1.id,
        tipo="servicio",
        descripcion="Ajuste de cadena",
        cantidad=1,
        precio_unitario=50000,
        subtotal=50000
    )
    
    item2 = OrdenItem(
        orden_id=orden1.id,
        tipo="repuesto",
        repuesto_id=repuestos[4].id,  # Cadena
        descripcion="Cadena de Distribución 428H",
        cantidad=1,
        precio_unitario=75000,
        subtotal=75000
    )
    
    item3 = OrdenItem(
        orden_id=orden2.id,
        tipo="servicio",
        descripcion="Cambio de aceite",
        cantidad=1,
        precio_unitario=30000,
        subtotal=30000
    )
    
    item4 = OrdenItem(
        orden_id=orden2.id,
        tipo="repuesto",
        repuesto_id=repuestos[0].id,  # Aceite
        descripcion="Aceite Motor 10W-40",
        cantidad=1,
        precio_unitario=28000,
        subtotal=28000
    )
    
    item5 = OrdenItem(
        orden_id=orden2.id,
        tipo="repuesto",
        repuesto_id=repuestos[1].id,  # Filtro
        descripcion="Filtro de Aceite Universal",
        cantidad=1,
        precio_unitario=22000,
        subtotal=22000
    )
    
    db.add_all([item1, item2, item3, item4, item5])
    db.commit()
    
    print("✓ Base de datos inicializada exitosamente")
    print("✓ Usuarios creados: admin@taller.com / admin123, mecanico@taller.com / meca123")
    print("✓ Clientes creados: 2")
    print("✓ Vehículos creados: 2")
    print("✓ Repuestos creados: 10")
    print("✓ Órdenes creadas: 2")
