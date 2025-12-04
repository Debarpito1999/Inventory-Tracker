const Product = require('../Models/Product');
const sendEmail = require('./emailAlert');

// Track last email sent time per product to prevent spam
const lastEmailSent = new Map();

// Cooldown period: Don't send another email for the same product for 1 hour
const EMAIL_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if a product is low on stock and send email if needed
 * @param {String|Object} productId - Product ID or Product object
 * @param {Number} oldStock - Previous stock level (optional, for comparison)
 */
async function checkAndAlertLowStock(productId, oldStock = null) {
  console.log('\n🔍 Checking low stock alert...');
  try {
    // Get product with supplier info
    const product = typeof productId === 'string' 
      ? await Product.findById(productId).populate('supplier')
      : productId;
    
    if (!product) {
      console.log('   ⚠️  Product not found');
      return false;
    }

    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;
    const currentStock = product.stock || 0;
    
    console.log(`   Product: ${product.name}`);
    console.log(`   Current Stock: ${currentStock}`);
    console.log(`   Threshold: ${threshold}`);
    console.log(`   Old Stock: ${oldStock !== null ? oldStock : 'N/A'}`);
    
    // Only alert if stock is below threshold
    if (currentStock >= threshold) {
      // Stock is fine, clear the alert flag
      console.log('   ✓ Stock is above threshold, no alert needed');
      lastEmailSent.delete(product._id.toString());
      return false;
    }

    // Check if we recently sent an email for this product
    const productKey = product._id.toString();
    const lastSent = lastEmailSent.get(productKey);
    const now = Date.now();
    
    // If we sent an email recently, skip (cooldown)
    if (lastSent && (now - lastSent) < EMAIL_COOLDOWN_MS) {
      console.log(`⏳ Skipping email for ${product.name} - cooldown active`);
      return false;
    }

    // Check if stock just dropped below threshold (was above, now below)
    const shouldAlert = oldStock === null || oldStock >= threshold;

    if (!shouldAlert) {
      // Stock was already low, don't alert again unless cooldown expired
      return false;
    }

    // Get all low stock items for comprehensive email
    const allLowStock = await Product.find({ stock: { $lt: threshold } })
      .populate('supplier')
      .sort({ stock: 1 }); // Sort by stock ascending (lowest first)

    if (allLowStock.length === 0) return false;

    // Check if ADMIN_EMAIL is configured
    if (!process.env.ADMIN_EMAIL) {
      console.error('❌ ADMIN_EMAIL not configured - cannot send low stock alert');
      console.error('   Please set ADMIN_EMAIL in your .env file');
      return false;
    }

    console.log(`   📧 Preparing to send email for ${allLowStock.length} low stock item(s)`);
    console.log(`   Recipient: ${process.env.ADMIN_EMAIL}`);

    // Format email
    const emailText = formatEmailText(allLowStock, threshold);
    const emailHtml = formatEmailHtml(allLowStock, threshold);

    // Send email
    const sendEmail = require('./emailAlert');
    const emailResult = await sendEmail(
      process.env.ADMIN_EMAIL,
      `⚠️ Low Stock Alert: ${allLowStock.length} Item(s) Need Attention`,
      emailText,
      emailHtml,
      true // returnDetails = true
    );

    if (emailResult.success) {
      // Mark this product as having received an alert
      allLowStock.forEach(p => {
        lastEmailSent.set(p._id.toString(), now);
      });
      console.log(`✅ Low stock alert email sent successfully for ${allLowStock.length} product(s)\n`);
      return { success: true };
    } else {
      console.error(`❌ Failed to send low stock alert email\n`);
      return { 
        success: false, 
        error: emailResult.error || { message: 'Unknown error' }
      };
    }
  } catch (error) {
    console.error('❌ Error checking low stock:', error.message);
    return false;
  }
}

/**
 * Check all products for low stock (used by scheduled job)
 */
async function checkAllProductsForLowStock() {
  console.log('\n🔍 Checking all products for low stock...');
  try {
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;
    console.log(`   Threshold: ${threshold}`);
    
    const lowStock = await Product.find({ stock: { $lt: threshold } })
      .populate('supplier')
      .sort({ stock: 1 });

    console.log(`   Found ${lowStock.length} low stock item(s)`);

    if (lowStock.length === 0) {
      console.log('   ✓ All products are well stocked\n');
      return false;
    }

    if (!process.env.ADMIN_EMAIL) {
      console.error('❌ ADMIN_EMAIL not configured');
      console.error('   Please set ADMIN_EMAIL in your .env file');
      return false;
    }

    console.log(`   📧 Preparing to send email for ${lowStock.length} low stock item(s)`);
    console.log(`   Recipient: ${process.env.ADMIN_EMAIL}`);

    // Format email
    const emailText = formatEmailText(lowStock, threshold);
    const emailHtml = formatEmailHtml(lowStock, threshold);

    const sendEmail = require('./emailAlert');
    const emailResult = await sendEmail(
      process.env.ADMIN_EMAIL,
      `⚠️ Low Stock Alert: ${lowStock.length} Item(s) Need Attention`,
      emailText,
      emailHtml,
      true // returnDetails = true
    );

    if (emailResult.success) {
      const now = Date.now();
      lowStock.forEach(p => {
        lastEmailSent.set(p._id.toString(), now);
      });
      console.log(`✅ Low stock alert email sent successfully for ${lowStock.length} product(s)\n`);
      return { success: true };
    } else {
      console.error(`❌ Failed to send low stock alert email\n`);
      return { 
        success: false, 
        error: emailResult.error || { message: 'Unknown error' }
      };
    }
  } catch (error) {
    console.error('❌ Error in checkAllProductsForLowStock:', error.message);
    return false;
  }
}

// Format plain text email
function formatEmailText(products, threshold) {
  let text = `Low Stock Alert\n\n`;
  text += `You have ${products.length} product(s) with stock below ${threshold} units:\n\n`;
  
  products.forEach((product, index) => {
    text += `${index + 1}. ${product.name}\n`;
    text += `   Category: ${product.category || 'N/A'}\n`;
    text += `   Current Stock: ${product.stock} units ⚠️\n`;
    text += `   Price: $${product.price?.toFixed(2) || '0.00'}\n`;
    text += `   Supplier: ${product.supplier?.name || 'N/A'}\n`;
    text += `\n`;
  });
  
  text += `Please restock these items soon to avoid stockouts.\n\n`;
  text += `This is an automated message from your Inventory Tracker system.`;
  
  return text;
}

// Format HTML email
function formatEmailHtml(products, threshold) {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .product-item { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ff9800; border-radius: 3px; }
        .product-name { font-weight: bold; font-size: 1.1em; color: #333; }
        .product-detail { margin: 5px 0; color: #666; }
        .stock-warning { color: #dc3545; font-weight: bold; }
        .footer { margin-top: 20px; text-align: center; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ Low Stock Alert</h2>
          <p>${products.length} product(s) need attention</p>
        </div>
        <div class="content">
          <p>You have <strong>${products.length}</strong> product(s) with stock below <strong>${threshold}</strong> units:</p>
  `;
  
  products.forEach((product) => {
    html += `
      <div class="product-item">
        <div class="product-name">${product.name}</div>
        <div class="product-detail">Category: ${product.category || 'N/A'}</div>
        <div class="product-detail stock-warning">Current Stock: ${product.stock} units</div>
        <div class="product-detail">Price: $${product.price?.toFixed(2) || '0.00'}</div>
        <div class="product-detail">Supplier: ${product.supplier?.name || 'N/A'}</div>
      </div>
    `;
  });
  
  html += `
          <p style="margin-top: 20px;"><strong>Please restock these items soon to avoid stockouts.</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message from your Inventory Tracker system.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

module.exports = {
  checkAndAlertLowStock,
  checkAllProductsForLowStock
};

