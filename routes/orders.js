/**
 * Rutas de Órdenes
 * Maneja la subida, validación, descarga y gestión de órdenes de archivos Excel
 */

// Importación de dependencias
const express = require('express'); // Framework web
const multer = require('multer'); // Middleware para manejo de archivos multipart
const jwt = require('jsonwebtoken'); // Librería para verificación de tokens JWT
const Order = require('../models/Order'); // Modelo de orden
const xlsx = require('xlsx'); // Librería para leer y procesar archivos Excel
const router = express.Router(); // Router de Express

// Configuración de Multer para almacenamiento en memoria
const memoryStorage = multer.memoryStorage(); // Almacena archivos en memoria (RAM)
const upload = multer({ storage: memoryStorage }); // Instancia de multer con configuración

/**
 * Middleware personalizado para verificar autenticación JWT
 * Similar al authMiddleware pero implementado localmente
 * @param {Object} req - Request object
 * @param {Object} res - Response object  
 * @param {Function} next - Next function
 */
function authenticateToken(req, res, next) {
  // Extrae el header de autorización
  const authHeader = req.headers['authorization'];
  // Separa el token del prefijo "Bearer "
  const token = authHeader?.split(' ')[1];

  // Si no hay token, retorna 401 Unauthorized
  if (!token) return res.sendStatus(401);

  // Verifica el token JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Token inválido: 403 Forbidden
    req.user = user; // Agrega usuario decodificado al request
    next(); // Continúa al siguiente middleware
  });
}

/**
 * POST /upload
 * Endpoint para subir archivos y crear nuevas órdenes
 * @route POST /upload
 * @desc Sube un archivo y crea una orden en estado pendiente
 * @access Privado (requiere token JWT)
 */
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Obtiene el username del usuario autenticado
    const client = req.user.username;
    // Convierte el archivo a base64 para almacenamiento en BD
    const base64File = req.file.buffer.toString('base64');

    // Crea una nueva orden con los datos del archivo
    const order = new Order({
      client,                        // Cliente que sube el archivo
      filename: req.file.originalname, // Nombre original del archivo
      mimeType: req.file.mimetype,   // Tipo MIME del archivo
      content: base64File,           // Contenido en base64
      status: 'pendiente'            // Estado inicial
    });

    // Guarda la orden en la base de datos
    await order.save();
    res.json({ message: 'Orden subida correctamente' });
  } catch (err) {
    console.error('[UPLOAD ERROR]', err);
    res.status(500).json({ error: 'Error al subir orden' });
  }
});

/**
 * GET /orders
 * Endpoint para obtener todas las órdenes
 * @route GET /orders
 * @desc Obtiene la lista completa de órdenes
 * @access Privado (requiere token JWT)
 */
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    // Busca todas las órdenes en la base de datos
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.error('[GET ORDERS ERROR]', err);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

/**
 * PUT /orders/:id
 * Endpoint para actualizar el estado de una orden
 * @route PUT /orders/:id
 * @desc Actualiza el estado de una orden específica
 * @access Privado (requiere token JWT)
 */
router.put('/orders/:id', authenticateToken, async (req, res) => {
  try {
    // Extrae el nuevo estado del body de la request
    const { status } = req.body;
    // Actualiza la orden por ID con el nuevo estado
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    console.error('[UPDATE ERROR]', err);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

/**
 * GET /orders/:id/download
 * Endpoint para descargar el archivo de una orden
 * @route GET /orders/:id/download
 * @desc Descarga el archivo original de una orden específica
 * @access Privado (requiere token JWT)
 */
router.get('/orders/:id/download', authenticateToken, async (req, res) => {
  try {
    // Busca la orden por ID
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // Convierte el contenido base64 de vuelta a buffer
    const buffer = Buffer.from(order.content, 'base64');

    // Configura headers para la descarga del archivo
    res.set({
      'Content-Type': order.mimeType || 'application/octet-stream', // Tipo MIME del archivo
      'Content-Disposition': `attachment; filename="${order.filename}"` // Nombre para descarga
    });

    // Envía el archivo como respuesta
    res.send(buffer);
  } catch (err) {
    console.error('[DOWNLOAD ERROR]', err);
    res.status(500).json({ error: 'Error al descargar archivo' });
  }
});

/**
 * POST /orders/:id/validate
 * Endpoint para validar archivos Excel y actualizar estado de orden
 * @route POST /orders/:id/validate
 * @desc Valida el contenido de un archivo Excel y actualiza el estado de la orden
 * @access Privado (requiere token JWT)
 */
router.post('/orders/:id/validate', authenticateToken, async (req, res) => {
  try {
    // Busca la orden por ID
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // Convierte el contenido base64 a buffer y lee el archivo Excel
    const buffer = Buffer.from(order.content, 'base64');
    const workbook = xlsx.read(buffer); // Lee el archivo Excel
    const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Obtiene la primera hoja
    const rowsRaw = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Convierte a array bidimensional

    // Valida que el archivo tenga contenido
    if (rowsRaw.length < 2) throw new Error('El archivo no contiene datos');

    // Normalización de encabezados para búsqueda flexible
    // Convierte a minúsculas, quita tildes, espacios y caracteres especiales
    const headers = rowsRaw[0].map(h =>
      String(h || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita tildes
        .replace(/\s+|\.|\/|-/g, '')      // quita espacios y caracteres especiales
    );

    /**
     * Función auxiliar para encontrar índices de columnas por palabras clave
     * @param {Array} keywords - Array de palabras clave a buscar
     * @returns {Array} - Array de índices donde se encontraron las palabras clave
     */
    const findColumnIndexes = (keywords) =>
      headers
        .map((h, i) => (keywords.some(k => h.includes(k)) ? i : -1))
        .filter(i => i >= 0);

    // Busca las columnas necesarias usando diferentes variaciones de nombres
    const skuIndexes = findColumnIndexes(['sku', 'codartprov', 'codigoproducto']);
    const cantidadIndexes = findColumnIndexes(['cantidad', 'cant', 'solicitad']);
    const precioIndexes = findColumnIndexes(['precio', 'valor', 'unitario']);

    // Valida que se hayan encontrado todas las columnas necesarias
    if (skuIndexes.length === 0 || cantidadIndexes.length === 0 || precioIndexes.length === 0) {
      throw new Error('No se encontraron las columnas necesarias');
    }

    /**
     * Función auxiliar para obtener el primer valor válido de múltiples columnas
     * @param {Array} rowArray - Fila del Excel como array
     * @param {Array} indexes - Índices de columnas a verificar
     * @returns {*} - Primer valor válido encontrado
     */
    const getFirstValidValue = (rowArray, indexes) =>
      indexes.map(i => rowArray[i]).find(val => val !== undefined && val !== null && val !== '');

    /**
     * Función auxiliar para limpiar y normalizar códigos SKU
     * @param {*} rawSKU - SKU sin procesar
     * @returns {string} - SKU limpio con solo números
     */
    const cleanSKU = (rawSKU) =>
      String(rawSKU).trim().replace(/\s+/g, '').replace(/\/\d+$/, '').replace(/[^\d]/g, '');

    // Procesa las filas de datos (sin encabezado)
    const rows = rowsRaw.slice(1);
    let valid = true; // Flag para determinar si toda la orden es válida

    // Valida cada fila del archivo
    for (const [index, rowArray] of rows.entries()) {
      // Extrae y limpia los valores de cada columna
      const rawSKU = getFirstValidValue(rowArray, skuIndexes) || '';
      const cleanedSKU = cleanSKU(rawSKU);
      const cantidad = Number(getFirstValidValue(rowArray, cantidadIndexes));
      const precio = Number(getFirstValidValue(rowArray, precioIndexes));

      // Aplica reglas de validación para cada campo
      const skuValido = /^\d{6,8}$/.test(cleanedSKU); // SKU: 6 a 8 dígitos
      const cantidadValida = !isNaN(cantidad) && cantidad > 0; // Cantidad: número positivo
      const precioValido = !isNaN(precio) && precio >= 0; // Precio: número no negativo
      
      // Si alguna validación falla, marca la orden como inválida
      if (!(skuValido && cantidadValida && precioValido)) {
        console.log('❌ Error de validación en esta fila');
        valid = false;
        break;
      } else {
        console.log('✅ Fila válida');
      }
    }

    // Actualiza el estado de la orden basado en la validación
    const nuevoEstado = valid ? 'aprobado' : 'error';
    order.status = nuevoEstado;
    await order.save();

    res.json({ message: `Orden validada como ${nuevoEstado}` });
  } catch (err) {
    console.error('[VALIDATION ERROR]', err);
    res.status(500).json({ error: 'Error al validar orden' });
  }
});

// Exporta el router para ser usado en la aplicación principal
module.exports = router;
