const Sale = require('../models/Sale');
const { fetchProductById, updateProduct } = require('../services/inventoryClient');
const { fetchSellerById } = require('../services/supplierClient');

exports.createSale = async (req, res) => {
  try {
    const { product: productId, seller: sellerId, quantity, unitPrice } = req.body;
    const auth = req.headers.authorization;

    if (!sellerId) return res.status(400).json({ message: 'Seller is required' });
    if (!unitPrice || unitPrice <= 0) {
      return res.status(400).json({ message: 'Unit price is required and must be greater than 0' });
    }

    let product;
    let seller;
    try {
      [product, seller] = await Promise.all([
        fetchProductById(productId, auth),
        fetchSellerById(sellerId, auth),
      ]);
    } catch (err) {
      return res.status(503).json({ message: 'Upstream service unavailable', detail: err.message });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const newStock = product.stock - quantity;

    let updatedProduct;
    try {
      updatedProduct = await updateProduct(
        productId,
        { stock: newStock },
        auth
      );
    } catch (err) {
      return res.status(503).json({ message: 'Could not update product stock', detail: err.message });
    }
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found while updating stock' });
    }

    const totalPrice = unitPrice * quantity;
    const sale = await Sale.create({
      user: req.user._id,
      product: productId,
      seller: sellerId,
      quantity,
      unitPrice,
      totalPrice,
    });

    res.status(201).json({
      ...sale.toObject(),
      product: updatedProduct,
      seller,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const sales = await Sale.find({ user: req.user._id }).sort({ saleDate: -1 });

    const enriched = await Promise.all(
      sales.map(async (s) => {
        const plain = s.toObject();
        let product = null;
        let seller = null;
        try {
          [product, seller] = await Promise.all([
            fetchProductById(s.product, auth),
            fetchSellerById(s.seller, auth),
          ]);
        } catch (err) {
          console.error('[sales] enrich', err.message);
        }
        return {
          ...plain,
          product,
          seller,
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
