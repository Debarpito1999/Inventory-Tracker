const Product = require('../models/Product');
const User = require('../models/User');
const sendEmail = require('./emailAlert');

const lastEmailSent = new Map();
const EMAIL_COOLDOWN_MS = 60 * 60 * 1000;

async function checkAndAlertLowStock(productId, oldStock = null) {
  try {
    const product = typeof productId === 'string'
      ? await Product.findById(productId).populate('user', 'name email')
      : productId;

    if (!product) {
      return false;
    }

    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10', 10);
    const currentStock = product.stock || 0;

    if (currentStock >= threshold) {
      lastEmailSent.delete(product._id.toString());
      return false;
    }

    const productKey = product._id.toString();
    const lastSent = lastEmailSent.get(productKey);
    const now = Date.now();
    if (lastSent && (now - lastSent) < EMAIL_COOLDOWN_MS) {
      return false;
    }

    const shouldAlert = oldStock === null || oldStock >= threshold;
    if (!shouldAlert) return false;

    const owner = await getOwnerUser(product);
    if (!owner || !owner.email) {
      return false;
    }

    const allLowStock = await Product.find({ user: owner.id, stock: { $lt: threshold } })
      .sort({ stock: 1 });
    if (allLowStock.length === 0) return false;

    const emailText = formatEmailText(allLowStock, threshold);
    const emailHtml = formatEmailHtml(allLowStock, threshold);

    const emailResult = await sendEmail(
      owner.email,
      `Low Stock Alert: ${allLowStock.length} Item(s) Need Attention`,
      emailText,
      emailHtml,
      true
    );

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || { message: 'Unknown error' }
      };
    }

    allLowStock.forEach((p) => {
      lastEmailSent.set(p._id.toString(), now);
    });
    return { success: true };
  } catch (error) {
    console.error('Error checking low stock:', error.message);
    return false;
  }
}

async function getOwnerUser(product) {
  const userId = product?.user?._id || product?.user;
  if (!userId) return null;

  if (product?.user?.email) {
    return {
      id: product.user._id.toString(),
      name: product.user.name || '',
      email: product.user.email
    };
  }

  const user = await User.findById(userId).select('name email');
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name || '',
    email: user.email
  };
}

function formatEmailText(products, threshold) {
  let text = 'Low Stock Alert\n\n';
  text += `You have ${products.length} product(s) with stock below ${threshold} units:\n\n`;

  products.forEach((product, index) => {
    text += `${index + 1}. ${product.name}\n`;
    text += `   Category: ${product.category || 'N/A'}\n`;
    text += `   Current Stock: ${product.stock} units\n`;
    text += `   Price: $${product.price?.toFixed(2) || '0.00'}\n\n`;
  });

  text += 'Please restock these items soon to avoid stockouts.\n\n';
  text += 'This is an automated message from your Inventory Tracker system.';
  return text;
}

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
          <h2>Low Stock Alert</h2>
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
  checkAndAlertLowStock
};

