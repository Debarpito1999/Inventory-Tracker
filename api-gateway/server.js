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
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Target backends
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5003';
const SALES_SERVICE_URL = process.env.SALES_SERVICE_URL || 'http://localhost:5004';
const SUPPLIER_SERVICE_URL = process.env.SUPPLIER_SERVICE_URL || 'http://localhost:5005';
const LEGACY_MONOLITH_URL = process.env.LEGACY_MONOLITH_URL || 'http://localhost:5002';

// Proxy auth routes to auth-service
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api': '' }, // /api/auth -> /auth at auth-service, but auth-service mounts /api/auth, so keep /api
    onProxyReq: (proxyReq, req) => {
      // Forward original IP info if needed
      proxyReq.setHeader('x-forwarded-host', req.headers.host || '');
    }
  })
);

// Proxy inventory-related routes to inventory-service
app.use(
  ['/api/products', '/api/productions', '/api/produced-transactions'],
  createProxyMiddleware({
    target: INVENTORY_SERVICE_URL,
    changeOrigin: true
  })
);

// Proxy sales routes to sales-service
app.use(
  '/api/sales',
  createProxyMiddleware({
    target: SALES_SERVICE_URL,
    changeOrigin: true
  })
);

// Proxy supplier and seller routes to supplier-service
app.use(
  ['/api/suppliers', '/api/sellers'],
  createProxyMiddleware({
    target: SUPPLIER_SERVICE_URL,
    changeOrigin: true
  })
);

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

