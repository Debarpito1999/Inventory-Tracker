require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const multer = require('multer');
const { protect, adminOnly } = require('./middleware/authMiddleware');
const { getReorderSuggestion } = require('./controllers/aiController');
const helmet = require('helmet');
const morgan = require('morgan');

// In microservices mode this app will run on a different port,
// behind the API Gateway. Keep its behavior the same.
connectDB();
const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer for multipart/form-data (without file uploads)
const upload = multer();
app.use(upload.none());

// Routes (excluding /api/auth, which is now handled by auth-service via gateway)
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/sellers', require('./routes/sellerRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/productions', require('./routes/productionRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/produced-transactions', require('./routes/producedTransactRoutes'));

// Direct AI route
app.get('/api/ai/reorder/:id', protect, adminOnly, getReorderSuggestion);

// Diagnostic endpoint to check email configuration
app.get('/api/check-email-config', (req, res) => {
  const config = {
    EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Missing',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Missing',
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com (default)',
    EMAIL_PORT: process.env.EMAIL_PORT || '587 (default)',
    EMAIL_SECURE: process.env.EMAIL_SECURE || 'false (default)',
    LOW_STOCK_THRESHOLD: process.env.LOW_STOCK_THRESHOLD || '10 (default)',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ? `Legacy set (${process.env.ADMIN_EMAIL})` : 'Not set (not required)'
  };

  const requiredSet = process.env.EMAIL_USER && process.env.EMAIL_PASS;

  res.json({
    status: requiredSet ? 'Configuration looks good' : 'Missing required configuration',
    config,
    message: requiredSet
      ? 'Email sender config is ready. Alerts are sent dynamically to each product owner email.'
      : 'Please set EMAIL_USER and EMAIL_PASS in your .env file'
  });
});

// Test endpoint for low stock email (remove in production or add auth)
app.get('/api/test-low-stock-email', async (req, res) => {
  try {
    const { checkAllProductsForLowStock } = require('./utils/lowStockChecker');
    const Product = require('./Models/Product');

    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10', 10);
    const low = await Product.find({ stock: { $lt: threshold } });

    if (low.length === 0) {
      return res.json({
        message: 'No low stock items found. All products are well stocked.',
        threshold
      });
    }

    const result = await checkAllProductsForLowStock();
    const success = typeof result === 'boolean' ? result : result?.success !== false;

    if (success) {
      return res.json({
        message: 'Low stock alerts processed and sent to owner emails.',
        lowStockCount: low.length,
        sentUsers: result?.sentUsers || 0
      });
    }

    return res.status(500).json({
      error: 'Failed to send low stock alerts',
      details: result?.error || 'Check server logs'
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start jobs
require('./jobs/lowStockJob');
require('./jobs/autoReorderJob');

// Health
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

// Run monolith backend on 5002 when using gateway
const PORT = process.env.PORT || 5002;
app.set('trust proxy', 1);
app.listen(PORT, () => console.log(`Legacy backend running on ${PORT}`));
