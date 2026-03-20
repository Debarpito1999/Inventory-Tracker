require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://13.127.150.195'],
  credentials: true
}));

// Target backends
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5003';
const SALES_SERVICE_URL = process.env.SALES_SERVICE_URL || 'http://localhost:5004';
const SUPPLIER_SERVICE_URL = process.env.SUPPLIER_SERVICE_URL || 'http://localhost:5005';
const LEGACY_MONOLITH_URL = process.env.LEGACY_MONOLITH_URL || 'http://localhost:5002';

// Proxy auth routes to auth-service (preserve /api/auth prefix)
const authProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true
});

app.use('/api/auth', (req, res, next) => {
  // Restore the /api/auth prefix so auth-service sees /api/auth/...
  req.url = '/api/auth' + req.url;
  authProxy(req, res, next);
});

// Proxy inventory-related routes to inventory-service (preserve exact /api/<prefix> paths)
const inventoryProxy = createProxyMiddleware({
  target: INVENTORY_SERVICE_URL,
  changeOrigin: true
});

app.use('/api/products', (req, res, next) => {
  req.url = '/api/products' + req.url; // '' -> '/api/products/'
  inventoryProxy(req, res, next);
});

app.use('/api/productions', (req, res, next) => {
  req.url = '/api/productions' + req.url;
  inventoryProxy(req, res, next);
});

app.use('/api/produced-transactions', (req, res, next) => {
  req.url = '/api/produced-transactions' + req.url;
  inventoryProxy(req, res, next);
});

// Proxy sales routes to sales-service (preserve /api/sales prefix)
const salesProxy = createProxyMiddleware({
  target: SALES_SERVICE_URL,
  changeOrigin: true
});

app.use('/api/sales', (req, res, next) => {
  req.url = '/api/sales' + req.url; // e.g. / -> /api/sales, /?q= -> /api/sales?q=
  salesProxy(req, res, next);
});

// Proxy supplier and seller routes to supplier-service (preserve exact /api/<prefix> paths)
const supplierProxy = createProxyMiddleware({
  target: SUPPLIER_SERVICE_URL,
  changeOrigin: true
});

app.use('/api/suppliers', (req, res, next) => {
  req.url = '/api/suppliers' + req.url;
  supplierProxy(req, res, next);
});

app.use('/api/sellers', (req, res, next) => {
  req.url = '/api/sellers' + req.url;
  supplierProxy(req, res, next);
});

// Proxy everything else to the existing monolith for now
app.use(
  '/api',
  createProxyMiddleware({
    target: LEGACY_MONOLITH_URL,
    changeOrigin: true,
  })
);

// Health check for gateway
app.get('/health', (req, res) => {
  res.json({ status: 'GATEWAY_OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

