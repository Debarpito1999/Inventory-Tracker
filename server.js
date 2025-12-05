require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const multer = require('multer');

connectDB();
const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data (x-www-form-urlencoded)

// Multer for multipart/form-data (without file uploads)
const upload = multer();
app.use(upload.none()); // Parse multipart/form-data (form-data in Postman)

// routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/sellers', require('./routes/sellerRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));

// Diagnostic endpoint to check email configuration
app.get('/api/check-email-config', (req, res) => {
  const config = {
    EMAIL_USER: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing',
    EMAIL_PASS: process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing',
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com (default)',
    EMAIL_PORT: process.env.EMAIL_PORT || '587 (default)',
    EMAIL_SECURE: process.env.EMAIL_SECURE || 'false (default)',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ? `✓ ${process.env.ADMIN_EMAIL}` : '✗ Missing',
    LOW_STOCK_THRESHOLD: process.env.LOW_STOCK_THRESHOLD || '10 (default)',
  };
  
  const allSet = process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL;
  
  res.json({
    status: allSet ? 'Configuration looks good' : 'Missing required configuration',
    config,
    message: allSet 
      ? 'All required email settings are configured. Check server logs when sending email.'
      : 'Please set EMAIL_USER, EMAIL_PASS, and ADMIN_EMAIL in your .env file'
  });
});

// Test endpoint for low stock email (remove in production or add auth)
app.get('/api/test-low-stock-email', async (req, res) => {
  console.log('\n🔍 Testing low stock email...');
  
  try {
    const { checkAllProductsForLowStock } = require('./utils/lowStockChecker');
    const Product = require('./Models/Product');
    
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;
    console.log(`   Threshold: ${threshold}`);
    
    const low = await Product.find({ stock: { $lt: threshold } }).populate('supplier');
    console.log(`   Found ${low.length} low stock item(s)`);
    
    if (!process.env.ADMIN_EMAIL) {
      console.error('❌ ADMIN_EMAIL not configured');
      return res.status(400).json({ 
        error: 'ADMIN_EMAIL not configured in .env',
        lowStockCount: low.length,
        suggestion: 'Add ADMIN_EMAIL=your_email@example.com to your .env file'
      });
    }
    
    if (low.length === 0) {
      console.log('✅ No low stock items found');
      return res.json({ 
        message: 'No low stock items found. All products are well stocked!',
        threshold 
      });
    }
    
    console.log('   Low stock products:');
    low.forEach(p => {
      console.log(`     - ${p.name}: ${p.stock} units`);
    });
    
    console.log('   Attempting to send email...');
    const result = await checkAllProductsForLowStock();
    
    const success = typeof result === 'boolean' ? result : result?.success !== false;
    
    if (success) {
      console.log('✅ Email sent successfully\n');
      res.json({ 
        message: `Low stock alert email sent successfully to ${process.env.ADMIN_EMAIL}`,
        lowStockCount: low.length,
        products: low.map(p => ({ name: p.name, stock: p.stock }))
      });
    } else {
      console.error('❌ Failed to send email\n');
      const errorDetails = typeof result === 'object' && result?.error ? result.error : null;
      
      res.status(500).json({ 
        error: 'Failed to send email',
        lowStockCount: low.length,
        errorDetails: errorDetails || 'Check server console logs for detailed error messages.',
        commonIssues: {
          gmail: 'If using Gmail, make sure you\'re using an App Password (not your regular password)',
          auth: 'Enable 2-Factor Authentication and generate an App Password at https://myaccount.google.com/apppasswords',
          connection: 'Check your internet connection and firewall settings'
        },
        suggestion: 'Check your email configuration. Visit /api/check-email-config for details.'
      });
    }
  } catch (error) {
    console.error('❌ Error in test endpoint:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start low stock monitoring job
require('./jobs/lowStockJob');

// error handler (simple)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
