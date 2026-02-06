const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secret_key_cambiar_en_produccion';

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

module.exports = { verificarToken };
