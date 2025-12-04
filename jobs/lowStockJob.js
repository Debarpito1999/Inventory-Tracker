const cron = require('node-cron');
const { checkAllProductsForLowStock } = require('../utils/lowStockChecker');

// Check if ADMIN_EMAIL is configured
if (!process.env.ADMIN_EMAIL) {
  console.warn('⚠️  ADMIN_EMAIL not set in .env - low stock email alerts will not be sent');
}

// Schedule job to run every day at 9:00 AM (backup check)
cron.schedule('0 9 * * *', async () => {
  console.log('🔍 Scheduled low stock check running...');
  await checkAllProductsForLowStock();
});


// For testing: Run immediately on startup (optional - comment out in production)
if (process.env.RUN_LOW_STOCK_JOB_ON_STARTUP === 'true') {
  console.log('🔄 Running low stock check on startup (testing mode)...');
  setTimeout(async () => {
    await checkAllProductsForLowStock();
  }, 5000); // Wait 5 seconds for DB connection
}

console.log('✅ Low stock monitoring job scheduled (runs daily at 9:00 AM)');
