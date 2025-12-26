const Product = require("../Models/Product");
const predictReorder = require("../utils/reorderPredictor");

exports.getReorderSuggestion = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    const prediction = await predictReorder(product._id, product.stock);

    res.json({
      product: product.name,
      currentStock: product.stock,
      ...prediction
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
