/**
 * Rutas de Autenticación
 * Maneja el login y autenticación de usuarios en el sistema
 */

// Importación de dependencias
const express = require('express'); // Framework web
const router = express.Router(); // Router de Express para definir rutas
const User = require('../models/User'); // Modelo de usuario
const bcrypt = require('bcryptjs'); // Librería para hash y comparación de contraseñas
const jwt = require('jsonwebtoken'); // Librería para manejo de JSON Web Tokens

/**
 * POST /api/login
 * Endpoint para autenticar usuarios y generar tokens JWT
 * @route POST /api/login
 * @desc Autentica un usuario y devuelve un token JWT
 * @access Público
 */
router.post('/login', async (req, res) => {
  // Extrae username y password del cuerpo de la request
  const { username, password } = req.body;

  try {
    // Busca el usuario en la base de datos por username
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    // Compara la contraseña proporcionada con la hasheada en la BD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Contraseña incorrecta' });

    // Genera un token JWT con la información del usuario
    const token = jwt.sign(
      {
        id: user._id,           // ID único del usuario
        username: user.username, // Nombre de usuario
        role: user.role,        // Rol del usuario (client/admin)
        name: user.name || '',  // Nombre real (opcional)
        company: user.company || '' // Empresa (opcional)
      },
      process.env.JWT_SECRET,   // Clave secreta para firmar el token
      { expiresIn: '1h' }       // Token expira en 1 hora
    );

    // Respuesta exitosa con token y datos del usuario
    res.json({
      message: 'Login exitoso',
      token,                    // Token JWT para futuras requests
      role: user.role,          // Rol para manejo de permisos en frontend
      name: user.name || '',    // Nombre para mostrar en UI
      company: user.company || '' // Empresa para mostrar en UI
    });
  } catch (err) {
    // Manejo de errores del servidor
    console.error('[ERROR EN LOGIN]', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Exporta el router para ser usado en la aplicación principal
module.exports = router;


