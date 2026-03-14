const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

exports.createSale = async (req, res) => {
  const { product: productId, seller: sellerId, quantity, unitPrice } = req.body;

  if (!sellerId) return res.status(400).json({ message: 'Seller is required' });
  if (!unitPrice || unitPrice <= 0) return res.status(400).json({ message: 'Unit price is required and must be greater than 0' });

  const product = await Product.findOne({ _id: productId, user: req.user._id });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const seller = await Seller.findOne({ _id: sellerId, user: req.user._id });
  if (!seller) return res.status(404).json({ message: 'Seller not found' });

  if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

  const oldStock = product.stock;

  product.stock -= quantity;
  await product.save();

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

exports.getSales = async (req, res) => {
  const sales = await Sale.find({ user: req.user._id }).populate('product').populate('seller');
  res.json(sales);
};

