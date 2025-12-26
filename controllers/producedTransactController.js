const Product = require('../Models/Product');
const ProducedTransact = require('../Models/ProducedTransact');

// Create a new produced transaction and update product stock
// Expected body: { productId, quantity, price, type, supplier, date? }
const createTransaction = async (req, res) => {
  try {
    const { productId, quantity, price, type, supplier, date } = req.body;

    if (!productId || !quantity || !price || !type || !supplier) {
      return res.status(400).json({
        message: 'productId, quantity, price, type and supplier are required',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create the transaction, taking the name from the product
    const transaction = await ProducedTransact.create({
      product: product._id,
      name: product.name,
      date: date ? new Date(date) : undefined,
      price,
      type,
      quantity,
      supplier,
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
    const query = {};

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
      .populate('supplier')
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
    const tx = await ProducedTransact.find({ product: productId })
      .populate('product')
      .populate('supplier')
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


