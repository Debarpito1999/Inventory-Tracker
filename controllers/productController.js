const Product = require('../Models/Product');
const { checkAndAlertLowStock } = require('../utils/lowStockChecker');

const getAll = async (req, res) => {
  const products = await Product.find().populate('supplier');
  res.json(products);
};

const create = async (req, res) => {
  const p = await Product.create(req.body);
  
  // Check for low stock and send alert if needed
  if (p.stock !== undefined) {
    await checkAndAlertLowStock(p);
  }
  
  res.status(201).json(p);
};

const update = async (req, res) => {
  // Get old stock level before update
  const oldProduct = await Product.findById(req.params.id);
  const oldStock = oldProduct ? oldProduct.stock : null;
  
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('supplier');
  
  // Check for low stock if stock was changed
  if (req.body.stock !== undefined && req.body.stock !== oldStock) {
    await checkAndAlertLowStock(p, oldStock);
  }
  
  res.json(p);
};

const remove = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

const getLowStock = async (req, res) => {
  const threshold = parseInt(req.query.t || '10', 10);
  const low = await Product.find({ stock: { $lt: threshold } }).populate('supplier');
  res.json(low);
};

module.exports = {
  getAll,
  create,
  update,
  remove,
  getLowStock
};
