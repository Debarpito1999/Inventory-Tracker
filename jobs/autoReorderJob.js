const cron = require('node-cron');
const Product = require('../Models/Product');
const User = require('../Models/User');
const predictReorder = require('../utils/reorderPredictor');
const sendEmail = require('../utils/emailAlert');

cron.schedule('0 8 * * *', async () => {
  console.log('Running auto reorder check...');

  try {
    const products = await Product.find();
    const alertsByUser = new Map();

    for (const product of products) {
      if (!product.user) continue;

      const userId = product.user.toString();
      const prediction = await predictReorder(product._id, product.stock, userId);

      if (!prediction.reorderRequired) continue;

      if (!alertsByUser.has(userId)) alertsByUser.set(userId, []);
      alertsByUser.get(userId).push({
        name: product.name,
        stock: product.stock,
        prediction
      });
    }

    if (alertsByUser.size === 0) {
      console.log('No reorder alerts to send.');
      return;
    }

    const users = await User.find({ _id: { $in: [...alertsByUser.keys()] } }).select('name email');
    const usersById = new Map(users.map((u) => [u._id.toString(), u]));

    for (const [userId, alerts] of alertsByUser.entries()) {
      const user = usersById.get(userId);
      if (!user || !user.email) continue;

      const text = formatReorderEmailText(alerts);
      const html = formatReorderEmailHtml(alerts);

      await sendEmail(
        user.email,
        `Reorder Prediction Alert: ${alerts.length} Product(s)`,
        text,
        html
      );
    }
  } catch (error) {
    console.error('Auto reorder job failed:', error.message);
  }
});

function formatReorderEmailText(alerts) {
  let text = 'Reorder Prediction Alert\n\n';
  text += `You have ${alerts.length} product(s) that may require reorder soon:\n\n`;

  alerts.forEach((item, index) => {
    text += `${index + 1}. ${item.name}\n`;
    text += `   Current Stock: ${item.stock}\n`;
    text += `   Predicted Daily Sales: ${item.prediction.predictedDailySales}\n`;
    text += `   Days Remaining: ${item.prediction.daysRemaining}\n`;
    text += `   Suggested Reorder Qty: ${item.prediction.suggestedReorderQty}\n`;
    text += `   Model: ${item.prediction.model}\n\n`;
  });

  text += 'This is an automated message from your Inventory Tracker system.';
  return text;
}

function formatReorderEmailHtml(alerts) {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef5350 0%, #f44336 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .item { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #f44336; border-radius: 3px; }
        .name { font-weight: bold; font-size: 1.1em; }
        .meta { margin: 5px 0; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Reorder Prediction Alert</h2>
          <p>${alerts.length} product(s) need review</p>
        </div>
        <div class="content">
  `;

  alerts.forEach((item) => {
    html += `
      <div class="item">
        <div class="name">${item.name}</div>
        <div class="meta">Current Stock: ${item.stock}</div>
        <div class="meta">Predicted Daily Sales: ${item.prediction.predictedDailySales}</div>
        <div class="meta">Days Remaining: ${item.prediction.daysRemaining}</div>
        <div class="meta">Suggested Reorder Qty: ${item.prediction.suggestedReorderQty}</div>
      </div>
    `;
  });

  html += `
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}
