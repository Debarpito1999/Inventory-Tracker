const Sale = require("../Models/Sale");
const linearRegression = require("./linearRegression");

const predictReorder = async (productId, currentStock) => {
  const sales = await Sale.find({ product: productId }).sort({ saleDate: 1 });

  if (sales.length < 5) {
    return {
      prediction: "Not enough data",
      reorderRequired: false
    }; 
  }

  // Prepare ML data
  const days = sales.map((_, index) => index + 1);
  const quantities = sales.map(s => s.quantity);

  const { slope, intercept } = linearRegression(days, quantities);

  // Predict next day sales
  const nextDaySales = Math.max(slope * (days.length + 1) + intercept, 0.1);

  const daysRemaining = Math.floor(currentStock / nextDaySales);

  return {
    model: "Linear Regression",
    predictedDailySales: Number(nextDaySales.toFixed(2)),
    daysRemaining,
    reorderRequired: daysRemaining <= 7,
    suggestedReorderQty: Math.ceil(nextDaySales * 15)
  };
};

module.exports = predictReorder;
