const Sale = require('../Models/Sale');
const Product = require('../Models/Product');
const { checkAndAlertLowStock } = require('../utils/lowStockChecker');

exports.createSale = async (req, res) => {
  const { product: productId, quantity } = req.body;
  const product = await Product.findById(productId).populate('supplier');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

  // Store old stock before reduction
  const oldStock = product.stock;

  // reduce stock
  product.stock -= quantity;
  await product.save();

  // Check for low stock and send alert if needed
  await checkAndAlertLowStock(product, oldStock);

  const totalPrice = product.price * quantity;
  const sale = await Sale.create({ product: productId, quantity, totalPrice });
  res.status(201).json(sale);
};
