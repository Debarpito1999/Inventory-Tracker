const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 0 },
  productName: { type: String, required: true }
});

const producedProductSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 0 },
  productName: { type: String, required: true }
});

const productionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true, default: Date.now },
  rawMaterials: [rawMaterialSchema],
  producedProducts: [producedProductSchema],
  ratios: [{
    rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rawMaterialName: String,
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    ratio: { type: Number, required: true }
  }],
  status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

productionSchema.index({ date: -1 });

module.exports = mongoose.model('Production', productionSchema);

