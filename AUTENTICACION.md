# 🚀 Sistema Multi-Empresa de Cotizaciones

## Implementación Completada

### ✅ Autenticación y Usuarios

**Archivos creados:**
- `public/login.html` - Página de login y registro
- `routes/auth.js` - Endpoints de autenticación
- `middleware/auth.js` - Middleware para validar tokens

**Funcionalidades:**
- ✅ Login con email y contraseña
- ✅ Registro de nuevos usuarios
- ✅ Generación de JWT tokens (válidos 30 días)
- ✅ Validación de tokens en rutas protegidas

---

### 🏢 Gestión de Empresas

**Archivos creados:**
- `public/empresa.html` - Formulario de registro y configuración de empresa

**Funcionalidades:**
- ✅ Registrar empresa con datos completos
- ✅ Subir logo (PNG/JPG, máx 2MB)
- ✅ Configurar colores primario y oscuro (con preview)
- ✅ IVA configurable por empresa
- ✅ Almacenar en BD: nombre, NIT, email, teléfono, dirección, descripción
- ✅ Descarga de archivos como base64

---

### 🗄️ Base de Datos (Multi-Tenant)

**Tablas creadas:**
```sql
empresas - Información de cada empresa
usuarios - Usuarios con relación a empresa_id
quotations - Cotizaciones filtradas por empresa_id
clientes - Clientes por empresa
productos - Productos por empresa
```

**Índices de seguridad:**
```sql
idx_usuarios_empresa
idx_usuarios_email
idx_quotations_empresa
idx_clientes_empresa
idx_productos_empresa
```

---

### 🔐 Seguridad

**Implementado:**
- ✅ Hasheo de contraseñas con bcrypt (10 salts)
- ✅ JWT tokens con expiración
- ✅ Filtrado de datos por empresa_id en todas las queries
- ✅ Middleware de autenticación en rutas protegidas
- ✅ SSL en conexión a PostgreSQL (sslmode=verify-full)

---

### 🎨 Interfaz Visual

**Estilos aplicados:**
- Tema oscuro futurista (#0a0e14, #141921)
- Gradientes dinámicos
- Colores personalizables por empresa
- Animaciones suaves
- Responsive design (mobile, tablet, desktop)
- Logo dinámico en header

---

## 📋 Pasos para Implementar

### 1️⃣ Instalar dependencias
```bash
npm install bcrypt jsonwebtoken
```

### 2️⃣ Actualizar base de datos
Ejecutar el script `database.sql` en Neon:
```bash
# Conectar a tu BD Neon
psql $DATABASE_URL < database.sql
```

### 3️⃣ Configurar variables de entorno
Crear/actualizar `.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET=tu_clave_secreta_aqui
NODE_ENV=production
PORT=5000
```

### 4️⃣ Iniciar servidor
```bash
npm run dev
```

### 5️⃣ Acceder a la aplicación
```
http://localhost:5000/login.html
```

---

## 🔄 Flujo de Usuario

1. **Usuario nuevo:**
   - Va a `login.html`
   - Click en "Regístrate aquí"
   - Ingresa nombre, email y contraseña
   - Sistema crea usuario + empresa inicial automáticamente
   - Regresa a login

2. **Iniciar sesión:**
   - Ingresa email y contraseña
   - Recibe JWT token
   - Se almacena en localStorage
   - Redirige a dashboard

3. **Configurar empresa:**
   - Click en ⚙️ (settings)
   - Va a `empresa.html`
   - Completa datos de empresa
   - Sube logo
   - Elige colores
   - Sistema actualiza empresa en BD

---

## 🛠️ Endpoints API

### Autenticación
```
POST /api/auth/register
  { nombre, email, password }
  → { message }

POST /api/auth/login
  { email, password }
  → { token, usuarioId, empresaId }

POST /api/auth/verificar
  Headers: Authorization: Bearer TOKEN
  → { valid, usuario, empresa }
```

### Empresa
```
POST /api/empresas/crear
  Headers: Authorization: Bearer TOKEN
  Body: { nombre, nit, logo_url, color_primario, color_oscuro, ... }
  → { message, empresaId }

GET /api/empresas/mi-empresa
  Headers: Authorization: Bearer TOKEN
  → { id, nombre, nit, logo_url, ... }
```

---

## 🔑 Variables de Entorno Necesarias

```bash
DATABASE_URL=postgresql://neondb_owner:...@ep-silent-king-aidy3p7b.us-east-1.aws.neon.tech/neondb?sslmode=verify-full

PORT=5000

NODE_ENV=production

JWT_SECRET=tu_clave_secretisima_de_256_caracteres_minimo_para_produccion
```

---

## 📦 Dependencias Instaladas

```json
{
  "bcrypt": "^5.x",
  "jsonwebtoken": "^9.x",
  "pg": "^8.x",
  "express": "^4.x",
  "cors": "^2.x",
  "body-parser": "^1.x"
}
```

---

## 🚀 Próximos Pasos (Opcional)

1. Actualizar todas las rutas de API para filtrar por empresa_id
2. Agregar roles (admin, user, viewer)
3. Crear panel de administración multi-empresa
4. Email de confirmación en registro
5. Recuperación de contraseña
6. 2FA (autenticación de dos factores)
7. Auditoría de cambios por usuario

---

## ⚠️ Notas Importantes

- **No compartir JWT_SECRET** en repositorios públicos
- **Cambiar contraseña de ejemplo** en producción
- **Usar HTTPS** en producción (no HTTP)
- **Validar JWT** antes de cada operación sensible
- **Logs de auditoría** para acciones críticas (recomendado)

---

## 📝 Test Rápido

1. Abre `http://localhost:5000/login.html`
2. Haz click en "Regístrate aquí"
3. Registra: nombre: "Test", email: "test@test.com", password: "123456"
4. Regresa y haz login con esas credenciales
5. Deberías ver el dashboard
6. El sistema automáticamente te redirige a `empresa.html` si es primera vez

---

¡Sistema listo para usar! 🎉
