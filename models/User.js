/**
 * Modelo de Usuario (User)
 * Define la estructura de datos para los usuarios del sistema en MongoDB
 */

// Importación de Mongoose para el modelado de datos
const mongoose = require('mongoose');

/**
 * Esquema de la colección User
 * Define los campos y validaciones para el manejo de usuarios
 */
const userSchema = new mongoose.Schema({
  // Nombre de usuario único para el login
  username: { 
    type: String, 
    required: true, // Campo obligatorio
    unique: true    // No puede haber usuarios duplicados
  },
  
  // Contraseña del usuario (debe ser hasheada antes del almacenamiento)
  password: { 
    type: String, 
    required: true // Campo obligatorio
  },
  
  // Rol del usuario en el sistema con valores predefinidos
  role: { 
    type: String, 
    enum: ['client', 'admin'], // Solo permite estos dos roles
    required: true // Campo obligatorio
  },
  
  // Nombre real del usuario (campo opcional)
  name: { 
    type: String 
  }, 
  
  // Empresa a la que pertenece el usuario (campo opcional)
  company: { 
    type: String 
  }
});

/**
 * Exporta el modelo User basado en el esquema definido
 * Esto permite crear, leer, actualizar y eliminar documentos de la colección 'users'
 */
module.exports = mongoose.model('User', userSchema);