# 🔒 Política de Seguridad - TallerPro

## 📋 Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad en TallerPro, por favor repórtala de manera responsable.

### Cómo Reportar

1. **NO** abras un issue público en GitHub
2. Envía un email a: **seguridad@tudominio.com**
3. Incluye:
   - Descripción de la vulnerabilidad
   - Pasos para reproducirla
   - Impacto potencial
   - Si es posible, una solución sugerida

### Tiempo de Respuesta

- **Confirmación**: 48 horas
- **Análisis inicial**: 5 días hábiles
- **Parche**: Depende de la severidad (1-30 días)

---

## 🛡️ Mejores Prácticas de Seguridad

### Para Usuarios

#### 1. Contraseñas Seguras
- ✅ Mínimo 8 caracteres
- ✅ Combinar mayúsculas, minúsculas, números y símbolos
- ✅ No reutilizar contraseñas de otros servicios
- ✅ Cambiar contraseña cada 90 días
- ❌ NO compartir contraseñas
- ❌ NO usar información personal (fechas, nombres)

**Ejemplo de contraseña fuerte:**
```
T@ller2024!Secure#Pass
```

#### 2. Autenticación
- ✅ Cerrar sesión al terminar
- ✅ No guardar contraseñas en navegadores compartidos
- ✅ Verificar que la URL sea HTTPS
- ✅ Reportar sesiones sospechosas

#### 3. Datos Sensibles
- ✅ No compartir credenciales por email/mensajes
- ✅ Hacer backup regular de datos
- ✅ Verificar permisos de usuario
- ❌ NO almacenar datos de clientes en dispositivos personales

---

### Para Administradores

#### 1. Gestión de Usuarios
```
✓ Crear usuarios con el mínimo de permisos necesarios
✓ Desactivar usuarios inmediatamente al dejar la empresa
✓ Revisar lista de usuarios activos mensualmente
✓ No compartir cuentas entre múltiples personas
✓ Usar roles correctamente (admin vs mecanico)
```

#### 2. Backups
```
✓ Hacer backup diario automático
✓ Almacenar backups en ubicación segura
✓ Probar restauración de backups trimestralmente
✓ Mantener backups por mínimo 30 días
✓ Cifrar backups si contienen datos sensibles
```

#### 3. Actualizaciones
```
✓ Mantener el software actualizado
✓ Revisar changelogs antes de actualizar
✓ Hacer backup antes de actualizaciones mayores
✓ Probar actualizaciones en entorno de staging
✓ Documentar versión actual y fecha de actualización
```

#### 4. Monitoreo
```
✓ Revisar logs de acceso semanalmente
✓ Monitorear intentos de login fallidos
✓ Alertar sobre actividades sospechosas
✓ Revisar permisos de archivos y carpetas
✓ Auditar cambios en configuración
```

---

### Para Desarrolladores

#### 1. Código Seguro

**Validación de Inputs:**
```typescript
// ✅ CORRECTO - Validar todos los inputs
function crearCliente(data: ClienteInput) {
  if (!data.nombre || data.nombre.length < 2) {
    throw new Error('Nombre inválido');
  }
  if (!data.telefono || !/^\d{10}$/.test(data.telefono)) {
    throw new Error('Teléfono inválido');
  }
  // ...
}

// ❌ INCORRECTO - Confiar en el cliente
function crearCliente(data: any) {
  db.clientes.push(data); // ¡Peligroso!
}
```

**Prevención de XSS:**
```typescript
// ✅ CORRECTO - React escapa automáticamente
<div>{userInput}</div>

// ❌ INCORRECTO - Usar dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Manejo de Errores:**
```typescript
// ✅ CORRECTO - No exponer detalles internos
try {
  await apiCall();
} catch (error) {
  console.error('Error detallado:', error); // Solo en logs
  throw new Error('Error al procesar la solicitud'); // Mensaje genérico
}

// ❌ INCORRECTO - Exponer información sensible
try {
  await apiCall();
} catch (error) {
  throw new Error(`DB Error: ${error.message} at ${error.stack}`);
}
```

#### 2. Dependencias Seguras

```bash
# Auditar dependencias regularmente
npm audit

# Actualizar dependencias
npm update

# Verificar vulnerabilidades específicas
npm audit fix
```

#### 3. Variables de Entorno

```bash
# ✅ CORRECTO - Usar variables de entorno
const API_KEY = process.env.API_KEY;

# ❌ INCORRECTO - Hardcodear secretos
const API_KEY = "sk-1234567890abcdef";
```

**Nunca commitear:**
- ❌ Archivos `.env`
- ❌ Claves API
- ❌ Contraseñas
- ❌ Certificados SSL
- ❌ Tokens de acceso

---

## 🔐 Seguridad en Producción

### Checklist Pre-Deploy

#### Autenticación
- [ ] Contraseñas hasheadas con bcrypt (cost factor ≥ 10)
- [ ] JWT con expiración adecuada (12 horas máximo)
- [ ] HTTPS obligatorio
- [ ] Rate limiting en endpoints de login
- [ ] Bloqueo tras múltiples intentos fallidos

#### Base de Datos
- [ ] Conexión cifrada (si es remoto)
- [ ] Backups automáticos
- [ ] Queries parametrizados (prevenir SQL injection)
- [ ] Mínimos privilegios para el usuario de DB
- [ ] Rotación de credenciales periódica

#### API
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Validación de inputs en todos los endpoints
- [ ] Autenticación requerida en endpoints protegidos
- [ ] Logs de auditoría activados

#### Frontend
- [ ] No almacenar datos sensibles en localStorage
- [ ] Tokens en httpOnly cookies (si es posible)
- [ ] Content Security Policy (CSP) configurado
- [ ] Subresource Integrity (SRI) para CDNs
- [ ] Headers de seguridad configurados

#### Servidor
- [ ] Firewall configurado
- [ ] Solo puertos necesarios abiertos (80, 443)
- [ ] SSH con llaves (no contraseñas)
- [ ] Actualizaciones de seguridad automáticas
- [ ] Monitoreo de intrusos

---

## 🚨 Incidentes de Seguridad

### Procedimiento de Respuesta

1. **Detección**
   - Identificar el incidente
   - Determinar severidad (Crítica/Alta/Media/Baja)
   - Documentar hora de detección

2. **Contención**
   - Aislar sistemas afectados
   - Desactivar cuentas comprometidas
   - Cambiar credenciales expuestas

3. **Erradicación**
   - Identificar causa raíz
   - Eliminar vulnerabilidad
   - Aplicar parches

4. **Recuperación**
   - Restaurar sistemas desde backup limpio
   - Verificar integridad de datos
   - Monitorear actividad sospechosa

5. **Lecciones Aprendidas**
   - Documentar incidente
   - Actualizar políticas
   - Capacitar al equipo

### Severidad de Incidentes

| Nivel | Descripción | Tiempo de Respuesta |
|-------|-------------|---------------------|
| **Crítica** | Acceso no autorizado a datos sensibles | 1 hora |
| **Alta** | Vulnerabilidad explotable activa | 4 horas |
| **Media** | Vulnerabilidad potencial | 24 horas |
| **Baja** | Mejora de seguridad recomendada | 1 semana |

---

## 📊 Auditoría de Seguridad

### Frecuencia

- **Diaria**: Revisión de logs
- **Semanal**: Análisis de accesos
- **Mensual**: Auditoría de permisos
- **Trimestral**: Pentesting básico
- **Anual**: Auditoría completa externa

### Herramientas Recomendadas

**Escaneo de Vulnerabilidades:**
- OWASP ZAP (gratis)
- Nessus (pago)
- Qualys (pago)

**Monitoreo:**
- Sentry (errores)
- LogRocket (sesiones)
- ELK Stack (logs)

**Pentesting:**
- Contratar servicio externo anual
- Usar herramientas automáticas mensualmente

---

## 🎓 Capacitación

### Temas Obligatorios

1. **Phishing y Ingeniería Social**
   - Cómo identificar emails sospechosos
   - No compartir credenciales
   - Verificar identidad antes de dar información

2. **Manejo de Datos**
   - Clasificación de datos (público/interno/confidencial)
   - Cómo almacenar datos sensibles
   - Procedimiento de backup

3. **Seguridad en Dispositivos**
   - Bloqueo de pantalla obligatorio
   - No instalar software no autorizado
   - Reportar dispositivos perdidos

4. **Incidentes**
   - Cómo reportar suspicious activity
   - Qué hacer ante un incidente
   - Contactos de emergencia

---

## 📞 Contactos de Emergencia

### Equipo de Seguridad

- **Responsable**: [Nombre]
- **Email**: seguridad@tudominio.com
- **Teléfono**: +57 300 123 4567
- **Horario**: 24/7 para incidentes críticos

### Soporte Técnico

- **Email**: soporte@tudominio.com
- **Teléfono**: +57 300 987 6543
- **Horario**: Lun-Vie 8am-6pm

### Servicios Externos

- **Hosting**: [Proveedor] - [Contacto]
- **Dominio**: [Registrador] - [Contacto]
- **SSL**: [Proveedor] - [Contacto]

---

## 📝 Registro de Cambios

| Fecha | Versión | Cambios | Responsable |
|-------|---------|---------|-------------|
| 2024-01-15 | 1.0.0 | Política inicial | [Nombre] |
| | | | |

---

## ✅ Aceptación

Al usar TallerPro, aceptas cumplir con esta política de seguridad.

**Última actualización**: 2024
**Versión**: 1.0.0
**Próxima revisión**: 2025-01-15
