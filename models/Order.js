/**
 * Modelo de Orden (Order)
 * Define la estructura de datos para las órdenes en MongoDB
 */

// Importación de Mongoose para el modelado de datos
const mongoose = require('mongoose');

/**
 * Esquema de la colección Order
 * Define los campos y sus tipos para almacenar información de órdenes
 */
const orderSchema = new mongoose.Schema({
  // Nombre del cliente que realiza la orden
  client: String,
  
  // Nombre original del archivo subido
  filename: String,
  
  // Tipo MIME del archivo (ej: image/jpeg, application/pdf, etc.)
  mimeType: String,
  
  // Contenido del archivo codificado en base64 para almacenamiento
  content: String, // archivo en base64
  
  // Fecha y hora de cuando se subió el archivo (se establece automáticamente)
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Estado actual de la orden con valores predefinidos
  status: { 
    type: String, 
    enum: ['pendiente', 'aprobado', 'error'], // Solo permite estos valores
    default: 'pendiente' // Estado inicial por defecto
  }
});

/**
 * Exporta el modelo Order basado en el esquema definido
 * Esto permite crear, leer, actualizar y eliminar documentos de la colección 'orders'
 */
module.exports = mongoose.model('Order', orderSchema);
