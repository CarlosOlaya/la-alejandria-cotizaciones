const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET todos los clientes
    router.get('/', async (req, res) => {
        try {
            const result = await pool.query('SELECT id, name, cc_nit, address, phone, email FROM clients ORDER BY name ASC');
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching clients:', err);
            res.status(500).json({ error: 'Error fetching clients' });
        }
    });

    // GET clientes por búsqueda
    router.get('/search/:query', async (req, res) => {
        try {
            const { query } = req.params;
            const result = await pool.query(
                'SELECT id, name, cc_nit, address, phone, email FROM clients WHERE name ILIKE $1 ORDER BY name ASC LIMIT 10',
                [`%${query}%`]
            );
            res.json(result.rows);
        } catch (err) {
            console.error('Error searching clients:', err);
            res.status(500).json({ error: 'Error searching clients' });
        }
    });

    // GET cliente por ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('SELECT id, name, cc_nit, address, phone, email FROM clients WHERE id = $1', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Client not found' });
            }
            
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error fetching client:', err);
            res.status(500).json({ error: 'Error fetching client' });
        }
    });

    // POST crear cliente
    router.post('/', async (req, res) => {
        try {
            const { name, cc_nit, address, phone, email } = req.body;
            
            const result = await pool.query(
                'INSERT INTO clients (name, cc_nit, address, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [name, cc_nit, address, phone, email]
            );
            
            res.status(201).json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') { // Duplicate key
                res.status(400).json({ error: 'Cliente ya existe' });
            } else {
                console.error('Error creating client:', err);
                res.status(500).json({ error: 'Error creating client' });
            }
        }
    });

    // PUT actualizar cliente
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, cc_nit, address, phone, email } = req.body;
            
            const result = await pool.query(
                'UPDATE clients SET name = $1, cc_nit = $2, address = $3, phone = $4, email = $5 WHERE id = $6 RETURNING *',
                [name, cc_nit, address, phone, email, id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Client not found' });
            }
            
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error updating client:', err);
            res.status(500).json({ error: 'Error updating client' });
        }
    });

    // DELETE cliente
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Client not found' });
            }
            
            res.json({ message: 'Client deleted successfully' });
        } catch (err) {
            console.error('Error deleting client:', err);
            res.status(500).json({ error: 'Error deleting client' });
        }
    });

    return router;
};
