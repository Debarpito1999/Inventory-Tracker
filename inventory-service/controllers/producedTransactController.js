const Product = require('../models/Product');
const ProducedTransact = require('../models/ProducedTransact');
const {
  fetchSupplierById,
  attachSuppliersToTransactions,
} = require('../services/supplierClient');

const createTransaction = async (req, res) => {
  try {
    const { productId, quantity, price, type, supplier, supplierName, date } = req.body;

    if (!productId || !quantity || !price || !type || !supplier) {
      return res.status(400).json({
        message: 'productId, quantity, price, type and supplier are required'
      });
    }

    const auth = req.headers.authorization;
    let sDoc;
    try {
      sDoc = await fetchSupplierById(supplier, auth);
    } catch (err) {
      return res.status(503).json({
        message: 'Supplier service unavailable',
        detail: err.message,
      });
    }
    if (!sDoc) {
      return res.status(404).json({
        message: 'Supplier not found (check supplier-service and SUPPLIER_SERVICE_URL in inventory-service .env)',
      });
    }

    const nameTrim =
      (supplierName != null && String(supplierName).trim()) || sDoc.name || '';

    const product = await Product.findOne({ _id: productId, user: req.user._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const transaction = await ProducedTransact.create({
      user: req.user._id,
      product: product._id,
      name: product.name,
      date: date ? new Date(date) : undefined,
      price,
      type,
      quantity,
      supplier,
      supplierName: nameTrim
    });

    product.stock = (product.stock || 0) + Number(quantity);
    product.lastRestocked = new Date();
    await product.save();

    res.status(201).json({
      transaction,
      updatedProduct: product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;
    const query = { user: req.user._id };

    if (productId) {
      query.product = productId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const tx = await ProducedTransact.find(query)
      .populate('product')
      .sort({ date: -1, createdAt: -1 });

    res.json(await attachSuppliersToTransactions(tx, req.headers.authorization));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const tx = await ProducedTransact.find({ product: productId, user: req.user._id })
      .populate('product')
      .sort({ date: -1, createdAt: -1 });
    res.json(await attachSuppliersToTransactions(tx, req.headers.authorization));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTransaction,
  getAll,
  getByProduct
};

