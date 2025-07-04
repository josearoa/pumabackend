# 🐾 Puma Chile - Backend API de Plataforma B2B de Órdenes

Backend de la aplicación web desarrollada para Puma Chile, diseñada para automatizar y simplificar el proceso de ingreso de órdenes de compra entre clientes y el equipo de Customer Service.

## 🛠 Tecnologías utilizadas

- **Framework**: Node.js con Express.js
- **Base de datos**: MongoDB Atlas
- **ODM**: Mongoose
- **Autenticación**: JWT (JSON Web Tokens)
- **Encriptación**: bcryptjs
- **Manejo de archivos**: Multer
- **Procesamiento Excel**: xlsx
- **Middleware**: CORS, express.json()
- **Variables de entorno**: dotenv

## 🌐 Funcionalidades del Backend

### 🔐 Sistema de Autenticación
- **Login JWT**: Autenticación segura con tokens
- **Encriptación**: Contraseñas hasheadas con bcryptjs
- **Roles**: Sistema de permisos (client/admin)
- **Middleware**: Verificación automática de tokens
- **Expiración**: Tokens con duración de 1 hora

### 📁 Gestión de Órdenes
- **Subida de archivos**: Almacenamiento en base64
- **Validación de Excel**: Procesamiento automático de archivos
- **Estados dinámicos**: pendiente → aprobado/error
- **Descarga**: Recuperación de archivos originales
- **Historial completo**: Tracking de todas las órdenes

### 🔍 Validación Inteligente
- **Normalización de headers**: Detección flexible de columnas
- **Limpieza de datos**: Procesamiento automático de SKUs
- **Reglas de negocio**: Validación de cantidad, precio y códigos
- **Feedback detallado**: Logging de errores específicos

## 📡 Endpoints de la API

### Autenticación
```http
POST /api/login
```
- **Descripción**: Autentica usuarios y genera tokens JWT
- **Body**: `{ username, password }`
- **Response**: Token JWT + datos del usuario

### Gestión de Órdenes
```http
POST /upload
```
- **Descripción**: Sube archivo y crea nueva orden
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `multipart/form-data` con archivo

```http
GET /orders
```
- **Descripción**: Obtiene lista de todas las órdenes
- **Headers**: `Authorization: Bearer <token>`

```http
PUT /orders/:id
```
- **Descripción**: Actualiza estado de una orden
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ status }`

```http
GET /orders/:id/download
```
- **Descripción**: Descarga archivo original de la orden
- **Headers**: `Authorization: Bearer <token>`

```http
POST /orders/:id/validate
```
- **Descripción**: Valida archivo Excel y actualiza estado
- **Headers**: `Authorization: Bearer <token>`

## 📊 Modelos de Datos

### User Schema
```javascript
{
  username: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['client', 'admin'], required),
  name: String (optional),
  company: String (optional)
}
```

### Order Schema
```javascript
{
  client: String,
  filename: String,
  mimeType: String,
  content: String (base64),
  uploadedAt: Date (default: now),
  status: String (enum: ['pendiente', 'aprobado', 'error'])
}
```

## 🔧 Reglas de Validación Excel

### Columnas Detectadas Automáticamente
- **SKU**: `sku`, `codartprov`, `codigoproducto`
- **Cantidad**: `cantidad`, `cant`, `solicitad`
- **Precio**: `precio`, `valor`, `unitario`

### Validaciones Aplicadas
- **SKU**: 6-8 dígitos numéricos únicamente
- **Cantidad**: Número entero positivo (> 0)
- **Precio**: Número decimal no negativo (≥ 0)

### Normalización
- Encabezados sin tildes, espacios ni caracteres especiales
- SKUs limpiados de caracteres no numéricos
- Detección flexible de variaciones de nombres

## 📁 Estructura del proyecto

```
backend/
├── server.js              # Servidor principal
├── middleware/
│   └── authMiddleware.js   # Middleware de autenticación JWT
├── models/
│   ├── User.js            # Modelo de usuario
│   └── Order.js           # Modelo de orden
├── routes/
│   ├── auth.js            # Rutas de autenticación
│   └── orders.js          # Rutas de órdenes
├── package.json           # Dependencias y scripts
└── README.md             # Este archivo
```

## 🚀 Instrucciones para ejecutar

### Prerrequisitos
- **Node.js** (versión 14 o superior)
- **npm** o **yarn**
- **MongoDB Atlas** (cuenta y cluster configurado)

### Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar en modo desarrollo
npm start
# o con nodemon para auto-restart
npm run dev
```

El servidor se ejecutará en `http://localhost:5000`

## 🔧 Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pumadb

# JWT
JWT_SECRET=tu_clave_secreta_super_segura

# Servidor
PORT=5000
NODE_ENV=development
```

## 📦 Dependencias principales

```json
{
  "express": "^4.18.2",      // Framework web
  "mongoose": "^7.5.0",      // ODM para MongoDB
  "bcryptjs": "^2.4.3",      // Encriptación de contraseñas
  "jsonwebtoken": "^9.0.2",  // Manejo de JWT
  "multer": "^1.4.5",        // Manejo de archivos
  "xlsx": "^0.18.5",         // Procesamiento de Excel
  "cors": "^2.8.5",          // Cross-Origin Resource Sharing
  "dotenv": "^16.3.1"        // Variables de entorno
}
```

## 🎯 Características técnicas

- **Arquitectura RESTful**: API bien estructurada y escalable
- **Seguridad JWT**: Autenticación stateless y segura
- **Validación robusta**: Procesamiento inteligente de Excel
- **Almacenamiento en la nube**: MongoDB Atlas para alta disponibilidad
- **Manejo de errores**: Logging detallado y respuestas consistentes
- **Middleware personalizado**: Autenticación y validación modular

## 🔒 Seguridad implementada

- **Contraseñas hasheadas**: bcryptjs con salt automático
- **Tokens JWT**: Firmados con clave secreta
- **Expiración de sesiones**: Tokens con TTL de 1 hora
- **Validación de entrada**: Sanitización de datos de usuario
- **CORS configurado**: Control de acceso de dominios

## 📈 Estados de órdenes

```mermaid
graph LR
    A[Upload] --> B[pendiente]
    B --> C{Validación}
    C -->|✅ Éxito| D[aprobado]
    C -->|❌ Error| E[error]
    D --> F[Descarga disponible]
    E --> G[Requiere corrección]
```

## 🧪 Testing y desarrollo

```bash
# Scripts disponibles
npm start          # Ejecuta el servidor
npm run dev        # Ejecuta con nodemon (desarrollo)
npm test           # Ejecuta pruebas (si están configuradas)
npm run lint       # Linting del código
```

## 📊 Monitoreo y logs

El sistema incluye logging detallado para:
- ✅ Conexiones exitosas a MongoDB
- 🔐 Intentos de login (exitosos y fallidos)
- 📤 Subidas de archivos
- 🔍 Procesos de validación
- ❌ Errores del servidor

## 🤝 Desarrollo

Este backend fue desarrollado siguiendo las mejores prácticas de Node.js y Express.js para proporcionar una API robusta, segura y escalable para la plataforma B2B de Puma Chile.

### Próximas mejoras
- [ ] Rate limiting para prevenir abuso
- [ ] Paginación en listado de órdenes
- [ ] Filtros avanzados por fecha/cliente
- [ ] Notificaciones por email
- [ ] API de métricas y analytics

## 🔗 Enlaces relacionados

- [Documentación de Express.js](https://expressjs.com/)
- [Mongoose ODM](https://mongoosejs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [JWT.io](https://jwt.io/)
- [XLSX Documentation](https://docs.sheetjs.com/)

---

*Desarrollado para Puma Chile - Sistema B2B de Gestión de Órdenes* 🐾
