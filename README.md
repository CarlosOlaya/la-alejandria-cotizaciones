# Cotización La Alejandría - Sistema Full Stack

Sistema profesional de generación de cotizaciones para cafeterías con Node.js, Express y PostgreSQL.

## 🚀 Características

- ✅ Interfaz responsive para móviles y escritorio
- ✅ Generación de cotizaciones en PDF
- ✅ Base de datos PostgreSQL con Neon
- ✅ API REST con Express.js
- ✅ Navbar modular y componetizado
- ✅ Transiciones suaves entre páginas
- ✅ Gestión completa (CRUD) de cotizaciones, clientes y productos
- ✅ Autocompletado de productos y clientes
- ✅ Desplegable en Vercel

## 📋 Requisitos

- Node.js 14+ instalado
- Cuenta en [Neon](https://neon.tech) para PostgreSQL
- Cuenta en [Vercel](https://vercel.com) para deploy
- npm o yarn

## 🔧 Instalación

### 1. Clonar repositorio
```bash
git clone https://github.com/CarlosOlaya/la-alejandria-cotizaciones.git
cd la-alejandria-cotizaciones
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar base de datos en Neon

1. Crear una cuenta en [https://neon.tech](https://neon.tech)
2. Crear un nuevo proyecto PostgreSQL
3. Copiar la cadena de conexión
4. Ejecutar el SQL de la base de datos:
```bash
# Conectarse a Neon con tu cadena de conexión y ejecutar:
psql "tu_connection_string"
```

5. Dentro de psql, ejecutar el contenido de `database.sql`:
```sql
CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    quotation_number INTEGER UNIQUE NOT NULL,
    date_exp DATE NOT NULL,
    date_valid DATE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_cc_nit VARCHAR(50) NOT NULL,
    client_address VARCHAR(500),
    client_phone VARCHAR(20),
    client_email VARCHAR(255),
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotation_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_client_name ON quotations(client_name);
CREATE INDEX IF NOT EXISTS idx_created_at ON quotations(created_at DESC);
```

### 4. Configurar variables de entorno

Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

Editar `.env`:
```
DATABASE_URL=postgresql://user:password@host/database
PORT=5000
NODE_ENV=development
```

Reemplazar `DATABASE_URL` con tu cadena de conexión de Neon.

### 5. Iniciar servidor

**Desarrollo (con nodemon):**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:5000`

## 📁 Estructura del Proyecto

```
cotizacion/
├── public/                    # Archivos estáticos (frontend)
│   ├── index.html            # Dashboard
│   ├── cotizacion.html       # Formulario de cotización
│   ├── icon.png              # Logo
│   └── assets/
│       ├── css/
│       │   └── styles.css    # Estilos globales (responsive)
│       └── js/
│           └── app.js        # Lógica con llamadas a API
├── server.js                  # Servidor Express principal
├── database.sql               # Esquema de base de datos
├── package.json               # Dependencias Node.js
├── .env                       # Variables de entorno (no commitear)
├── .env.example               # Template de .env
└── README.md                  # Este archivo
```

## 🔌 API Endpoints

### Cotizaciones

**GET /api/quotations**
- Obtener todas las cotizaciones
- Respuesta: Array de cotizaciones

**GET /api/quotations/:id**
- Obtener una cotización por ID
- Parámetros: `id` (number)

**POST /api/quotations**
- Crear nueva cotización
- Body:
```json
{
  "quotationNumber": 1001,
  "dateExp": "04/02/2026",
  "dateValid": "19/02/2026",
  "clientName": "FOCUS LAB S.A.",
  "clientCCNIT": "901149786",
  "clientAddress": "CL 31 4 67",
  "clientPhone": "3008065912",
  "clientEmail": "tesoreria@focuslabs.co",
  "items": [...],
  "subtotal": 7700000,
  "discount": 700000,
  "total": 7000000
}
```

**PUT /api/quotations/:id**
- Actualizar cotización
- Mismo body que POST

**DELETE /api/quotations/:id**
- Eliminar cotización

**GET /api/quotations/next/number**
- Obtener próximo número de cotización disponible

## 📱 Características Responsive

- **Móviles (≤768px):** Formulario vertical optimizado con inputs grandes
- **Tablets (768px-1024px):** Layout intermedio
- **Escritorio (≥1024px):** Diseño completo profesional
- **Impresión:** Formato A4 profesional igual en todos los dispositivos

## 🖨️ Generación de PDF

El PDF se genera automáticamente al imprimir:
- Nombre: `CLIENTE_DD_MM_YY` (ej: `FOCUS_LAB_04_02_26`)
- Formato: A4
- Sin bordes de inputs
- Sin botones ni elementos UI
- Márgenes mínimos para máximo contenido

## 🚀 Despliegue en Producción

### Opción 1: Heroku (Recomendado)

```bash
# 1. Crear app en Heroku
heroku create tu-app-name

# 2. Configurar variables de entorno
heroku config:set DATABASE_URL="tu_connection_string"
heroku config:set NODE_ENV=production

# 3. Hacer push
git push heroku main
```

### Opción 2: Railway, Render, Vercel

## 🌐 Despliegue en Vercel

### 1. Preparar el proyecto

```bash
# Asegurarse de tener vercel.json en la raíz
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

### 2. Configurar Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en "Add New Project"
3. Importa tu repositorio de GitHub
4. Configura las variables de entorno:
   - `DATABASE_URL`: Tu connection string de Neon
   - `NODE_ENV`: production

### 3. Variables de Entorno en Vercel

En el dashboard de Vercel → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
NODE_ENV=production
```

### 4. Deploy

Vercel desplegará automáticamente. El proyecto estará en:
```
https://tu-proyecto.vercel.app
```

### Troubleshooting

Si ves errores 404 en `/api/*`:
1. Verifica que `vercel.json` exista en la raíz
2. Asegúrate de que `server.js` exporte `module.exports = app`
3. Revisa que `DATABASE_URL` esté configurada en Vercel
4. Verifica los logs en Vercel Dashboard → Deployments → View Function Logs

## 🔒 Seguridad

- Variables sensibles en `.env` (no commitear)
- Validación de entrada en servidor
- Conexión SSL a PostgreSQL
- CORS configurado

## 📝 Notas de Desarrollo

- El frontend se sirve desde `/public`
- Todos los endpoints usan JSON
- Las fechas se almacenan en formato YYYY-MM-DD
- Los items se guardan como JSONB para flexibilidad
- Los totales se almacenan como DECIMAL para precisión
- Navbar modular: Un solo archivo `navbar.js` para todas las páginas

## 📧 Soporte

Para reportar bugs o sugerencias, contactar a CarlosOlaya.

## 📄 Licencia

MIT
