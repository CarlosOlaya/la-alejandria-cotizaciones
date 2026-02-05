-- Crear tabla de cotizaciones
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
