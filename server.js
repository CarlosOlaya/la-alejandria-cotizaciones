const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');
const { Pool } = require('pg');

// Importar rutas
const quotationsRoutes = require('./routes/quotations');
const clientsRoutes = require('./routes/clients');
const productsRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar pool de conexión a PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : { rejectUnauthorized: false } // Usa SSL incluso en desarrollo con Neon
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// ========================================
// RUTAS API
// ========================================
app.use('/api/auth', authRoutes);
app.use('/api/quotations', quotationsRoutes(pool));
app.use('/api/clients', clientsRoutes(pool));
app.use('/api/products', productsRoutes(pool));

// Ruta para servir el frontend (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Iniciar servidor
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Exportar para Vercel
module.exports = app;
