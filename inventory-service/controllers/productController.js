const Product = require('../models/Product');
const { checkAndAlertLowStock } = require('../utils/lowStockChecker');

const getAll = async (req, res) => {
  const products = await Product.find({ user: req.user._id });
  res.json(products);
};

const create = async (req, res) => {
  const p = await Product.create({
    ...req.body,
    user: req.user._id
  });

  if (p.stock !== undefined) {
    await checkAndAlertLowStock(p);
  }

  res.status(201).json(p);
};

const update = async (req, res) => {
  const oldProduct = await Product.findOne({ _id: req.params.id, user: req.user._id });
  const oldStock = oldProduct ? oldProduct.stock : null;

  if (!oldProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const p = await Product.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { ...req.body, user: req.user._id },
    { new: true }
  );

  if (req.body.stock !== undefined && req.body.stock !== oldStock) {
    await checkAndAlertLowStock(p, oldStock);
  }

  res.json(p);
};

const remove = async (req, res) => {
  const deleted = await Product.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json({ message: 'Deleted' });
};

const getLowStock = async (req, res) => {
  const threshold = parseInt(req.query.t || '10', 10);
  const low = await Product.find({ user: req.user._id, stock: { $lt: threshold } });
  res.json(low);
};

module.exports = {
  getAll,
  create,
  update,
  remove,
  getLowStock
};

