const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const xlsx = require('xlsx');
const router = express.Router();

const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

// Middleware para verificar JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// POST /upload
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const client = req.user.username;
    const base64File = req.file.buffer.toString('base64');

    const order = new Order({
      client,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      content: base64File,
      status: 'pendiente'
    });

    await order.save();
    res.json({ message: 'Orden subida correctamente' });
  } catch (err) {
    console.error('[UPLOAD ERROR]', err);
    res.status(500).json({ error: 'Error al subir orden' });
  }
});

// GET /orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.error('[GET ORDERS ERROR]', err);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// PUT /orders/:id
router.put('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    console.error('[UPDATE ERROR]', err);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// GET /orders/:id/download
router.get('/orders/:id/download', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const buffer = Buffer.from(order.content, 'base64');

    res.set({
      'Content-Type': order.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${order.filename}"`
    });

    res.send(buffer);
  } catch (err) {
    console.error('[DOWNLOAD ERROR]', err);
    res.status(500).json({ error: 'Error al descargar archivo' });
  }
});

// POST /orders/:id/validate
router.post('/orders/:id/validate', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const buffer = Buffer.from(order.content, 'base64');
    const workbook = xlsx.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rowsRaw = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (rowsRaw.length < 2) throw new Error('El archivo no contiene datos');

    // Normaliza encabezados
    const headers = rowsRaw[0].map(h =>
      String(h || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita tildes
        .replace(/\s+|\.|\/|-/g, '')
    );

    const findColumnIndexes = (keywords) =>
      headers
        .map((h, i) => (keywords.some(k => h.includes(k)) ? i : -1))
        .filter(i => i >= 0);

    const skuIndexes = findColumnIndexes(['sku', 'codartprov', 'codigoproducto']);
    const cantidadIndexes = findColumnIndexes(['cantidad', 'cant', 'solicitad']);
    const precioIndexes = findColumnIndexes(['precio', 'valor', 'unitario']);

    if (skuIndexes.length === 0 || cantidadIndexes.length === 0 || precioIndexes.length === 0) {
      throw new Error('No se encontraron las columnas necesarias');
    }

    const getFirstValidValue = (rowArray, indexes) =>
      indexes.map(i => rowArray[i]).find(val => val !== undefined && val !== null && val !== '');

    const cleanSKU = (rawSKU) =>
      String(rawSKU).trim().replace(/\s+/g, '').replace(/\/\d+$/, '').replace(/[^\d]/g, '');

    const rows = rowsRaw.slice(1); // sin encabezado
    let valid = true;

    for (const [index, rowArray] of rows.entries()) {
      const rawSKU = getFirstValidValue(rowArray, skuIndexes) || '';
      const cleanedSKU = cleanSKU(rawSKU);
      const cantidad = Number(getFirstValidValue(rowArray, cantidadIndexes));
      const precio = Number(getFirstValidValue(rowArray, precioIndexes));

      const skuValido = /^\d{6,8}$/.test(cleanedSKU); // 6 a 8 dígitos
      const cantidadValida = !isNaN(cantidad) && cantidad > 0;
      const precioValido = !isNaN(precio) && precio >= 0;
      
      if (!(skuValido && cantidadValida && precioValido)) {
        console.log('❌ Error de validación en esta fila');
        valid = false;
        break;
      } else {
        console.log('✅ Fila válida');
      }
    }

    const nuevoEstado = valid ? 'aprobado' : 'error';
    order.status = nuevoEstado;
    await order.save();

    res.json({ message: `Orden validada como ${nuevoEstado}` });
  } catch (err) {
    console.error('[VALIDATION ERROR]', err);
    res.status(500).json({ error: 'Error al validar orden' });
  }
});

module.exports = router;
