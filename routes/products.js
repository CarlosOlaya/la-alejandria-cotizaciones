const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET todos los productos
    router.get('/', async (req, res) => {
        try {
            const result = await pool.query('SELECT id, name, price, description FROM products ORDER BY name ASC');
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching products:', err);
            res.status(500).json({ error: 'Error fetching products' });
        }
    });

    // GET productos por búsqueda
    router.get('/search/:query', async (req, res) => {
        try {
            const { query } = req.params;
            const result = await pool.query(
                'SELECT id, name, price, description FROM products WHERE name ILIKE $1 ORDER BY name ASC LIMIT 10',
                [`%${query}%`]
            );
            res.json(result.rows);
        } catch (err) {
            console.error('Error searching products:', err);
            res.status(500).json({ error: 'Error searching products' });
        }
    });

    // GET producto por ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('SELECT id, name, price, description FROM products WHERE id = $1', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error fetching product:', err);
            res.status(500).json({ error: 'Error fetching product' });
        }
    });

    // POST crear producto
    router.post('/', async (req, res) => {
        try {
            const { name, price, description } = req.body;
            
            const result = await pool.query(
                'INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING *',
                [name, price, description]
            );
            
            res.status(201).json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') { // Duplicate key
                res.status(400).json({ error: 'Producto ya existe' });
            } else {
                console.error('Error creating product:', err);
                res.status(500).json({ error: 'Error creating product' });
            }
        }
    });

    // PUT actualizar producto
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, price, description } = req.body;
            
            const result = await pool.query(
                'UPDATE products SET name = $1, price = $2, description = $3 WHERE id = $4 RETURNING *',
                [name, price, description, id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error updating product:', err);
            res.status(500).json({ error: 'Error updating product' });
        }
    });

    // DELETE producto
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            res.json({ message: 'Product deleted successfully' });
        } catch (err) {
            console.error('Error deleting product:', err);
            res.status(500).json({ error: 'Error deleting product' });
        }
    });

    return router;
};
