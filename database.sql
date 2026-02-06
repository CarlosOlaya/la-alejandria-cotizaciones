-- ================================================
-- SISTEMA MULTI-EMPRESA DE COTIZACIONES
-- Base de datos para múltiples empresas
-- ================================================

-- ================================================
-- PASO 1: ELIMINAR TODAS LAS TABLAS ANTERIORES
-- ================================================
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;

-- ================================================
-- PASO 2: CREAR NUEVAS TABLAS CON ESTRUCTURA MULTI-EMPRESA
-- ================================================

-- Tabla de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nit VARCHAR(20) UNIQUE NOT NULL,
    logo_url VARCHAR(255),
    color_primary VARCHAR(7) DEFAULT '#ff6b35',
    color_secondary VARCHAR(7) DEFAULT '#4ecdc4',
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
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_quotations_empresa ON quotations(empresa_id);
CREATE INDEX IF NOT EXISTS idx_quotations_cliente ON quotations(client_name);
CREATE INDEX IF NOT EXISTS idx_quotations_numero ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_fecha ON quotations(date_exp);
CREATE INDEX IF NOT EXISTS idx_quotations_estado ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_total ON quotations(total);

-- ================================================
-- PASO 3: CONSTRAINTS ADICIONALES
-- ================================================

-- Validaciones en empresas
ALTER TABLE empresas 
    ADD CONSTRAINT chk_empresas_iva CHECK (iva_porcentaje >= 0 AND iva_porcentaje <= 100),
    ADD CONSTRAINT chk_empresas_colores CHECK (color_primary ~ '^#[0-9A-Fa-f]{6}$' AND color_secondary ~ '^#[0-9A-Fa-f]{6}$');

-- Validaciones en usuarios
ALTER TABLE usuarios
    ADD CONSTRAINT chk_usuarios_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    ADD CONSTRAINT chk_usuarios_rol CHECK (rol IN ('admin', 'user', 'viewer'));

-- Validaciones en productos
ALTER TABLE productos
    ADD CONSTRAINT chk_productos_precio CHECK (valor_unitario >= 0);

-- Validaciones en cotizaciones
ALTER TABLE quotations
    ADD CONSTRAINT chk_quotations_totales CHECK (subtotal >= 0 AND total >= 0),
    ADD CONSTRAINT chk_quotations_descuento CHECK (discount >= 0),
    ADD CONSTRAINT chk_quotations_fechas CHECK (date_valid >= date_exp),
    ADD CONSTRAINT chk_quotations_estado CHECK (status IN ('pending', 'approved', 'rejected', 'sent'));

-- ================================================
-- PASO 4: TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers en todas las tablas
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- PASO 5: FUNCIONES ÚTILES
-- ================================================

-- Función para obtener el siguiente número de cotización por empresa
CREATE OR REPLACE FUNCTION get_next_quotation_number(p_empresa_id INT)
RETURNS INT AS $$
DECLARE
    next_num INT;
BEGIN
    SELECT COALESCE(MAX(quotation_number), 0) + 1 INTO next_num
    FROM quotations
    WHERE empresa_id = p_empresa_id;
    
    RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular estadísticas de una empresa
CREATE OR REPLACE FUNCTION get_empresa_stats(p_empresa_id INT)
RETURNS TABLE(
    total_cotizaciones BIGINT,
    total_clientes BIGINT,
    total_productos BIGINT,
    monto_total NUMERIC,
    promedio_cotizacion NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT q.id)::BIGINT,
        COUNT(DISTINCT c.id)::BIGINT,
        COUNT(DISTINCT p.id)::BIGINT,
        COALESCE(SUM(q.total), 0)::NUMERIC,
        COALESCE(AVG(q.total), 0)::NUMERIC
    FROM empresas e
    LEFT JOIN quotations q ON q.empresa_id = e.id
    LEFT JOIN clientes c ON c.empresa_id = e.id
    LEFT JOIN productos p ON p.empresa_id = e.id
    WHERE e.id = p_empresa_id
    GROUP BY e.id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- PASO 6: VISTAS ÚTILES
-- ================================================

-- Vista de cotizaciones con información completa
CREATE OR REPLACE VIEW v_cotizaciones_completas AS
SELECT 
    q.id,
    q.empresa_id,
    e.nombre AS empresa_nombre,
    e.logo_url AS empresa_logo,
    q.quotation_number,
    q.client_name,
    q.client_email,
    q.date_exp AS fecha_expedicion,
    q.date_valid AS fecha_validez,
    q.subtotal,
    q.discount AS descuento,
    q.iva,
    q.total,
    q.status AS estado,
    q.notes AS notas,
    q.created_at AS fecha_creacion,
    q.updated_at AS fecha_actualizacion,
    CASE 
        WHEN q.date_valid < CURRENT_DATE THEN 'vencida'
        WHEN q.date_valid < CURRENT_DATE + INTERVAL '7 days' THEN 'por_vencer'
        ELSE 'vigente'
    END AS estado_vigencia
FROM quotations q
INNER JOIN empresas e ON e.id = q.empresa_id;

-- Vista de estadísticas mensuales por empresa
CREATE OR REPLACE VIEW v_estadisticas_mensuales AS
SELECT 
    e.id AS empresa_id,
    e.nombre AS empresa_nombre,
    DATE_TRUNC('month', q.date_exp) AS mes,
    COUNT(q.id) AS total_cotizaciones,
    SUM(q.total) AS monto_total,
    AVG(q.total) AS promedio,
    COUNT(CASE WHEN q.status = 'approved' THEN 1 END) AS aprobadas,
    COUNT(CASE WHEN q.status = 'rejected' THEN 1 END) AS rechazadas,
    COUNT(CASE WHEN q.status = 'pending' THEN 1 END) AS pendientes
FROM empresas e
LEFT JOIN quotations q ON q.empresa_id = e.id
GROUP BY e.id, e.nombre, DATE_TRUNC('month', q.date_exp)
ORDER BY mes DESC;

-- Vista de productos más cotizados
CREATE OR REPLACE VIEW v_productos_populares AS
SELECT 
    p.empresa_id,
    e.nombre AS empresa_nombre,
    p.id AS producto_id,
    p.nombre AS producto_nombre,
    p.valor_unitario,
    COUNT(*) AS veces_cotizado,
    SUM((item->>'quantity')::NUMERIC) AS cantidad_total
FROM productos p
INNER JOIN empresas e ON e.id = p.empresa_id
INNER JOIN quotations q ON q.empresa_id = p.empresa_id
CROSS JOIN LATERAL jsonb_array_elements(q.items::jsonb) AS item
WHERE item->>'description' ILIKE '%' || p.nombre || '%'
GROUP BY p.empresa_id, e.nombre, p.id, p.nombre, p.valor_unitario
ORDER BY veces_cotizado DESC;

-- Vista de clientes activos (con cotizaciones recientes)
CREATE OR REPLACE VIEW v_clientes_activos AS
SELECT 
    c.empresa_id,
    e.nombre AS empresa_nombre,
    c.id AS cliente_id,
    c.nombre AS cliente_nombre,
    c.email AS cliente_email,
    COUNT(q.id) AS total_cotizaciones,
    SUM(q.total) AS monto_total,
    MAX(q.date_exp) AS ultima_cotizacion,
    CASE 
        WHEN MAX(q.date_exp) > CURRENT_DATE - INTERVAL '30 days' THEN 'activo'
        WHEN MAX(q.date_exp) > CURRENT_DATE - INTERVAL '90 days' THEN 'regular'
        ELSE 'inactivo'
    END AS estado_cliente
FROM clientes c
INNER JOIN empresas e ON e.id = c.empresa_id
LEFT JOIN quotations q ON q.client_name = c.nombre AND q.empresa_id = c.empresa_id
GROUP BY c.empresa_id, e.nombre, c.id, c.nombre, c.email
ORDER BY ultima_cotizacion DESC;

-- Vista de dashboard general por empresa
CREATE OR REPLACE VIEW v_dashboard_empresa AS
SELECT 
    e.id AS empresa_id,
    e.nombre AS empresa_nombre,
    e.nit,
    e.email_contacto,
    (SELECT COUNT(*) FROM usuarios WHERE empresa_id = e.id) AS total_usuarios,
    (SELECT COUNT(*) FROM quotations WHERE empresa_id = e.id) AS total_cotizaciones,
    (SELECT COUNT(*) FROM clientes WHERE empresa_id = e.id) AS total_clientes,
    (SELECT COUNT(*) FROM productos WHERE empresa_id = e.id) AS total_productos,
    (SELECT COALESCE(SUM(total), 0) FROM quotations WHERE empresa_id = e.id) AS monto_total,
    (SELECT COUNT(*) FROM quotations WHERE empresa_id = e.id AND date_exp >= DATE_TRUNC('month', CURRENT_DATE)) AS cotizaciones_mes_actual,
    (SELECT COALESCE(SUM(total), 0) FROM quotations WHERE empresa_id = e.id AND date_exp >= DATE_TRUNC('month', CURRENT_DATE)) AS monto_mes_actual,
    e.created_at AS fecha_registro,
    e.activa
FROM empresas e;

-- ================================================
-- PASO 7: POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ================================================

-- Habilitar RLS en tablas críticas
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven datos de su empresa
CREATE POLICY quotations_empresa_policy ON quotations
    USING (empresa_id = current_setting('app.current_empresa_id')::INT);

CREATE POLICY clientes_empresa_policy ON clientes
    USING (empresa_id = current_setting('app.current_empresa_id')::INT);

CREATE POLICY productos_empresa_policy ON productos
    USING (empresa_id = current_setting('app.current_empresa_id')::INT);

-- ================================================
-- FIN DEL SCRIPT - BASE DE DATOS LISTA
-- ================================================

