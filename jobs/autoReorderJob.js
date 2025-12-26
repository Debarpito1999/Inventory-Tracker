const cron = require("node-cron"); 
const Product = require("../Models/Product");
const predictReorder = require("../utils/reorderPredictor");
const sendEmail = require("../utils/emailAlert");

cron.schedule("0 8 * * *", async () => {  
  console.log("Running auto reorder check...");

  if (!process.env.ADMIN_EMAIL) {
    console.warn("ADMIN_EMAIL not set; skipping auto reorder email job.");
    return;
  }

  const products = await Product.find();

  for (const product of products) {
    const prediction = await predictReorder(product._id, product.stock);

    if (prediction.reorderRequired) {
      const message = `
Product: ${product.name}
Current Stock: ${product.stock}
Predicted Daily Sales: ${prediction.predictedDailySales}
Days Remaining: ${prediction.daysRemaining}
Suggested Reorder Qty: ${prediction.suggestedReorderQty}
Model: ${prediction.model}
      `;

      await sendEmail(
        process.env.ADMIN_EMAIL,
        `🚨 Reorder Alert: ${product.name}`,
        message
      );
    }
  }
});
