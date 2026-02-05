const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');

const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar pool de conexión a PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// ========================================
// RUTAS API - COTIZACIONES
// ========================================

// GET todas las cotizaciones
app.get('/api/quotations', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM quotations ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching quotations:', err);
        res.status(500).json({ error: 'Error fetching quotations' });
    }
});

// GET una cotización por ID
app.get('/api/quotations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM quotations WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching quotation:', err);
        res.status(500).json({ error: 'Error fetching quotation' });
    }
});

// POST crear nueva cotización
app.post('/api/quotations', async (req, res) => {
    try {
        const { quotationNumber, dateExp, dateValid, clientName, clientCCNIT, clientAddress, clientPhone, clientEmail, items, subtotal, discount, total } = req.body;
        
        const result = await pool.query(
            'INSERT INTO quotations (quotation_number, date_exp, date_valid, client_name, client_cc_nit, client_address, client_phone, client_email, items, subtotal, discount, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [quotationNumber, dateExp, dateValid, clientName, clientCCNIT, clientAddress, clientPhone, clientEmail, JSON.stringify(items), subtotal, discount, total]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating quotation:', err);
        res.status(500).json({ error: 'Error creating quotation' });
    }
});

// PUT actualizar cotización
app.put('/api/quotations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quotationNumber, dateExp, dateValid, clientName, clientCCNIT, clientAddress, clientPhone, clientEmail, items, subtotal, discount, total } = req.body;
        
        const result = await pool.query(
            'UPDATE quotations SET quotation_number = $1, date_exp = $2, date_valid = $3, client_name = $4, client_cc_nit = $5, client_address = $6, client_phone = $7, client_email = $8, items = $9, subtotal = $10, discount = $11, total = $12 WHERE id = $13 RETURNING *',
            [quotationNumber, dateExp, dateValid, clientName, clientCCNIT, clientAddress, clientPhone, clientEmail, JSON.stringify(items), subtotal, discount, total, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating quotation:', err);
        res.status(500).json({ error: 'Error updating quotation' });
    }
});

// DELETE eliminar cotización
app.delete('/api/quotations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM quotations WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        res.json({ message: 'Quotation deleted successfully' });
    } catch (err) {
        console.error('Error deleting quotation:', err);
        res.status(500).json({ error: 'Error deleting quotation' });
    }
});

// GET próximo número de cotización
app.get('/api/quotations/next/number', async (req, res) => {
    try {
        const result = await pool.query('SELECT MAX(quotation_number) as max_number FROM quotations');
        const maxNumber = result.rows[0].max_number || 1000;
        const nextNumber = maxNumber + 1;
        
        res.json({ nextNumber });
    } catch (err) {
        console.error('Error getting next quotation number:', err);
        res.status(500).json({ error: 'Error getting next quotation number' });
    }
});

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
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
