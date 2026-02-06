const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secret_key_cambiar_en_produccion';

module.exports = (pool) => {
    const router = express.Router();

    // Middleware para verificar token
    const verificarToken = (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.usuarioId = decoded.usuarioId;
            req.empresaId = decoded.empresaId;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Token inválido o expirado' });
        }
    };

    // REGISTRO
    router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        // Validaciones
        if (!nombre || !email || !password) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar si el email ya existe
        const usuarioExistente = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Hashear contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Crear empresa inicial
        const empresaResult = await pool.query(
            'INSERT INTO empresas (nombre, nit, color_primary, color_secondary) VALUES ($1, $2, $3, $4) RETURNING id',
            [`Empresa de ${nombre}`, 'POR_DEFINIR', '#ff6b35', '#4ecdc4']
        );

        const empresaId = empresaResult.rows[0].id;

        // Crear usuario
        const usuarioResult = await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash, empresa_id, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [nombre, email, passwordHash, empresaId, 'admin']
        );

        res.status(201).json({ message: 'Registro exitoso' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña requeridos' });
        }

        // Buscar usuario
        const usuarioResult = await pool.query(
            'SELECT id, password_hash, empresa_id FROM usuarios WHERE email = $1',
            [email]
        );

        if (usuarioResult.rows.length === 0) {
            return res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }

        const usuario = usuarioResult.rows[0];

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }

        // Generar JWT
        const token = jwt.sign(
            { usuarioId: usuario.id, empresaId: usuario.empresa_id },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            usuarioId: usuario.id,
            empresaId: usuario.empresa_id
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// CREAR/ACTUALIZAR EMPRESA
router.post('/empresas/crear', verificarToken, async (req, res) => {
    try {
        const {
            nombre,
            nit,
            logo_url,
            color_primary,
            color_secondary,
            incluye_iva,
            iva_porcentaje,
            direccion,
            telefono,
            email_contacto,
            descripcion
        } = req.body;

        if (!nombre || !nit) {
            return res.status(400).json({ message: 'Nombre y NIT son requeridos' });
        }

        // Actualizar empresa existente
        const result = await pool.query(
            `UPDATE empresas SET
                nombre = $1,
                nit = $2,
                logo_url = $3,
                color_primary = $4,
                color_secondary = $5,
                incluye_iva = $6,
                iva_porcentaje = $7,
                direccion = $8,
                telefono = $9,
                email_contacto = $10,
                descripcion = $11
            WHERE id = $12
            RETURNING id`,
            [nombre, nit, logo_url, color_primary, color_secondary, incluye_iva, iva_porcentaje, direccion, telefono, email_contacto, descripcion, req.empresaId]
        );

        res.json({ message: 'Empresa actualizada', empresaId: req.empresaId });
    } catch (error) {
        console.error('Error al crear empresa:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// OBTENER DATOS DE EMPRESA
router.get('/empresas/mi-empresa', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM empresas WHERE id = $1',
            [req.empresaId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Empresa no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// VERIFICAR TOKEN
router.post('/verificar', verificarToken, async (req, res) => {
    try {
        const usuarioResult = await pool.query(
            'SELECT id, nombre, email FROM usuarios WHERE id = $1',
            [req.usuarioId]
        );

        if (usuarioResult.rows.length === 0) {
            return res.status(401).json({ valid: false });
        }

        const usuario = usuarioResult.rows[0];

        const empresaResult = await pool.query(
            'SELECT * FROM empresas WHERE id = $1',
            [req.empresaId]
        );

        res.json({
            valid: true,
            usuario,
            empresa: empresaResult.rows[0]
        });
    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

    return router;
};
