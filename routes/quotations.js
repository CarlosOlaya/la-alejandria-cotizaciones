const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

// Inyectar pool desde el servidor
module.exports = (pool) => {
    // GET todas las cotizaciones (filtradas por empresa)
    router.get('/', verificarToken, async (req, res) => {
        try {
            const empresaId = req.empresaId;
            const result = await pool.query(
                'SELECT * FROM quotations WHERE empresa_id = $1 ORDER BY id DESC',
                [empresaId]
            );
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching quotations:', err);
            res.status(500).json({ error: 'Error fetching quotations' });
        }
    });

    // GET una cotización por ID (validando empresa)
    router.get('/:id', verificarToken, async (req, res) => {
        try {
            const { id } = req.params;
            const empresaId = req.empresaId;
            const result = await pool.query(
                'SELECT * FROM quotations WHERE id = $1 AND empresa_id = $2',
                [id, empresaId]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Quotation not found' });
            }
            
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error fetching quotation:', err);
            res.status(500).json({ error: 'Error fetching quotation' });
        }
    });

    // GET próximo número de cotización (por empresa)
    router.get('/next/number', verificarToken, async (req, res) => {
        try {
            const empresaId = req.empresaId;
            const result = await pool.query(
                'SELECT MAX(quotation_number) as max_number FROM quotations WHERE empresa_id = $1',
                [empresaId]
            );
            const maxNumber = result.rows[0].max_number || 1000;
            const nextNumber = maxNumber + 1;
            
            res.json({ nextNumber });
        } catch (err) {
            console.error('Error getting next quotation number:', err);
            res.status(500).json({ error: 'Error getting next quotation number' });
        }
    });

    // POST crear nueva cotización
    router.post('/', verificarToken, async (req, res) => {
        try {
            const empresaId = req.empresaId;
            const { quotationNumber, dateExp, dateValid, clientName, clientCCNIT, clientAddress, clientPhone, clientEmail, items, subtotal, discount, total } = req.body;
            
            const result = await pool.query(
                'INSERT INTO quotations (empresa_id, quotation_number, date_exp, date_valid, client_name, client_cc_nit, client_address, client_phone, client_email, items, subtotal, discount, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
                [empresaId, quotationNumber, dateExp, dateValid, clientName, clientCCNIT, clientAddress, clientPhone, clientEmail, JSON.stringify(items), subtotal, discount, total]
            );
            
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Error creating quotation:', err);
            res.status(500).json({ error: 'Error creating quotation' });
        }
    });

    // PUT actualizar cotización
    router.put('/:id', verificarToken, async (req, res) => {
        try {
            const { id } = req.params;
            const empresaId = req.empresaId;
            const { quotationNumber, dateExp, dateValid, clientName, clientCCNIT, clientAddress, clientPhone, clientEmail, items, subtotal, discount, total } = req.body;
            
            const result = await pool.query(
                'UPDATE quotations SET quotation_number = $1, date_exp = $2, date_valid = $3, client_name = $4, client_cc_nit = $5, client_address = $6, client_phone = $7, client_email = $8, items = $9, subtotal = $10, discount = $11, total = $12 WHERE id = $13 AND empresa_id = $14 RETURNING *',
                [quotationNumber, dateExp, dateValid, clientName, clientCCNIT, clientAddress, clientPhone, clientEmail, JSON.stringify(items), subtotal, discount, total, id, empresaId]
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
    router.delete('/:id', verificarToken, async (req, res) => {
        try {
            const { id } = req.params;
            const empresaId = req.empresaId;
            const result = await pool.query(
                'DELETE FROM quotations WHERE id = $1 AND empresa_id = $2 RETURNING *',
                [id, empresaId]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Quotation not found' });
            }
            
            res.json({ message: 'Quotation deleted successfully' });
        } catch (err) {
            console.error('Error deleting quotation:', err);
            res.status(500).json({ error: 'Error deleting quotation' });
        }
    });

    return router;
};
