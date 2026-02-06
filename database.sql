-- ================================================
-- SISTEMA MULTI-EMPRESA DE COTIZACIONES
-- Base de datos para múltiples empresas
-- ================================================

-- Tabla de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nit VARCHAR(20) UNIQUE NOT NULL,
    logo_url VARCHAR(255),
    color_primario VARCHAR(7) DEFAULT '#ff6b35',
    color_oscuro VARCHAR(7) DEFAULT '#0a0e14',
    incluye_iva BOOLEAN DEFAULT true,
    iva_porcentaje DECIMAL(5,2) DEFAULT 19.00,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email_contacto VARCHAR(100),
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    rol VARCHAR(20) DEFAULT 'user', -- 'admin', 'user'
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de cotizaciones (original, migrada a multi-empresa)
CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    quotation_number INTEGER NOT NULL,
    date_exp DATE NOT NULL,
    date_valid DATE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(100),
    client_cc_nit VARCHAR(50),
    client_address VARCHAR(500),
    client_phone VARCHAR(20),
    items JSON,
    subtotal DECIMAL(12,2),
    discount DECIMAL(12,2) DEFAULT 0,
    iva DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes (con empresa_id)
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    nit_cedula VARCHAR(20),
    contacto_principal VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos (con empresa_id)
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    valor_unitario DECIMAL(12,2) NOT NULL,
    unidad VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para seguridad y performance
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_quotations_empresa ON quotations(empresa_id);
CREATE INDEX IF NOT EXISTS idx_quotations_cliente ON quotations(client_name);
CREATE INDEX IF NOT EXISTS idx_quotations_numero ON quotations(quotation_number);
    client_email VARCHAR(255),
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_quotation_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_client_name ON quotations(client_name);
CREATE INDEX IF NOT EXISTS idx_created_at ON quotations(created_at DESC);

-- Crear tabla de auditoría (opcional)
CREATE TABLE IF NOT EXISTS quotations_audit (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    changed_data JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice en tabla de auditoría
CREATE INDEX IF NOT EXISTS idx_audit_quotation ON quotations_audit(quotation_id);

-- ========================================
-- TABLA DE CLIENTES
-- ========================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    cc_nit VARCHAR(50),
    address VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_name ON clients(name);

-- ========================================
-- TABLA DE PRODUCTOS
-- ========================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_name ON products(name);
