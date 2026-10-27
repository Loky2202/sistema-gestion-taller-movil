#!/bin/bash

# ============================================
# Script de Backup - TallerPro
# ============================================
# Este script genera un backup de los datos de localStorage
# Uso: ./backup.sh
# ============================================

set -e

# Configuración
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="tallerpro_backup_${DATE}.json"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 TallerPro - Backup de Datos${NC}"
echo "================================"
echo ""

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Instrucciones para el usuario
echo -e "${YELLOW}📋 Instrucciones:${NC}"
echo ""
echo "1. Abre tu aplicación en el navegador"
echo "2. Presiona F12 para abrir las herramientas de desarrollador"
echo "3. Ve a la pestaña 'Console'"
echo "4. Copia y pega el siguiente comando:"
echo ""
echo -e "${GREEN}copy(JSON.stringify({${NC}"
echo -e "${GREEN}  timestamp: new Date().toISOString(),${NC}"
echo -e "${GREEN}  version: '1.0.0',${NC}"
echo -e "${GREEN}  data: JSON.parse(localStorage.getItem('taller_db'))${NC}"
echo -e "${GREEN}))${NC}"
echo ""
echo "5. El JSON se copiará al portapapeles"
echo "6. Pégalo en un archivo y guárdalo como: $FILENAME"
echo ""

# Crear archivo de instrucciones
cat > "$BACKUP_DIR/INSTRUCCIONES.txt" << EOF
BACKUP DE TALLERPRO
===================

Fecha: $(date)
Archivo: $FILENAME

INSTRUCCIONES:
1. Abrir la aplicación en el navegador
2. Abrir consola (F12)
3. Ejecutar:
   copy(JSON.stringify({
     timestamp: new Date().toISOString(),
     version: '1.0.0',
     data: JSON.parse(localStorage.getItem('taller_db'))
   }))
4. Pegar el contenido en un archivo nuevo
5. Guardar como: $FILENAME

RESTAURAR BACKUP:
1. Abrir la aplicación
2. Abrir consola (F12)
3. Ejecutar:
   const backup = PEGAR_AQUI_EL_JSON;
   localStorage.setItem('taller_db', JSON.stringify(backup.data));
   location.reload();

NOTAS:
- Los backups contienen TODOS los datos (usuarios, órdenes, inventario, etc.)
- Mantener los backups en un lugar seguro
- No compartir los backups (contienen contraseñas)
- Hacer backup antes de actualizaciones importantes
EOF

echo -e "${GREEN}✓ Instrucciones guardadas en: $BACKUP_DIR/INSTRUCCIONES.txt${NC}"
echo ""

# Limpiar backups antiguos
echo -e "${YELLOW}🧹 Limpiando backups antiguos (+${RETENTION_DAYS} días)...${NC}"
find "$BACKUP_DIR" -name "tallerpro_backup_*.json" -type f -mtime +$RETENTION_DAYS -delete
echo -e "${GREEN}✓ Limpieza completada${NC}"
echo ""

# Mostrar backups existentes
echo -e "${YELLOW}📦 Backups existentes:${NC}"
if [ -d "$BACKUP_DIR" ]; then
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "tallerpro_backup_*.json" -type f | wc -l)
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        ls -lh "$BACKUP_DIR"/tallerpro_backup_*.json | tail -5
        echo ""
        echo "Total: $BACKUP_COUNT backup(s)"
    else
        echo "No hay backups aún"
    fi
fi

echo ""
echo -e "${GREEN}✅ Proceso completado${NC}"
echo ""
echo -e "${YELLOW}💡 Consejo:${NC} Programa este script con cron para backups automáticos:"
echo "   0 2 * * * /ruta/al/backup.sh"
