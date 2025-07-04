const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error de conexión:', err));

// Rutas API
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
app.use('/', ordersRoutes);
app.use('/api', authRoutes);

// 🔁 Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'build');
  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Ruta base para verificar funcionamiento
app.get('/', (req, res) => {
  res.send('API Puma conectada a MongoDB 🚀');
});

// Servidor en puerto definido
app.listen(process.env.PORT || 5000, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT || 5000}`);
});