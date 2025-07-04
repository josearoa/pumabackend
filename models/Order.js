const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  client: String,
  filename: String,
  mimeType: String,
  content: String, // archivo en base64
  uploadedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pendiente', 'aprobado', 'error'], default: 'pendiente' }
});

module.exports = mongoose.model('Order', orderSchema);
