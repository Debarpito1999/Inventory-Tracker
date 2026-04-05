const Product = require('../Models/Product');
const ProducedTransact = require('../Models/ProducedTransact');

// Create a new produced transaction and update product stock
// Expected body: { productId, quantity, price, type, supplier, supplierName, date? }
// supplierName is stored on the transaction (required for microservices where Supplier lives in another DB).
const createTransaction = async (req, res) => {
  try {
    const { productId, quantity, price, type, supplier, supplierName, date } = req.body;

    if (!productId || !quantity || !price || !type || !supplier) {
      return res.status(400).json({
        message: 'productId, quantity, price, type and supplier are required',
      });
    }

    const nameTrim = supplierName != null ? String(supplierName).trim() : '';
    if (!nameTrim) {
      return res.status(400).json({
        message: 'supplierName is required',
      });
    }

    const product = await Product.findOne({ _id: productId, user: req.user._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create the transaction, taking the name from the product
    const transaction = await ProducedTransact.create({
      user: req.user._id,
      product: product._id,
      name: product.name,
      date: date ? new Date(date) : undefined,
      price,
      type,
      quantity,
      supplier,
      supplierName: nameTrim,
    });

    // Increase product stock by transaction quantity
    product.stock = (product.stock || 0) + Number(quantity);
    product.lastRestocked = new Date();
    await product.save();

    res.status(201).json({
      transaction,
      updatedProduct: product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List transactions with optional date range and product filter
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

    res.json(tx);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// (Optional) list all transactions for a product
const getByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const tx = await ProducedTransact.find({ product: productId, user: req.user._id })
      .populate('product')
      .sort({ date: -1, createdAt: -1 });
    res.json(tx);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTransaction,
  getAll,
  getByProduct,
};

