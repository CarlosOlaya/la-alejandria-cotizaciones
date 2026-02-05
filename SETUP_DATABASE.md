# Guía de Configuración - Base de Datos PostgreSQL con Neon

## 📝 Pasos para Configurar la Base de Datos

### 1. Crear Cuenta en Neon

1. Ir a [https://neon.tech](https://neon.tech)
2. Hacer clic en "Sign up" (Registrarse)
3. Usar email o cuenta de GitHub
4. Verificar email si es necesario

### 2. Crear un Proyecto

1. Una vez registrado, hacer clic en "New Project"
2. Dar un nombre al proyecto (ej: "cotizacion-la-alejandria")
3. Seleccionar región más cercana
4. Crear la base de datos

### 3. Obtener la Cadena de Conexión

1. En el dashboard de Neon, ir al proyecto creado
2. Copiar la cadena de conexión (Connection String)
3. Debe verse así: `postgresql://user:password@host/database`

### 4. Configurar Variables de Entorno

1. En la raíz del proyecto, crear archivo `.env`
2. Pegar la cadena de conexión:
   ```
   DATABASE_URL=postgresql://user:password@host/database
   PORT=5000
   NODE_ENV=development
   ```
3. Guardar archivo (NO commitear a GitHub)

### 5. Crear Tablas en la Base de Datos

#### Opción A: Usando psql (CLI)

```bash
# Instalar psql si no lo tienes: https://www.postgresql.org/download/

# Conectarse a la base de datos
psql "tu_connection_string_aquí"

# Ejecutar el script SQL
```

Luego pegar el contenido de `database.sql`:

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

CREATE TABLE IF NOT EXISTS quotations_audit (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    changed_data JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_quotation ON quotations_audit(quotation_id);
```

#### Opción B: Usando pgAdmin (GUI)

1. Ir a [https://www.pgadmin.org/](https://www.pgadmin.org/)
2. Crear una conexión con los datos de Neon
3. Crear base de datos
4. Ejecutar script SQL desde interfaz

### 6. Verificar Conexión

```bash
# En la terminal, ejecutar:
npm run dev
```

Si ves el mensaje:
```
🚀 Servidor corriendo en http://localhost:5000
📧 Ambiente: development
```

¡La conexión está funcionando! 🎉

### 7. Probar la Aplicación

1. Abrir navegador en `http://localhost:5000`
2. Crear una nueva cotización
3. Guardar
4. Verificar que aparezca en el dashboard

## 🔒 Seguridad

- **NUNCA** compartir el `.env` con nadie
- **NUNCA** hacer commit de `.env` a GitHub
- La información sensible siempre en variables de entorno

## 🆘 Troubleshooting

### Error: "connect ECONNREFUSED"
- Verificar que la cadena de conexión es correcta
- Verificar conexión a internet

### Error: "relation "quotations" does not exist"
- Las tablas no fueron creadas correctamente
- Ejecutar script SQL nuevamente

### Error: "password authentication failed"
- Usuario o password incorrecto
- Revisar cadena de conexión

## 📞 Soporte

Para más ayuda, revisar documentación oficial:
- [Documentación Neon](https://neon.tech/docs)
- [Documentación PostgreSQL](https://www.postgresql.org/docs/)
