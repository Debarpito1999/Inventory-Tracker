const mongoose = require('mongoose');

const producedTransactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  price: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  // Supplier document lives in supplier-service; inventory-service resolves via HTTP + stores snapshot
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  supplierName: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.ProducedTransact || mongoose.model('ProducedTransact', producedTransactSchema);

