const Sale = require('../Models/Sale');
const Product = require('../Models/Product');
const Seller = require('../Models/Seller');
const { checkAndAlertLowStock } = require('../utils/lowStockChecker');

exports.createSale = async (req, res) => {
  const { product: productId, seller: sellerId, quantity, unitPrice } = req.body;
  
  if (!sellerId) return res.status(400).json({ message: 'Seller is required' });
  if (!unitPrice || unitPrice <= 0) return res.status(400).json({ message: 'Unit price is required and must be greater than 0' });
  
  const product = await Product.findOne({ _id: productId, user: req.user._id });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const seller = await Seller.findOne({ _id: sellerId, user: req.user._id });
  if (!seller) return res.status(404).json({ message: 'Seller not found' });

  if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

  // Store old stock before reduction
  const oldStock = product.stock;

  // reduce stock
  product.stock -= quantity;
  await product.save();

  // Check for low stock and send alert if needed
  await checkAndAlertLowStock(product, oldStock);

  const totalPrice = unitPrice * quantity;
  const sale = await Sale.create({
    user: req.user._id,
    product: productId,
    seller: sellerId,
    quantity,
    unitPrice,
    totalPrice
  });
  await sale.populate('seller');
  await sale.populate('product');
  res.status(201).json(sale);
};
