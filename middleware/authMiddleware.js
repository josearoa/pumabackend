/**
 * Middleware de Autenticación JWT
 * Verifica la validez de los tokens JWT en las rutas protegidas
 */

// Importación de dependencias
const jwt = require('jsonwebtoken'); // Librería para manejo de JSON Web Tokens
require('dotenv').config(); // Carga variables de entorno

/**
 * Middleware para verificar la autenticación del usuario
 * @param {Object} req - Objeto de request de Express
 * @param {Object} res - Objeto de response de Express  
 * @param {Function} next - Función next para continuar al siguiente middleware
 * @returns {Object} - Response con error o continúa al siguiente middleware
 */
const authMiddleware = (req, res, next) => {
  // Extrae el header de autorización de la request
  const authHeader = req.headers.authorization;

  // Verifica si existe el header y si tiene el formato correcto "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token no proporcionado' });

  // Extrae el token del header (separa "Bearer" del token)
  const token = authHeader.split(' ')[1];

  try {
    // Verifica y decodifica el token usando la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agrega la información del usuario decodificada al objeto request
    req.user = decoded;
    
    // Continúa al siguiente middleware o ruta
    next();
  } catch (err) {
    // Si el token es inválido o ha expirado, retorna error 403
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// Exporta el middleware para ser usado en otras partes de la aplicación
module.exports = authMiddleware;
