/**
 * Servidor Express.js para la aplicación Puma
 * Configuración del servidor backend con MongoDB Atlas
 */

// Importación de dependencias necesarias
const express = require('express'); // Framework web para Node.js
const cors = require('cors'); // Middleware para habilitar CORS (Cross-Origin Resource Sharing)
const path = require('path'); // Utilidad para trabajar con rutas de archivos
const mongoose = require('mongoose'); // ODM para MongoDB
require('dotenv').config(); // Carga variables de entorno desde archivo .env

// Inicialización de la aplicación Express
const app = express();

// Configuración de middlewares globales
app.use(cors()); // Permite solicitudes desde diferentes dominios
app.use(express.json()); // Permite parsear JSON en el body de las requests

// Configuración de la base de datos MongoDB
// Conexión a MongoDB Atlas usando la URI definida en las variables de entorno
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, // Usar el nuevo parser de URL de MongoDB
  useUnifiedTopology: true // Usar el nuevo motor de topología unificada
}).then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error de conexión:', err));

// Configuración de rutas de la API
// Importación de los módulos de rutas
const authRoutes = require('./routes/auth'); // Rutas para autenticación de usuarios
const ordersRoutes = require('./routes/orders'); // Rutas para gestión de órdenes

// Configuración de las rutas en la aplicación
app.use('/', ordersRoutes); // Rutas de órdenes montadas en la raíz
app.use('/api', authRoutes); // Rutas de autenticación montadas en /api

// Ruta de verificación del estado del servidor
// Endpoint simple para confirmar que la API está funcionando correctamente
app.get('/', (req, res) => {
  res.send('API Puma conectada a MongoDB 🚀');
});

// Configuración e inicio del servidor
// El servidor escucha en el puerto definido en las variables de entorno o por defecto en el 5000
app.listen(process.env.PORT || 5000, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT || 5000}`);
});