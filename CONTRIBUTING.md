# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a TallerPro! Esta guía te ayudará a entender cómo puedes participar en el proyecto.

## 📋 Tabla de Contenidos

- [Código de Conducta](#-código-de-conducta)
- [¿Cómo Puedo Contribuir?](#-cómo-puedo-contribuir)
- [Configuración del Entorno](#-configuración-del-entorno)
- [Proceso de Desarrollo](#-proceso-de-desarrollo)
- [Estilo de Código](#-estilo-de-código)
- [Pull Requests](#-pull-requests)
- [Reportar Bugs](#-reportar-bugs)
- [Sugerir Mejoras](#-sugerir-mejoras)

---

## 📜 Código de Conducta

Este proyecto se adhiere al [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/). Al participar, se espera que mantengas este código.

### Nuestros Estándares

Ejemplos de comportamiento que contribuyen a crear un ambiente positivo:

- ✅ Usar lenguaje inclusivo y amigable
- ✅ Respetar diferentes puntos de vista y experiencias
- ✅ Aceptar críticas constructivas con gracia
- ✅ Enfocarse en lo que es mejor para la comunidad
- ✅ Mostrar empatía hacia otros miembros

Ejemplos de comportamiento inaceptable:

- ❌ Uso de lenguaje o imágenes sexualizadas
- ❌ Trolling, comentarios insultantes/degradantes
- ❌ Acoso público o privado
- ❌ Publicar información privada sin permiso
- ❌ Otra conducta que sea poco profesional

---

## 🎯 ¿Cómo Puedo Contribuir?

### 1. Reportar Bugs

- Usa la plantilla de issue para bugs
- Incluye pasos detallados para reproducir
- Agrega screenshots si es posible
- Especifica versión del navegador y SO

### 2. Sugerir Mejoras

- Usa la plantilla de issue para features
- Explica el problema que resuelve
- Describe la solución propuesta
- Considera alternativas

### 3. Contribuir Código

- Fork el repositorio
- Crea una rama para tu feature
- Escribe tests si aplica
- Actualiza la documentación
- Envía un Pull Request

### 4. Mejorar Documentación

- Corregir typos o errores
- Agregar ejemplos
- Traducir a otros idiomas
- Mejorar claridad

### 5. Revisar Pull Requests

- Revisa código de otros contribuidores
- Prueba los cambios localmente
- Da feedback constructivo
- Aprueba si todo está correcto

---

## 🛠️ Configuración del Entorno

### Requisitos Previos

```bash
# Node.js 18+
node --version  # v18.0.0 o superior

# npm o yarn
npm --version   # 8.0.0 o superior
```

### Instalación

```bash
# 1. Fork el repositorio en GitHub

# 2. Clona tu fork
git clone https://github.com/TU-USUARIO/tallerpro.git
cd tallerpro

# 3. Agrega el repositorio original como upstream
git remote add upstream https://github.com/ORIGINAL-USUARIO/tallerpro.git

# 4. Instala dependencias
npm install

# 5. Crea una rama para tu feature
git checkout -b feature/nombre-de-tu-feature

# 6. Inicia el servidor de desarrollo
npm run dev

# 7. Abre en navegador
# http://localhost:3000
```

### Estructura del Proyecto

```
tallerpro/
├── src/
│   ├── components/    # Componentes reutilizables
│   ├── pages/         # Páginas de la aplicación
│   ├── db/           # Capa de datos
│   ├── store/        # Estado global
│   ├── types/        # Tipos TypeScript
│   └── utils/        # Utilidades
├── public/           # Archivos estáticos
├── docs/            # Documentación
└── tests/           # Tests (próximamente)
```

---

## 🔄 Proceso de Desarrollo

### 1. Mantén tu Fork Actualizado

```bash
# Fetch cambios del repositorio original
git fetch upstream

# Checkout a tu rama main
git checkout main

# Merge cambios de upstream
git merge upstream/main

# Push a tu fork
git push origin main
```

### 2. Crea una Rama para tu Feature

```bash
# Nombra la rama descriptivamente
git checkout -b feature/agregar-fotos-ordenes
# o
git checkout -b fix/corregir-bug-stock
# o
git checkout -b docs/actualizar-readme
```

### 3. Desarrolla tu Feature

- Escribe código limpio y comentado
- Sigue el estilo de código del proyecto
- Haz commits pequeños y frecuentes
- Usa mensajes de commit descriptivos

### 4. Prueba tus Cambios

```bash
# Verificar que compila
npm run build

# Verificar tipos TypeScript
npm run typecheck

# Probar manualmente en el navegador
npm run dev
```

### 5. Commit tus Cambios

```bash
# Agrega archivos modificados
git add .

# Commit con mensaje descriptivo
git commit -m "feat: agregar funcionalidad de fotos en órdenes"
```

### 6. Push a tu Fork

```bash
git push origin feature/nombre-de-tu-feature
```

---

## 🎨 Estilo de Código

### TypeScript

```typescript
// ✅ BUENO - Tipos explícitos
interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'mecanico';
}

function getUsuario(id: string): Usuario | null {
  // ...
}

// ❌ MALO - Tipos implícitos o any
function getUsuario(id) {
  // ...
}
```

### React Components

```typescript
// ✅ BUENO - Componente funcional con tipos
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button onClick={onClick} className={...}>
      {children}
    </button>
  );
}

// ❌ MALO - Sin tipos o con any
export function Button(props: any) {
  // ...
}
```

### Nombres

```typescript
// ✅ BUENO - Nombres descriptivos
const ordenesAbiertas = getOrdenes().filter(o => o.estado !== 'entregado');
function calcularTotalOrden(items: OrdenItem[]): number { ... }

// ❌ MALO - Nombres cortos o poco claros
const x = getOrdenes().filter(o => o.estado !== 'entregado');
function calc(i: any[]): number { ... }
```

### Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
feat: agregar búsqueda de vehículos por placa
feat: implementar alertas de stock bajo

# Fixes
fix: corregir cálculo de total en órdenes
fix: validar teléfono duplicado en clientes

# Documentation
docs: actualizar README con instrucciones de deploy
docs: agregar ejemplos en MIGRACION_BACKEND.md

# Refactoring
refactor: extraer lógica de inventario a servicio
refactor: simplificar componente de órdenes

# Style
style: formatear código con Prettier
style: corregir indentación en componentes

# Tests
test: agregar tests para función de login
test: mejorar cobertura de tests de órdenes

# Chores
chore: actualizar dependencias
chore: configurar ESLint
```

---

## 📬 Pull Requests

### Antes de Enviar

- [ ] Código compila sin errores (`npm run build`)
- [ ] Tipos TypeScript correctos (`npm run typecheck`)
- [ ] Probado manualmente en el navegador
- [ ] Documentación actualizada si aplica
- [ ] Commits con mensajes descriptivos
- [ ] Rama actualizada con main

### Proceso de Review

1. **Envía el PR**
   - Usa la plantilla de Pull Request
   - Describe claramente los cambios
   - Agrega screenshots si es UI
   - Menciona issues relacionados

2. **Espera Review**
   - Los maintainers revisarán tu código
   - Pueden pedir cambios o aclaraciones
   - Sé receptivo al feedback

3. **Haz Cambios Solicitados**
   - Responde a comentarios
   - Haz los cambios pedidos
   - Push nuevos commits a la misma rama

4. **Aprobación y Merge**
   - Una vez aprobado, un maintainer hará merge
   - Tu contribución será parte del proyecto
   - ¡Gracias por contribuir!

### Plantilla de Pull Request

```markdown
## Descripción
Breve descripción de los cambios

## Tipo de Cambio
- [ ] Bug fix (cambio que arregla un issue)
- [ ] New feature (cambio que agrega funcionalidad)
- [ ] Breaking change (cambio que rompe funcionalidad existente)
- [ ] Documentation update

## Issue Relacionado
Fixes #(número del issue)

## Screenshots
Si aplica, agrega screenshots de los cambios

## Checklist
- [ ] Mi código sigue el estilo del proyecto
- [ ] He comentado mi código en áreas complejas
- [ ] He actualizado la documentación
- [ ] He agregado tests (si aplica)
- [ ] Los tests existentes pasan
- [ ] He verificado que no hay errores de TypeScript
```

---

## 🐛 Reportar Bugs

### Antes de Reportar

- Busca en [Issues](https://github.com/tu-usuario/tallerpro/issues) si ya existe
- Verifica que puedes reproducir el bug en la última versión
- Reúne información detallada

### Plantilla de Bug Report

```markdown
## Descripción del Bug
Descripción clara y concisa del bug

## Pasos para Reproducir
1. Ir a '...'
2. Click en '....'
3. Scroll hasta '....'
4. Ver error

## Comportamiento Esperado
Qué debería pasar

## Comportamiento Actual
Qué está pasando

## Screenshots
Si aplica, agrega screenshots

## Entorno
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Safari, Firefox]
- Version: [e.g. 22]
- Device: [e.g. iPhone 12, Desktop]

## Contexto Adicional
Cualquier otro contexto sobre el problema
```

---

## 💡 Sugerir Mejoras

### Antes de Sugerir

- Verifica que no exista una sugerencia similar
- Piensa en si es viable técnicamente
- Considera el impacto en el proyecto

### Plantilla de Feature Request

```markdown
## ¿Tu solicitud está relacionada con un problema?
Descripción clara del problema. Ej: Siempre me frustra cuando [...]

## Describe la solución que te gustaría
Descripción clara de lo que quieres que pase

## Describe alternativas que has considerado
Descripción de soluciones o características alternativas

## Contexto Adicional
Screenshots, mockups, o cualquier otro contexto
```

---

## 📚 Recursos Útiles

- [Documentación de React](https://react.dev/)
- [Documentación de TypeScript](https://www.typescriptlang.org/docs/)
- [Documentación de TailwindCSS](https://tailwindcss.com/docs)
- [Guía de Vite](https://vitejs.dev/guide/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## ❓ ¿Necesitas Ayuda?

- Revisa la [documentación](./README.md)
- Busca en [Issues](https://github.com/tu-usuario/tallerpro/issues)
- Pregunta en [Discussions](https://github.com/tu-usuario/tallerpro/discussions)
- Contacta: info@tudominio.com

---

## 🎉 ¡Gracias por Contribuir!

Tu tiempo y esfuerzo ayudan a hacer TallerPro mejor para todos. Cada contribución, grande o pequeña, es valiosa.

---

**Última actualización**: 2024-01-15
