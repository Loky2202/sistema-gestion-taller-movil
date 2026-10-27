# 🚀 Guía de Despliegue a Producción - TallerPro

## 📋 Contenido

1. [Requisitos Previos](#requisitos-previos)
2. [Despliegue Frontend](#despliegue-frontend)
3. [Despliegue Backend (Futuro)](#despliegue-backend-futuro)
4. [Plataformas Recomendadas](#plataformas-recomendadas)
5. [Configuración de Dominio](#configuración-de-dominio)
6. [SSL/HTTPS](#sslhttps)
7. [Backup y Monitoreo](#backup-y-monitoreo)
8. [Checklist de Producción](#checklist-de-producción)

---

## 🔧 Requisitos Previos

### Para el Frontend (Actual)
- Node.js 18+ instalado
- npm o yarn
- Cuenta en plataforma de hosting (Vercel, Netlify, etc.)

### Para el Backend (Futuro - FastAPI)
- Python 3.11+
- Docker y Docker Compose
- Servidor VPS o cloud (AWS, GCP, DigitalOcean)
- Dominio propio recomendado

---

## 🌐 Despliegue Frontend

### Opción 1: Vercel (Recomendado - Gratis)

**Ventajas:**
- Deploy automático desde Git
- CDN global
- SSL automático
- Preview deployments
- Gratis para proyectos personales

**Pasos:**

1. **Sube tu código a GitHub/GitLab**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/tallerpro.git
   git push -u origin main
   ```

2. **Conecta Vercel con tu repositorio**
   - Ve a https://vercel.com
   - Click en "New Project"
   - Selecciona tu repositorio
   - Vercel detectará automáticamente que es Vite

3. **Configura las variables de entorno**
   - En "Environment Variables" agrega:
     ```
     VITE_APP_NAME=TallerPro
     VITE_APP_VERSION=1.0.0
     ```

4. **Deploy**
   - Click en "Deploy"
   - Espera 1-2 minutos
   - Tu app estará en: `https://tallerpro.vercel.app`

5. **Dominio personalizado (opcional)**
   - Ve a "Settings" → "Domains"
   - Agrega tu dominio: `taller.tudominio.com`
   - Configura los DNS según las instrucciones

---

### Opción 2: Netlify (Gratis)

**Pasos:**

1. **Sube a GitHub** (igual que Vercel)

2. **Conecta Netlify**
   - Ve a https://netlify.com
   - "Add new site" → "Import an existing project"
   - Selecciona tu repositorio

3. **Configura el build**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Deploy**
   - Click en "Deploy site"
   - URL: `https://tallerpro.netlify.app`

---

### Opción 3: Servidor Propio (Nginx)

**Para VPS o servidor dedicado:**

1. **Build local**
   ```bash
   npm run build
   ```

2. **Sube los archivos al servidor**
   ```bash
   scp -r dist/* usuario@servidor:/var/www/tallerpro/
   ```

3. **Configura Nginx**
   ```nginx
   server {
       listen 80;
       server_name taller.tudominio.com;
       root /var/www/tallerpro;
       index index.html;

       # PWA headers
       add_header Cache-Control "public, max-age=31536000, immutable";
       
       # Service Worker - no cachear
       location /sw.js {
           add_header Cache-Control "no-cache, no-store, must-revalidate";
       }

       # SPA routing
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Assets con cache
       location /assets {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header Referrer-Policy "strict-origin-when-cross-origin" always;
   }
   ```

4. **Reinicia Nginx**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 🖥️ Despliegue Backend (Futuro)

Cuando implementes el backend con FastAPI:

### Con Docker Compose

1. **Crea el docker-compose.yml**
   ```yaml
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
   
     frontend:
       build: ./frontend
       ports:
         - "8000:80"
       depends_on:
         - backend
       restart: unless-stopped
   ```

2. **Levanta los servicios**
   ```bash
   docker-compose up -d
   ```

3. **Accede a:**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:8001
   - Swagger Docs: http://localhost:8001/docs

---

## 🌍 Plataformas Recomendadas

### Frontend Only (Actual)
| Plataforma | Precio | Facilidad | Recomendado para |
|------------|--------|-----------|------------------|
| **Vercel** | Gratis | ⭐⭐⭐⭐⭐ | Producción rápida |
| **Netlify** | Gratis | ⭐⭐⭐⭐⭐ | Alternativa a Vercel |
| **GitHub Pages** | Gratis | ⭐⭐⭐⭐ | Proyectos simples |
| **Cloudflare Pages** | Gratis | ⭐⭐⭐⭐ | CDN global |

### Frontend + Backend (Futuro)
| Plataforma | Precio | Facilidad | Recomendado para |
|------------|--------|-----------|------------------|
| **Railway** | $5/mes | ⭐⭐⭐⭐⭐ | Todo en uno |
| **Render** | Gratis/$7 | ⭐⭐⭐⭐ | Buen balance |
| **DigitalOcean** | $5/mes | ⭐⭐⭐ | Control total |
| **AWS** | Variable | ⭐⭐ | Escalabilidad |

---

## 🔐 Configuración de Dominio

### Comprar un dominio
- **Namecheap**: https://namecheap.com
- **GoDaddy**: https://godaddy.com
- **Google Domains**: https://domains.google

**Costo típico:** $10-15 USD/año para `.com`

### Configurar DNS

**Para Vercel/Netlify:**
1. Obtén la IP o CNAME de la plataforma
2. En tu registrador de dominio:
   ```
   Tipo: CNAME
   Nombre: taller (o www)
   Valor: cname.vercel-dns.com (Vercel)
   ```

**Para servidor propio:**
```
Tipo: A
Nombre: @ (o taller)
Valor: 123.456.789.012 (IP de tu servidor)
```

---

## 🔒 SSL/HTTPS

### Vercel/Netlify (Automático)
- SSL se configura automáticamente
- Let's Encrypt certificado gratuito
- Renovación automática

### Servidor Propio (Certbot)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d taller.tudominio.com

# Renovación automática (ya viene configurada)
sudo certbot renew --dry-run
```

---

## 💾 Backup y Monitoreo

### Backup de Datos (localStorage)

**Script de backup automático:**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/tallerpro"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="tallerpro_backup_$DATE.json"

# Exportar localStorage desde el navegador
# (El usuario debe ejecutar esto en la consola del navegador)
# JSON.stringify(localStorage.getItem('taller_db'))

# Guardar en archivo
echo "Backup creado: $FILENAME"
echo "Recuerda exportar localStorage manualmente desde el navegador"
```

### Monitoreo

**Vercel/Netlify:**
- Dashboard con métricas de uso
- Logs de errores
- Analytics básicos

**Servidor Propio:**
```bash
# Instalar Uptime Kuma (monitoreo gratuito)
docker run -d --restart=always -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1
```

---

## ✅ Checklist de Producción

### Antes de Deploy

- [ ] Probar todas las funcionalidades en modo producción (`npm run build && npm run preview`)
- [ ] Verificar que no hay `console.log` en código
- [ ] Configurar variables de entorno
- [ ] Probar en móvil real (no solo simulador)
- [ ] Verificar que PWA se instala correctamente
- [ ] Probar modo offline
- [ ] Verificar que service worker funciona
- [ ] Comprobar que iconos se muestran correctamente
- [ ] Testear flujo completo de orden
- [ ] Verificar validaciones (teléfono, placa duplicados)

### Seguridad

- [ ] No exponer credenciales en código
- [ ] Configurar CORS correctamente (backend)
- [ ] Usar HTTPS (SSL)
- [ ] Implementar rate limiting (backend)
- [ ] Validar inputs del usuario
- [ ] Sanitizar datos antes de guardar
- [ ] Usar contraseñas seguras
- [ ] Implementar backup automático

### Performance

- [ ] Build optimizado (`npm run build`)
- [ ] Assets minificados
- [ ] Imágenes optimizadas
- [ ] Code splitting configurado
- [ ] Cache headers configurados
- [ ] CDN para assets estáticos
- [ ] Lazy loading de rutas

### SEO y Accesibilidad

- [ ] Meta tags completos
- [ ] Open Graph tags
- [ ] Title y description únicos
- [ ] Favicon configurado
- [ ] Texto alternativo en imágenes
- [ ] Navegación por teclado funciona
- [ ] Contraste de colores adecuado
- [ ] Tamaños de fuente legibles

### PWA

- [ ] manifest.json válido
- [ ] Service worker registrado
- [ ] Iconos en todos los tamaños
- [ ] Funciona offline
- [ ] Se puede instalar en móvil
- [ ] Splash screen configurado

### Legal

- [ ] Términos y condiciones
- [ ] Política de privacidad
- [ ] Aviso de cookies (si aplica)
- [ ] Información de contacto
- [ ] Licencia del software

---

## 📊 Métricas Post-Deploy

### Herramientas Recomendadas

**Analytics:**
- Google Analytics (gratis)
- Plausible (privado, pago)
- Fathom (privado, pago)

**Monitoreo de Errores:**
- Sentry (gratis hasta 5k eventos/mes)
- LogRocket (sesiones de usuario)

**Performance:**
- Lighthouse CI
- WebPageTest
- GTmetrix

---

## 🔄 Actualizaciones

### Proceso de Deploy

1. **Desarrollo local**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   # Hacer cambios
   git commit -m "Agregar nueva funcionalidad"
   git push origin feature/nueva-funcionalidad
   ```

2. **Pull Request**
   - Crear PR en GitHub
   - Vercel crea preview deployment
   - Probar en preview URL

3. **Merge a main**
   - Aprobar PR
   - Merge a main
   - Vercel hace deploy automático

4. **Verificar producción**
   - Probar en URL de producción
   - Verificar que todo funciona
   - Monitorear errores

---

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

**PWA no se instala:**
- Verificar que manifest.json es válido
- Verificar que service worker está registrado
- Verificar que hay HTTPS
- Limpiar cache del navegador

**Service worker no actualiza:**
- Incrementar versión en CACHE_NAME (sw.js)
- Forzar actualización: `Ctrl+Shift+R`
- Verificar que sw.js no está cacheado

**Datos se pierden:**
- localStorage tiene límite de 5-10MB
- Implementar backup automático
- Considerar migrar a backend con base de datos

**Build falla:**
- Limpiar node_modules: `rm -rf node_modules && npm install`
- Verificar versión de Node.js: `node --version`
- Revisar errores de TypeScript: `npm run typecheck`

---

## 📞 Contacto y Soporte

- **Documentación**: README.md, DEPLOY.md
- **Issues**: GitHub Issues del repositorio
- **Email**: soporte@tudominio.com
- **Teléfono**: +57 300 123 4567

---

## 🎯 Siguientes Pasos

1. ✅ Desplegar frontend en Vercel/Netlify
2. ⏳ Configurar dominio personalizado
3. ⏳ Implementar backend con FastAPI
4. ⏳ Migrar localStorage a base de datos real
5. ⏳ Configurar backup automático
6. ⏳ Implementar monitoreo de errores
7. ⏳ Agregar analytics
8. ⏳ Documentar API para desarrolladores

---

**Última actualización**: 2024
**Versión**: 1.0.0
**Estado**: ✅ Listo para producción (frontend only)
